'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import Link from 'next/link';

/**
 * Site Widget Component
 * 
 * Displays widgets for a single site:
 * - Headcount (current vs planned)
 * - Progress %
 * - Incidents count
 * - Spend
 */
export default function SiteWidget({ site }) {
  const { widgets, alerts } = site;

  const getHeadcountStatusColor = (status) => {
    switch (status) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const getHeadcountStatusIcon = (status) => {
    switch (status) {
      case 'critical':
        return <XCircle className="h-4 w-4" />;
      case 'warning':
        return <Clock className="h-4 w-4" />;
      default:
        return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{site.name}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{site.siteCode}</p>
          </div>
          {alerts.missingDailyLog && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Missing Log
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Headcount Widget */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Headcount</p>
              <p className="text-lg font-bold">
                {widgets.headcount.current} / {widgets.headcount.planned}
              </p>
              <p className="text-xs text-muted-foreground">
                {widgets.headcount.attendancePercentage}% attendance
              </p>
            </div>
          </div>
          <Badge className={getHeadcountStatusColor(widgets.headcount.status)}>
            {getHeadcountStatusIcon(widgets.headcount.status)}
            <span className="ml-1 capitalize">{widgets.headcount.status}</span>
          </Badge>
        </div>

        {/* Progress Widget */}
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Progress</p>
              <p className="text-lg font-bold">{widgets.progress.percentage}%</p>
              {widgets.progress.lastUpdated && (
                <p className="text-xs text-muted-foreground">
                  Updated: {new Date(widgets.progress.lastUpdated).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Incidents Widget */}
        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Incidents</p>
              <p className="text-lg font-bold">{widgets.incidents.count}</p>
              <p className="text-xs text-muted-foreground">This period</p>
            </div>
          </div>
        </div>

        {/* Spend Widget */}
        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Spend</p>
              <p className="text-lg font-bold">
                £{widgets.spend.total.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground">Payroll</p>
            </div>
          </div>
        </div>

        {/* Alerts Summary */}
        {(alerts.missingDailyLog || alerts.lowAttendance || alerts.activeCount > 0) && (
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertTriangle className="h-3 w-3 text-orange-600" />
                <span>
                  {alerts.missingDailyLog && 'Missing daily log'}
                  {alerts.missingDailyLog && alerts.lowAttendance && ' • '}
                  {alerts.lowAttendance && 'Low attendance'}
                </span>
              </div>
              {alerts.activeCount > 0 && (
                <div className="flex items-center gap-1">
                  <Badge
                    variant={alerts.criticalCount > 0 ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {alerts.activeCount} alert{alerts.activeCount !== 1 ? 's' : ''}
                    {alerts.criticalCount > 0 && ` (${alerts.criticalCount} critical)`}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}

        {/* View Details & Alerts Links */}
        <div className="pt-2 flex items-center justify-between">
          <Link
            href={`/contracts-manager/sites/${site._id}`}
            className="text-sm text-primary hover:underline"
          >
            View Site Details →
          </Link>
          {alerts.activeCount > 0 && (
            <Link
              href={`/contracts-manager/alerts?siteId=${site._id}`}
              className="text-sm text-orange-600 hover:underline"
            >
              View Alerts ({alerts.activeCount}) →
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

