'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { checkModuleAccess } from '@/lib/utils/moduleAccess';
import { Package, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Module Access Guard Component
 * 
 * Protects routes that require module access
 * Shows a message if user doesn't have access to the required module
 */
export default function ModuleAccessGuard({ 
  moduleCode, 
  children, 
  moduleName 
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session?.user) {
    router.push('/login');
    return null;
  }

  const hasAccess = checkModuleAccess(session.user, moduleCode);

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <Lock className="h-12 w-12 text-gray-400" />
            </div>
            <CardTitle className="text-center">Module Access Required</CardTitle>
            <CardDescription className="text-center">
              You need to purchase the {moduleName || 'module'} to access this feature
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-gray-600">
              <p>This dashboard requires the <strong>{moduleName || moduleCode}</strong> module.</p>
              <p className="mt-2">Purchase it from the marketplace to get started.</p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => router.push('/modules')} 
                className="flex-1"
              >
                <Package className="mr-2 h-4 w-4" />
                Browse Modules
              </Button>
              <Button 
                onClick={() => {
                  // Only admin goes to modules-dashboard, all other roles go to /dashboard
                  const userRole = session?.user?.role;
                  if (userRole === 'admin') {
                    router.push('/modules-dashboard');
                  } else {
                    router.push('/dashboard');
                  }
                }} 
                variant="outline"
                className="flex-1"
              >
                My Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}


