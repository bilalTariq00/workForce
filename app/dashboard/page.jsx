import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db/mongodb';
import { Attendance } from '@/lib/models/Attendance';
import { LogOut } from 'lucide-react';
import LogoutButton from '@/components/LogoutButton';

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Redirect HR to their dashboard
  if (session.user.role === 'hr_officer' || session.user.role === 'admin') {
    redirect('/hr/dashboard');
  }

  // Redirect Site Managers to their dashboard
  if (session.user.role === 'site_manager') {
    redirect('/site-manager/dashboard');
  }

  // Check if attendance is marked today
  await connectDB();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const attendance = await Attendance.findOne({
    employeeId: session.user.id,
    date: {
      $gte: today,
      $lt: tomorrow,
    },
  })
    .populate('siteId', 'name siteCode')
    .lean();

  // If attendance not marked, redirect to scan page
  if (!attendance) {
    redirect('/attendance/scan');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container-mobile py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Welcome, {session.user.name}
              </p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container-mobile py-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Portal</h2>
          <p className="text-gray-600">
            Your role: <span className="font-medium capitalize">{session.user.role.replace('_', ' ')}</span>
          </p>
          <p className="text-gray-600 mt-2">
            Employee ID: <span className="font-medium">{session.user.employeeId}</span>
          </p>
          
          {attendance && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-900 mb-2">Today's Attendance</h3>
              <p className="text-sm text-green-800">
                <span className="font-medium">Site:</span> {attendance.siteId?.name || 'N/A'}
              </p>
              <p className="text-sm text-green-800">
                <span className="font-medium">Signed in:</span>{' '}
                {new Date(attendance.signInTime).toLocaleTimeString()}
              </p>
              {attendance.signOutTime && (
                <p className="text-sm text-green-800">
                  <span className="font-medium">Signed out:</span>{' '}
                  {new Date(attendance.signOutTime).toLocaleTimeString()}
                </p>
              )}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              More features coming soon! This is your personal dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

