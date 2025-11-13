'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { QrCode, MapPin, AlertCircle, CheckCircle2, Loader, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const UNIVERSAL_QR_CODE = JSON.stringify({
  type: 'attendance',
  version: '1.0',
});

export default function AttendanceScanPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [manualQR, setManualQR] = useState('');
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [checkingAttendance, setCheckingAttendance] = useState(true);
  const [alreadyMarked, setAlreadyMarked] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const scannerRef = useRef(null);
  const qrCodeRegionId = 'qr-reader';

  // Check if attendance already marked
  useEffect(() => {
    const checkAttendance = async () => {
      try {
        const response = await fetch('/api/v1/attendance/check');
        const result = await response.json();

        if (result.success && result.data.marked) {
          setAlreadyMarked(true);
          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        }
      } catch (err) {
        console.error('Error checking attendance:', err);
      } finally {
        setCheckingAttendance(false);
      }
    };

    if (status === 'authenticated') {
      checkAttendance();
    }
  }, [status, router]);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (err) => {
          setLocationError('Location access denied. Please enable location services.');
          console.error('Geolocation error:', err);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
    }
  }, []);

  const handleQRScan = async (qrData) => {
    if (!location) {
      setError('Please allow location access to mark attendance.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/v1/attendance/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qrCode: qrData,
          latitude: location.latitude,
          longitude: location.longitude,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard');
          router.refresh();
        }, 2000);
      } else {
        setError(result.error?.message || 'Failed to mark attendance');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualQR.trim()) {
      handleQRScan(manualQR.trim());
    }
  };

  // Check camera permissions
  const checkCameraPermission = async () => {
    try {
      // Check if we can query permissions
      if (navigator.permissions && navigator.permissions.query) {
        const permissionStatus = await navigator.permissions.query({ name: 'camera' });
        return permissionStatus.state !== 'denied';
      }
      return true; // Assume allowed if we can't check
    } catch (err) {
      console.log('Permission check not supported:', err);
      return true; // Assume allowed if check fails
    }
  };

  // Start QR Scanner
  const startQRScanner = async () => {
    try {
      setError(''); // Clear any previous errors
      setCameraLoading(true);
      setShowScanner(true);

      // Check camera availability first
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported. Please use a modern browser or manual entry.');
      }

      // Wait for DOM element to be ready
      await new Promise((resolve) => {
        const checkElement = () => {
          const element = document.getElementById(qrCodeRegionId);
          if (element) {
            resolve();
          } else {
            setTimeout(checkElement, 50);
          }
        };
        checkElement();
      });

      // Small delay to ensure DOM is fully rendered
      await new Promise(resolve => setTimeout(resolve, 100));

      // Dynamic import
      const { Html5Qrcode } = await import('html5-qrcode');
      
      // Clean up any existing scanner instance
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          scannerRef.current.clear();
        } catch (e) {
          console.warn('Error cleaning up previous scanner:', e);
        }
      }

      const html5QrCode = new Html5Qrcode(qrCodeRegionId);
      scannerRef.current = html5QrCode;

      // Request camera permission explicitly first with timeout
      console.log('Requesting camera permission...');
      let permissionGranted = false;
      try {
        const permissionPromise = navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Permission request timeout')), 10000)
        );

        const stream = await Promise.race([permissionPromise, timeoutPromise]);
        stream.getTracks().forEach(track => track.stop()); // Stop test stream
        permissionGranted = true;
        console.log('Camera permission granted');
      } catch (permErr) {
        console.error('Permission error:', permErr);
        if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError') {
          throw new Error('Camera permission denied. Please allow camera access in your browser settings.');
        } else if (permErr.message === 'Permission request timeout') {
          throw new Error('Camera permission request timed out. Please try again or use manual entry.');
        }
        // Continue anyway - some browsers grant permission during getCameras()
      }

      // Try to get available cameras with timeout
      let cameraId = null;
      try {
        const camerasPromise = Html5Qrcode.getCameras();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Camera enumeration timeout')), 5000)
        );

        const devices = await Promise.race([camerasPromise, timeoutPromise]);
        console.log('Available cameras:', devices);
        if (devices && devices.length > 0) {
          // Prefer back camera (environment) on mobile
          const backCamera = devices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('rear') ||
            device.label.toLowerCase().includes('environment')
          );
          cameraId = backCamera ? backCamera.id : devices[0].id;
        }
      } catch (camErr) {
        console.warn('Could not enumerate cameras, will use facingMode:', camErr);
        if (camErr.message === 'Camera enumeration timeout') {
          console.warn('Camera enumeration timed out, using default facingMode');
        }
      }

      // Use camera ID if found, otherwise use facingMode
      const cameraConfig = cameraId || { facingMode: 'environment' };
      console.log('Starting QR scanner with:', cameraConfig);

      // Start scanner with timeout
      const startPromise = html5QrCode.start(
        cameraConfig,
        {
          fps: 10,
          qrbox: function(viewfinderWidth, viewfinderHeight) {
            // Make QR box responsive - 70% of the smaller dimension for better detection
            const minEdgePercentage = 0.7;
            const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
            return {
              width: qrboxSize,
              height: qrboxSize
            };
          },
          aspectRatio: 1.0,
          disableFlip: false,
        },
        (decodedText) => {
          // QR code scanned successfully
          console.log('QR Code scanned:', decodedText);
          handleQRScan(decodedText);
          stopQRScanner();
        },
        (errorMessage) => {
          // Ignore scanning errors (they're frequent during scanning)
          // These are normal and expected while scanning
        }
      );

      const startTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Camera start timeout')), 15000)
      );

      await Promise.race([startPromise, startTimeoutPromise]);

      setCameraLoading(false);
      console.log('Camera started successfully');
    } catch (err) {
      console.error('Camera error:', err);
      setCameraLoading(false);
      let errorMsg = 'Failed to open camera. ';
      
      // Provide specific error messages
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.message?.includes('permission') || err.message?.includes('Permission denied')) {
        errorMsg += 'Camera permission denied. Please allow camera access in your browser settings and try again, or use manual entry below.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError' || err.message?.includes('no camera') || err.message?.includes('No camera')) {
        errorMsg += 'No camera found. Please use manual entry below.';
      } else if (err.message?.includes('HTTPS') || err.message?.includes('secure context')) {
        errorMsg += 'Camera requires HTTPS connection. Please use manual entry below.';
      } else if (err.message?.includes('timeout')) {
        errorMsg += 'Camera initialization timed out. Please try again or use manual entry below.';
      } else if (err.message?.includes('not supported')) {
        errorMsg += err.message;
      } else {
        errorMsg += `Error: ${err.message || 'Unknown error'}. Please use manual entry below.`;
      }
      
      setError(errorMsg);
      setShowScanner(false);
      
      // Clean up on error
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
  };

  const stopQRScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
        setShowScanner(false);
        setCameraLoading(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
        // Force cleanup even if stop fails
        try {
          scannerRef.current.clear();
        } catch (e) {
          // Ignore
        }
        scannerRef.current = null;
        setShowScanner(false);
        setCameraLoading(false);
      }
    } else {
      setShowScanner(false);
      setCameraLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    };
  }, []);

  // Redirect HR/Admin users - they don't need to mark attendance
  useEffect(() => {
    if (session?.user && (session.user.role === 'hr_officer' || session.user.role === 'admin')) {
      router.push('/hr/dashboard');
    }
  }, [session, router]);

  if (status === 'loading' || checkingAttendance) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  // Don't show scan page for HR/Admin
  if (session?.user && (session.user.role === 'hr_officer' || session.user.role === 'admin')) {
    return null; // Will redirect via useEffect
  }

  if (alreadyMarked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Attendance Already Marked
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                You have already marked your attendance for today.
              </p>
              <p className="text-xs text-muted-foreground">
                Redirecting to dashboard...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4 mx-auto">
              <QrCode className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Mark Attendance</CardTitle>
            <CardDescription>
              Scan the QR code to mark your attendance for today
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Location Status */}
            {location ? (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                <MapPin className="h-4 w-4" />
                <span>Location detected</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                <span>{locationError || 'Requesting location...'}</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium mb-1">Camera Error</p>
                    <p className="text-xs">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Attendance marked successfully! Redirecting...</span>
                </div>
              </div>
            )}

            {/* QR Scanner Section */}
            <div className="space-y-4">
              {!showScanner ? (
                <>
                  <div className="bg-muted p-6 rounded-lg text-center">
                    <p className="text-sm font-medium text-foreground mb-2">
                      Scan the QR code displayed on the laptop/computer at the site
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Point your camera at the QR code shown on the screen
                    </p>
                    <div className="bg-white p-4 rounded-lg inline-block mb-4 border-2 border-dashed border-primary/30">
                      <QrCode className="h-32 w-32 text-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      The QR code should be visible on a laptop or monitor at the site entrance
                    </p>
                  </div>

                  <Button
                    onClick={startQRScanner}
                    disabled={!location}
                    className="w-full"
                    variant="outline"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Open Camera Scanner
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or</span>
                    </div>
                  </div>

                  {/* Manual QR Entry - Always Visible */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-900 mb-2">
                      Manual Entry (If camera doesn't work)
                    </p>
                    <form onSubmit={handleManualSubmit} className="space-y-3">
                      <div>
                        <div className="flex gap-2 mb-2">
                          <Input
                            type="text"
                            placeholder='{"type":"attendance","version":"1.0"}'
                            value={manualQR}
                            onChange={(e) => setManualQR(e.target.value)}
                            disabled={loading || !location}
                            className="text-center font-mono text-sm bg-white flex-1"
                          />
                          <Button
                            type="button"
                            onClick={() => {
                              setManualQR(UNIVERSAL_QR_CODE);
                            }}
                            disabled={loading || !location}
                            variant="outline"
                            className="whitespace-nowrap"
                            title="Fill with default QR code"
                          >
                            Fill
                          </Button>
                        </div>
                        <p className="text-xs text-blue-700 mt-2 text-center">
                          Copy and paste the QR code data from the laptop screen, or click "Fill" to use the default code
                        </p>
                        <div className="mt-2 p-2 bg-white rounded border border-blue-200">
                          <p className="text-xs text-blue-600 text-center font-mono break-all">
                            {UNIVERSAL_QR_CODE}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="submit"
                        disabled={loading || !location || !manualQR.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        {loading ? (
                          <>
                            <Loader className="h-4 w-4 mr-2 animate-spin" />
                            Marking Attendance...
                          </>
                        ) : (
                          'Mark Attendance Manually'
                        )}
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  {cameraLoading ? (
                    <div className="flex flex-col items-center justify-center p-8 bg-muted rounded-lg">
                      <Loader className="h-8 w-8 animate-spin text-primary mb-4" />
                      <p className="text-sm text-muted-foreground text-center">
                        Requesting camera permission...
                      </p>
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        Please allow camera access when prompted
                      </p>
                    </div>
                  ) : (
                    <>
                      <div 
                        id={qrCodeRegionId} 
                        className="w-full rounded-lg overflow-hidden bg-black"
                        style={{ minHeight: '300px', position: 'relative' }}
                      ></div>
                      <div className="text-center space-y-2">
                        <p className="text-xs text-muted-foreground">
                          Point your camera at the QR code
                        </p>
                        <p className="text-xs text-muted-foreground">
                          The camera view should appear above
                        </p>
                      </div>
                    </>
                  )}
                  <Button
                    onClick={stopQRScanner}
                    variant="outline"
                    className="w-full"
                    disabled={cameraLoading}
                  >
                    {cameraLoading ? (
                      <>
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        Initializing...
                      </>
                    ) : (
                      'Cancel Scanning'
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="text-xs text-muted-foreground text-center space-y-1">
              <p>• You must be within the site radius to mark attendance</p>
              <p>• Attendance can only be marked once per day</p>
              <p>• Location access is required</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

