import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db/mongodb';
import { Inspection } from '@/lib/models/Inspection';
import { Site } from '@/lib/models/Site';
import InspectionList from '@/components/ehs/InspectionList';
import EHSLayout from '@/components/layouts/EHSLayout';

/**
 * EHS Inspection Management Page
 * 
 * Purpose: EHS officers can create, view, and manage site inspections
 * 
 * Access: EHS Officers, HR, Admin
 */
export default async function InspectionsPage({ searchParams }) {
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
  const sites = await Site.find({ status: 'active' })
    .select('name siteCode')
    .sort({ name: 1 })
    .lean();

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
}

