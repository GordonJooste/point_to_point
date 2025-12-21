'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { MapPin, Trophy, Users, Camera, Upload, Download, Trash2, Loader2 } from 'lucide-react';

interface Stats {
  routes: number;
  waypoints: number;
  challenges: number;
  users: number;
  photos: number;
  activeRoute: any;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const [routes, waypoints, challenges, users, photos, activeRoute] = await Promise.all([
        supabase.from('routes').select('id', { count: 'exact', head: true }),
        supabase.from('waypoints').select('id', { count: 'exact', head: true }),
        supabase.from('challenges').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('challenge_completions').select('id', { count: 'exact', head: true }),
        supabase.from('routes').select('*').eq('is_active', true).single(),
      ]);

      setStats({
        routes: routes.count || 0,
        waypoints: waypoints.count || 0,
        challenges: challenges.count || 0,
        users: users.count || 0,
        photos: photos.count || 0,
        activeRoute: activeRoute.data,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
    setIsLoading(false);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>

      {/* Active Route */}
      {stats?.activeRoute && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Active Route</p>
              <p className="text-lg font-bold text-green-800">{stats.activeRoute.name}</p>
              <p className="text-sm text-green-600">
                {new Date(stats.activeRoute.start_date).toLocaleDateString()} -{' '}
                {new Date(stats.activeRoute.end_date).toLocaleDateString()}
              </p>
            </div>
            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              Active
            </div>
          </div>
        </div>
      )}

      {!stats?.activeRoute && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-yellow-800">No active route. Import a route to get started.</p>
          <Link
            href="/admin/import"
            className="inline-flex items-center gap-2 mt-2 text-yellow-700 hover:text-yellow-800 font-medium"
          >
            <Upload className="w-4 h-4" />
            Import Route
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats?.waypoints}</p>
              <p className="text-sm text-gray-500">Waypoints</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats?.challenges}</p>
              <p className="text-sm text-gray-500">Challenges</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats?.users}</p>
              <p className="text-sm text-gray-500">Users</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Camera className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats?.photos}</p>
              <p className="text-sm text-gray-500">Photos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-bold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/import"
            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50"
          >
            <Upload className="w-5 h-5 text-gray-600" />
            <div>
              <p className="font-medium text-gray-800">Import Data</p>
              <p className="text-sm text-gray-500">Upload CSV files</p>
            </div>
          </Link>

          <Link
            href="/admin/waypoints"
            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50"
          >
            <MapPin className="w-5 h-5 text-gray-600" />
            <div>
              <p className="font-medium text-gray-800">Manage Waypoints</p>
              <p className="text-sm text-gray-500">View and edit waypoints</p>
            </div>
          </Link>

          <Link
            href="/admin/challenges"
            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50"
          >
            <Trophy className="w-5 h-5 text-gray-600" />
            <div>
              <p className="font-medium text-gray-800">Manage Challenges</p>
              <p className="text-sm text-gray-500">View and edit challenges</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Template Downloads */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-bold text-gray-800 mb-4">CSV Templates</h3>
        <p className="text-gray-500 text-sm mb-4">
          Download these templates, fill them out, and upload them in the Import section.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/templates/waypoints-template.csv"
            download
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200"
          >
            <Download className="w-4 h-4" />
            waypoints-template.csv
          </a>
          <a
            href="/templates/challenges-template.csv"
            download
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200"
          >
            <Download className="w-4 h-4" />
            challenges-template.csv
          </a>
          <a
            href="/templates/route-template.csv"
            download
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200"
          >
            <Download className="w-4 h-4" />
            route-template.csv
          </a>
        </div>
      </div>
    </div>
  );
}
