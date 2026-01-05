'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LiveLocation } from '@/types';

const FETCH_INTERVAL = 20000; // 20 seconds

export function useLiveLocations(currentUserId: string | undefined) {
  const [locations, setLocations] = useState<LiveLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLocations = useCallback(async () => {
    if (!currentUserId) return;

    try {
      const { data, error } = await supabase
        .from('live_locations')
        .select(`
          user_id,
          latitude,
          longitude,
          heading,
          speed,
          updated_at,
          users:user_id (
            id,
            username
          )
        `)
        .neq('user_id', currentUserId)
        // Only show locations updated in the last 2 hours
        .gte('updated_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString());

      if (error) {
        console.error('Error fetching live locations:', error);
        return;
      }

      if (data) {
        const formattedLocations: LiveLocation[] = data.map((loc: any) => ({
          user_id: loc.user_id,
          latitude: loc.latitude,
          longitude: loc.longitude,
          heading: loc.heading,
          speed: loc.speed,
          updated_at: loc.updated_at,
          user: loc.users ? {
            id: loc.users.id,
            username: loc.users.username,
          } : undefined,
        }));
        setLocations(formattedLocations);
      }
    } catch (err) {
      console.error('Error in fetchLocations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, supabase]);

  // Initial fetch and interval setup
  useEffect(() => {
    if (!currentUserId) {
      setIsLoading(false);
      return;
    }

    // Initial fetch
    fetchLocations();

    // Set up polling interval
    intervalRef.current = setInterval(fetchLocations, FETCH_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentUserId, fetchLocations]);

  return {
    locations,
    isLoading,
    refetch: fetchLocations,
  };
}
