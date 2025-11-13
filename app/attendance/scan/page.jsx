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
  const [locationLoading, setLocationLoading] = useState(false);
  const [nearestSite, setNearestSite] = useState(null);
  const [distanceToSite, setDistanceToSite] = useState(null);
  const [checkingAttendance, setCheckingAttendance] = useState(true);
  const [alreadyMarked, setAlreadyMarked] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [startingCamera, setStartingCamera] = useState(false);
  const scannerRef = useRef(null);
  const videoRef = useRef(null);
  const qrCodeRegionId = 'qr-reader';

  // Check if attendance already marked
  useEffect(() => {
    const checkAttendance = async () => {
      try {
        const response = await fetch('/api/v1/attendance/check');
        const result = await response.json();

        if (result.success && result.data.marked) {
          setAlreadyMarked(true);
          // Redirect to role-specific dashboard after 2 seconds
          setTimeout(() => {
            const userRole = session?.user?.role;
            if (userRole === 'hr_officer' || userRole === 'admin') {
              router.push('/hr/dashboard');
            } else if (userRole === 'site_manager') {
              router.push('/site-manager/dashboard');
            } else if (userRole === 'contracts_manager') {
              router.push('/contracts-manager/dashboard');
            } else if (userRole === 'labour') {
              router.push('/labour/dashboard');
            } else {
              router.push('/dashboard');
            }
            router.refresh();
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

  // Function to get user location
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          resolve(loc);
        },
        (err) => {
          reject(err);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    });
  };

  // Function to check distance to nearest site
  const checkDistanceToSite = async (userLocation) => {
    try {
      const response = await fetch('/api/v1/sites');
      const result = await response.json();
      
      if (result.success && result.data) {
        const activeSites = result.data.filter(site => site.status === 'active');
        
        if (activeSites.length === 0) {
          return null;
        }

        // Calculate distance to each site
        let nearest = null;
        let minDistance = Infinity;

        for (const site of activeSites) {
          if (!site.location || !site.location.latitude || !site.location.longitude) {
            continue;
          }

          const distance = calculateDistance(
            site.location.latitude,
            site.location.longitude,
            userLocation.latitude,
            userLocation.longitude
          );

          if (distance < minDistance) {
            minDistance = distance;
            nearest = { ...site, distance: Math.round(distance) };
          }
        }

        return nearest;
      }
      return null;
    } catch (err) {
      console.error('Error checking site distance:', err);
      return null;
    }
  };

  // Calculate distance using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  // Refresh location
  const refreshLocation = async () => {
    setLocationLoading(true);
    setLocationError('');
    try {
      const loc = await getCurrentLocation();
      setLocation(loc);
      
      // Check distance to nearest site
      const nearest = await checkDistanceToSite(loc);
      if (nearest) {
        setNearestSite(nearest);
        setDistanceToSite(nearest.distance);
      }
    } catch (err) {
      let errorMsg = 'Failed to get location. ';
      if (err.code === 1) {
        errorMsg += 'Please allow location access in your browser settings.';
      } else if (err.code === 2) {
        errorMsg += 'Location unavailable. Please check your GPS.';
      } else if (err.code === 3) {
        errorMsg += 'Location request timed out. Please try again.';
      } else {
        errorMsg += err.message || 'Unknown error.';
      }
      setLocationError(errorMsg);
      console.error('Geolocation error:', err);
    } finally {
      setLocationLoading(false);
    }
  };

  // Get user location on mount
  useEffect(() => {
    refreshLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQRScan = async (qrData) => {
    setError('');
    setLoading(true);

    try {
      // Refresh location right before scanning for accuracy
      let currentLocation = location;
      if (!currentLocation) {
        setError('Getting your location...');
        currentLocation = await getCurrentLocation();
        setLocation(currentLocation);
      } else {
        // Still refresh to get most accurate location
        try {
          currentLocation = await getCurrentLocation();
          setLocation(currentLocation);
        } catch (err) {
          // Use existing location if refresh fails
          console.warn('Could not refresh location, using existing:', err);
        }
      }

      const response = await fetch('/api/v1/attendance/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qrCode: qrData,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          // Redirect to role-specific dashboard
          const userRole = session?.user?.role;
          if (userRole === 'hr_officer' || userRole === 'admin') {
            router.push('/hr/dashboard');
          } else if (userRole === 'site_manager') {
            router.push('/site-manager/dashboard');
          } else if (userRole === 'contracts_manager') {
            router.push('/contracts-manager/dashboard');
          } else if (userRole === 'labour') {
            // For labour workers, go to labour dashboard
            router.push('/labour/dashboard');
          } else {
            // For other roles, go to personal dashboard
            router.push('/dashboard');
          }
          router.refresh();
        }, 2000);
      } else {
        // Show detailed error message
        if (result.error?.code === 'OUT_OF_RANGE') {
          setError(
            `You are ${result.error.distance}m away from the site. ` +
            `Please move within ${result.error.requiredRadius}m of the site to mark attendance.`
          );
        } else {
          setError(result.error?.message || 'Failed to mark attendance');
        }
      }
    } catch (err) {
      if (err.message?.includes('Geolocation')) {
        setError('Location access denied. Please allow location access to mark attendance.');
      } else {
        setError('An error occurred. Please try again.');
      }
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

  // Start QR Scanner using qr-scanner (primary) with html5-qrcode fallback
  const startQRScanner = async () => {
    try {
      setStartingCamera(true);
      setError(''); // Clear any previous errors

      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera is not supported in this browser. Please use manual entry.');
        setStartingCamera(false);
        return;
      }

      // Check if we're on HTTPS (required for camera access in most browsers)
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        setError('Camera requires HTTPS connection. Please use manual entry or access via HTTPS.');
        setStartingCamera(false);
        return;
      }

      setShowScanner(true);

      // Try qr-scanner first (lighter and often works better)
      try {
        const QrScanner = (await import('qr-scanner')).default;
        
        // Get video element
        const video = document.createElement('video');
        video.id = 'qr-scanner-video';
        video.style.width = '100%';
        video.style.maxWidth = '100%';
        video.style.borderRadius = '0.5rem';
        video.setAttribute('playsinline', 'true');
        
        const container = document.getElementById(qrCodeRegionId);
        if (!container) {
          throw new Error('Scanner container not found');
        }
        
        container.innerHTML = '';
        container.appendChild(video);
        videoRef.current = video;

        // Create QR scanner instance
        const qrScanner = new QrScanner(
          video,
          (result) => {
            // QR code scanned successfully
            handleQRScan(result.data);
            stopQRScanner();
          },
          {
            onDecodeError: (error) => {
              // Ignore decode errors (they're frequent during scanning)
            },
            highlightScanRegion: true,
            highlightCodeOutline: true,
          }
        );

        scannerRef.current = qrScanner;

        // Start scanning with preferred camera (back camera on mobile)
        await qrScanner.start({ preferredCamera: 'environment' });
        setStartingCamera(false);
        return; // Success!
      } catch (qrScannerError) {
        console.warn('qr-scanner failed, trying html5-qrcode fallback:', qrScannerError);
        
        // Fallback to html5-qrcode
        try {
          const { Html5Qrcode } = await import('html5-qrcode');
          const html5QrCode = new Html5Qrcode(qrCodeRegionId);
          scannerRef.current = html5QrCode;

          // Try different camera configurations
          const cameraConfigs = [
            { facingMode: 'environment' },
            { facingMode: 'user' },
            { facingMode: { exact: 'environment' } },
            { facingMode: { exact: 'user' } },
          ];

          let cameraStarted = false;
          let lastError = null;

          for (const config of cameraConfigs) {
            try {
              await html5QrCode.start(
                config,
                {
                  fps: 10,
                  qrbox: { width: 250, height: 250 },
                  aspectRatio: 1.0,
                },
                (decodedText) => {
                  handleQRScan(decodedText);
                  stopQRScanner();
                },
                (errorMessage) => {
                  // Ignore scanning errors
                }
              );
              cameraStarted = true;
              setStartingCamera(false);
              break;
            } catch (configError) {
              lastError = configError;
              continue;
            }
          }

          if (!cameraStarted) {
            throw lastError || new Error('All camera configurations failed');
          }
        } catch (html5Error) {
          throw html5Error;
        }
      }
    } catch (err) {
      console.error('QR Scanner error:', err);
      setShowScanner(false);
      setStartingCamera(false);
      
      // Clean up
      if (scannerRef.current) {
        if (scannerRef.current.stop) {
          scannerRef.current.stop().catch(() => {});
        }
        if (scannerRef.current.destroy) {
          scannerRef.current.destroy();
        }
        scannerRef.current = null;
      }
      
      // Provide specific error messages
      if (err.name === 'NotAllowedError' || err.message?.includes('permission')) {
        setError('Camera permission denied. Please allow camera access in your browser settings and try again.');
      } else if (err.name === 'NotFoundError' || err.message?.includes('no camera')) {
        setError('No camera found. Please ensure your device has a camera.');
      } else if (err.name === 'NotReadableError' || err.message?.includes('already in use')) {
        setError('Camera is already in use. Please close other apps using the camera.');
      } else {
        setError(`Failed to start camera: ${err.message || 'Unknown error'}. Please use manual entry.`);
      }
    }
  };

  const stopQRScanner = async () => {
    if (scannerRef.current) {
      try {
        // Check if it's qr-scanner (has destroy method) or html5-qrcode
        if (scannerRef.current.destroy) {
          // qr-scanner: stop and destroy
          scannerRef.current.stop();
          scannerRef.current.destroy();
        } else if (scannerRef.current.stop) {
          // html5-qrcode: stop returns a promise
          await scannerRef.current.stop();
          if (scannerRef.current.clear) {
            scannerRef.current.clear();
          }
        }
      } catch (err) {
        console.error('Error stopping scanner:', err);
      } finally {
        scannerRef.current = null;
        if (videoRef.current) {
          videoRef.current = null;
        }
        // Clear the container
        const container = document.getElementById(qrCodeRegionId);
        if (container) {
          container.innerHTML = '';
        }
        setShowScanner(false);
      }
    } else {
      setShowScanner(false);
    }
  };

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
            <div className="space-y-2">
              {location ? (
                <div className="flex items-center justify-between text-sm bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <MapPin className="h-4 w-4" />
                    <span>Location detected</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={refreshLocation}
                    disabled={locationLoading}
                    className="h-7 text-xs"
                  >
                    {locationLoading ? 'Refreshing...' : 'Refresh'}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between text-sm bg-amber-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-700">
                    <AlertCircle className="h-4 w-4" />
                    <span>{locationError || 'Requesting location...'}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={refreshLocation}
                    disabled={locationLoading}
                    className="h-7 text-xs"
                  >
                    {locationLoading ? 'Loading...' : 'Retry'}
                  </Button>
                </div>
              )}

              {/* Show distance to nearest site */}
              {nearestSite && (
                <div className={`text-sm p-3 rounded-lg ${
                  distanceToSite <= nearestSite.attendanceRadius
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}>
                  <div className="flex items-center justify-between">
                    <span>
                      <strong>{nearestSite.name}</strong>
                    </span>
                    <span>
                      {distanceToSite}m away
                    </span>
                  </div>
                  <div className="text-xs mt-1">
                    {distanceToSite <= nearestSite.attendanceRadius ? (
                      <span className="text-green-600">✓ Within range ({nearestSite.attendanceRadius}m radius)</span>
                    ) : (
                      <span className="text-red-600">
                        ⚠ Too far! Need to be within {nearestSite.attendanceRadius}m
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
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
                    disabled={!location || loading || startingCamera}
                    className="w-full"
                    variant="outline"
                  >
                    {startingCamera ? (
                      <>
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        Starting Camera...
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4 mr-2" />
                        Open Camera Scanner
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    {!location && 'Location required to enable camera'}
                    {location && !startingCamera && 'Click to start camera and scan QR code'}
                    {location && startingCamera && 'Requesting camera permission...'}
                  </p>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or</span>
                    </div>
                  </div>

                  {/* Manual QR Entry */}
                  <form onSubmit={handleManualSubmit} className="space-y-3">
                    <div>
                      <Input
                        type="text"
                        placeholder='{"type":"attendance","version":"1.0"}'
                        value={manualQR}
                        onChange={(e) => setManualQR(e.target.value)}
                        disabled={loading || !location}
                        className="text-center font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        Enter the QR code data shown on the laptop screen
                      </p>
                    </div>
                    <Button
                      type="submit"
                      disabled={loading || !location || !manualQR.trim()}
                      className="w-full"
                    >
                      {loading ? (
                        <>
                          <Loader className="h-4 w-4 mr-2 animate-spin" />
                          Marking Attendance...
                        </>
                      ) : (
                        'Mark Attendance'
                      )}
                    </Button>
                  </form>
                </>
              ) : (
                <div className="space-y-4">
                  <div id={qrCodeRegionId} className="w-full rounded-lg overflow-hidden"></div>
                  <Button
                    onClick={stopQRScanner}
                    variant="outline"
                    className="w-full"
                  >
                    Cancel Scanning
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

