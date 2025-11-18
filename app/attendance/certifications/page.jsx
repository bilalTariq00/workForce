import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db/mongodb';
import { Certification } from '@/lib/models/Certification';
import CertificationUpload from '@/components/attendance/CertificationUpload';
import CertificationList from '@/components/attendance/CertificationList';

/**
 * Certification Upload & View Page
 * 
 * Purpose: Employees can upload and view their certifications
 * 
 * Access: All authenticated employees
 */
export default async function CertificationsPage({ searchParams }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  await connectDB();

  // Get employee's certifications
  const certifications = await Certification.find({ employeeId: session.user.id })
    .populate('validatedBy', 'firstName lastName')
    .sort({ createdAt: -1 })
    .lean();

  const success = searchParams?.success === 'true';

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">My Certifications</h1>
          <p className="text-muted-foreground">
            Upload and manage your certifications (SafePass, CSCS, First Aid, etc.)
          </p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-400">
              Certification uploaded successfully! It is now pending HR/EHS validation.
            </p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Upload Form */}
          <div>
            <CertificationUpload employeeId={session.user.id} />
          </div>

          {/* Certifications List */}
          <div>
            <CertificationList certifications={certifications} />
          </div>
        </div>
      </div>
    </div>
  );
}

