'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [showLoading, setShowLoading] = useState(false);

  // Redirect authenticated users to dashboard immediately
  useEffect(() => {
    if (!loading && user) {
      // Use replace instead of push to avoid adding to history
      router.replace('/dashboard');
      // Show loading briefly during redirect
      setShowLoading(true);
    } else if (!loading && !user) {
      // No user and not loading - show page
      setShowLoading(false);
    }
    
    // Safety timeout: never show loading for more than 2 seconds
    const timeout = setTimeout(() => {
      setShowLoading(false);
    }, 2000);
    
    return () => clearTimeout(timeout);
  }, [user, loading, router]);

  // Show loading state ONLY during redirect (user exists) or brief auth check
  if (showLoading && (loading || user)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24 pb-20 md:pb-24 relative z-10">
      <div className="z-10 max-w-5xl w-full items-center justify-between">
        {/* Hero Section with Aviation Theme */}
        <div className="text-center mb-12 md:mb-16">
          <div className="flex justify-center items-center gap-4 mb-6">
            <span className="text-6xl md:text-8xl animate-pulse">✈️</span>
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6">
            <span className="bg-sky-gradient bg-clip-text text-transparent">
              Flight Schedule Pro
            </span>
            <br />
            <span className="text-sky-700">AI Rescheduler</span>
          </h1>
          <p className="text-lg md:text-xl text-sky-600 font-medium mb-2">
            AI-Powered Weather Cancellation & Rescheduling
          </p>
          <p className="text-base md:text-lg text-sky-500">
            For Flight Schools
          </p>
        </div>
        
        {/* Demo Credentials Card */}
        <Card className="mb-8 max-w-2xl mx-auto card-elevated border-cloud-200">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl flex items-center gap-2 text-sky-800">
              <span>🎯</span> Demo Accounts
            </CardTitle>
            <CardDescription className="text-sky-600">
              Use these credentials to explore the system. All accounts use password: <strong className="text-sky-700">DemoPass123!</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <Link 
                href="/login?email=demo.student@flightpro.com&password=DemoPass123!"
                className="p-4 card-sky hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-sky-300 rounded-lg"
              >
                <div className="font-bold text-sky-600 mb-2 flex items-center gap-2">
                  <span>👨‍🎓</span> Student
                </div>
                <div className="text-xs text-sky-700 break-all font-mono">demo.student@flightpro.com</div>
                <div className="text-xs text-sky-500 mt-2 font-medium">DemoPass123!</div>
                <div className="text-xs text-sky-600 mt-2 font-semibold">Click to login →</div>
              </Link>
              <Link 
                href="/login?email=demo.instructor@flightpro.com&password=DemoPass123!"
                className="p-4 card-sky hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-aviation-green-300 rounded-lg"
              >
                <div className="font-bold text-aviation-green-600 mb-2 flex items-center gap-2">
                  <span>👨‍✈️</span> Instructor
                </div>
                <div className="text-xs text-sky-700 break-all font-mono">demo.instructor@flightpro.com</div>
                <div className="text-xs text-sky-500 mt-2 font-medium">DemoPass123!</div>
                <div className="text-xs text-aviation-green-600 mt-2 font-semibold">Click to login →</div>
              </Link>
              <Link 
                href="/login?email=demo.admin@flightpro.com&password=DemoPass123!"
                className="p-4 card-sky hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-sky-400 rounded-lg"
              >
                <div className="font-bold text-sky-700 mb-2 flex items-center gap-2">
                  <span>👔</span> Admin
                </div>
                <div className="text-xs text-sky-700 break-all font-mono">demo.admin@flightpro.com</div>
                <div className="text-xs text-sky-500 mt-2 font-medium">DemoPass123!</div>
                <div className="text-xs text-sky-700 mt-2 font-semibold">Click to login →</div>
              </Link>
            </div>
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800">
                <strong>Note:</strong> If accounts don't exist yet, sign up first, then run: <code className="bg-amber-100 px-2 py-1 rounded font-mono">npx tsx scripts/update-demo-roles.ts</code>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <button className="btn-sky min-h-[44px] w-full sm:w-auto">
                Login
              </button>
            </Link>
            <Link href="/signup">
              <button className="btn-cloud min-h-[44px] w-full sm:w-auto">
                Sign Up
              </button>
            </Link>
            <Link href="/discovery">
              <button className="btn-cloud min-h-[44px] w-full sm:w-auto flex items-center gap-2">
                <span>🛫</span> Book Discovery Flight
              </button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
