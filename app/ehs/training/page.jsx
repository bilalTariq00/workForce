import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db/mongodb';
import { Employee } from '@/lib/models/Employee';
import TrainingRegisterList from '@/components/ehs/TrainingRegisterList';
import EHSLayout from '@/components/layouts/EHSLayout';

/**
 * EHS Training Register Page
 * 
 * Purpose: EHS officers can manage training records and track completion
 * 
 * Access: EHS Officers, HR, Admin
 */
export default async function TrainingPage() {
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

  // Get all active employees for the assignment form
  const employees = await Employee.find({ status: 'active' })
    .select('firstName lastName employeeId email')
    .sort({ firstName: 1, lastName: 1 })
    .lean();

  return (
    <EHSLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Training Register</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Manage mandatory training assignments and track completion status
          </p>
        </div>

        <TrainingRegisterList employees={employees} />
      </div>
    </EHSLayout>
  );
}

