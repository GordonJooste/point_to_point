'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import BottomNav from '@/components/ui/BottomNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen pb-16">
      {children}
      <BottomNav />
    </div>
  );
}
