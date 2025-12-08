'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function EditEmployeeModal({ isOpen, onClose, employee, onSuccess }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
    status: 'active',
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
    if (isOpen) {
      fetchSites();
    }
  }, [isOpen]);

  // Load employee data when modal opens
  useEffect(() => {
    if (employee && isOpen) {
      // Format date for input (YYYY-MM-DD)
      const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().split('T')[0];
      };

      setFormData({
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        phone: employee.phone || '',
        password: '', // Don't pre-fill password
        role: employee.role || 'labour',
        payRate: employee.payRate?.toString() || '',
        status: employee.status || 'active',
        siteId: employee.siteId?.toString() || '',
        annualLeaveBalance: employee.annualLeaveBalance?.toString() || '',
        // HR Data
        dateOfBirth: formatDate(employee.dateOfBirth),
        nationalInsuranceNumber: employee.nationalInsuranceNumber || '',
        emergencyContact: {
          name: employee.emergencyContact?.name || '',
          relationship: employee.emergencyContact?.relationship || '',
          phone: employee.emergencyContact?.phone || '',
        },
        employmentDetails: {
          startDate: formatDate(employee.employmentDetails?.startDate),
          employmentType: employee.employmentDetails?.employmentType || 'full_time',
          department: employee.employmentDetails?.department || '',
          position: employee.employmentDetails?.position || '',
        },
        // Payroll Data
        payroll: {
          payType: employee.payroll?.payType || 'hourly',
          currency: employee.payroll?.currency || 'GBP',
          taxCode: employee.payroll?.taxCode || '',
          pensionScheme: employee.payroll?.pensionScheme || '',
          pensionContribution: employee.payroll?.pensionContribution?.toString() || '0',
          studentLoan: employee.payroll?.studentLoan || false,
          studentLoanPlan: employee.payroll?.studentLoanPlan || '',
        },
      });
      
      // Load assigned sites
      const loadAssignedSites = async () => {
        try {
          const response = await fetch(`/api/v1/employees/${employee._id}/sites`);
          const data = await response.json();
          if (data.success && data.data) {
            setAssignedSites(data.data.map(a => ({
              siteId: a.siteId._id || a.siteId,
              role: a.role,
              isPrimary: a.isPrimary,
              notes: a.notes || '',
            })));
          }
        } catch (err) {
          console.error('Error loading assigned sites:', err);
        }
      };
      
      loadAssignedSites();
      setError('');
    }
  }, [employee, isOpen]);

  // Clear site assignment and leave balance when role changes to a role that doesn't need them
  useEffect(() => {
    // Only run this effect if we have an employee loaded (to avoid clearing on initial load)
    if (!employee || !isOpen) return;

    if (formData.role !== 'labour' && formData.role !== 'site_manager') {
      // Clear siteId if role doesn't need site assignment
      setFormData((prev) => {
        if (prev.siteId) {
          return { ...prev, siteId: '' };
        }
        return prev;
      });
      // Clear assigned sites
      if (assignedSites.length > 0) {
        setAssignedSites([]);
      }
    }
    if (formData.role !== 'labour') {
      // Clear annualLeaveBalance if role is not labour
      setFormData((prev) => {
        if (prev.annualLeaveBalance && prev.annualLeaveBalance !== '0') {
          return { ...prev, annualLeaveBalance: '0' };
        }
        return prev;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.role, employee, isOpen]);

  if (!isOpen || !employee) return null;

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
    setLoading(true);

    try {
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        status: formData.status,
      };

      // Only include password if provided
      if (formData.password && formData.password.length > 0) {
        updateData.password = formData.password;
      }

      // Only include payRate if provided
      if (formData.payRate && formData.payRate.length > 0) {
        updateData.payRate = parseFloat(formData.payRate);
      }

      // HR Data
      if (formData.dateOfBirth) {
        updateData.dateOfBirth = new Date(formData.dateOfBirth).toISOString();
      }
      if (formData.nationalInsuranceNumber) {
        updateData.nationalInsuranceNumber = formData.nationalInsuranceNumber.toUpperCase();
      }
      if (formData.emergencyContact.name) {
        updateData.emergencyContact = {
          name: formData.emergencyContact.name,
          relationship: formData.emergencyContact.relationship || undefined,
          phone: formData.emergencyContact.phone || undefined,
        };
      }
      if (formData.employmentDetails.startDate) {
        updateData.employmentDetails = {
          startDate: new Date(formData.employmentDetails.startDate).toISOString(),
          employmentType: formData.employmentDetails.employmentType,
          department: formData.employmentDetails.department || undefined,
          position: formData.employmentDetails.position || undefined,
        };
      }

      // Payroll Data
      updateData.payroll = {
        payType: formData.payroll.payType,
        currency: formData.payroll.currency,
        taxCode: formData.payroll.taxCode || undefined,
        pensionScheme: formData.payroll.pensionScheme || undefined,
        pensionContribution: formData.payroll.pensionContribution ? parseFloat(formData.payroll.pensionContribution) : 0,
        studentLoan: formData.payroll.studentLoan || false,
        studentLoanPlan: formData.payroll.studentLoanPlan || undefined,
        otherDeductions: employee.payroll?.otherDeductions || [], // Preserve existing deductions
      };

      // Handle multi-site assignments
      if (formData.role === 'labour' || formData.role === 'site_manager') {
        // Use assignedSites if provided, otherwise fall back to legacy siteId
        if (assignedSites.length > 0) {
          updateData.assignedSites = assignedSites.map(a => ({
            siteId: a.siteId,
            role: a.role,
            isPrimary: a.isPrimary,
            notes: a.notes || undefined,
          }));
        } else {
          // Legacy: single site assignment
          if (formData.siteId === '' || formData.siteId === 'none') {
            updateData.siteId = null; // Unassign from site
          } else if (formData.siteId) {
            updateData.siteId = formData.siteId;
          }
        }
      } else {
        // For other roles, unassign from all sites
        updateData.assignedSites = [];
        updateData.siteId = null;
      }

      // Only include annualLeaveBalance for labour role
      if (formData.role === 'labour' && formData.annualLeaveBalance && formData.annualLeaveBalance.length > 0) {
        updateData.annualLeaveBalance = parseFloat(formData.annualLeaveBalance);
      } else if (formData.role !== 'labour') {
        // For non-labour roles, set to 0 or undefined
        updateData.annualLeaveBalance = 0;
      }

      console.log('Updating employee:', employee._id, 'with data:', updateData);

      const response = await fetch(`/api/v1/employees/${employee._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle HTTP errors
        const errorMessage = result.error?.message || result.message || `HTTP ${response.status}: ${response.statusText}`;
        const errorDetails = result.error?.details ? JSON.stringify(result.error.details, null, 2) : '';
        setError(errorDetails ? `${errorMessage}\n${errorDetails}` : errorMessage);
        console.error('Update failed:', result);
        return;
      }

      if (result.success) {
        if (onSuccess) {
          onSuccess(result.data);
        }
        router.refresh();
        onClose();
      } else {
        const errorMessage = result.error?.message || 'Failed to update employee';
        const errorDetails = result.error?.details ? JSON.stringify(result.error.details, null, 2) : '';
        setError(errorDetails ? `${errorMessage}\n${errorDetails}` : errorMessage);
        console.error('Update failed:', result);
      }
    } catch (err) {
      console.error('Update error:', err);
      setError(`An error occurred: ${err.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Edit Employee</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm whitespace-pre-wrap">
              {error}
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
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm sm:text-base"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm sm:text-base"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm sm:text-base"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm sm:text-base"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm sm:text-base"
              >
                <option value="labour">Labour / Tradesperson</option>
                <option value="site_manager">Site Manager</option>
                <option value="contracts_manager">Contracts Manager</option>
                <option value="hr_officer">HR Officer</option>
                <option value="ehs_officer">EHS Officer</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm sm:text-base"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="payRate" className="block text-sm font-medium text-gray-700 mb-1">
              Pay Rate (per hour)
            </label>
            <input
              type="number"
              id="payRate"
              name="payRate"
              value={formData.payRate}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm sm:text-base"
            />
          </div>

          {/* Multi-Site Assignment - Only for labour and site_manager */}
          {(formData.role === 'labour' || formData.role === 'site_manager') && (
            <div className="space-y-3">
              <div>
                <label htmlFor="addSite" className="block text-sm font-medium text-gray-700 mb-1">
                  Assign to Sites (Multi-Site Support)
                </label>
                <div className="flex gap-2">
                  <select
                    id="addSite"
                    onChange={(e) => {
                      handleAddSite(e.target.value);
                      e.target.value = 'none'; // Reset dropdown
                    }}
                    disabled={loadingSites}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm sm:text-base disabled:bg-gray-100"
                  >
                    <option value="none">Add a site...</option>
                    {sites
                      .filter(site => !assignedSites.some(a => a.siteId === site._id))
                      .map((site) => (
                        <option key={site._id} value={site._id}>
                          {site.name} ({site.siteCode})
                        </option>
                      ))}
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Select sites to assign this employee to. First site will be set as primary.
                </p>
              </div>

              {/* Display assigned sites */}
              {assignedSites.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Assigned Sites:</p>
                  {assignedSites.map((assignment) => {
                    const site = sites.find(s => s._id === assignment.siteId);
                    return (
                      <div
                        key={assignment.siteId}
                        className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {site?.name || 'Unknown Site'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {site?.siteCode || ''} • Role: {assignment.role}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSetPrimary(assignment.siteId)}
                            className={`px-3 py-1 text-xs rounded ${
                              assignment.isPrimary
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {assignment.isPrimary ? 'Primary' : 'Set Primary'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveSite(assignment.siteId)}
                            className="px-3 py-1 text-xs rounded bg-red-50 text-red-600 hover:bg-red-100"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Legacy single site assignment (for backward compatibility) */}
              {assignedSites.length === 0 && (
                <div>
                  <label htmlFor="siteId" className="block text-sm font-medium text-gray-700 mb-1">
                    Assign to Site (Single)
                  </label>
                  <select
                    id="siteId"
                    name="siteId"
                    value={formData.siteId || 'none'}
                    onChange={(e) => setFormData((prev) => ({ ...prev, siteId: e.target.value === 'none' ? '' : e.target.value }))}
                    disabled={loadingSites}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm sm:text-base disabled:bg-gray-100"
                  >
                    <option value="none">No Site Assignment</option>
                    {sites.map((site) => (
                      <option key={site._id} value={site._id}>
                        {site.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Or use multi-site assignment above</p>
                </div>
              )}
            </div>
          )}

          {/* Annual Leave Balance - Only for labour */}
          {formData.role === 'labour' && (
            <div>
              <label htmlFor="annualLeaveBalance" className="block text-sm font-medium text-gray-700 mb-1">
                Annual Leave Balance (days)
              </label>
              <input
                type="number"
                id="annualLeaveBalance"
                name="annualLeaveBalance"
                value={formData.annualLeaveBalance}
                onChange={handleChange}
                min="0"
                step="0.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm sm:text-base"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">Current annual leave balance in days</p>
            </div>
          )}

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password (leave blank to keep current)
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm sm:text-base"
                  placeholder="Enter new password (minimum 6 characters)"
                />
                <p className="text-xs text-gray-500 mt-1">Only enter if you want to change the password</p>
              </div>
            </div>
          )}

          {/* HR Data Tab */}
          {activeTab === 'hr' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label htmlFor="nationalInsuranceNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    National Insurance Number (UK)
                  </label>
                  <input
                    type="text"
                    id="nationalInsuranceNumber"
                    name="nationalInsuranceNumber"
                    value={formData.nationalInsuranceNumber}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm sm:text-base uppercase"
                    placeholder="AB123456C"
                    maxLength={9}
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: AB123456C (2 letters, 6 digits, 1 letter)</p>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Emergency Contact</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="emergencyContact.name" className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      id="emergencyContact.name"
                      name="emergencyContact.name"
                      value={formData.emergencyContact.name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm sm:text-base"
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label htmlFor="emergencyContact.relationship" className="block text-sm font-medium text-gray-700 mb-1">
                      Relationship
                    </label>
                    <select
                      id="emergencyContact.relationship"
                      name="emergencyContact.relationship"
                      value={formData.emergencyContact.relationship}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm sm:text-base"
                    >
                      <option value="">Select relationship</option>
                      <option value="spouse">Spouse</option>
                      <option value="parent">Parent</option>
                      <option value="sibling">Sibling</option>
                      <option value="child">Child</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="emergencyContact.phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      id="emergencyContact.phone"
                      name="emergencyContact.phone"
                      value={formData.emergencyContact.phone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm sm:text-base"
                      placeholder="+44..."
                    />
                  </div>
                </div>
              </div>

              {/* Employment Details */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Employment Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="employmentDetails.startDate" className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      id="employmentDetails.startDate"
                      name="employmentDetails.startDate"
                      value={formData.employmentDetails.startDate}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label htmlFor="employmentDetails.employmentType" className="block text-sm font-medium text-gray-700 mb-1">
                      Employment Type
                    </label>
                    <select
                      id="employmentDetails.employmentType"
                      name="employmentDetails.employmentType"
                      value={formData.employmentDetails.employmentType}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm sm:text-base"
                    >
                      <option value="full_time">Full Time</option>
                      <option value="part_time">Part Time</option>
                      <option value="contractor">Contractor</option>
                      <option value="temporary">Temporary</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="employmentDetails.department" className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      id="employmentDetails.department"
                      name="employmentDetails.department"
                      value={formData.employmentDetails.department}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm sm:text-base"
                      placeholder="Department name"
                    />
                  </div>
                  <div>
                    <label htmlFor="employmentDetails.position" className="block text-sm font-medium text-gray-700 mb-1">
                      Position
                    </label>
                    <input
                      type="text"
                      id="employmentDetails.position"
                      name="employmentDetails.position"
                      value={formData.employmentDetails.position}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm sm:text-base"
                      placeholder="Job title/position"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payroll Data Tab */}
          {activeTab === 'payroll' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="payroll.payType" className="block text-sm font-medium text-gray-700 mb-1">
                    Pay Type
                  </label>
                  <select
                    id="payroll.payType"
                    name="payroll.payType"
                    value={formData.payroll.payType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm sm:text-base"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="salary">Salary</option>
                    <option value="daily">Daily</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="payroll.currency" className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    id="payroll.currency"
                    name="payroll.currency"
                    value={formData.payroll.currency}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm sm:text-base"
                  >
                    <option value="GBP">GBP (£)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="payroll.taxCode" className="block text-sm font-medium text-gray-700 mb-1">
                    UK Tax Code
                  </label>
                  <input
                    type="text"
                    id="payroll.taxCode"
                    name="payroll.taxCode"
                    value={formData.payroll.taxCode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm sm:text-base uppercase"
                    placeholder="1250L"
                    maxLength={6}
                  />
                  <p className="text-xs text-gray-500 mt-1">UK tax code (e.g., 1250L, BR, D0)</p>
                </div>

                <div>
                  <label htmlFor="payroll.pensionScheme" className="block text-sm font-medium text-gray-700 mb-1">
                    Pension Scheme
                  </label>
                  <input
                    type="text"
                    id="payroll.pensionScheme"
                    name="payroll.pensionScheme"
                    value={formData.payroll.pensionScheme}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm sm:text-base"
                    placeholder="Scheme name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="payroll.pensionContribution" className="block text-sm font-medium text-gray-700 mb-1">
                    Pension Contribution (%)
                  </label>
                  <input
                    type="number"
                    id="payroll.pensionContribution"
                    name="payroll.pensionContribution"
                    value={formData.payroll.pensionContribution}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm sm:text-base"
                    placeholder="5"
                  />
                  <p className="text-xs text-gray-500 mt-1">Employee contribution percentage</p>
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
                    <label htmlFor="payroll.studentLoan" className="text-sm font-medium text-gray-700">
                      Student Loan
                    </label>
                  </div>

                  {formData.payroll.studentLoan && (
                    <div>
                      <label htmlFor="payroll.studentLoanPlan" className="block text-sm font-medium text-gray-700 mb-1">
                        Student Loan Plan
                      </label>
                      <select
                        id="payroll.studentLoanPlan"
                        name="payroll.studentLoanPlan"
                        value={formData.payroll.studentLoanPlan}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm sm:text-base"
                      >
                        <option value="">Select plan</option>
                        <option value="plan1">Plan 1</option>
                        <option value="plan2">Plan 2</option>
                        <option value="plan4">Plan 4</option>
                        <option value="postgraduate">Postgraduate</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm sm:text-base"
            >
              {loading ? 'Updating...' : 'Update Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

