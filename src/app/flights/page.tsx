'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { FlightList } from '@/components/dashboard/FlightList';

export default function FlightsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
      <div className="mx-auto max-w-7xl w-full">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Flights</h1>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm md:text-base text-gray-600">
            View and manage your upcoming flights
          </p>
        </div>
        <FlightList />
      </div>
    </div>
  );
}

