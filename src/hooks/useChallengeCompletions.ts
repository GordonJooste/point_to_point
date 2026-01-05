'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/contexts/UserContext';
import { CompletionResult } from '@/types';
import toast from 'react-hot-toast';

export function useChallengeCompletions() {
  const { user, activeRoute } = useUser();
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  // Load completed challenges
  useEffect(() => {
    if (!user || !activeRoute) {
      setCompletedIds([]);
      setIsLoading(false);
      return;
    }

    async function loadCompletions() {
      if (!user || !activeRoute) return;

      try {
        const { data, error } = await supabase
          .from('challenge_completions')
          .select('challenge_id')
          .eq('user_id', user.id)
          .eq('route_id', activeRoute.id);

        if (!error && data) {
          setCompletedIds(data.map((c) => c.challenge_id));
        }
      } catch (err) {
        console.error('Error loading challenge completions:', err);
      }
      setIsLoading(false);
    }

    loadCompletions();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('challenge-completions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'challenge_completions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setCompletedIds((prev) => [...prev, payload.new.challenge_id]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeRoute, supabase]);

  const completeChallenge = useCallback(
    async (challengeId: string, photoUrl: string): Promise<CompletionResult> => {
      if (!user) {
        return { success: false, error: 'Not logged in' };
      }

      try {
        // Call the completion function
        const { data, error } = await supabase.rpc('complete_challenge', {
          p_user_id: user.id,
          p_challenge_id: challengeId,
          p_photo_url: photoUrl,
        });

        if (error) {
          console.error('Completion error:', error);
          return { success: false, error: 'Failed to complete challenge' };
        }

        const result = data as CompletionResult;

        if (result.success) {
          toast.success(`+${result.points_earned} points! ${result.challenge_title}`);
          setCompletedIds((prev) => [...prev, challengeId]);
        } else {
          toast.error(result.error || 'Failed to complete challenge');
        }

        return result;
      } catch (err) {
        console.error('Completion error:', err);
        return { success: false, error: 'An unexpected error occurred' };
      }
    },
    [user, supabase]
  );

  return { completedIds, completeChallenge, isLoading };
}
