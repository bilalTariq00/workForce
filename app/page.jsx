import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Attendance } from '@/lib/models/Attendance';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // HR and Admin don't need to mark attendance - go directly to dashboard
  if (session.user.role === 'hr_officer' || session.user.role === 'admin') {
    redirect('/hr/dashboard');
  }

  // For other roles, check if attendance is marked today
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
  });

  // If attendance not marked, redirect to scan page
  if (!attendance) {
    redirect('/attendance/scan');
  }

  // Attendance marked, go to dashboard
  redirect('/dashboard');
}

