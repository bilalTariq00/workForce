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

  // Start QR Scanner
  const startQRScanner = async () => {
    try {
      // Dynamic import
      const { Html5Qrcode } = await import('html5-qrcode');
      
      setShowScanner(true);
      const html5QrCode = new Html5Qrcode(qrCodeRegionId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // QR code scanned successfully
          handleQRScan(decodedText);
          stopQRScanner();
        },
        (errorMessage) => {
          // Ignore scanning errors (they're frequent)
        }
      );
    } catch (err) {
      setError('Failed to start camera. Please use manual entry.');
      setShowScanner(false);
    }
  };

  const stopQRScanner = () => {
    if (scannerRef.current) {
      scannerRef.current
        .stop()
        .then(() => {
          scannerRef.current.clear();
          setShowScanner(false);
        })
        .catch((err) => {
          console.error('Error stopping scanner:', err);
        });
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

