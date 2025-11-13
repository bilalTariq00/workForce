'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, AlertTriangle, DollarSign, Bell } from 'lucide-react';
import Link from 'next/link';

/**
 * Dashboard Totals Component
 * 
 * Displays aggregated totals across all sites
 */
export default function DashboardTotals({ totals }) {
  if (!totals) {
    return null;
  }

  const widgets = [
    {
      title: 'Total Headcount',
      value: `${totals.headcount.current} / ${totals.headcount.planned}`,
      subtitle: `${totals.headcount.current - totals.headcount.planned >= 0 ? '+' : ''}${totals.headcount.current - totals.headcount.planned}`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Average Progress',
      value: `${totals.progress.average}%`,
      subtitle: 'Across all sites',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Incidents',
      value: totals.incidents.total,
      subtitle: 'All sites',
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Total Spend',
      value: `£${totals.spend.total.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: 'Payroll',
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    ...(totals.alerts ? [{
      title: 'Active Alerts',
      value: totals.alerts.active,
      subtitle: totals.alerts.critical > 0 ? `${totals.alerts.critical} critical` : 'All sites',
      icon: Bell,
      color: totals.alerts.critical > 0 ? 'text-red-600' : 'text-orange-600',
      bgColor: totals.alerts.critical > 0 ? 'bg-red-50' : 'bg-orange-50',
      link: '/contracts-manager/alerts',
    }] : []),
  ];

  const gridCols = widgets.length > 4 ? 'lg:grid-cols-5' : 'lg:grid-cols-4';
  
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridCols} gap-4`}>
      {widgets.map((widget, index) => {
        const Icon = widget.icon;
        const cardContent = (
          <Card key={index} className={widget.link ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {widget.title}
                  </p>
                  <p className="text-2xl font-bold">{widget.value}</p>
                  {widget.subtitle && (
                    <p className="text-xs text-muted-foreground mt-1">{widget.subtitle}</p>
                  )}
                </div>
                <div className={`${widget.bgColor} p-3 rounded-lg`}>
                  <Icon className={`h-6 w-6 ${widget.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );

        if (widget.link) {
          return (
            <Link key={index} href={widget.link}>
              {cardContent}
            </Link>
          );
        }

        return cardContent;
      })}
    </div>
  );
}

