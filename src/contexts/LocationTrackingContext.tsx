'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useSendLocation } from '@/hooks/useSendLocation';
import { useVisibility } from '@/hooks/useVisibility';
import { useUser } from '@/contexts/UserContext';
import { GeolocationState } from '@/types';

interface LocationTrackingContextType extends GeolocationState {}

const LocationTrackingContext = createContext<LocationTrackingContextType | undefined>(undefined);

export function LocationTrackingProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const isVisible = useVisibility();

  const {
    latitude,
    longitude,
    accuracy,
    heading,
    speed,
    error,
    isTracking,
    startTracking,
    stopTracking,
  } = useGeolocation();

  // Send location to database only when tracking AND tab is visible
  useSendLocation({
    userId: user?.id,
    latitude,
    longitude,
    heading,
    speed,
    isTracking: isTracking && isVisible,
  });

  // Start/stop tracking based on user auth and tab visibility
  useEffect(() => {
    if (user && isVisible) {
      startTracking();
    } else {
      stopTracking();
    }
  }, [user, isVisible, startTracking, stopTracking]);

  const value: LocationTrackingContextType = {
    latitude,
    longitude,
    accuracy,
    heading,
    speed,
    error,
    isTracking,
  };

  return (
    <LocationTrackingContext.Provider value={value}>
      {children}
    </LocationTrackingContext.Provider>
  );
}

export function useLocationTracking() {
  const context = useContext(LocationTrackingContext);
  if (context === undefined) {
    throw new Error('useLocationTracking must be used within a LocationTrackingProvider');
  }
  return context;
}
