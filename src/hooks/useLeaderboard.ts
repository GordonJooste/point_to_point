'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/contexts/UserContext';
import { LeaderboardEntry } from '@/types';

export function useLeaderboard() {
  const { activeRoute } = useUser();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    if (!activeRoute) {
      setEntries([]);
      setIsLoading(false);
      return;
    }

    // Initial fetch
    fetchLeaderboard();

    // Subscribe to score changes
    const channel = supabase
      .channel('leaderboard-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'route_participants',
          filter: `route_id=eq.${activeRoute.id}`,
        },
        () => {
          // Refetch on any score update
          fetchLeaderboard();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'route_participants',
          filter: `route_id=eq.${activeRoute.id}`,
        },
        () => {
          // Refetch when new participant joins
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeRoute]);

  async function fetchLeaderboard() {
    if (!activeRoute) return;

    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('route_id', activeRoute.id)
        .order('rank');

      if (!error && data) {
        setEntries(data);
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    }
    setIsLoading(false);
  }

  return { entries, isLoading, refetch: fetchLeaderboard };
}
