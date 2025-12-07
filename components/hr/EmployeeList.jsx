'use client';

import { useState, useEffect } from 'react';
import { Trash2, Mail, Phone, Edit, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import EditEmployeeModal from './EditEmployeeModal';

export default function EmployeeList({ initialEmployees }) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [deletingId, setDeletingId] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);

  // Sync employees with initialEmployees when it changes
  useEffect(() => {
    setEmployees(initialEmployees);
  }, [initialEmployees]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this employee?')) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/v1/employees/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setEmployees(employees.filter((emp) => emp._id !== id));
      } else {
        alert(result.error?.message || 'Failed to delete employee');
      }
    } catch (err) {
      alert('An error occurred');
    } finally {
      setDeletingId(null);
    }
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
    return role
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
  };

  const handleEditClose = () => {
    setEditingEmployee(null);
  };

  const handleUpdateSuccess = (updatedEmployee) => {
    setEmployees(employees.map(emp => 
      emp._id === updatedEmployee._id ? updatedEmployee : emp
    ));
  };

  if (employees.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>No employees found. Create your first employee to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-full divide-y divide-gray-200">
        {/* Mobile Card View */}
        <div className="block sm:hidden">
          {employees.map((employee) => (
            <div key={employee._id} className="p-3 sm:p-4 border-b">
              <div className="flex items-start justify-between mb-2 gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">
                    {employee.firstName} {employee.lastName}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">{employee.employeeId}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Link
                    href={`/chat/${employee._id}`}
                    className="text-green-600 hover:text-green-800 p-2 touch-manipulation"
                    aria-label="Chat with employee"
                    title="Chat"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleEdit(employee)}
                    className="text-blue-600 hover:text-blue-800 p-2 touch-manipulation"
                    aria-label="Edit employee"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(employee._id)}
                    disabled={deletingId === employee._id}
                    className="text-red-600 hover:text-red-800 p-2 touch-manipulation"
                    aria-label="Delete employee"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-1 mt-2">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{employee.email}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Phone className="w-3 h-3" />
                  <span>{employee.phone}</span>
                </div>
                <div className="mt-2">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(employee.role)}`}>
                    {formatRole(employee.role)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <table className="hidden sm:table min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.map((employee) => (
              <tr key={employee._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {employee.firstName} {employee.lastName}
                    </div>
                    <div className="text-xs text-gray-500">{employee.employeeId}</div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-900">{employee.email}</div>
                  <div className="text-xs text-gray-500">{employee.phone}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(employee.role)}`}>
                    {formatRole(employee.role)}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    employee.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {employee.status}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/chat/${employee._id}`}
                      className="text-green-600 hover:text-green-900"
                      title="Chat with employee"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleEdit(employee)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit employee"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(employee._id)}
                      disabled={deletingId === employee._id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      title="Delete employee"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Employee Modal */}
      <EditEmployeeModal
        isOpen={editingEmployee !== null}
        onClose={handleEditClose}
        employee={editingEmployee}
        onSuccess={handleUpdateSuccess}
      />
    </div>
  );
}

