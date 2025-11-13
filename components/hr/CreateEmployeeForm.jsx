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
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'labour',
    payRate: '',
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
    fetchSites();
  }, []);

  // Clear site assignment and leave balance when role changes to a role that doesn't need them
  useEffect(() => {
    if (formData.role !== 'labour' && formData.role !== 'site_manager') {
      // Clear siteId if role doesn't need site assignment
      if (formData.siteId) {
        setFormData((prev) => ({ ...prev, siteId: '' }));
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
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch('/api/v1/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          payRate: formData.payRate ? parseFloat(formData.payRate) : undefined,
          // Only include siteId for roles that need it
          siteId: (formData.role === 'labour' || formData.role === 'site_manager') 
            ? (formData.siteId || null) 
            : undefined,
          // Only include annualLeaveBalance for labour
          annualLeaveBalance: formData.role === 'labour' && formData.annualLeaveBalance 
            ? parseFloat(formData.annualLeaveBalance) 
            : undefined,
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
        });
        
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

      {/* Site Assignment - Only for labour and site_manager */}
      {(formData.role === 'labour' || formData.role === 'site_manager') && (
        <div>
          <label htmlFor="siteId" className="block text-sm font-medium text-foreground mb-2">
            Assign to Site
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
            Assign this employee to a site (optional)
          </p>
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

