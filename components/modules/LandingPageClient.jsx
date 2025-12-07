'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Package, Users, ClipboardList, FileText, DollarSign, Wrench, ShoppingCart,
  Check, ShoppingBag, Sparkles, ArrowRight, LogIn, Zap, Shield, TrendingUp,
  Star, ChevronRight
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

export default function LandingPageClient({ 
  modules, 
  buyAllPrice, 
  individualTotal, 
  discount,
  allModulesPurchased,
  isAuthenticated,
  user
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Ensure modules is an array
  const modulesList = Array.isArray(modules) ? modules : [];

  const handlePurchase = async (moduleCodes, isBuyAll = false) => {
    // If not authenticated, redirect to login
    if (!isAuthenticated || !session) {
      router.push(`/login?redirect=/modules&action=buy`);
      return;
    }

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
        router.push('/modules-dashboard');
      }, 1500);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to purchase modules' });
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = (moduleCode) => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/modules&action=buy&module=${moduleCode}`);
    } else {
      handlePurchase([moduleCode]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 md:mb-12">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-primary rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 md:h-7 md:w-7 text-white" />
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Workforce Management</h1>
            </div>
            {!isAuthenticated && (
              <Button 
                onClick={() => router.push('/login')}
                size="lg"
                className="gap-2"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Button>
            )}
            {isAuthenticated && (session?.user || user) && (
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-semibold text-gray-900">
                    {user?.name || session?.user?.name || session?.user?.email || user?.email}
                  </div>
                  <div className="text-xs text-gray-600">
                    {user?.email || session?.user?.email}
                  </div>
                </div>
                <Button 
                  onClick={() => router.push('/modules-dashboard')}
                  variant="outline"
                  size="lg"
                  className="gap-2"
                >
                  My Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Hero Content */}
          <div className="text-center mb-12 md:mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Zap className="h-3 w-3 mr-1" />
              Modular Workforce Solutions
            </Badge>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 md:mb-6">
              Build Your Perfect
              <span className="text-primary block mt-2">Workforce Platform</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Choose the modules you need. Pay only for what you use. Scale as you grow.
            </p>
            
            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-6 md:gap-12 mb-12">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">{modulesList.length}</div>
                <div className="text-sm md:text-base text-gray-600">Available Modules</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">20%</div>
                <div className="text-sm md:text-base text-gray-600">Buy All Discount</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                  <Shield className="h-8 w-8 md:h-10 md:w-10 inline" />
                </div>
                <div className="text-sm md:text-base text-gray-600">Secure & Reliable</div>
              </div>
            </div>
          </div>

          {/* Message Display */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg max-w-2xl mx-auto ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          {/* Buy All Card */}
          {!allModulesPurchased && (
            <Card className="mb-12 border-2 border-primary shadow-xl">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="h-6 w-6 text-primary" />
                  <CardTitle className="text-2xl md:text-3xl">Buy All Modules</CardTitle>
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-1.5 mx-auto">
                  {discount}% OFF
                </Badge>
                <CardDescription className="text-base md:text-lg mt-2">
                  Get all {modulesList.length} modules at a discounted price
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="flex items-baseline justify-center gap-3 mb-6">
                  <span className="text-4xl md:text-5xl font-bold text-primary">${buyAllPrice}</span>
                  <span className="text-2xl md:text-3xl text-gray-400 line-through">${individualTotal}</span>
                  <span className="text-lg md:text-xl text-green-600 font-semibold">
                    Save ${individualTotal - buyAllPrice}
                  </span>
                </div>
                <p className="text-sm md:text-base text-gray-600 mb-6">
                  Includes: {modulesList.map(m => m.name).join(', ')}
                </p>
              </CardContent>
              <CardFooter className="justify-center">
                <Button 
                  onClick={() => handlePurchase([], true)}
                  disabled={loading}
                  size="lg"
                  className="w-full md:w-auto px-8 py-6 text-lg"
                >
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  {loading ? 'Processing...' : 'Buy All Modules'}
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Modules Section */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900">Available Modules</h3>
              {isAuthenticated && (
                <Button 
                  variant="outline"
                  onClick={() => router.push('/modules-dashboard')}
                  className="gap-2"
                >
                  View My Modules
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Modules Grid */}
            {modulesList.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-xl font-semibold mb-2">No Modules Available</h4>
                  <p className="text-gray-600 mb-4">
                    Modules need to be initialized in the database.
                  </p>
                  <p className="text-sm text-gray-500">
                    Run: <code className="bg-gray-100 px-2 py-1 rounded">node scripts/init-modules.js</code>
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {modulesList.map((module) => {
                const Icon = iconMap[module.icon] || Package;
                const isPurchased = module.isPurchased;

                return (
                  <Card 
                    key={module.code} 
                    className={`hover:shadow-xl transition-all duration-300 ${
                      isPurchased ? 'border-green-500 bg-green-50/50' : 'border-gray-200 hover:border-primary'
                    }`}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between mb-3">
                        <div className={`p-3 rounded-lg ${
                          isPurchased ? 'bg-green-100' : 'bg-primary/10'
                        }`}>
                          <Icon className={`h-6 w-6 md:h-8 md:w-8 ${
                            isPurchased ? 'text-green-600' : 'text-primary'
                          }`} />
                        </div>
                        {isPurchased && (
                          <Badge className="bg-green-500">
                            <Check className="h-3 w-3 mr-1" />
                            Purchased
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl md:text-2xl">{module.name}</CardTitle>
                      <CardDescription className="text-base">{module.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                          ${module.price}
                        </div>
                        {module.features && module.features.length > 0 && (
                          <ul className="space-y-2 text-sm md:text-base text-gray-600">
                            {module.features.slice(0, 3).map((feature, idx) => (
                              <li key={idx} className="flex items-start">
                                <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                <span className="capitalize">{feature.replace(/-/g, ' ')}</span>
                              </li>
                            ))}
                            {module.features.length > 3 && (
                              <li className="text-primary font-medium text-sm">
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
                          size="lg"
                        >
                          Access Dashboard
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => handleBuyNow(module.code)}
                          disabled={loading}
                          className="w-full"
                          size="lg"
                        >
                          {loading ? 'Processing...' : 'Buy Now'}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
              </div>
            )}
          </div>

          {/* Features Section */}
          <div className="mt-16 md:mt-24 mb-12">
            <div className="text-center mb-12">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Why Choose Our Platform?
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <Card className="text-center border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-semibold text-lg mb-2">Pay As You Grow</h4>
                  <p className="text-gray-600 text-sm">
                    Start with what you need, add modules as your business grows
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-semibold text-lg mb-2">Secure & Reliable</h4>
                  <p className="text-gray-600 text-sm">
                    Enterprise-grade security with regular updates and support
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-semibold text-lg mb-2">Scalable Solution</h4>
                  <p className="text-gray-600 text-sm">
                    Built to scale with your workforce from startup to enterprise
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* CTA Section */}
          {!isAuthenticated && (
            <div className="text-center py-12 md:py-16">
              <Card className="max-w-2xl mx-auto border-primary/20 bg-gradient-to-r from-primary/5 to-blue-50">
                <CardContent className="pt-8 pb-8">
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                    Ready to Get Started?
                  </h3>
                  <p className="text-gray-600 mb-6 text-lg">
                    Sign in to purchase modules and start managing your workforce
                  </p>
                  <Button 
                    onClick={() => router.push('/login')}
                    size="lg"
                    className="px-8 py-6 text-lg"
                  >
                    <LogIn className="mr-2 h-5 w-5" />
                    Sign In to Continue
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


