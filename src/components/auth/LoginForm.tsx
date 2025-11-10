'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();

  // Auto-populate from URL params (for demo badges)
  useEffect(() => {
    const emailParam = searchParams.get('email');
    const passwordParam = searchParams.get('password');
    if (emailParam) {
      setEmail(emailParam);
    }
    if (passwordParam) {
      setPassword(passwordParam);
    }
  }, [searchParams]);

  // Redirect if already logged in (wait for loading to complete)
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render form if user is logged in (redirect will happen)
  if (user) {
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await signIn(email, password);
      
      // Wait a moment for auth state to update
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Redirect to dashboard
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      // Provide helpful error messages
      let errorMessage = 'Failed to sign in';
      
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address. Please check your email and try again.';
      } else if (err.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled. Please contact support.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8 pb-20 md:pb-12 relative z-10">
      <div className="w-full max-w-md space-y-6 md:space-y-8">
        {/* Hero Section */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <span className="text-5xl md:text-6xl animate-pulse">✈️</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-sky-800 mb-2">
            Welcome Back
          </h2>
          <p className="text-sky-600 font-medium">
            Flight Schedule Pro AI Rescheduler
          </p>
        </div>

        {/* Demo Credentials Card */}
        <Card className="card-elevated border-cloud-200">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl flex items-center gap-2 text-sky-800">
              <span>🎯</span> Demo Accounts
            </CardTitle>
            <CardDescription className="text-sky-600">
              Use these credentials to explore the system. All accounts use password: <strong className="text-sky-700">DemoPass123!</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <button
                type="button"
                onClick={() => {
                  setEmail('demo.student@flightpro.com');
                  setPassword('DemoPass123!');
                }}
                className="p-3 card-sky hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-sky-300 rounded-lg text-left"
              >
                <div className="font-bold text-sky-600 mb-1 flex items-center gap-1">
                  <span>👨‍🎓</span> Student
                </div>
                <div className="text-xs text-sky-700 break-all font-mono">demo.student@flightpro.com</div>
                <div className="text-xs text-sky-500 mt-1 font-medium">DemoPass123!</div>
                <div className="text-xs text-sky-600 mt-1 font-semibold">Click to fill →</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('demo.instructor@flightpro.com');
                  setPassword('DemoPass123!');
                }}
                className="p-3 card-sky hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-aviation-green-300 rounded-lg text-left"
              >
                <div className="font-bold text-aviation-green-600 mb-1 flex items-center gap-1">
                  <span>👨‍✈️</span> Instructor
                </div>
                <div className="text-xs text-sky-700 break-all font-mono">demo.instructor@flightpro.com</div>
                <div className="text-xs text-sky-500 mt-1 font-medium">DemoPass123!</div>
                <div className="text-xs text-aviation-green-600 mt-1 font-semibold">Click to fill →</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('demo.admin@flightpro.com');
                  setPassword('DemoPass123!');
                }}
                className="p-3 card-sky hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-sky-400 rounded-lg text-left"
              >
                <div className="font-bold text-sky-700 mb-1 flex items-center gap-1">
                  <span>👔</span> Admin
                </div>
                <div className="text-xs text-sky-700 break-all font-mono">demo.admin@flightpro.com</div>
                <div className="text-xs text-sky-500 mt-1 font-medium">DemoPass123!</div>
                <div className="text-xs text-sky-700 mt-1 font-semibold">Click to fill →</div>
              </button>
            </div>
            <div className="mt-4 p-3 bg-sky-50 border border-sky-200 rounded-lg">
              <p className="text-xs text-sky-800">
                <strong>First time?</strong> These demo accounts need to be created first. 
                <a href="/signup" className="underline font-medium ml-1 text-sky-600 hover:text-sky-700">Sign up</a> with these credentials, 
                then run <code className="bg-sky-100 px-1 rounded text-xs font-mono">npx tsx scripts/update-demo-roles.ts</code> to set roles.
              </p>
            </div>
          </CardContent>
        </Card>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg bg-aviation-red-50 border border-aviation-red-200 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-xl">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-aviation-red-800">{error}</p>
                  {error.includes('Invalid email or password') && (
                    <p className="mt-2 text-xs text-aviation-red-700">
                      Don't have an account? <a href="/signup" className="underline font-medium">Sign up here</a>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-sky-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="card-sky w-full px-4 py-3 text-sky-900 placeholder:text-sky-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-sky-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="card-sky w-full px-4 py-3 text-sky-900 placeholder:text-sky-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting || !email || !password}
              className="btn-sky w-full disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>🛫</span> Sign in
                </span>
              )}
            </button>
          </div>
          <div className="text-center">
            <p className="text-sm text-sky-600">
              Don't have an account?{' '}
              <a href="/signup" className="font-semibold text-sky-700 hover:text-sky-800 underline">
                Sign up
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

