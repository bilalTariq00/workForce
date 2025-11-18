'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { FileText, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';

export default function CertificationList({ certifications }) {
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

  if (certifications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Certifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No certifications uploaded yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Upload your first certification to get started
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">My Certifications ({certifications.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 sm:space-y-4">
          {certifications.map((cert) => (
            <div
              key={cert._id}
              className="p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">{cert.type}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {cert.validatedBy
                      ? `Validated by ${cert.validatedBy.firstName} ${cert.validatedBy.lastName}`
                      : 'Pending validation'}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {getStatusBadge(cert.status, cert.expiryDate)}
                </div>
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
      </CardContent>
    </Card>
  );
}

