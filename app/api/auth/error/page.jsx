'use client';

import { useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = () => {
    switch (error) {
      case 'CredentialsSignin':
        return {
          title: 'Invalid Credentials',
          message: 'The email or password you entered is incorrect.',
          suggestion: 'Please check your credentials and try again. If you haven\'t set up the HR admin yet, please initialize it first.',
        };
      case 'Configuration':
        return {
          title: 'Configuration Error',
          message: 'There is a problem with the server configuration.',
          suggestion: 'Please check your environment variables, especially NEXTAUTH_SECRET.',
        };
      default:
        return {
          title: 'Authentication Error',
          message: 'An error occurred during authentication.',
          suggestion: 'Please try again or contact support if the problem persists.',
        };
    }
  };

  const errorInfo = getErrorMessage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {errorInfo.title}
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              {errorInfo.message}
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              {errorInfo.suggestion}
            </p>
          </div>

          {error === 'CredentialsSignin' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium text-blue-900 mb-2">First Time Setup?</p>
              <p className="text-sm text-blue-800 mb-3">
                If you haven't initialized the HR admin user yet, you need to do that first.
              </p>
              <Link
                href="/setup"
                className="inline-block w-full text-center bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Initialize HR Admin
              </Link>
            </div>
          )}

          <div className="space-y-3">
            <Link
              href="/login"
              className="block w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold text-base hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors text-center"
            >
              Try Again
            </Link>
            <Link
              href="/setup"
              className="block w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold text-base hover:bg-gray-50 transition-colors text-center"
            >
              Setup / Initialize
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

