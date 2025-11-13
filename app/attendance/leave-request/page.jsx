import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db/mongodb';
import { Employee } from '@/lib/models/Employee';
import LeaveRequestForm from '@/components/attendance/LeaveRequestForm';

/**
 * Leave Request Page
 * 
 * Purpose: Employees can request leave from this mobile-optimized page
 * 
 * Access: All authenticated employees
 */
export default async function LeaveRequestPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  await connectDB();

  // Get employee details to show leave balance
  const employee = await Employee.findById(session.user.id).lean();

  if (!employee) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Request Leave</h1>
          <p className="text-muted-foreground">
            Submit a leave request for approval. Your request will be reviewed by HR or your supervisor.
          </p>
        </div>

        {employee.annualLeaveBalance !== undefined && (
          <div className="mb-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-sm text-muted-foreground mb-1">Annual Leave Balance</p>
            <p className="text-2xl font-semibold text-primary">
              {employee.annualLeaveBalance || 0} days
            </p>
          </div>
        )}

        <LeaveRequestForm employeeId={session.user.id} annualLeaveBalance={employee.annualLeaveBalance || 0} />
      </div>
    </div>
  );
}

