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
import { format } from 'date-fns';
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
} from 'lucide-react';
import VariationApprovalModal from './VariationApprovalModal';

export default function VariationApprovalList() {
  const [variations, setVariations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchVariations();
  }, [filterStatus]);

  const fetchVariations = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);

      const response = await fetch(`/api/v1/variations?${params.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch variations');
      }

      // Filter by search term
      let filtered = result.data;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(
          (var_) =>
            var_.title?.toLowerCase().includes(term) ||
            var_.siteId?.name?.toLowerCase().includes(term) ||
            var_.siteManagerId?.firstName?.toLowerCase().includes(term) ||
            var_.siteManagerId?.lastName?.toLowerCase().includes(term)
        );
      }

      setVariations(filtered);
    } catch (err) {
      console.error('Error fetching variations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalSuccess = () => {
    setSelectedVariation(null);
    fetchVariations();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'draft':
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            Draft
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="flex items-center gap-1 border-yellow-500 text-yellow-700 dark:text-yellow-400">
            <Clock className="h-3 w-3" />
            Pending Approval
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-500">
            <CheckCircle className="h-3 w-3" />
            Approved
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
            <p className="text-muted-foreground">Loading variations...</p>
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
            <Button onClick={fetchVariations} className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingVariations = variations.filter((v) => v.status === 'pending');

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            All Variations ({variations.length})
            {pendingVariations.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingVariations.length} Pending
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by title, site, or manager..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') fetchVariations();
                }}
                className="w-full pl-9 pr-4 py-2.5 sm:py-2 border rounded-lg text-sm sm:text-base"
              />
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="text-sm sm:text-base">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Variations List */}
          {variations.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No variations found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {variations.map((variation) => (
                <div
                  key={variation._id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{variation.title}</h3>
                        {getStatusBadge(variation.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Site:</strong> {variation.siteId?.name} ({variation.siteId?.siteCode})
                      </p>
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Site Manager:</strong> {variation.siteManagerId?.firstName}{' '}
                        {variation.siteManagerId?.lastName} ({variation.siteManagerId?.employeeId})
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {variation.description}
                      </p>
                    </div>
                    {variation.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => setSelectedVariation(variation)}
                        className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm"
                      >
                        Review
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Cost:</span>
                      <p className="font-medium">
                        {new Intl.NumberFormat('en-GB', {
                          style: 'currency',
                          currency: 'GBP',
                        }).format(variation.cost)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Delay:</span>
                      <p className="font-medium">
                        {variation.delayDays} day{variation.delayDays !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created:</span>
                      <p className="font-medium">
                        {format(new Date(variation.createdAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>

                  {variation.approvedBy && (
                    <div className="mt-3 text-xs sm:text-sm text-muted-foreground">
                      {variation.status === 'approved' ? 'Approved' : 'Rejected'} by{' '}
                      {variation.approvedBy?.firstName} {variation.approvedBy?.lastName} on{' '}
                      {format(new Date(variation.approvedAt), 'MMM dd, yyyy')}
                    </div>
                  )}

                  {variation.commercialNotes && (
                    <div className="mt-3 p-2 sm:p-3 bg-muted rounded">
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        <strong>Commercial Notes:</strong> {variation.commercialNotes}
                      </p>
                    </div>
                  )}

                  {variation.rejectionReason && (
                    <div className="mt-3 p-2 sm:p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                      <p className="text-xs sm:text-sm text-red-700 dark:text-red-400">
                        <strong>Rejection Reason:</strong> {variation.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedVariation && (
        <VariationApprovalModal
          variation={selectedVariation}
          onClose={() => setSelectedVariation(null)}
          onSuccess={handleApprovalSuccess}
        />
      )}
    </>
  );
}

