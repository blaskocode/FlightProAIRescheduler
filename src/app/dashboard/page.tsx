'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { FlightList } from '@/components/dashboard/FlightList';
import { WeatherAlerts } from '@/components/dashboard/WeatherAlerts';

export default function DashboardPage() {
  const { user, authUser, loading } = useAuth();
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 pb-20 md:pb-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm md:text-base text-gray-600">
            Welcome, {authUser?.email || user.email}!
          </p>
          <p className="mt-1 text-xs md:text-sm text-gray-500">
            Role: {authUser?.role || 'Unknown'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-2">
            <FlightList />
          </div>
          <div>
            <WeatherAlerts />
          </div>
        </div>
      </div>
    </div>
  );
}

