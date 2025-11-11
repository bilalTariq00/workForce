import { Users, UserPlus, Building2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardStats({ stats }) {
  const statCards = [
    {
      title: 'Total Employees',
      value: stats.total,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Labour',
      value: stats.labour,
      icon: Building2,
      color: 'text-amber-700',
      bgColor: 'bg-amber-100',
    },
    {
      title: 'Site Managers',
      value: stats.siteManagers,
      icon: UserPlus,
      color: 'text-brown-700',
      bgColor: 'bg-amber-50',
    },
    {
      title: 'Active',
      value: stats.active,
      icon: CheckCircle2,
      color: 'text-amber-800',
      bgColor: 'bg-amber-100',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`${stat.bgColor} p-2 rounded-lg`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

