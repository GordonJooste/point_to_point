'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, Route } from '@/types';

interface UserContextType {
  user: User | null;
  activeRoute: Route | null;
  isLoading: boolean;
  login: (username: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [activeRoute, setActiveRoute] = useState<Route | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem('ptp_user_id');
    if (storedUserId) {
      loadUser(storedUserId);
    } else {
      setIsLoading(false);
    }
    loadActiveRoute();
  }, []);

  async function loadUser(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (data && !error) {
        setUser(data);
      } else {
        // User not found, clear localStorage
        localStorage.removeItem('ptp_user_id');
      }
    } catch (err) {
      console.error('Error loading user:', err);
      localStorage.removeItem('ptp_user_id');
    }
    setIsLoading(false);
  }

  async function loadActiveRoute() {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .eq('is_active', true)
        .single();

      if (data && !error) {
        setActiveRoute(data);
      }
    } catch (err) {
      console.error('Error loading active route:', err);
    }
  }

  const login = useCallback(async (username: string): Promise<{ success: boolean; error?: string }> => {
    const trimmed = username.trim().toLowerCase();

    if (!trimmed) {
      return { success: false, error: 'Username is required' };
    }

    if (trimmed.length < 3) {
      return { success: false, error: 'Username must be at least 3 characters' };
    }

    if (!/^[a-z0-9_]+$/.test(trimmed)) {
      return { success: false, error: 'Username can only contain letters, numbers, and underscores' };
    }

    try {
      // Check if username exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('username', trimmed)
        .single();

      let currentUser: User;

      if (existingUser) {
        // Login existing user
        currentUser = existingUser;
      } else {
        // Register new user
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({ username: trimmed })
          .select()
          .single();

        if (insertError) {
          if (insertError.code === '23505') {
            return { success: false, error: 'Username already taken' };
          }
          return { success: false, error: 'Failed to register. Please try again.' };
        }

        currentUser = newUser;
      }

      // Save to state and localStorage
      setUser(currentUser);
      localStorage.setItem('ptp_user_id', currentUser.id);

      // Ensure user is a participant in the active route
      if (activeRoute) {
        await supabase.from('route_participants').upsert(
          {
            user_id: currentUser.id,
            route_id: activeRoute.id,
          },
          { onConflict: 'user_id,route_id' }
        );
      }

      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, [activeRoute, supabase]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('ptp_user_id');
  }, []);

  return (
    <UserContext.Provider value={{ user, activeRoute, isLoading, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
