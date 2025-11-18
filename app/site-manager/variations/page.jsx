import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db/mongodb';
import { Employee } from '@/lib/models/Employee';
import { Site } from '@/lib/models/Site';
import { Variation } from '@/lib/models/Variation';
import SiteManagerLayout from '@/components/layouts/SiteManagerLayout';
import VariationForm from '@/components/site-manager/VariationForm';
import VariationList from '@/components/site-manager/VariationList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

/**
 * Site Manager Variations Page
 * 
 * Purpose: Site Managers can create and manage variations/change orders
 * 
 * Access: Only Site Managers
 */
export default async function VariationsPage({ searchParams }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  if (session.user.role !== 'site_manager') {
    redirect('/dashboard');
  }

  await connectDB();

  // Get the Site Manager's assigned site
  const siteManager = await Employee.findById(session.user.id).lean();

  if (!siteManager || !siteManager.siteId) {
    return (
      <SiteManagerLayout>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                You are not assigned to any site. Please contact HR to assign you to a site.
              </p>
              <Link href="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </SiteManagerLayout>
    );
  }

  // Get site details
  const site = await Site.findById(siteManager.siteId).lean();

  // Get variations for this site
  const variations = await Variation.find({ siteId: siteManager.siteId })
    .populate('approvedBy', 'firstName lastName')
    .sort({ createdAt: -1 })
    .lean();

  const showForm = searchParams?.create === 'true';
  const editId = searchParams?.edit;
  const variationToEdit = editId
    ? await Variation.findById(editId)
        .populate('siteId', 'name siteCode')
        .lean()
    : null;

  const success = searchParams?.success === 'true';

  return (
    <SiteManagerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Variations / Change Orders</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage variations for {site?.name || 'your site'}
            </p>
          </div>
          {!showForm && !editId && (
            <Link href="/site-manager/variations?create=true">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Variation
              </Button>
            </Link>
          )}
        </div>

        {success && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-400">
              Variation {editId ? 'updated' : 'created'} successfully!
            </p>
          </div>
        )}

        {/* Create/Edit Form */}
        {(showForm || editId) && (
          <div>
            {editId && variationToEdit && (
              <div className="mb-4">
                <Link href="/site-manager/variations">
                  <Button variant="outline">← Back to List</Button>
                </Link>
              </div>
            )}
            <VariationForm
              siteId={siteManager.siteId}
              variation={variationToEdit}
              onSuccess={() => {
                // This will be handled client-side
              }}
            />
          </div>
        )}

        {/* Variations List */}
        {!showForm && !editId && (
          <VariationList variations={variations} site={site} />
        )}
      </div>
    </SiteManagerLayout>
  );
}

