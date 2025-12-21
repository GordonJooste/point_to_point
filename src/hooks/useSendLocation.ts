'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

const SEND_INTERVAL = 15000; // 15 seconds

interface SendLocationOptions {
  userId: string | undefined;
  latitude: number | null;
  longitude: number | null;
  heading: number | null;
  speed: number | null;
  isTracking: boolean;
}

export function useSendLocation({
  userId,
  latitude,
  longitude,
  heading,
  speed,
  isTracking,
}: SendLocationOptions) {
  const supabase = createClient();
  const lastSentRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const sendLocation = useCallback(async () => {
    if (!userId || latitude === null || longitude === null) return;

    const now = Date.now();
    // Throttle: only send if 15 seconds have passed
    if (now - lastSentRef.current < SEND_INTERVAL) return;

    try {
      const { error } = await supabase.rpc('update_live_location', {
        p_user_id: userId,
        p_lat: latitude,
        p_lng: longitude,
        p_heading: heading,
        p_speed: speed,
      });

      if (error) {
        console.error('Error sending location:', error);
      } else {
        lastSentRef.current = now;
      }
    } catch (err) {
      console.error('Error in sendLocation:', err);
    }
  }, [userId, latitude, longitude, heading, speed, supabase]);

  // Send location when tracking is active
  useEffect(() => {
    if (!isTracking || !userId || latitude === null || longitude === null) {
      // Clear interval if not tracking
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Send immediately on start
    sendLocation();

    // Set up interval to send periodically
    intervalRef.current = setInterval(sendLocation, SEND_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isTracking, userId, latitude, longitude, sendLocation]);

  return { sendLocation };
}
