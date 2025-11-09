'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FlightList } from '@/components/dashboard/FlightList';

export default function FlightsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    // Only redirect if we're sure there's no user (after loading completes)
    const timeout = setTimeout(() => {
      if (!loading && !user) {
        router.push('/login');
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      // User exists - show page immediately
      setShowLoading(false);
    } else if (!loading) {
      // Loading finished but no user - don't show loading screen
      setShowLoading(false);
    }
    
    // Safety timeout: never show loading for more than 3 seconds
    const timeout = setTimeout(() => {
      setShowLoading(false);
    }, 3000);
    
    return () => clearTimeout(timeout);
  }, [user, loading]);

  // Show loading ONLY if we're actively loading AND have no user yet
  if (showLoading && loading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // If no user after loading, show nothing (redirect will happen)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-6 lg:p-8 pb-20 md:pb-8 relative z-10">
      <div className="mx-auto max-w-7xl w-full">
        {/* Hero Header */}
        <div className="mb-6 sm:mb-8">
          <div className="card-sky-featured p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 opacity-5">
              <div className="text-8xl transform rotate-12">🛫</div>
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl sm:text-4xl">✈️</span>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                  Flights
                </h1>
              </div>
              <p className="text-sky-100 text-sm sm:text-base">
                View and manage your upcoming flights
              </p>
            </div>
          </div>
        </div>
        <FlightList />
      </div>
    </div>
  );
}

