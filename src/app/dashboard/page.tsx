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
    // Only redirect if we're sure there's no user (after loading completes)
    // Give it a brief moment for auth to initialize
    const timeout = setTimeout(() => {
      if (!loading && !user) {
        router.push('/login');
      }
    }, 100); // Small delay to allow auth to initialize

    return () => clearTimeout(timeout);
  }, [user, loading, router]);

  // Show loading ONLY if we're actively loading AND have no user yet
  // If user exists but authUser is still loading, show the page anyway
  // Add safety timeout to prevent infinite loading
  const [showLoading, setShowLoading] = useState(true);
  
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

  const metricsSchoolId = authUser?.schoolId || selectedSchoolId || undefined;

  // Get display name: firstName + lastName, or fallback to email
  const getDisplayName = () => {
    if (authUser?.firstName && authUser?.lastName) {
      return `${authUser.firstName} ${authUser.lastName}`;
    }
    if (authUser?.firstName) {
      return authUser.firstName;
    }
    return authUser?.email || user?.email || 'User';
  };

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-6 lg:p-8 pb-20 md:pb-8 relative z-10">
      <div className="mx-auto max-w-7xl w-full space-y-4 sm:space-y-6">
        {/* Compact Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-sky-900 flex items-center gap-2">
              <span className="text-3xl">✈️</span>
              Dashboard
            </h1>
            <p className="text-sm sm:text-base text-sky-600 mt-1">
              Welcome back, {getDisplayName()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs sm:text-sm text-sky-600 bg-sky-50 px-3 py-1.5 rounded-full border border-sky-200">
              <span className="capitalize font-semibold text-sky-700">{authUser?.role || 'user'}</span>
            </span>
            {(authUser?.role === 'admin' || authUser?.role === 'super_admin') && !authUser?.schoolId && (
              <SchoolSwitcher />
            )}
          </div>
        </div>

        {/* Quick Actions - Prominent at Top */}
        <div className="card-elevated p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-sky-800 mb-4 flex items-center gap-2">
            <span>⚡</span> Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            <button
              onClick={() => router.push('/flights')}
              className="group flex flex-col items-center justify-center gap-2 p-4 sm:p-5 card-sky hover:shadow-xl hover:scale-[1.02] transition-all duration-200 text-center min-h-[100px]"
            >
              <span className="text-3xl sm:text-4xl group-hover:scale-110 transition-transform duration-200">✈️</span>
              <div className="font-semibold text-sm sm:text-base text-sky-800 group-hover:text-sky-900">View Flights</div>
              <div className="text-xs text-sky-600 hidden sm:block">Manage schedule</div>
            </button>
            {authUser?.role === 'instructor' && (
              <button
                onClick={() => {
                  const studentSection = document.getElementById('students-section');
                  studentSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="group flex flex-col items-center justify-center gap-2 p-4 sm:p-5 card-sky hover:shadow-xl hover:scale-[1.02] transition-all duration-200 text-center min-h-[100px]"
              >
                <span className="text-3xl sm:text-4xl group-hover:scale-110 transition-transform duration-200">👥</span>
                <div className="font-semibold text-sm sm:text-base text-sky-800 group-hover:text-sky-900">My Students</div>
                <div className="text-xs text-sky-600 hidden sm:block">View students</div>
              </button>
            )}
            {(authUser?.role === 'instructor' || authUser?.role === 'admin') && (
              <button
                onClick={() => {
                  const squawkSection = document.getElementById('squawk-section');
                  squawkSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="group flex flex-col items-center justify-center gap-2 p-4 sm:p-5 card-sky hover:shadow-xl hover:scale-[1.02] transition-all duration-200 text-center min-h-[100px]"
              >
                <span className="text-3xl sm:text-4xl group-hover:scale-110 transition-transform duration-200">🔧</span>
                <div className="font-semibold text-sm sm:text-base text-sky-800 group-hover:text-sky-900">Report Squawk</div>
                <div className="text-xs text-sky-600 hidden sm:block">Aircraft issues</div>
              </button>
            )}
            {metricsSchoolId && (
              <button
                onClick={() => {
                  const metricsSection = document.getElementById('metrics-section');
                  metricsSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="group flex flex-col items-center justify-center gap-2 p-4 sm:p-5 card-sky hover:shadow-xl hover:scale-[1.02] transition-all duration-200 text-center min-h-[100px]"
              >
                <span className="text-3xl sm:text-4xl group-hover:scale-110 transition-transform duration-200">📊</span>
                <div className="font-semibold text-sm sm:text-base text-sky-800 group-hover:text-sky-900">View Metrics</div>
                <div className="text-xs text-sky-600 hidden sm:block">Analytics</div>
              </button>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Primary Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 min-w-0">
            {/* Weather Alerts - High Priority */}
            <WeatherAlerts />

            {/* Metrics Section */}
            {metricsSchoolId && (
              <div id="metrics-section" className="space-y-4 sm:space-y-6">
                <MetricsDashboard schoolId={metricsSchoolId} />
                <WeatherAnalyticsDashboard schoolId={metricsSchoolId} />
              </div>
            )}

            {/* Weather Map */}
            <WeatherMapDashboard schoolId={metricsSchoolId} />
          </div>

          {/* Right Column - Secondary Widgets */}
          <div className="space-y-4 sm:space-y-6 min-w-0">
            {authUser?.role === 'instructor' && (
              <div id="students-section">
                <StudentList />
              </div>
            )}
            {(authUser?.role === 'instructor' || authUser?.role === 'admin') && (
              <div id="squawk-section">
                <SquawkReportCard />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

