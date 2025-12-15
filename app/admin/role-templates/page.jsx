import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db/mongodb';
import { RoleTemplate } from '@/lib/models/RoleTemplate';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import AdminRoleTemplateManager from '@/components/admin/AdminRoleTemplateManager';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield, AlertCircle } from 'lucide-react';
import { serializeMongooseArray } from '@/lib/utils/serialize';

export const dynamic = 'force-dynamic';

/**
 * Admin Role Templates Management Page
 * 
 * Purpose: Admin-only page for managing role templates with full access
 * - Can edit default templates
 * - Can update any template at any time
 * - Can change role access for each role
 * 
 * Access: Admin only
 */
export default async function AdminRoleTemplatesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Only Admin and HR Officers can access (HR has admin-like permissions)
  if (session.user.role !== 'admin' && session.user.role !== 'hr_officer') {
    redirect('/dashboard');
  }

  await connectDB();

  // Fetch all role templates
  const templates = await RoleTemplate.find()
    .populate('createdBy', 'firstName lastName email')
    .sort({ baseRole: 1, name: 1 })
    .lean();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Role Templates Management
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage all role templates. Edit default templates, update role access, and modify permissions at any time.
            {session.user.role === 'admin' && ' (Full admin access)'}
          </p>
        </div>

        {/* Access Warning */}
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-amber-900">
                {session.user.role === 'admin' ? 'Admin Access' : 'HR Officer Access'}
              </CardTitle>
            </div>
            <CardDescription className="text-amber-800">
              {session.user.role === 'admin' 
                ? 'You have full administrative access to all role templates. Changes made here will affect all users assigned to these templates.'
                : 'You have access to manage role templates. Changes made here will affect all users assigned to these templates.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-amber-800 space-y-2">
            <p>
              • <strong>Default Templates:</strong> Can be edited and modified
            </p>
            <p>
              • <strong>Role Access:</strong> Update permissions for any role at any time
            </p>
            <p>
              • <strong>Immediate Effect:</strong> Changes apply to all users with these templates
            </p>
            {session.user.role === 'admin' && (
              <p>
                • <strong>Full Control:</strong> Admins can also delete default templates
              </p>
            )}
            <p>
              • <strong>Use with Caution:</strong> Modifying default templates affects system-wide access
            </p>
          </CardContent>
        </Card>

        {/* Templates Manager */}
        <Card>
          <CardHeader>
            <CardTitle>All Role Templates ({templates.length})</CardTitle>
            <CardDescription>
              Manage all role templates including default templates. Grouped by base role for easy navigation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminRoleTemplateManager initialTemplates={serializeMongooseArray(templates)} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

