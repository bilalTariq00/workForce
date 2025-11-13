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
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'labour',
    payRate: '',
    status: 'active',
    siteId: '',
    annualLeaveBalance: '',
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
      });
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
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

      // Handle siteId assignment/unassignment - Only for roles that need it
      if (formData.role === 'labour' || formData.role === 'site_manager') {
        if (formData.siteId === '' || formData.siteId === 'none') {
          updateData.siteId = null; // Unassign from site
        } else if (formData.siteId) {
          updateData.siteId = formData.siteId;
        }
      } else {
        // For other roles, unassign from site if they were previously assigned
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

          {/* Site Assignment - Only for labour and site_manager */}
          {(formData.role === 'labour' || formData.role === 'site_manager') && (
            <div>
              <label htmlFor="siteId" className="block text-sm font-medium text-gray-700 mb-1">
                Assign to Site
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
              <p className="text-xs text-gray-500 mt-1">Assign or unassign from a site</p>
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

