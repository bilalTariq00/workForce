'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
} from 'lucide-react';
import CertificationValidationModal from './CertificationValidationModal';

export default function CertificationTrackingList() {
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCert, setSelectedCert] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expiringSoon, setExpiringSoon] = useState(false);

  useEffect(() => {
    fetchCertifications();
  }, [filterStatus, filterType, expiringSoon]);

  const fetchCertifications = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterType !== 'all') params.append('type', filterType);
      if (expiringSoon) params.append('expiringSoon', 'true');

      const response = await fetch(`/api/v1/certifications?${params.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch certifications');
      }

      // Filter by search term
      let filtered = result.data;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(
          (cert) =>
            cert.employeeId?.firstName?.toLowerCase().includes(term) ||
            cert.employeeId?.lastName?.toLowerCase().includes(term) ||
            cert.employeeId?.employeeId?.toLowerCase().includes(term) ||
            cert.type?.toLowerCase().includes(term)
        );
      }

      setCertifications(filtered);
    } catch (err) {
      console.error('Error fetching certifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleValidationSuccess = () => {
    setSelectedCert(null);
    fetchCertifications();
  };

  const getStatusBadge = (status, expiryDate) => {
    const isExpired = new Date(expiryDate) < new Date();
    const isExpiringSoon = (() => {
      const today = new Date();
      const threshold = new Date();
      threshold.setDate(today.getDate() + 30);
      const expDate = new Date(expiryDate);
      return expDate >= today && expDate <= threshold;
    })();

    if (isExpired || status === 'expired') {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Expired
        </Badge>
      );
    }

    if (isExpiringSoon && status === 'valid') {
      return (
        <Badge variant="outline" className="flex items-center gap-1 border-orange-500 text-orange-700 dark:text-orange-400">
          <AlertTriangle className="h-3 w-3" />
          Expiring Soon
        </Badge>
      );
    }

    switch (status) {
      case 'valid':
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-500">
            <CheckCircle2 className="h-3 w-3" />
            Valid
          </Badge>
        );
      case 'pending_validation':
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-muted-foreground">Loading certifications...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-red-500">Error: {error}</p>
            <Button onClick={fetchCertifications} className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">All Certifications ({certifications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') fetchCertifications();
                }}
                className="pl-9"
              />
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending_validation">Pending</SelectItem>
                <SelectItem value="valid">Valid</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="SafePass">SafePass</SelectItem>
                <SelectItem value="CSCS">CSCS</SelectItem>
                <SelectItem value="FirstAid">First Aid</SelectItem>
                <SelectItem value="Forklift">Forklift</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={expiringSoon ? 'default' : 'outline'}
              onClick={() => setExpiringSoon(!expiringSoon)}
              className="w-full"
            >
              <Filter className="mr-2 h-4 w-4" />
              {expiringSoon ? 'Expiring Soon' : 'All'}
            </Button>
          </div>

          {/* Certifications List */}
          {certifications.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No certifications found</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {certifications.map((cert) => (
                <div
                  key={cert._id}
                  className="p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold text-foreground text-sm sm:text-base">{cert.type}</h3>
                        {getStatusBadge(cert.status, cert.expiryDate)}
                      </div>
                      <div className="space-y-1 text-xs sm:text-sm text-muted-foreground">
                        <p>
                          <strong>Employee:</strong> {cert.employeeId?.firstName}{' '}
                          {cert.employeeId?.lastName} ({cert.employeeId?.employeeId})
                        </p>
                        {cert.validatedBy && (
                          <p>
                            Validated by {cert.validatedBy.firstName}{' '}
                            {cert.validatedBy.lastName} on{' '}
                            {format(new Date(cert.validatedAt), 'MMM dd, yyyy')}
                          </p>
                        )}
                      </div>
                    </div>
                    {cert.status === 'pending_validation' && (
                      <Button
                        size="sm"
                        onClick={() => setSelectedCert(cert)}
                        className="w-full sm:w-auto flex-shrink-0"
                      >
                        Validate
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm mt-3">
                    <div>
                      <span className="text-muted-foreground">Issue Date:</span>
                      <p className="font-medium">
                        {format(new Date(cert.issueDate), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Expiry Date:</span>
                      <p className="font-medium">
                        {format(new Date(cert.expiryDate), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>

                  {cert.rejectionReason && (
                    <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                      <p className="text-xs text-red-700 dark:text-red-400">
                        <strong>Rejection Reason:</strong> {cert.rejectionReason}
                      </p>
                    </div>
                  )}

                  {cert.documentUrl && (
                    <div className="mt-3">
                      <a
                        href={cert.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        <FileText className="h-4 w-4" />
                        View Document
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedCert && (
        <CertificationValidationModal
          certification={selectedCert}
          onClose={() => setSelectedCert(null)}
          onSuccess={handleValidationSuccess}
        />
      )}
    </>
  );
}

