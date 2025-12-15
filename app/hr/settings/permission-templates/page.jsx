import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db/mongodb';
import { RoleTemplate } from '@/lib/models/RoleTemplate';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PermissionTemplateList from '@/components/hr/PermissionTemplateList';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { serializeMongooseArray } from '@/lib/utils/serialize';

export const dynamic = 'force-dynamic';

export default async function PermissionTemplatesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Only HR and Admin can access
  if (session.user.role !== 'hr_officer' && session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  await connectDB();

  // Fetch all role templates
  const templates = await RoleTemplate.find()
    .populate('createdBy', 'firstName lastName email')
    .sort({ name: 1 })
    .lean();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Permission Templates
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage role-based permission templates. Assign templates to employees to control their access to modules and actions.
          </p>
        </div>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>About Permission Templates</CardTitle>
            <CardDescription>
              Permission templates define what modules and actions each role can access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              • <strong>Modules:</strong> Different areas of the system (HR, Payroll, Attendance, etc.)
            </p>
            <p>
              • <strong>Actions:</strong> What users can do (View, Create, Edit, Approve, Export, Manage)
            </p>
            <p>
              • <strong>Default Templates:</strong> Pre-configured templates for each role that cannot be deleted
            </p>
            <p>
              • <strong>Custom Templates:</strong> Create your own templates with specific permission combinations
            </p>
          </CardContent>
        </Card>

        {/* Templates List */}
        <Card>
          <CardHeader>
            <CardTitle>All Templates ({templates.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <PermissionTemplateList initialTemplates={serializeMongooseArray(templates)} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}



