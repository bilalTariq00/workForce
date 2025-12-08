'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn, Eye, EyeOff, Info, Copy, Check } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [copied, setCopied] = useState({ email: false, password: false });

  const defaultHREmail = 'hr@workforce.com';
  const defaultHRPassword = 'Admin@123';

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [type]: true });
    setTimeout(() => {
      setCopied({ ...copied, [type]: false });
    }, 2000);
  };

  const handleFillCredentials = () => {
    setEmail(defaultHREmail);
    setPassword(defaultHRPassword);
    setShowCredentials(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        console.error('Login error:', result.error);
        setError('Invalid email or password. Please check your credentials.');
        setLoading(false);
        return;
      }

      // Handle redirect after login
      if (result?.ok) {
        // Get callbackUrl from NextAuth or use redirect param
        const callbackUrl = searchParams.get('callbackUrl') || searchParams.get('redirect');
        const action = searchParams.get('action');
        const module = searchParams.get('module');
        
        let targetPath = '/dashboard'; // Default redirect - dashboard will handle role-based routing
        
        // Decode callbackUrl if it's URL encoded
        const decodedCallback = callbackUrl ? decodeURIComponent(callbackUrl) : null;
        
        // Only use callbackUrl if it's a specific route (not /dashboard)
        // Otherwise, redirect to /dashboard which will route to role-specific dashboard
        if (decodedCallback && decodedCallback !== '/login' && decodedCallback !== '/dashboard') {
          targetPath = decodedCallback;
        } else if (callbackUrl === '/modules' && action === 'buy' && module) {
          targetPath = `/modules?buy=${module}`;
        } else if (callbackUrl === '/modules') {
          targetPath = '/modules';
        } else if (callbackUrl && callbackUrl !== '/login' && callbackUrl !== '/dashboard') {
          targetPath = callbackUrl;
        }
        
        // Small delay to ensure cookie is set, then redirect
        setTimeout(() => {
          window.location.href = targetPath;
        }, 100);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-6 sm:py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8">
          {/* Logo/Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-primary-600 rounded-full mb-3 sm:mb-4">
              <LogIn className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Workforce Management
            </h1>
            <p className="text-gray-600 text-xs sm:text-sm md:text-base">
              Sign in to your account
            </p>
          </div>

          {/* HR Credentials Info */}
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setShowCredentials(!showCredentials)}
              className="w-full flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  Default HR Credentials
                </span>
              </div>
              <span className="text-xs text-blue-600">
                {showCredentials ? 'Hide' : 'Show'}
              </span>
            </button>

            {showCredentials && (
              <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                <div>
                  <label className="block text-xs font-medium text-blue-900 mb-1">
                    Email
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded text-sm text-gray-800 font-mono">
                      {defaultHREmail}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopy(defaultHREmail, 'email')}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                      title="Copy email"
                    >
                      {copied.email ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-blue-900 mb-1">
                    Password
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded text-sm text-gray-800 font-mono">
                      {defaultHRPassword}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopy(defaultHRPassword, 'password')}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                      title="Copy password"
                    >
                      {copied.password ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleFillCredentials}
                  className="w-full mt-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Fill Credentials
                </button>
              </div>
            )}
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-base text-gray-900 placeholder:text-gray-400"
                placeholder="Enter your email"
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-base text-gray-900 placeholder:text-gray-400"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors p-1 touch-manipulation"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold text-sm sm:text-base hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation min-h-[44px]"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>HR Management System</p>
          </div>
        </div>
      </div>
    </div>
  );
}

