'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, TrendingUp, Users, DollarSign, Building2 } from 'lucide-react';
import SiteWidget from './SiteWidget';
import DashboardTotals from './DashboardTotals';

/**
 * Multi-Site Dashboard Client Component
 * 
 * Displays aggregated data for all sites with widgets
 */
export default function MultiSiteDashboardClient() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState(null);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setError('');
      const response = await fetch('/api/v1/dashboard/multi-site');
      const result = await response.json();

      if (result.success) {
        setDashboardData(result.data);
      } else {
        setError(result.error?.message || 'Failed to load dashboard data');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  // Handle manual refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-red-800 mb-4">{error}</p>
            <Button onClick={handleRefresh}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const { sites, totals, lastUpdated } = dashboardData;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Multi-Site Dashboard</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Real-time overview of all construction sites
            {lastUpdated && (
              <span className="hidden sm:inline ml-2">
                • Last updated: {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={refreshing} 
          variant="outline" 
          size="sm"
          className="w-full sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Dashboard Totals */}
      <DashboardTotals totals={totals} />

      {/* Sites Grid */}
      {sites.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 sm:py-12">
              <Building2 className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm sm:text-base text-muted-foreground mb-4">No active sites found</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {sites.map((site) => (
            <SiteWidget key={site._id} site={site} />
          ))}
        </div>
      )}
    </div>
  );
}

