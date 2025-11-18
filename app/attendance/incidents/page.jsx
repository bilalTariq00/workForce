import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db/mongodb';
import { Employee } from '@/lib/models/Employee';
import { Incident } from '@/lib/models/Incident';
import IncidentReportForm from '@/components/attendance/IncidentReportForm';
import IncidentList from '@/components/attendance/IncidentList';

/**
 * Incident Reporting Page
 * 
 * Purpose: Employees and Site Managers can report incidents and near-misses
 * 
 * Access: All authenticated employees
 */
export default async function IncidentsPage({ searchParams }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  await connectDB();

  // Get employee's assigned site
  const employee = await Employee.findById(session.user.id).lean();

  if (!employee || !employee.siteId) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">Report Incident</h1>
            <p className="text-muted-foreground">
              You are not assigned to any site. Please contact HR to assign you to a site.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Get employee's reported incidents
  const incidents = await Incident.find({ reportedBy: session.user.id })
    .populate('siteId', 'name siteCode')
    .populate('assignedTo', 'firstName lastName')
    .sort({ occurredAt: -1 })
    .lean();

  const showForm = searchParams?.create === 'true';
  const success = searchParams?.success === 'true';

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Incident Reports</h1>
          <p className="text-muted-foreground">
            Report incidents and near-misses. EHS will review and investigate.
          </p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-400">
              Incident reported successfully! EHS will review and investigate.
            </p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Report Form */}
          {showForm && (
            <div>
              <div className="mb-4">
                <a href="/attendance/incidents">
                  <button className="px-4 py-2 border rounded-lg hover:bg-muted">
                    ← Back to List
                  </button>
                </a>
              </div>
              <IncidentReportForm
                siteId={employee.siteId}
                onSuccess={() => {
                  // This will be handled client-side
                }}
              />
            </div>
          )}

          {/* Incidents List */}
          <div>
            {!showForm && (
              <div className="mb-4">
                <a href="/attendance/incidents?create=true">
                  <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                    Report New Incident
                  </button>
                </a>
              </div>
            )}
            <IncidentList incidents={incidents} />
          </div>
        </div>
      </div>
    </div>
  );
}

