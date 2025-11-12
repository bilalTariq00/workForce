import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db/mongodb';
import { Employee } from '@/lib/models/Employee';
import { Site } from '@/lib/models/Site';
import SiteManagerLayout from '@/components/layouts/SiteManagerLayout';
import AttendanceVerificationClient from '@/components/site-manager/AttendanceVerificationClient';

/**
 * Site Manager Attendance Verification Page
 * 
 * Purpose: Compare planned vs actual headcount and identify missing workers
 * 
 * Access: Only Site Managers (their assigned site)
 */
export default async function AttendanceVerificationPage() {
  const session = await getServerSession(authOptions);

  // Redirect to login if not authenticated
  if (!session) {
    redirect('/login');
  }

  // Only Site Managers can access this page
  if (session.user.role !== 'site_manager') {
    redirect('/dashboard');
  }

  await connectDB();

  // Get the Site Manager's assigned site
  const siteManager = await Employee.findById(session.user.id).lean();
  
  if (!siteManager || !siteManager.siteId) {
    return (
      <SiteManagerLayout>
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            You are not assigned to any site. Please contact HR to assign you to a site.
          </p>
        </div>
      </SiteManagerLayout>
    );
  }

  // Get site details
  const site = await Site.findById(siteManager.siteId).lean();

  if (!site) {
    return (
      <SiteManagerLayout>
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            Your assigned site was not found. Please contact HR.
          </p>
        </div>
      </SiteManagerLayout>
    );
  }

  return (
    <SiteManagerLayout siteName={site.name}>
      <AttendanceVerificationClient siteId={site._id.toString()} />
    </SiteManagerLayout>
  );
}

