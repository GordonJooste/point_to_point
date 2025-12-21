'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/contexts/UserContext';
import { ChallengeCompletion } from '@/types';

export function useGallery() {
  const { activeRoute } = useUser();
  const [photos, setPhotos] = useState<ChallengeCompletion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    if (!activeRoute) {
      setPhotos([]);
      setIsLoading(false);
      return;
    }

    async function fetchPhotos() {
      try {
        const { data, error } = await supabase
          .from('challenge_completions')
          .select(`
            *,
            user:users(id, username, avatar_url),
            challenge:challenges(id, title, category)
          `)
          .eq('route_id', activeRoute.id)
          .order('completed_at', { ascending: false });

        if (!error && data) {
          setPhotos(data);
        }
      } catch (err) {
        console.error('Error fetching gallery:', err);
      }
      setIsLoading(false);
    }

    fetchPhotos();

    // Subscribe to new photos
    const channel = supabase
      .channel('gallery-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'challenge_completions',
          filter: `route_id=eq.${activeRoute.id}`,
        },
        () => {
          // Refetch to get the joined data
          fetchPhotos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeRoute, supabase]);

  return { photos, isLoading };
}
