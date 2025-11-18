'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { FileText, Edit, Trash2, CheckCircle, XCircle, Clock, Send } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VariationList({ variations, site }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState(null);

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

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this variation?')) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/v1/variations/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error?.message || 'Failed to delete variation');
      }
    } catch (error) {
      console.error('Error deleting variation:', error);
      alert('An error occurred while deleting variation');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (id) => {
    try {
      const response = await fetch(`/api/v1/variations/${id}/submit`, {
        method: 'POST',
      });

      const result = await response.json();
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error?.message || 'Failed to submit variation');
      }
    } catch (error) {
      console.error('Error submitting variation:', error);
      alert('An error occurred while submitting variation');
    }
  };

  if (variations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Variations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No variations created yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Create your first variation to get started
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Variations ({variations.length})</CardTitle>
      </CardHeader>
      <CardContent>
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
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {variation.description}
                  </p>
                </div>
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

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 mt-4">
                {(variation.status === 'draft' || variation.status === 'rejected') && (
                  <>
                    <Link href={`/site-manager/variations?edit=${variation._id}`}>
                      <Button size="sm" variant="outline" className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm">
                        <Edit className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        Edit
                      </Button>
                    </Link>
                    {variation.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={() => handleSubmit(variation._id)}
                        className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm"
                      >
                        <Send className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        Submit
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(variation._id)}
                      disabled={deletingId === variation._id}
                      className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm"
                    >
                      <Trash2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

