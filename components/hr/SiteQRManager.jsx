'use client';

import { useState, useEffect } from 'react';
import { QrCode, Download, RefreshCw, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * SiteQRManager Component
 * 
 * Purpose: Manage QR codes for a site (view, download, regenerate)
 * 
 * Props:
 * - siteId: Site ID
 * - siteName: Site name (for display)
 */
export default function SiteQRManager({ siteId, siteName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState('');

  // Fetch QR data when modal opens
  useEffect(() => {
    if (isOpen && siteId) {
      fetchQRToken();
    }
  }, [isOpen, siteId]);

  const fetchQRToken = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/v1/sites/${siteId}/qr-token`);
      const result = await response.json();

      if (result.success) {
        setQrData(result.data);
      } else {
        setError(result.error?.message || 'Failed to load QR code');
      }
    } catch (err) {
      setError('An error occurred while loading QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!confirm('Are you sure you want to regenerate the QR code? The old QR code will no longer work.')) {
      return;
    }

    setRegenerating(true);
    setError('');
    try {
      const response = await fetch(`/api/v1/sites/${siteId}/qr-token/regenerate`, {
        method: 'POST',
      });
      const result = await response.json();

      if (result.success) {
        setQrData(result.data);
        alert('QR code regenerated successfully');
      } else {
        setError(result.error?.message || 'Failed to regenerate QR code');
      }
    } catch (err) {
      setError('An error occurred while regenerating QR code');
    } finally {
      setRegenerating(false);
    }
  };

  const handleDownloadPNG = () => {
    if (!qrData?.qrImage) return;

    const link = document.createElement('a');
    link.href = qrData.qrImage;
    link.download = `${siteName || 'site'}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = async () => {
    if (!qrData?.qrImage) return;

    try {
      // Create a canvas to convert image to PDF
      const img = new Image();
      img.src = qrData.qrImage;
      
      img.onload = () => {
        // For PDF, we'll use a simple approach: open in new window and print
        // Or use a library like jsPDF
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
          <html>
            <head>
              <title>QR Code - ${siteName}</title>
              <style>
                body { 
                  display: flex; 
                  justify-content: center; 
                  align-items: center; 
                  height: 100vh; 
                  margin: 0;
                  flex-direction: column;
                }
                img { max-width: 100%; height: auto; }
                h2 { text-align: center; margin-bottom: 20px; }
              </style>
            </head>
            <body>
              <h2>${siteName} - Attendance QR Code</h2>
              <img src="${qrData.qrImage}" alt="QR Code" />
              <p style="text-align: center; margin-top: 20px;">Scan this QR code to mark attendance</p>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      };
    } catch (err) {
      alert('Failed to generate PDF. Please use the PNG download instead.');
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-blue-600 hover:text-blue-900"
        title="View QR Code"
      >
        <QrCode className="w-4 h-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code - {siteName}</DialogTitle>
            <DialogDescription>
              Scan this QR code to mark attendance at this site
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-600">
                <p>{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchQRToken}
                  className="mt-4"
                >
                  Retry
                </Button>
              </div>
            ) : qrData?.qrImage ? (
              <>
                <div className="flex justify-center">
                  <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
                    <img
                      src={qrData.qrImage}
                      alt="QR Code"
                      className="w-64 h-64"
                    />
                  </div>
                </div>

                <div className="text-center text-sm text-gray-600">
                  <p>Token: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{qrData.token?.substring(0, 20)}...</code></p>
                  <p className="mt-2">Generated: {new Date(qrData.generatedAt).toLocaleString()}</p>
                </div>

                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    onClick={handleDownloadPNG}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download PNG
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Print PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleRegenerate}
                    disabled={regenerating}
                    className="flex items-center gap-2"
                  >
                    {regenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Regenerate
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No QR code available</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

