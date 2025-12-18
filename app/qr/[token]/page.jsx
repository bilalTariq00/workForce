'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * QR Token Scanning Route
 * 
 * Purpose: Resolve site from QR token and redirect to attendance scan
 * 
 * This route is used when scanning a site-specific QR code.
 * It resolves the site ID from the token and redirects to the attendance scan page
 * with the site information pre-filled.
 */
export default function QRTokenPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [siteInfo, setSiteInfo] = useState(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login?callbackUrl=' + encodeURIComponent(window.location.pathname));
      return;
    }

    const resolveToken = async () => {
      try {
        const token = params.token;
        
        // Parse the QR data if it's a JSON string
        let qrData;
        try {
          qrData = JSON.parse(token);
        } catch {
          // If not JSON, treat as token string
          qrData = { token };
        }

        // If it's a site-specific QR code, extract the token
        if (qrData.type === 'site_attendance' && qrData.token && qrData.siteId) {
          const fullToken = `${qrData.siteId}_${qrData.token}`;
          
          // Redirect to attendance scan with QR data
          router.push(`/attendance/scan?qr=${encodeURIComponent(JSON.stringify(qrData))}`);
          return;
        }

        // If it's just a token string, try to resolve it
        const response = await fetch(`/api/v1/sites/resolve-token?token=${encodeURIComponent(token)}`);
        const result = await response.json();

        if (result.success && result.data.site) {
          setSiteInfo(result.data.site);
          // Redirect to attendance scan with site info
          const qrData = {
            type: 'site_attendance',
            siteId: result.data.site._id,
            token: result.data.token,
          };
          router.push(`/attendance/scan?qr=${encodeURIComponent(JSON.stringify(qrData))}`);
        } else {
          setError('Invalid or expired QR code');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error resolving QR token:', err);
        setError('Failed to process QR code');
        setLoading(false);
      }
    };

    resolveToken();
  }, [params.token, session, status, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-gray-600">Processing QR code...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">{error}</p>
            <Button onClick={() => router.push('/attendance/scan')} className="w-full">
              Go to Attendance Scan
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-12 w-12 text-green-600 mb-4" />
            <p className="text-gray-600">Redirecting to attendance scan...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

