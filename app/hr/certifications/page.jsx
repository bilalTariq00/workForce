import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import CertificationTrackingList from '@/components/hr/CertificationTrackingList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Certification Tracking Page
 * 
 * Purpose: HR/EHS can view, validate, and track all certifications
 * 
 * Access: HR Officers, EHS Officers, Admin
 */
export default async function CertificationsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Only HR, EHS, and Admin can access
  if (
    session.user.role !== 'hr_officer' &&
    session.user.role !== 'ehs_officer' &&
    session.user.role !== 'admin'
  ) {
    redirect('/dashboard');
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Certification Tracking</h1>
          <p className="text-muted-foreground mt-2">
            Review, validate, and track employee certifications
          </p>
        </div>

        <CertificationTrackingList />
      </div>
    </DashboardLayout>
  );
}

