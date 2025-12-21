'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Trophy, Trash2, Loader2 } from 'lucide-react';
import { Challenge } from '@/types';
import toast from 'react-hot-toast';

export default function AdminChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
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
        .from('challenges')
        .select('*')
        .eq('route_id', route.id)
        .order('sort_order');

      setChallenges(data || []);
    }

    setIsLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this challenge?')) return;

    const { error } = await supabase.from('challenges').delete().eq('id', id);

    if (error) {
      toast.error('Failed to delete challenge');
    } else {
      toast.success('Challenge deleted');
      setChallenges((prev) => prev.filter((c) => c.id !== id));
    }
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
        <h2 className="text-2xl font-bold text-gray-800">Challenges</h2>
        <span className="text-gray-500">{challenges.length} total</span>
      </div>

      {!activeRoute ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
          No active route. Import a route first.
        </div>
      ) : challenges.length === 0 ? (
        <div className="bg-gray-50 border rounded-lg p-8 text-center">
          <Trophy className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p className="text-gray-500">No challenges yet</p>
          <p className="text-gray-400 text-sm">Import challenges from CSV</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                    Points
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
                {challenges.map((challenge) => (
                  <tr key={challenge.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{challenge.title}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-500 truncate max-w-md">
                        {challenge.description}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded text-sm font-medium">
                        {challenge.points} pts
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {challenge.category && (
                        <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                          {challenge.category}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(challenge.id)}
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
