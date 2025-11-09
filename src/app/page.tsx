'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to dashboard immediately
  useEffect(() => {
    if (!loading && user) {
      // Use replace instead of push to avoid adding to history
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  // Show loading state while checking auth OR if user exists (during redirect)
  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24 pb-20 md:pb-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-2xl md:text-4xl font-bold text-center mb-6 md:mb-8">
          Flight Schedule Pro AI Rescheduler
        </h1>
        <p className="text-center text-base md:text-lg text-muted-foreground mb-8">
          AI-Powered Weather Cancellation & Rescheduling System for Flight Schools
        </p>
        
        {/* Demo Credentials Card */}
        <Card className="mb-8 max-w-2xl mx-auto border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">🎯 Demo Accounts</CardTitle>
            <CardDescription>
              Use these credentials to explore the system. All accounts use password: <strong>DemoPass123!</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-white rounded-md border border-gray-200">
                <div className="font-semibold text-blue-600 mb-1">👨‍🎓 Student</div>
                <div className="text-xs text-gray-600 break-all">student.demo@flightpro.com</div>
                <div className="text-xs text-gray-500 mt-1">DemoPass123!</div>
              </div>
              <div className="p-3 bg-white rounded-md border border-gray-200">
                <div className="font-semibold text-green-600 mb-1">👨‍✈️ Instructor</div>
                <div className="text-xs text-gray-600 break-all">instructor.demo@flightpro.com</div>
                <div className="text-xs text-gray-500 mt-1">DemoPass123!</div>
              </div>
              <div className="p-3 bg-white rounded-md border border-gray-200">
                <div className="font-semibold text-purple-600 mb-1">👔 Admin</div>
                <div className="text-xs text-gray-600 break-all">admin.demo@flightpro.com</div>
                <div className="text-xs text-gray-500 mt-1">DemoPass123!</div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-xs text-yellow-800">
                <strong>Note:</strong> If accounts don't exist yet, sign up first, then run: <code className="bg-yellow-100 px-1 rounded">npx tsx scripts/update-demo-roles.ts</code>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="min-h-[44px] w-full sm:w-auto">
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="outline" size="lg" className="min-h-[44px] w-full sm:w-auto">
                Sign Up
              </Button>
            </Link>
            <Link href="/discovery">
              <Button variant="outline" size="lg" className="min-h-[44px] w-full sm:w-auto">
                Book Discovery Flight
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
