'use client';

import { useState, useEffect } from 'react';
import { QrCode, Download, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Public QR display page - can be shown on laptop/computer at site entrance
// No login required - just displays the QR code
export default function PublicQRDisplay() {
  const [qrImage, setQrImage] = useState(null);
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const fetchQR = async () => {
      try {
        const response = await fetch('/api/v1/qr/generate');
        const result = await response.json();

        if (result.success) {
          setQrImage(result.data.qrCodeImage);
          setQrCode(result.data.qrCode);
        } else {
          setError('Failed to generate QR code');
        }
      } catch (err) {
        setError('An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchQR();
  }, []);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleDownload = () => {
    if (qrImage) {
      const link = document.createElement('a');
      link.href = qrImage;
      link.download = 'attendance-qr-code.png';
      link.click();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <QrCode className="h-16 w-16 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading QR Code...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center text-red-600">
          <p className="text-xl font-semibold mb-2">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      {/* Header - Hidden in fullscreen */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Scan to Mark Attendance
        </h1>
        <p className="text-muted-foreground">
          Employees: Scan this QR code with your phone after logging in
        </p>
      </div>

      {/* QR Code Display */}
      <div className="bg-white p-8 rounded-2xl shadow-2xl mb-8">
        {qrImage && (
          <img
            src={qrImage}
            alt="Attendance QR Code"
            className="w-96 h-96 border-4 border-primary rounded-lg"
          />
        )}
      </div>

      {/* Instructions */}
      <div className="max-w-2xl text-center space-y-4 mb-8">
        <div className="bg-muted p-6 rounded-lg">
          <h2 className="font-semibold text-foreground mb-4">Instructions for Employees:</h2>
          <ol className="text-left space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li>Log in to the workforce app on your mobile phone</li>
            <li>You will be redirected to the QR scan page</li>
            <li>Point your phone camera at this QR code</li>
            <li>Wait for the scan to complete</li>
            <li>Your attendance will be marked automatically</li>
          </ol>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4">
        <Button onClick={handleFullscreen} variant="outline" size="lg">
          <Maximize2 className="h-4 w-4 mr-2" />
          {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Mode'}
        </Button>
        <Button onClick={handleDownload} variant="outline" size="lg">
          <Download className="h-4 w-4 mr-2" />
          Download QR Code
        </Button>
      </div>

      {/* QR Code Data (for manual entry) */}
      <div className="mt-8 max-w-2xl w-full">
        <div className="bg-muted p-4 rounded-lg border border-border">
          <p className="text-xs font-medium text-foreground mb-2 text-center">
            QR Code Data (for manual entry if camera doesn't work):
          </p>
          <div className="bg-background p-3 rounded border border-border">
            <code className="text-xs font-mono text-foreground break-all">
              {qrCode || '{"type":"attendance","version":"1.0"}'}
            </code>
          </div>
          <Button
            onClick={() => {
              navigator.clipboard.writeText(qrCode || '{"type":"attendance","version":"1.0"}');
              alert('QR code data copied to clipboard!');
            }}
            variant="outline"
            size="sm"
            className="mt-2 w-full"
          >
            Copy QR Code Data
          </Button>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-4 text-xs text-muted-foreground text-center">
        Keep this page open and visible at the site entrance
      </p>
    </div>
  );
}

