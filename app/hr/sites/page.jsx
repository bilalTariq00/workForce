import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db/mongodb';
import { Site } from '@/lib/models/Site';
import { Employee } from '@/lib/models/Employee';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import SiteList from '@/components/hr/SiteList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { serializeMongoose, serializeMongooseArray } from '@/lib/utils/serialize';

/**
 * Sites Page
 * 
 * Purpose: HR manages construction sites and assigns Site Managers
 * 
 * Features:
 * - View all sites
 * - Create new sites
 * - See assigned Contracts Managers
 * - See assigned Site Managers
 * - Assign/Unassign Site Managers to sites
 */
export default async function SitesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Only HR and Admin can access
  if (session.user.role !== 'hr_officer' && session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  await connectDB();
  
  // Fetch all sites (contractsManagerId is now optional)
  const sites = await Site.find()
    .populate('contractsManagerId', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .lean();

  // Fetch EmployeeSite assignments for each site (includes role templates)
  const { EmployeeSite } = await import('@/lib/models/EmployeeSite');
  
  const sitesWithManagers = await Promise.all(
    sites.map(async (site) => {
      // Get all employees assigned to this site via EmployeeSite
      const siteAssignments = await EmployeeSite.getSiteEmployees(site._id);
      
      // Separate Site Managers from other roles
      const siteManagers = siteAssignments
        .filter(assignment => assignment.role === 'site_manager')
        .map(assignment => ({
          ...assignment.employeeId,
          roleTemplateId: assignment.roleTemplateId,
          assignmentId: assignment._id,
        }));

      return serializeMongoose({
        ...site,
        siteManagers: serializeMongooseArray(siteManagers),
        allAssignments: serializeMongooseArray(siteAssignments), // All employees at site
      });
    })
  );

  // Also fetch all available Site Managers (not assigned to any site or assigned to other sites)
  // This is used for the assignment dropdown
  const allSiteManagers = await Employee.find({
    role: 'site_manager',
    status: 'active',
  })
    .select('firstName lastName email employeeId siteId')
    .lean();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Sites</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all construction sites and assign Site Managers
          </p>
        </div>

        {/* Site List */}
        <Card>
          <CardHeader>
            <CardTitle>All Sites ({sites.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <SiteList 
              initialSites={serializeMongooseArray(sitesWithManagers)} 
              allSiteManagers={serializeMongooseArray(allSiteManagers)}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

