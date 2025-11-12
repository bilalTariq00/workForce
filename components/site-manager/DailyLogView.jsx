'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// Using inline badge styling
import { Calendar, Users, Package, FileText, Lock, Send } from 'lucide-react';

/**
 * Daily Log View Component
 * 
 * Purpose: Display a read-only view of a daily log
 * Used when log is locked or sent (cannot be edited)
 * 
 * Props:
 * - dailyLog: The daily log object to display
 */
export default function DailyLogView({ dailyLog }) {
  // Format date for display
  const logDate = new Date(dailyLog.date);
  const formattedDate = logDate.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'locked':
        return 'bg-yellow-100 text-yellow-800';
      case 'sent':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format status text
  const formatStatus = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {dailyLog.status === 'locked' && <Lock className="h-5 w-5 text-yellow-600" />}
              {dailyLog.status === 'sent' && <Send className="h-5 w-5 text-green-600" />}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <p className="text-lg font-semibold">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(dailyLog.status)}`}>
                    {formatStatus(dailyLog.status)}
                  </span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-muted-foreground">Date</p>
              <p className="text-sm font-semibold">{formattedDate}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Site Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Site Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Site Name</p>
              <p className="text-sm font-semibold">{dailyLog.siteId?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Site Code</p>
              <p className="text-sm font-semibold">{dailyLog.siteId?.siteCode || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weather & Headcount */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daily Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Weather */}
          {dailyLog.weather && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Weather</p>
              <p className="text-sm">{dailyLog.weather}</p>
            </div>
          )}

          {/* Headcount Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Actual Headcount
              </p>
              <p className="text-2xl font-bold text-foreground">{dailyLog.headcount}</p>
            </div>
            {dailyLog.plannedHeadcount !== undefined && dailyLog.plannedHeadcount !== null && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Planned Headcount</p>
                <p className="text-2xl font-bold text-foreground">{dailyLog.plannedHeadcount}</p>
                {/* Show difference */}
                {dailyLog.plannedHeadcount > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Difference: {dailyLog.headcount - dailyLog.plannedHeadcount > 0 ? '+' : ''}
                    {dailyLog.headcount - dailyLog.plannedHeadcount}
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Deliveries */}
      {dailyLog.deliveries && dailyLog.deliveries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Material Deliveries ({dailyLog.deliveries.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dailyLog.deliveries.map((delivery, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{delivery.material}</p>
                      <p className="text-xs text-muted-foreground">
                        Docket: {delivery.docketNumber}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      delivery.poMatchStatus === 'matched'
                        ? 'bg-green-100 text-green-800'
                        : delivery.poMatchStatus === 'unmatched'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {delivery.poMatchStatus}
                    </span>
                  </div>
                  {delivery.docketPhoto && (
                    <div className="mt-2">
                      <a
                        href={delivery.docketPhoto}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View Photo →
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Issues/Notes */}
      {dailyLog.issues && (
        <Card>
          <CardHeader>
            <CardTitle>Issues / Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{dailyLog.issues}</p>
          </CardContent>
        </Card>
      )}

      {/* Timestamps */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {dailyLog.lockedAt && (
              <div>
                <p className="text-muted-foreground">Locked At</p>
                <p className="font-medium">
                  {new Date(dailyLog.lockedAt).toLocaleString()}
                </p>
              </div>
            )}
            {dailyLog.sentAt && (
              <div>
                <p className="text-muted-foreground">Sent At</p>
                <p className="font-medium">
                  {new Date(dailyLog.sentAt).toLocaleString()}
                </p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">Created At</p>
              <p className="font-medium">
                {new Date(dailyLog.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Last Updated</p>
              <p className="font-medium">
                {new Date(dailyLog.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

