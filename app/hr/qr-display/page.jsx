import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import QRDisplay from '@/components/hr/QRDisplay';

export default async function QRDisplayPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Only HR and Admin can access
  if (session.user.role !== 'hr_officer' && session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Attendance QR Code</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Display this QR code for employees to scan and mark attendance
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Universal QR Code</CardTitle>
            <CardDescription>
              This QR code works for all employees. They scan it after logging in to mark attendance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QRDisplay />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. Display this QR code at the site entrance</p>
            <p>2. Employees log in to the system</p>
            <p>3. They scan this QR code with their phone</p>
            <p>4. System validates their location (must be within site radius)</p>
            <p>5. Attendance is automatically marked for the day</p>
            <p>6. Employee can then access their dashboard</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

