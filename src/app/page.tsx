'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Loader2 } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, user, activeRoute, isLoading } = useUser();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      router.push('/map');
    }
  }, [user, isLoading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    const result = await login(username);

    if (result.success) {
      router.push('/map');
    } else {
      setError(result.error || 'Login failed');
      setIsSubmitting(false);
    }
  }

  // Show loading while checking auth
  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center">
            <MapPin className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Point to Point
        </h1>
        <p className="text-gray-500 text-center mb-6">
          Location Challenge
        </p>

        {/* Active Route Info */}
        {activeRoute && (
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-primary-700 font-medium">
              {activeRoute.name}
            </p>
            <p className="text-xs text-primary-600">
              {new Date(activeRoute.start_date).toLocaleDateString()} -{' '}
              {new Date(activeRoute.end_date).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Enter your username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g., explorer_jane"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              maxLength={50}
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              required
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !username.trim()}
            className="w-full py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Joining...
              </>
            ) : (
              'Join the Challenge'
            )}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6">
          New user? Just enter a unique username to register.
          <br />
          Returning? Enter your existing username.
        </p>
      </div>
    </main>
  );
}
