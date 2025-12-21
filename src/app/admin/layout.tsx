'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Lock, Home, Upload, MapPin, Trophy, Camera, LogOut } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const pathname = usePathname();

  useEffect(() => {
    const adminAuth = sessionStorage.getItem('admin_auth');
    if (adminAuth === 'authenticated') {
      setIsAuthenticated(true);
    }
    setIsChecking(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const response = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    const { success } = await response.json();

    if (success) {
      sessionStorage.setItem('admin_auth', 'authenticated');
      setIsAuthenticated(true);
    } else {
      setError('Invalid password');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth');
    setIsAuthenticated(false);
    setPassword('');
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
            Admin Access
          </h1>
          <p className="text-gray-500 text-center mb-6">
            Enter the admin password to continue
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-gray-800"
              required
            />
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}
            <button
              type="submit"
              className="w-full py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900"
            >
              Login
            </button>
          </form>

          <Link
            href="/"
            className="block text-center text-gray-500 text-sm mt-4 hover:text-gray-700"
          >
            Back to app
          </Link>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: Home },
    { href: '/admin/import', label: 'Import', icon: Upload },
    { href: '/admin/waypoints', label: 'Waypoints', icon: MapPin },
    { href: '/admin/challenges', label: 'Challenges', icon: Trophy },
    { href: '/admin/gallery', label: 'Gallery', icon: Camera },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gray-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Point to Point Admin</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-sm hover:text-gray-300"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  pathname === href
                    ? 'border-gray-800 text-gray-800'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-6xl mx-auto p-4">{children}</main>
    </div>
  );
}
