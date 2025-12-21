'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MapPin, Trash2, Loader2, ExternalLink } from 'lucide-react';
import { Waypoint } from '@/types';
import toast from 'react-hot-toast';

export default function AdminWaypointsPage() {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeRoute, setActiveRoute] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: route } = await supabase
      .from('routes')
      .select('*')
      .eq('is_active', true)
      .single();

    setActiveRoute(route);

    if (route) {
      const { data } = await supabase
        .from('waypoints')
        .select('*')
        .eq('route_id', route.id)
        .order('sort_order');

      setWaypoints(data || []);
    }

    setIsLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this waypoint?')) return;

    const { error } = await supabase.from('waypoints').delete().eq('id', id);

    if (error) {
      toast.error('Failed to delete waypoint');
    } else {
      toast.success('Waypoint deleted');
      setWaypoints((prev) => prev.filter((w) => w.id !== id));
    }
  }

  function openInMaps(lat: number, lng: number) {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Waypoints</h2>
        <span className="text-gray-500">{waypoints.length} total</span>
      </div>

      {!activeRoute ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
          No active route. Import a route first.
        </div>
      ) : waypoints.length === 0 ? (
        <div className="bg-gray-50 border rounded-lg p-8 text-center">
          <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p className="text-gray-500">No waypoints yet</p>
          <p className="text-gray-400 text-sm">Import waypoints from CSV</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                    Icon
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                    Points
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                    Location
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                    Category
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {waypoints.map((waypoint) => (
                  <tr key={waypoint.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{waypoint.name}</p>
                      {waypoint.description && (
                        <p className="text-sm text-gray-500 truncate max-w-xs">
                          {waypoint.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                        {waypoint.icon}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded text-sm font-medium">
                        {waypoint.points} pts
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openInMaps(waypoint.latitude, waypoint.longitude)}
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                      >
                        {waypoint.latitude.toFixed(4)}, {waypoint.longitude.toFixed(4)}
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {waypoint.category && (
                        <span className="text-sm text-gray-600">{waypoint.category}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(waypoint.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
