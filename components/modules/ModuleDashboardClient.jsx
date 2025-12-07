'use client';

import { useRouter } from 'next/navigation';
import { 
  Package, Users, ClipboardList, FileText, DollarSign, Wrench, ShoppingCart,
  ArrowRight, ShoppingBag, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const iconMap = {
  Users,
  ClipboardList,
  FileText,
  DollarSign,
  Wrench,
  ShoppingCart,
  Package,
};

export default function ModuleDashboardClient({ purchasedModules, allModulesCount }) {
  const router = useRouter();

  if (purchasedModules.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Modules Purchased</h2>
        <p className="text-gray-600 mb-6">
          Purchase modules to unlock features and access dashboards
        </p>
        <Button onClick={() => router.push('/modules')} size="lg">
          <ShoppingBag className="mr-2 h-5 w-5" />
          Browse Modules
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your Modules</h2>
          <p className="text-gray-600 mt-1">
            {purchasedModules.length} of {allModulesCount} modules purchased
          </p>
        </div>
        <Button onClick={() => router.push('/modules')} variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Buy More Modules
        </Button>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {purchasedModules.map((module) => {
          const Icon = iconMap[module.icon] || Package;

          return (
            <Card key={module.code} className="hover:shadow-lg transition-shadow border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Icon className="h-10 w-10 text-primary" />
                  <Badge className="bg-green-500">
                    Active
                  </Badge>
                </div>
                <CardTitle className="text-xl">{module.name}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {module.features && module.features.length > 0 && (
                  <ul className="space-y-1 text-sm text-gray-600">
                    {module.features.slice(0, 4).map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span className="capitalize">{feature.replace(/-/g, ' ')}</span>
                      </li>
                    ))}
                    {module.features.length > 4 && (
                      <li className="text-primary font-medium text-xs">
                        + {module.features.length - 4} more features
                      </li>
                    )}
                  </ul>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full"
                  onClick={() => router.push(module.route)}
                >
                  Open Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Buy More CTA */}
      {purchasedModules.length < allModulesCount && (
        <Card className="bg-primary/5 border-primary">
          <CardContent className="pt-6">
            <div className="text-center">
              <ShoppingBag className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Want More Features?</h3>
              <p className="text-gray-600 mb-4">
                Explore additional modules to enhance your workforce management
              </p>
              <Button onClick={() => router.push('/modules')} size="lg">
                Browse All Modules
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


