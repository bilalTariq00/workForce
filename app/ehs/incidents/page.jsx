import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db/mongodb';
import { Incident } from '@/lib/models/Incident';
import IncidentTriageList from '@/components/ehs/IncidentTriageList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * EHS Incident Triage & Investigation Page
 * 
 * Purpose: EHS officers can triage, assign, and investigate incidents
 * 
 * Access: EHS Officers, HR, Admin
 */
export default async function EHSIncidentsPage() {
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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Incident Triage & Investigation</h1>
          <p className="text-muted-foreground mt-2">
            Review, assign, and investigate safety incidents and near-misses
          </p>
        </div>

        <IncidentTriageList />
      </div>
    </div>
  );
}

