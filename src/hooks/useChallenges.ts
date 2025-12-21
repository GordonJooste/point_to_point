'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/contexts/UserContext';
import { Challenge } from '@/types';

export function useChallenges() {
  const { activeRoute } = useUser();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!activeRoute) {
      setChallenges([]);
      setIsLoading(false);
      return;
    }

    async function fetchChallenges() {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('challenges')
          .select('*')
          .eq('route_id', activeRoute.id)
          .order('sort_order');

        if (fetchError) {
          throw fetchError;
        }

        setChallenges(data || []);
      } catch (err) {
        console.error('Error fetching challenges:', err);
        setError('Failed to load challenges');
      }

      setIsLoading(false);
    }

    fetchChallenges();
  }, [activeRoute, supabase]);

  return { challenges, isLoading, error };
}
