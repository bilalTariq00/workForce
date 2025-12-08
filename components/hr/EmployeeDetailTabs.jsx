'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Briefcase, 
  CreditCard, 
  MapPin, 
  Calendar, 
  FileText,
  Mail,
  Phone,
  Shield,
  Building
} from 'lucide-react';
import EmployeeCertificatesTab from './EmployeeCertificatesTab';

export default function EmployeeDetailTabs({ employee, assignedSites }) {
  const [activeTab, setActiveTab] = useState('overview');

  // Date formatting functions (must be in Client Component)
  const formatDate = (date) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDateShort = (date) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-GB');
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      labour: 'bg-blue-100 text-blue-800',
      site_manager: 'bg-green-100 text-green-800',
      contracts_manager: 'bg-purple-100 text-purple-800',
      hr_officer: 'bg-orange-100 text-orange-800',
      ehs_officer: 'bg-red-100 text-red-800',
      admin: 'bg-gray-100 text-gray-800',
    };
    return colors[role] || colors.labour;
  };

  const formatRole = (role) => {
    return role?.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || '';
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          {[
            { id: 'overview', label: 'Overview', icon: User },
            { id: 'hr', label: 'HR Data', icon: Briefcase },
            { id: 'payroll', label: 'Payroll', icon: CreditCard },
            { id: 'certificates', label: 'Certificates', icon: FileText },
            { id: 'sites', label: 'Sites', icon: MapPin },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">First Name</p>
                    <p className="text-sm font-medium">{employee.firstName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Last Name</p>
                    <p className="text-sm font-medium">{employee.lastName}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Employee ID</p>
                  <p className="text-sm font-medium">{employee.employeeId}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {employee.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {employee.phone}
                  </p>
                </div>
                {employee.dateOfBirth && (
                  <div>
                    <p className="text-xs text-muted-foreground">Date of Birth</p>
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(employee.dateOfBirth)}
                    </p>
                  </div>
                )}
                {employee.nationalInsuranceNumber && (
                  <div>
                    <p className="text-xs text-muted-foreground">National Insurance Number</p>
                    <p className="text-sm font-medium">{employee.nationalInsuranceNumber}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Employment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">Role</p>
                  <Badge className={getRoleBadgeColor(employee.role)}>
                    {formatRole(employee.role)}
                  </Badge>
                </div>
                {employee.roleTemplateId && (
                  <div>
                    <p className="text-xs text-muted-foreground">Role Template</p>
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      {typeof employee.roleTemplateId === 'object' 
                        ? employee.roleTemplateId.name 
                        : 'Not assigned'}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge className={employee.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {employee.status}
                  </Badge>
                </div>
                {employee.employmentDetails?.startDate && (
                  <div>
                    <p className="text-xs text-muted-foreground">Start Date</p>
                    <p className="text-sm font-medium">{formatDate(employee.employmentDetails.startDate)}</p>
                  </div>
                )}
                {employee.employmentDetails?.employmentType && (
                  <div>
                    <p className="text-xs text-muted-foreground">Employment Type</p>
                    <p className="text-sm font-medium capitalize">
                      {employee.employmentDetails.employmentType.replace('_', ' ')}
                    </p>
                  </div>
                )}
                {employee.employmentDetails?.department && (
                  <div>
                    <p className="text-xs text-muted-foreground">Department</p>
                    <p className="text-sm font-medium">{employee.employmentDetails.department}</p>
                  </div>
                )}
                {employee.employmentDetails?.position && (
                  <div>
                    <p className="text-xs text-muted-foreground">Position</p>
                    <p className="text-sm font-medium">{employee.employmentDetails.position}</p>
                  </div>
                )}
                {employee.payRate && (
                  <div>
                    <p className="text-xs text-muted-foreground">Pay Rate</p>
                    <p className="text-sm font-medium">£{employee.payRate.toFixed(2)}/hour</p>
                  </div>
                )}
                {employee.annualLeaveBalance !== undefined && (
                  <div>
                    <p className="text-xs text-muted-foreground">Annual Leave Balance</p>
                    <p className="text-sm font-medium">{employee.annualLeaveBalance} days</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* HR Data Tab */}
        {activeTab === 'hr' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {employee.dateOfBirth && (
                  <div>
                    <p className="text-xs text-muted-foreground">Date of Birth</p>
                    <p className="text-sm font-medium">{formatDate(employee.dateOfBirth)}</p>
                  </div>
                )}
                {employee.nationalInsuranceNumber && (
                  <div>
                    <p className="text-xs text-muted-foreground">National Insurance Number</p>
                    <p className="text-sm font-medium font-mono">{employee.nationalInsuranceNumber}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {employee.emergencyContact?.name && (
              <Card>
                <CardHeader>
                  <CardTitle>Emergency Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="text-sm font-medium">{employee.emergencyContact.name}</p>
                  </div>
                  {employee.emergencyContact.relationship && (
                    <div>
                      <p className="text-xs text-muted-foreground">Relationship</p>
                      <p className="text-sm font-medium capitalize">
                        {employee.emergencyContact.relationship}
                      </p>
                    </div>
                  )}
                  {employee.emergencyContact.phone && (
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium">{employee.emergencyContact.phone}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Employment Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {employee.employmentDetails?.startDate && (
                    <div>
                      <p className="text-xs text-muted-foreground">Start Date</p>
                      <p className="text-sm font-medium">{formatDate(employee.employmentDetails.startDate)}</p>
                    </div>
                  )}
                  {employee.employmentDetails?.employmentType && (
                    <div>
                      <p className="text-xs text-muted-foreground">Employment Type</p>
                      <p className="text-sm font-medium capitalize">
                        {employee.employmentDetails.employmentType.replace('_', ' ')}
                      </p>
                    </div>
                  )}
                  {employee.employmentDetails?.department && (
                    <div>
                      <p className="text-xs text-muted-foreground">Department</p>
                      <p className="text-sm font-medium">{employee.employmentDetails.department}</p>
                    </div>
                  )}
                  {employee.employmentDetails?.position && (
                    <div>
                      <p className="text-xs text-muted-foreground">Position</p>
                      <p className="text-sm font-medium">{employee.employmentDetails.position}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payroll Tab */}
        {activeTab === 'payroll' && employee.payroll && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payroll Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground">Pay Type</p>
                  <p className="text-sm font-medium capitalize">{employee.payroll.payType}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Currency</p>
                  <p className="text-sm font-medium">{employee.payroll.currency}</p>
                </div>
                {employee.payroll.taxCode && (
                  <div>
                    <p className="text-xs text-muted-foreground">Tax Code</p>
                    <p className="text-sm font-medium font-mono">{employee.payroll.taxCode}</p>
                  </div>
                )}
                {employee.payroll.pensionScheme && (
                  <div>
                    <p className="text-xs text-muted-foreground">Pension Scheme</p>
                    <p className="text-sm font-medium">{employee.payroll.pensionScheme}</p>
                  </div>
                )}
                {employee.payroll.pensionContribution !== undefined && (
                  <div>
                    <p className="text-xs text-muted-foreground">Pension Contribution</p>
                    <p className="text-sm font-medium">{employee.payroll.pensionContribution}%</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Student Loan</p>
                  <p className="text-sm font-medium">
                    {employee.payroll.studentLoan ? 'Yes' : 'No'}
                    {employee.payroll.studentLoanPlan && ` (${employee.payroll.studentLoanPlan})`}
                  </p>
                </div>
                {employee.payroll.otherDeductions && employee.payroll.otherDeductions.length > 0 && (
                  <div className="sm:col-span-2 lg:col-span-3">
                    <p className="text-xs text-muted-foreground mb-2">Other Deductions</p>
                    <div className="space-y-2">
                      {employee.payroll.otherDeductions.map((deduction, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium">{deduction.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {deduction.type === 'fixed' 
                              ? `£${deduction.amount.toFixed(2)}` 
                              : `${deduction.amount}%`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Certificates Tab */}
        {activeTab === 'certificates' && (
          <EmployeeCertificatesTab employeeId={employee._id} />
        )}

        {/* Sites Tab */}
        {activeTab === 'sites' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Site Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignedSites && assignedSites.length > 0 ? (
                <div className="space-y-4">
                  {assignedSites.map((assignment) => {
                    const site = assignment.siteId;
                    return (
                      <div
                        key={assignment._id || assignment.siteId?._id || assignment.siteId}
                        className={`p-4 border rounded-lg ${
                          assignment.isPrimary ? 'border-primary-300 bg-primary-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Building className="h-4 w-4 text-gray-500" />
                              <h3 className="font-medium text-foreground">
                                {typeof site === 'object' ? site?.name || 'Unknown Site' : 'Loading...'}
                              </h3>
                              {assignment.isPrimary && (
                                <Badge className="bg-primary-100 text-primary-800">Primary</Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-xs text-muted-foreground">Site Code</p>
                                <p className="font-medium">
                                  {typeof site === 'object' ? site?.siteCode || 'N/A' : 'Loading...'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Role at Site</p>
                                <Badge className={getRoleBadgeColor(assignment.role)}>
                                  {formatRole(assignment.role)}
                                </Badge>
                              </div>
                              {assignment.assignedAt && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Assigned Date</p>
                                  <p className="font-medium">{formatDateShort(assignment.assignedAt)}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No site assignments</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

