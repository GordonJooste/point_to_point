'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/contexts/UserContext';
import { Waypoint } from '@/types';

export function useWaypoints() {
  const { activeRoute } = useUser();
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!activeRoute) {
      setWaypoints([]);
      setIsLoading(false);
      return;
    }

    async function fetchWaypoints() {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('waypoints')
          .select('*')
          .eq('route_id', activeRoute.id)
          .order('sort_order');

        if (fetchError) {
          throw fetchError;
        }

        setWaypoints(data || []);
      } catch (err) {
        console.error('Error fetching waypoints:', err);
        setError('Failed to load waypoints');
      }

      setIsLoading(false);
    }

    fetchWaypoints();
  }, [activeRoute, supabase]);

  return { waypoints, isLoading, error };
}
