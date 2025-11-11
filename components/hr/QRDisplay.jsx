'use client';

import { useState, useEffect } from 'react';
import { QrCode, Download, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function QRDisplay() {
  const [qrImage, setQrImage] = useState(null);
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      <div className="flex items-center justify-center py-12">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center bg-muted p-8 rounded-lg">
        {qrImage && (
          <img
            src={qrImage}
            alt="Attendance QR Code"
            className="w-64 h-64 border-4 border-white rounded-lg shadow-lg"
          />
        )}
        <p className="mt-4 text-sm text-muted-foreground text-center max-w-md">
          Employees scan this QR code after logging in to mark their attendance
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={handleDownload} variant="outline" className="flex-1">
          <Download className="h-4 w-4 mr-2" />
          Download QR Code
        </Button>
        <Button
          onClick={() => {
            navigator.clipboard.writeText(qrCode);
            alert('QR code data copied to clipboard!');
          }}
          variant="outline"
          className="flex-1"
        >
          Copy QR Data
        </Button>
      </div>

      <div className="bg-muted p-4 rounded-lg">
        <p className="text-xs font-mono text-muted-foreground break-all">
          {qrCode}
        </p>
      </div>
    </div>
  );
}

