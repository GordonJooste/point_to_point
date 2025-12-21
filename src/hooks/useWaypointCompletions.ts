'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/contexts/UserContext';
import { CompletionResult } from '@/types';
import toast from 'react-hot-toast';

export function useWaypointCompletions() {
  const { user, activeRoute } = useUser();
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  // Load completed waypoints
  useEffect(() => {
    if (!user || !activeRoute) {
      setCompletedIds([]);
      setIsLoading(false);
      return;
    }

    async function loadCompletions() {
      try {
        const { data, error } = await supabase
          .from('waypoint_completions')
          .select('waypoint_id')
          .eq('user_id', user.id)
          .eq('route_id', activeRoute.id);

        if (!error && data) {
          setCompletedIds(data.map((c) => c.waypoint_id));
        }
      } catch (err) {
        console.error('Error loading completions:', err);
      }
      setIsLoading(false);
    }

    loadCompletions();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('waypoint-completions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'waypoint_completions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setCompletedIds((prev) => [...prev, payload.new.waypoint_id]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeRoute, supabase]);

  const completeWaypoint = useCallback(
    async (
      waypointId: string,
      latitude: number,
      longitude: number
    ): Promise<CompletionResult> => {
      if (!user) {
        return { success: false, error: 'Not logged in' };
      }

      try {
        // Call the PostGIS-based completion function
        const { data, error } = await supabase.rpc('complete_waypoint', {
          p_user_id: user.id,
          p_waypoint_id: waypointId,
          p_user_lat: latitude,
          p_user_lng: longitude,
        });

        if (error) {
          console.error('Completion error:', error);
          return { success: false, error: 'Failed to complete waypoint' };
        }

        const result = data as CompletionResult;

        if (result.success) {
          toast.success(`+${result.points_earned} points! ${result.waypoint_name}`);
          setCompletedIds((prev) => [...prev, waypointId]);
        } else {
          if (result.error === 'Too far from waypoint') {
            toast.error(`Too far! You're ${result.distance}m away (need to be within ${result.required}m)`);
          } else {
            toast.error(result.error || 'Failed to complete waypoint');
          }
        }

        return result;
      } catch (err) {
        console.error('Completion error:', err);
        return { success: false, error: 'An unexpected error occurred' };
      }
    },
    [user, supabase]
  );

  return { completedIds, completeWaypoint, isLoading };
}
