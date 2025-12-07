import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db/mongodb';
import { checkModuleAccessServer } from '@/lib/utils/checkModuleAccessServer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Package, Building2, FileText, ArrowRight, Plus, Clock, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

/**
 * Procurement Module Dashboard
 * 
 * Purpose: Manage purchase orders, vendors, and procurement workflows
 * 
 * Access: Requires 'procurement' module
 * 
 * Note: This is a placeholder dashboard. Full procurement features to be implemented later.
 */
export default async function ProcurementDashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Check module access (Procurement module required)
  const { hasAccess } = await checkModuleAccessServer('procurement');
  if (!hasAccess) {
    redirect('/modules?required=procurement');
  }

  await connectDB();

  // Placeholder stats (to be implemented with actual data)
  const stats = {
    purchaseOrders: 0,
    vendors: 0,
    pendingOrders: 0,
    completedOrders: 0,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <ShoppingCart className="h-8 w-8 text-primary" />
                Procurement
              </h1>
              <p className="text-sm text-gray-600 mt-2">
                Purchase orders, vendor management, and procurement workflows
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" disabled>
                <Plus className="h-4 w-4 mr-2" />
                New Purchase Order
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Coming Soon Notice */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="text-center">
              <Package className="h-16 w-16 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Procurement Module</h3>
              <p className="text-gray-600 mb-4">
                This module is currently under development. Full procurement features including purchase orders, 
                vendor management, and procurement workflows will be available soon.
              </p>
              <p className="text-sm text-gray-500">
                Expected features: Purchase Orders, Vendor Management, Approval Workflows, Inventory Tracking
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Purchase Orders</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.purchaseOrders}</div>
              <p className="text-xs text-muted-foreground">Total orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendors</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.vendors}</div>
              <p className="text-xs text-muted-foreground">Active vendors</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingOrders}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedOrders}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Purchase Orders */}
          <Card className="hover:shadow-lg transition-shadow opacity-60">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-8 w-8 text-primary" />
                <CardTitle>Purchase Orders</CardTitle>
              </div>
              <CardDescription>
                Create and manage purchase orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 mb-4">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Create purchase orders
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Track order status
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Approval workflows
                </li>
              </ul>
            </CardContent>
            <CardContent className="pt-0">
              <Button className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {/* Vendor Management */}
          <Card className="hover:shadow-lg transition-shadow opacity-60">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Building2 className="h-8 w-8 text-primary" />
                <CardTitle>Vendor Management</CardTitle>
              </div>
              <CardDescription>
                Manage vendor information and relationships
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 mb-4">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Vendor directory
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Contact management
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Performance tracking
                </li>
              </ul>
            </CardContent>
            <CardContent className="pt-0">
              <Button className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {/* Procurement Workflows */}
          <Card className="hover:shadow-lg transition-shadow opacity-60">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Package className="h-8 w-8 text-primary" />
                <CardTitle>Workflows</CardTitle>
              </div>
              <CardDescription>
                Procurement approval and tracking workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 mb-4">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Approval chains
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Status tracking
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Notifications
                </li>
              </ul>
            </CardContent>
            <CardContent className="pt-0">
              <Button className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

