import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect, notFound } from 'next/navigation';
import { connectDB } from '@/lib/db/mongodb';
import { Employee } from '@/lib/models/Employee';
import { EmployeeSite } from '@/lib/models/EmployeeSite';
import { Site } from '@/lib/models/Site';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Mail, Phone, Calendar, MapPin, Building, User } from 'lucide-react';
import Link from 'next/link';
import EmployeeDetailTabs from '@/components/hr/EmployeeDetailTabs';
import { serializeMongoose, serializeMongooseArray as serializeArray } from '@/lib/utils/serialize';
import mongoose from 'mongoose';

export default async function EmployeeDetailPage({ params }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Only HR and Admin can access
  if (session.user.role !== 'hr_officer' && session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  await connectDB();

  const { id } = params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    notFound();
  }

  const employee = await Employee.findById(id)
    .select('-password')
    .populate('siteId', 'name siteCode')
    .populate('roleTemplateId', 'name description')
    .lean();

  if (!employee) {
    notFound();
  }

  // Get assigned sites
  const assignedSites = await EmployeeSite.getEmployeeSites(id);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/hr/employees">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                {employee.firstName} {employee.lastName}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {employee.employeeId}
              </p>
            </div>
          </div>
          <Link href={`/hr/employees/${id}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit Employee
            </Button>
          </Link>
        </div>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium text-foreground truncate">{employee.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Phone className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium text-foreground">{employee.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <User className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Role</p>
                  <p className="text-sm font-medium text-foreground capitalize">
                    {employee.role?.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  employee.status === 'active' ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <Building className={`h-5 w-5 ${
                    employee.status === 'active' ? 'text-green-600' : 'text-gray-600'
                  }`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="text-sm font-medium text-foreground capitalize">{employee.status}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Employee Detail Tabs */}
        <EmployeeDetailTabs 
          employee={serializeMongoose(employee)} 
          assignedSites={serializeArray(assignedSites)}
        />
      </div>
    </DashboardLayout>
  );
}

