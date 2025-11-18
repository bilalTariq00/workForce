import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db/mongodb';
import { Inspection } from '@/lib/models/Inspection';
import { Site } from '@/lib/models/Site';
import { Employee } from '@/lib/models/Employee';
import InspectionList from '@/components/ehs/InspectionList';
import EHSLayout from '@/components/layouts/EHSLayout';

export const dynamic = 'force-dynamic';

/**
 * EHS Inspection Management Page
 * 
 * Purpose: EHS officers can create, view, and manage site inspections
 * 
 * Access: EHS Officers, HR, Admin
 */
export default async function InspectionsPage({ searchParams }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      redirect('/login');
    }

    // Only EHS, HR, and Admin can access
    if (
      session.user.role !== 'ehs_officer' &&
      session.user.role !== 'hr_officer' &&
      session.user.role !== 'admin'
    ) {
      redirect('/dashboard');
    }

    await connectDB();

    // Get all sites for the create form
    let sites = [];
    try {
      sites = await Site.find({ status: 'active' })
        .select('name siteCode')
        .sort({ name: 1 })
        .lean();
    } catch (error) {
      console.error('[EHS INSPECTIONS] Error fetching sites:', error);
    }

    return (
      <EHSLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Site Inspections</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Create and manage site inspections, log issues, and track corrective actions
            </p>
          </div>

          <InspectionList sites={sites} />
        </div>
      </EHSLayout>
    );
  } catch (error) {
    console.error('[EHS INSPECTIONS] Fatal error:', error);
    return (
      <EHSLayout>
        <div className="space-y-4 sm:space-y-6">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
              Error Loading Page
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              An error occurred while loading the page. Please try refreshing.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <pre className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded text-xs overflow-auto">
                {error.message}
                {error.stack && `\n${error.stack}`}
              </pre>
            )}
          </div>
        </div>
      </EHSLayout>
    );
  }
}

