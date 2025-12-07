'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Package, Users, ClipboardList, FileText, DollarSign, Wrench, ShoppingCart,
  Check, ShoppingBag, Sparkles, ArrowRight
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

export default function ModuleMarketplaceClient({ 
  modules, 
  buyAllPrice, 
  individualTotal, 
  discount,
  allModulesPurchased 
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handlePurchase = async (moduleCodes, isBuyAll = false) => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const response = await fetch('/api/v1/modules/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleCodes, buyAll: isBuyAll }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Purchase failed');
      }

      setMessage({ type: 'success', text: data.message || 'Modules purchased successfully!' });
      
      // Refresh and redirect after a short delay
      setTimeout(() => {
        router.refresh();
        router.push('/dashboard');
      }, 1500);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to purchase modules' });
    } finally {
      setLoading(false);
    }
  };

  const unpurchasedModules = modules.filter(m => !m.isPurchased);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Module Marketplace</h1>
          <p className="text-gray-600">Purchase modules to unlock features and dashboards</p>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Buy All Card */}
        {!allModulesPurchased && (
          <Card className="mb-8 border-2 border-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-primary" />
                  <CardTitle className="text-2xl">Buy All Modules</CardTitle>
                </div>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {discount}% OFF
                </Badge>
              </div>
              <CardDescription className="text-base">
                Get all {modules.length} modules at a discounted price
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-bold text-primary">${buyAllPrice}</span>
                <span className="text-xl text-gray-400 line-through">${individualTotal}</span>
                <span className="text-sm text-green-600 font-semibold">Save ${individualTotal - buyAllPrice}</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Includes: {modules.map(m => m.name).join(', ')}
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => handlePurchase([], true)}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                {loading ? 'Processing...' : 'Buy All Modules'}
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => {
            const Icon = iconMap[module.icon] || Package;
            const isPurchased = module.isPurchased;

            return (
              <Card key={module.code} className={isPurchased ? 'border-green-500 bg-green-50/50' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="h-8 w-8 text-primary" />
                    {isPurchased && (
                      <Badge className="bg-green-500">
                        <Check className="h-3 w-3 mr-1" />
                        Purchased
                      </Badge>
                    )}
                  </div>
                  <CardTitle>{module.name}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="text-2xl font-bold text-gray-900 mb-3">${module.price}</div>
                    {module.features && module.features.length > 0 && (
                      <ul className="space-y-1 text-sm text-gray-600">
                        {module.features.slice(0, 3).map((feature, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span className="capitalize">{feature.replace(/-/g, ' ')}</span>
                          </li>
                        ))}
                        {module.features.length > 3 && (
                          <li className="text-primary font-medium">
                            + {module.features.length - 3} more features
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  {isPurchased ? (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => router.push(module.route)}
                    >
                      Access Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handlePurchase([module.code])}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? 'Processing...' : 'Buy Now'}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Info Section */}
        {allModulesPurchased && (
          <Card className="mt-8 bg-primary/5 border-primary">
            <CardContent className="pt-6">
              <div className="text-center">
                <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">All Modules Purchased!</h3>
                <p className="text-gray-600 mb-4">You have access to all available modules.</p>
                <Button onClick={() => router.push('/dashboard')}>
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}


