import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db/mongodb';
import { Site } from '@/lib/models/Site';
import { Employee } from '@/lib/models/Employee';
import { Attendance } from '@/lib/models/Attendance';
import ContractsManagerLayout from '@/components/layouts/ContractsManagerLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, Users, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { serializeMongoose, serializeMongooseArray } from '@/lib/utils/serialize';

export const dynamic = 'force-dynamic';

/**
 * Contracts Manager Sites Page
 * 
 * Purpose: View all sites with key metrics and details
 * 
 * Access: Contracts Manager, Admin only
 */
export default async function ContractsManagerSitesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Only Contracts Managers and Admin can access
  if (session.user.role !== 'contracts_manager' && session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  await connectDB();

  // Fetch all sites
  const sites = await Site.find()
    .populate('contractsManagerId', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .lean();

  // Get today's date for attendance check
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Fetch site managers and today's attendance for each site
  const sitesWithDetails = await Promise.all(
    sites.map(async (site) => {
      // Find Site Managers assigned to this site
      const siteManagers = await Employee.find({
        role: 'site_manager',
        siteId: site._id,
        status: 'active',
      })
        .select('firstName lastName email employeeId')
        .lean();

      // Get today's attendance count
      const todayAttendance = await Attendance.countDocuments({
        siteId: site._id,
        date: {
          $gte: today,
          $lt: tomorrow,
        },
      });

      // Get total employees assigned to this site
      const totalEmployees = await Employee.countDocuments({
        siteId: site._id,
        status: 'active',
      });

      return serializeMongoose({
        ...site,
        siteManagers: serializeMongooseArray(siteManagers),
        todayAttendance,
        totalEmployees,
      });
    })
  );

  return (
    <ContractsManagerLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Sites</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            View all construction sites and their key metrics
          </p>
        </div>

        {/* Sites Grid */}
        {sitesWithDetails.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 sm:py-12">
                <Building2 className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm sm:text-base text-muted-foreground">No sites found</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {sitesWithDetails.map((site) => (
              <Card key={site._id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 sm:pb-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                        <span className="truncate">{site.name}</span>
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm mt-1">
                        {site.siteCode}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={site.status === 'active' ? 'default' : 'secondary'}
                      className="flex-shrink-0"
                    >
                      {site.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-4">
                  {/* Address */}
                  {site.address && (
                    <div className="flex items-start gap-2 text-xs sm:text-sm">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-muted-foreground break-words">
                          {[site.address.street, site.address.city, site.address.postcode]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Employees</p>
                      <p className="text-sm sm:text-base font-semibold">{site.totalEmployees || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Today's Attendance</p>
                      <p className="text-sm sm:text-base font-semibold">{site.todayAttendance || 0}</p>
                    </div>
                  </div>

                  {/* Site Managers */}
                  {site.siteManagers && site.siteManagers.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-2">Site Managers</p>
                      <div className="space-y-1">
                        {site.siteManagers.map((manager) => (
                          <div key={manager._id} className="flex items-center gap-2 text-xs sm:text-sm">
                            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                            <span className="truncate">
                              {manager.firstName} {manager.lastName}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-2 border-t">
                    <Link href={`/contracts-manager/dashboard?site=${site._id}`}>
                      <button className="w-full text-xs sm:text-sm py-2 px-3 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors touch-manipulation">
                        View Dashboard
                      </button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ContractsManagerLayout>
  );
}

