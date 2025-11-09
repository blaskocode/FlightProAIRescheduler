'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { WeatherAlerts } from '@/components/dashboard/WeatherAlerts';
import { WeatherMapDashboard } from '@/components/dashboard/WeatherMapDashboard';
import { StudentList } from '@/components/dashboard/StudentList';
import { SquawkReportCard } from '@/components/dashboard/SquawkReportCard';
import { MetricsDashboard } from '@/components/dashboard/MetricsDashboard';
import { WeatherAnalyticsDashboard } from '@/components/dashboard/WeatherAnalyticsDashboard';
import { SchoolSwitcher } from '@/components/dashboard/SchoolSwitcher';

export default function DashboardPage() {
  const { user, authUser, loading } = useAuth();
  const router = useRouter();
  
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  
  // Get selected school from localStorage for super admins, or default to first school
  useEffect(() => {
    if (typeof window !== 'undefined' && (authUser?.role === 'admin' || authUser?.role === 'super_admin') && !authUser?.schoolId) {
      // Fetch schools list
      fetch('/api/schools')
        .then(res => res.json())
        .then(data => {
          // Get selected school from localStorage, or default to first school
          const stored = localStorage.getItem('selectedSchoolId');
          const defaultSchoolId = stored || data[0]?.id || null;
          if (defaultSchoolId && defaultSchoolId !== selectedSchoolId) {
            setSelectedSchoolId(defaultSchoolId);
            // Store default in localStorage if not already set
            if (!stored && defaultSchoolId) {
              localStorage.setItem('selectedSchoolId', defaultSchoolId);
            }
          }
        })
        .catch(err => console.error('Error fetching schools:', err));
    }
  }, [authUser, selectedSchoolId]);

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
        <div className="mb-4 sm:mb-6 md:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm md:text-base text-gray-600 break-words">
              Welcome, {authUser?.email || user.email}!
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-4">
              <p className="text-xs sm:text-sm text-gray-500">
                Role: {loading || !authUser ? (
                  <span className="inline-block w-16 h-4 bg-gray-200 rounded animate-pulse"></span>
                ) : (
                  <span className="capitalize">{authUser.role}</span>
                )}
              </p>
              {/* Show school switcher for super admins */}
              {(authUser?.role === 'admin' || authUser?.role === 'super_admin') && !authUser?.schoolId && (
                <SchoolSwitcher />
              )}
            </div>
          </div>
        </div>

        {/* Metrics Section - Show to anyone with schoolId or super admins with selected school */}
        {(() => {
          // Get schoolId: from authUser if available, or from selectedSchoolId for super admins
          const metricsSchoolId = authUser?.schoolId || selectedSchoolId || undefined;
          
          return metricsSchoolId ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
              <MetricsDashboard schoolId={metricsSchoolId} />
              <WeatherAnalyticsDashboard schoolId={metricsSchoolId} />
            </div>
          ) : null;
        })()}

        {/* Main Dashboard Content - Overview Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <div className="lg:col-span-2 space-y-3 sm:space-y-4 md:space-y-6 min-w-0">
            {/* Quick Actions Card */}
            <div className="bg-white rounded-lg border shadow-sm p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => router.push('/flights')}
                  className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left min-h-[44px]"
                >
                  <span className="text-2xl">✈️</span>
                  <div>
                    <div className="font-medium">View All Flights</div>
                    <div className="text-sm text-gray-500">Manage your flight schedule</div>
                  </div>
                </button>
                {authUser?.role === 'instructor' && (
                  <div className="flex items-center gap-3 p-4 border rounded-lg bg-gray-50">
                    <span className="text-2xl">👥</span>
                    <div>
                      <div className="font-medium">My Students</div>
                      <div className="text-sm text-gray-500">View student list in sidebar</div>
                    </div>
                  </div>
                )}
                {(authUser?.role === 'instructor' || authUser?.role === 'admin') && (
                  <div className="flex items-center gap-3 p-4 border rounded-lg bg-gray-50">
                    <span className="text-2xl">🔧</span>
                    <div>
                      <div className="font-medium">Report Squawk</div>
                      <div className="text-sm text-gray-500">Use the form in sidebar</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-3 sm:space-y-4 md:space-y-6 min-w-0">
            {authUser?.role === 'instructor' && <StudentList />}
            {(authUser?.role === 'instructor' || authUser?.role === 'admin') && <SquawkReportCard />}
            <WeatherMapDashboard schoolId={authUser?.schoolId || selectedSchoolId || undefined} />
            <WeatherAlerts />
          </div>
        </div>
      </div>
    </div>
  );
}

