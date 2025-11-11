'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

export default function SetupPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const initializeHR = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/v1/init', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          success: true,
          message: data.message,
          email: data.data.email,
          password: data.data.password,
        });
      } else {
        setError(data.message || 'Failed to initialize HR admin');
        setResult({
          success: false,
          message: data.message,
        });
      }
    } catch (err) {
      setError('An error occurred. Please check your MongoDB connection.');
      console.error('Setup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 text-center">
            Initial Setup
          </h1>
          <p className="text-gray-600 text-sm md:text-base text-center mb-6">
            Create the default HR admin user
          </p>

          {!result && !error && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  This will create the default HR admin user in your database.
                </p>
              </div>

              <button
                onClick={initializeHR}
                disabled={loading}
                className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold text-base hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  'Initialize HR Admin'
                )}
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Error</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {result.success ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Success!</p>
                      <p className="text-sm text-green-700 mt-1">{result.message}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Notice</p>
                      <p className="text-sm text-yellow-700 mt-1">{result.message}</p>
                    </div>
                  </div>
                </div>
              )}

              {result.success && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">Login Credentials:</p>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <span className="ml-2 font-mono text-gray-900">{result.email}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Password:</span>
                      <span className="ml-2 font-mono text-gray-900">{result.password}</span>
                    </div>
                  </div>
                </div>
              )}

              <a
                href="/login"
                className="block w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold text-base hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors text-center"
              >
                Go to Login
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

