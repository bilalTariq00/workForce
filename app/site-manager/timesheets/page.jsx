import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db/mongodb';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import TimesheetListClient from '@/components/hr/TimesheetListClient';

/**
 * Site Manager Timesheet View
 * 
 * Purpose: Site Managers can view timesheets for employees at their assigned sites only
 * 
 * Access: Site Manager only
 */
export default async function SiteManagerTimesheetsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Only Site Managers can access
  if (session.user.role !== 'site_manager') {
    redirect('/dashboard');
  }

  await connectDB();

  // Get all sites where this user is assigned as site_manager
  const { EmployeeSite } = await import('@/lib/models/EmployeeSite');
  const siteAssignments = await EmployeeSite.find({
    employeeId: session.user.id,
    role: 'site_manager',
    isActive: true,
  })
    .select('siteId')
    .lean();

  const siteIds = siteAssignments.map(assignment => assignment.siteId);

  // If no sites assigned, show empty state
  if (siteIds.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Timesheets</h2>
            <p className="text-sm text-muted-foreground mt-1">
              View timesheets for employees at your assigned sites
            </p>
          </div>
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              You are not assigned to any sites. Please contact HR to be assigned to a site.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Pass siteIds to the client component for filtering
  return (
    <DashboardLayout>
      <TimesheetListClient siteManagerMode={true} assignedSiteIds={siteIds.map(id => id.toString())} />
    </DashboardLayout>
  );
}

