'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function CreateEmployeeForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sites, setSites] = useState([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [assignedSites, setAssignedSites] = useState([]); // Multi-site assignments
  const [activeTab, setActiveTab] = useState('basic'); // Form tabs: basic, hr, payroll
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'labour',
    payRate: '',
    siteId: '', // Legacy: keep for backward compatibility
    annualLeaveBalance: '',
    // HR Data
    dateOfBirth: '',
    nationalInsuranceNumber: '',
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
    },
    employmentDetails: {
      startDate: '',
      employmentType: 'full_time',
      department: '',
      position: '',
    },
    // Payroll Data
    payroll: {
      payType: 'hourly',
      currency: 'GBP',
      taxCode: '',
      pensionScheme: '',
      pensionContribution: '0',
      studentLoan: false,
      studentLoanPlan: '',
    },
  });

  // Fetch sites for dropdown
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const response = await fetch('/api/v1/sites');
        const data = await response.json();
        if (data.success) {
          setSites(data.data || []);
        }
      } catch (err) {
        console.error('Error fetching sites:', err);
      } finally {
        setLoadingSites(false);
      }
    };
    fetchSites();
  }, []);

  // Clear site assignment and leave balance when role changes to a role that doesn't need them
  useEffect(() => {
    if (formData.role !== 'labour' && formData.role !== 'site_manager') {
      // Clear siteId if role doesn't need site assignment
      if (formData.siteId) {
        setFormData((prev) => ({ ...prev, siteId: '' }));
      }
      // Clear assigned sites
      if (assignedSites.length > 0) {
        setAssignedSites([]);
      }
    }
    if (formData.role !== 'labour') {
      // Clear annualLeaveBalance if role is not labour
      if (formData.annualLeaveBalance && formData.annualLeaveBalance !== '0') {
        setFormData((prev) => ({ ...prev, annualLeaveBalance: '0' }));
      }
    }
  }, [formData.role]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle nested fields
    if (name.startsWith('emergencyContact.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
          [field]: value,
        },
      }));
    } else if (name.startsWith('employmentDetails.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        employmentDetails: {
          ...prev.employmentDetails,
          [field]: value,
        },
      }));
    } else if (name.startsWith('payroll.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        payroll: {
          ...prev.payroll,
          [field]: type === 'checkbox' ? checked : value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  // Add site to assigned sites
  const handleAddSite = (siteId) => {
    if (!siteId || siteId === 'none') return;
    
    const site = sites.find(s => s._id === siteId);
    if (!site) return;
    
    // Check if already assigned
    if (assignedSites.some(a => a.siteId === siteId)) {
      setError('This site is already assigned');
      return;
    }
    
    // Add new assignment
    const newAssignment = {
      siteId,
      role: formData.role,
      isPrimary: assignedSites.length === 0, // First site is primary by default
      notes: '',
    };
    
    setAssignedSites([...assignedSites, newAssignment]);
    setError('');
  };

  // Remove site from assigned sites
  const handleRemoveSite = (siteId) => {
    const updated = assignedSites.filter(a => a.siteId !== siteId);
    // If we removed the primary, set the first remaining as primary
    if (updated.length > 0 && !updated.some(a => a.isPrimary)) {
      updated[0].isPrimary = true;
    }
    setAssignedSites(updated);
  };

  // Set primary site
  const handleSetPrimary = (siteId) => {
    setAssignedSites(assignedSites.map(a => ({
      ...a,
      isPrimary: a.siteId === siteId,
    })));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      // Prepare assignedSites array
      const assignedSitesData = assignedSites.length > 0 
        ? assignedSites.map(a => ({
            siteId: a.siteId,
            role: a.role,
            isPrimary: a.isPrimary,
            notes: a.notes || undefined,
          }))
        : undefined;

      // Prepare HR data
      const hrData = {
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : undefined,
        nationalInsuranceNumber: formData.nationalInsuranceNumber || undefined,
        emergencyContact: formData.emergencyContact.name ? {
          name: formData.emergencyContact.name,
          relationship: formData.emergencyContact.relationship || undefined,
          phone: formData.emergencyContact.phone || undefined,
        } : undefined,
        employmentDetails: formData.employmentDetails.startDate ? {
          startDate: new Date(formData.employmentDetails.startDate).toISOString(),
          employmentType: formData.employmentDetails.employmentType,
          department: formData.employmentDetails.department || undefined,
          position: formData.employmentDetails.position || undefined,
        } : undefined,
      };

      // Prepare Payroll data
      const payrollData = {
        payType: formData.payroll.payType,
        currency: formData.payroll.currency,
        taxCode: formData.payroll.taxCode || undefined,
        pensionScheme: formData.payroll.pensionScheme || undefined,
        pensionContribution: formData.payroll.pensionContribution ? parseFloat(formData.payroll.pensionContribution) : 0,
        studentLoan: formData.payroll.studentLoan || false,
        studentLoanPlan: formData.payroll.studentLoanPlan || undefined,
        otherDeductions: [], // Can be added later via edit
      };

      const response = await fetch('/api/v1/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: formData.role,
          payRate: formData.payRate ? parseFloat(formData.payRate) : undefined,
          // Use assignedSites if provided, otherwise fall back to legacy siteId
          assignedSites: assignedSitesData,
          siteId: assignedSitesData ? undefined : (
            (formData.role === 'labour' || formData.role === 'site_manager') 
              ? (formData.siteId || null) 
              : undefined
          ),
          // Only include annualLeaveBalance for labour
          annualLeaveBalance: formData.role === 'labour' && formData.annualLeaveBalance 
            ? parseFloat(formData.annualLeaveBalance) 
            : undefined,
          // HR Data
          ...hrData,
          // Payroll Data
          payroll: payrollData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          password: '',
          role: 'labour',
          payRate: '',
          siteId: '',
          annualLeaveBalance: '0',
          dateOfBirth: '',
          nationalInsuranceNumber: '',
          emergencyContact: { name: '', relationship: '', phone: '' },
          employmentDetails: { startDate: '', employmentType: 'full_time', department: '', position: '' },
          payroll: { payType: 'hourly', currency: 'GBP', taxCode: '', pensionScheme: '', pensionContribution: '0', studentLoan: false, studentLoanPlan: '' },
        });
        setAssignedSites([]);
        setActiveTab('basic');
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/hr/dashboard');
          router.refresh();
        }, 2000);
      } else {
        setError(result.error?.message || 'Failed to create employee');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          Employee created successfully! Redirecting to dashboard...
        </div>
      )}

      {/* Form Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'basic'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Basic Information
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('hr')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'hr'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            HR Data
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payroll')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'payroll'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Payroll Data
          </button>
        </nav>
      </div>

      {/* Basic Information Tab */}
      {activeTab === 'basic' && (
        <div className="space-y-6">

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-2">
            First Name *
          </label>
          <Input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            className="w-full"
          />
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-2">
            Last Name *
          </label>
          <Input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            className="w-full"
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
          Email Address *
        </label>
        <Input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
          Phone Number *
        </label>
        <Input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
          className="w-full"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-foreground mb-2">
            Role *
          </label>
          <Select
            value={formData.role}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value }))}
            required
          >
            <SelectTrigger id="role" className="w-full">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="labour">Labour / Tradesperson</SelectItem>
              <SelectItem value="site_manager">Site Manager</SelectItem>
              <SelectItem value="contracts_manager">Contracts Manager</SelectItem>
              <SelectItem value="hr_officer">HR Officer</SelectItem>
              <SelectItem value="ehs_officer">EHS Officer</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor="payRate" className="block text-sm font-medium text-foreground mb-2">
            Pay Rate (per hour)
          </label>
          <Input
            type="number"
            id="payRate"
            name="payRate"
            value={formData.payRate}
            onChange={handleChange}
            min="0"
            step="0.01"
            className="w-full"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Multi-Site Assignment - Only for labour and site_manager */}
      {(formData.role === 'labour' || formData.role === 'site_manager') && (
        <div className="space-y-3">
          <div>
            <label htmlFor="addSite" className="block text-sm font-medium text-foreground mb-2">
              Assign to Sites (Multi-Site Support)
            </label>
            <div className="flex gap-2">
              <Select
                onValueChange={handleAddSite}
                disabled={loadingSites}
              >
                <SelectTrigger id="addSite" className="flex-1">
                  <SelectValue placeholder={loadingSites ? "Loading sites..." : "Add a site..."} />
                </SelectTrigger>
                <SelectContent>
                  {sites
                    .filter(site => !assignedSites.some(a => a.siteId === site._id))
                    .map((site) => (
                      <SelectItem key={site._id} value={site._id}>
                        {site.name} ({site.siteCode})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Select sites to assign this employee to. First site will be set as primary.
            </p>
          </div>

          {/* Display assigned sites */}
          {assignedSites.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Assigned Sites:</p>
              {assignedSites.map((assignment) => {
                const site = sites.find(s => s._id === assignment.siteId);
                return (
                  <div
                    key={assignment.siteId}
                    className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {site?.name || 'Unknown Site'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {site?.siteCode || ''} • Role: {assignment.role}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={assignment.isPrimary ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleSetPrimary(assignment.siteId)}
                        className="text-xs"
                      >
                        {assignment.isPrimary ? 'Primary' : 'Set Primary'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveSite(assignment.siteId)}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Legacy single site assignment (for backward compatibility) */}
          {assignedSites.length === 0 && (
            <div>
              <label htmlFor="siteId" className="block text-sm font-medium text-foreground mb-2">
                Assign to Site (Single)
              </label>
              <Select
                value={formData.siteId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, siteId: value === 'none' ? '' : value }))}
                disabled={loadingSites}
              >
                <SelectTrigger id="siteId" className="w-full">
                  <SelectValue placeholder={loadingSites ? "Loading sites..." : "Select a site (optional)"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Site Assignment</SelectItem>
                  {sites.map((site) => (
                    <SelectItem key={site._id} value={site._id}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Or use multi-site assignment above
              </p>
            </div>
          )}
        </div>
      )}

      {/* Annual Leave Balance - Only for labour */}
      {formData.role === 'labour' && (
        <div>
          <label htmlFor="annualLeaveBalance" className="block text-sm font-medium text-foreground mb-2">
            Annual Leave Balance (days)
          </label>
          <Input
            type="number"
            id="annualLeaveBalance"
            name="annualLeaveBalance"
            value={formData.annualLeaveBalance}
            onChange={handleChange}
            min="0"
            step="0.5"
            className="w-full"
            placeholder="0"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Initial annual leave balance in days (default: 0)
          </p>
        </div>
      )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
              Password *
            </label>
            <Input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full"
              placeholder="Minimum 6 characters"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Employee will use this password to login
            </p>
          </div>
        </div>
      )}

      {/* HR Data Tab */}
      {activeTab === 'hr' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-foreground mb-2">
                Date of Birth
              </label>
              <Input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="nationalInsuranceNumber" className="block text-sm font-medium text-foreground mb-2">
                National Insurance Number (UK)
              </label>
              <Input
                type="text"
                id="nationalInsuranceNumber"
                name="nationalInsuranceNumber"
                value={formData.nationalInsuranceNumber}
                onChange={handleChange}
                className="w-full uppercase"
                placeholder="AB123456C"
                maxLength={9}
                pattern="[A-Z]{2}[0-9]{6}[A-Z]{1}"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Format: AB123456C (2 letters, 6 digits, 1 letter)
              </p>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Emergency Contact</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="emergencyContact.name" className="block text-sm font-medium text-foreground mb-2">
                  Name
                </label>
                <Input
                  type="text"
                  id="emergencyContact.name"
                  name="emergencyContact.name"
                  value={formData.emergencyContact.name}
                  onChange={handleChange}
                  className="w-full"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label htmlFor="emergencyContact.relationship" className="block text-sm font-medium text-foreground mb-2">
                  Relationship
                </label>
                <Select
                  value={formData.emergencyContact.relationship}
                  onValueChange={(value) => setFormData((prev) => ({
                    ...prev,
                    emergencyContact: { ...prev.emergencyContact, relationship: value },
                  }))}
                >
                  <SelectTrigger id="emergencyContact.relationship" className="w-full">
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spouse">Spouse</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="sibling">Sibling</SelectItem>
                    <SelectItem value="child">Child</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="emergencyContact.phone" className="block text-sm font-medium text-foreground mb-2">
                  Phone
                </label>
                <Input
                  type="tel"
                  id="emergencyContact.phone"
                  name="emergencyContact.phone"
                  value={formData.emergencyContact.phone}
                  onChange={handleChange}
                  className="w-full"
                  placeholder="+44..."
                />
              </div>
            </div>
          </div>

          {/* Employment Details */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Employment Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="employmentDetails.startDate" className="block text-sm font-medium text-foreground mb-2">
                  Start Date
                </label>
                <Input
                  type="date"
                  id="employmentDetails.startDate"
                  name="employmentDetails.startDate"
                  value={formData.employmentDetails.startDate}
                  onChange={handleChange}
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="employmentDetails.employmentType" className="block text-sm font-medium text-foreground mb-2">
                  Employment Type
                </label>
                <Select
                  value={formData.employmentDetails.employmentType}
                  onValueChange={(value) => setFormData((prev) => ({
                    ...prev,
                    employmentDetails: { ...prev.employmentDetails, employmentType: value },
                  }))}
                >
                  <SelectTrigger id="employmentDetails.employmentType" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                    <SelectItem value="temporary">Temporary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="employmentDetails.department" className="block text-sm font-medium text-foreground mb-2">
                  Department
                </label>
                <Input
                  type="text"
                  id="employmentDetails.department"
                  name="employmentDetails.department"
                  value={formData.employmentDetails.department}
                  onChange={handleChange}
                  className="w-full"
                  placeholder="Department name"
                />
              </div>
              <div>
                <label htmlFor="employmentDetails.position" className="block text-sm font-medium text-foreground mb-2">
                  Position
                </label>
                <Input
                  type="text"
                  id="employmentDetails.position"
                  name="employmentDetails.position"
                  value={formData.employmentDetails.position}
                  onChange={handleChange}
                  className="w-full"
                  placeholder="Job title/position"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payroll Data Tab */}
      {activeTab === 'payroll' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="payroll.payType" className="block text-sm font-medium text-foreground mb-2">
                Pay Type
              </label>
              <Select
                value={formData.payroll.payType}
                onValueChange={(value) => setFormData((prev) => ({
                  ...prev,
                  payroll: { ...prev.payroll, payType: value },
                }))}
              >
                <SelectTrigger id="payroll.payType" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="salary">Salary</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="payroll.currency" className="block text-sm font-medium text-foreground mb-2">
                Currency
              </label>
              <Select
                value={formData.payroll.currency}
                onValueChange={(value) => setFormData((prev) => ({
                  ...prev,
                  payroll: { ...prev.payroll, currency: value },
                }))}
              >
                <SelectTrigger id="payroll.currency" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="payroll.taxCode" className="block text-sm font-medium text-foreground mb-2">
                UK Tax Code
              </label>
              <Input
                type="text"
                id="payroll.taxCode"
                name="payroll.taxCode"
                value={formData.payroll.taxCode}
                onChange={handleChange}
                className="w-full uppercase"
                placeholder="1250L"
                maxLength={6}
              />
              <p className="text-xs text-muted-foreground mt-1">
                UK tax code (e.g., 1250L, BR, D0)
              </p>
            </div>

            <div>
              <label htmlFor="payroll.pensionScheme" className="block text-sm font-medium text-foreground mb-2">
                Pension Scheme
              </label>
              <Input
                type="text"
                id="payroll.pensionScheme"
                name="payroll.pensionScheme"
                value={formData.payroll.pensionScheme}
                onChange={handleChange}
                className="w-full"
                placeholder="Scheme name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="payroll.pensionContribution" className="block text-sm font-medium text-foreground mb-2">
                Pension Contribution (%)
              </label>
              <Input
                type="number"
                id="payroll.pensionContribution"
                name="payroll.pensionContribution"
                value={formData.payroll.pensionContribution}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.1"
                className="w-full"
                placeholder="5"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Employee contribution percentage
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="payroll.studentLoan"
                  name="payroll.studentLoan"
                  checked={formData.payroll.studentLoan}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="payroll.studentLoan" className="text-sm font-medium text-foreground">
                  Student Loan
                </label>
              </div>

              {formData.payroll.studentLoan && (
                <div>
                  <label htmlFor="payroll.studentLoanPlan" className="block text-sm font-medium text-foreground mb-2">
                    Student Loan Plan
                  </label>
                  <Select
                    value={formData.payroll.studentLoanPlan}
                    onValueChange={(value) => setFormData((prev) => ({
                      ...prev,
                      payroll: { ...prev.payroll, studentLoanPlan: value },
                    }))}
                  >
                    <SelectTrigger id="payroll.studentLoanPlan" className="w-full">
                      <SelectValue placeholder="Select plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plan1">Plan 1</SelectItem>
                      <SelectItem value="plan2">Plan 2</SelectItem>
                      <SelectItem value="plan4">Plan 4</SelectItem>
                      <SelectItem value="postgraduate">Postgraduate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/hr/dashboard')}
          className="flex-1 sm:flex-initial"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || success}
          className="flex-1 sm:flex-initial"
        >
          {loading ? 'Creating...' : success ? 'Created!' : 'Create Employee'}
        </Button>
      </div>
    </form>
  );
}

