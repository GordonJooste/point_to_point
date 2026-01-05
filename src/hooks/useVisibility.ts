'use client';

import { useState, useEffect } from 'react';

export function useVisibility() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Set initial state based on current visibility
    setIsVisible(document.visibilityState === 'visible');

    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}
