'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signUp } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';

interface School {
  id: string;
  name: string;
  airportCode: string;
  address?: string;
}

export function SignupForm() {
  // ALL HOOKS MUST BE CALLED FIRST - before any conditional returns
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [schools, setSchools] = useState<School[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const router = useRouter();
  const { user, loading } = useAuth();

  // Redirect if already logged in (wait for loading to complete)
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Fetch schools on mount
  useEffect(() => {
    async function fetchSchools() {
      try {
        const response = await fetch('/api/schools');
        if (response.ok) {
          const data = await response.json();
          setSchools(data);
          if (data.length > 0) {
            setSchoolId(data[0].id); // Default to first school
          }
        }
      } catch (err) {
        console.error('Error fetching schools:', err);
      } finally {
        setLoadingSchools(false);
      }
    }
    fetchSchools();
  }, []);

  // NOW we can do conditional returns - all hooks have been called
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

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Determine role based on email (for demo accounts) or default to student
    let role: 'student' | 'instructor' | 'admin' = 'student';
    if (email === 'admin.demo@flightpro.com') {
      role = 'admin';
    } else if (email === 'instructor.demo@flightpro.com') {
      role = 'instructor';
    } else if (email === 'student.demo@flightpro.com') {
      role = 'student';
    }

    // Admin doesn't need a school, but students and instructors do
    if (role !== 'admin' && !schoolId) {
      setError('Please select a flight school');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create Firebase user
      const userCredential = await signUp(email, password);
      const firebaseUser = userCredential.user;

      // Sync user to database
      try {
        const syncResponse = await fetch('/api/auth/sync-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: role, // Use the role determined above
            schoolId: role === 'admin' ? undefined : schoolId, // Admin doesn't need schoolId
          }),
        });

        if (!syncResponse.ok && syncResponse.status !== 409) {
          // 409 is now handled as success (user already exists)
          const syncError = await syncResponse.json();
          console.error('Error syncing user to database:', syncError);
          // Show error but don't fail signup - user can be synced later
          setError('Account created but database sync failed. Please contact support.');
          setIsSubmitting(false);
          return;
        }

        // Wait for user role to be available in database (with increasing delays)
        let retries = 0;
        let roleAvailable = false;
        while (retries < 8 && !roleAvailable) {
          // Increasing delay: 300ms, 500ms, 700ms, 900ms, etc.
          await new Promise(resolve => setTimeout(resolve, 300 + (retries * 200)));
          const roleResponse = await fetch(`/api/auth/user-role?uid=${firebaseUser.uid}`);
          if (roleResponse.ok) {
            roleAvailable = true;
            break;
          }
          retries++;
        }

        if (!roleAvailable) {
          console.warn('User role not available after sync, but proceeding anyway. AuthContext will retry.');
        }
      } catch (syncErr) {
        console.error('Error calling sync-user endpoint:', syncErr);
        // Don't fail signup - AuthContext will retry syncing
        console.log('Proceeding with signup - AuthContext will handle sync');
      }

      // Wait a moment for auth state to update, then redirect
      // The auth context will handle the redirect automatically via useEffect
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Force redirect if auth state hasn't updated yet
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      // Provide helpful error messages
      let errorMessage = 'Failed to create account';
      
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please sign in instead.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address. Please check your email and try again.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password (at least 6 characters).';
      } else if (err.code === 'auth/operation-not-allowed') {
        errorMessage = 'Account creation is currently disabled. Please contact support.';
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
            <span className="text-5xl md:text-6xl">✈️</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-sky-800 mb-2">
            Join FlightPro
          </h2>
          <p className="text-sky-600 font-medium">
            Create your account to get started
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg bg-aviation-red-50 border border-aviation-red-200 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-xl">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-aviation-red-800">{error}</p>
                  {error.includes('already registered') && (
                    <p className="mt-2 text-xs text-aviation-red-700">
                      Already have an account? <a href="/login" className="underline font-medium">Sign in here</a>
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
                autoComplete="new-password"
                required
                className="card-sky w-full px-4 py-3 text-sky-900 placeholder:text-sky-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-sky-700 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="card-sky w-full px-4 py-3 text-sky-900 placeholder:text-sky-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="school" className="block text-sm font-medium text-sky-700 mb-2">
                Flight School
              </label>
              {loadingSchools ? (
                <div className="card-sky w-full px-4 py-3 text-sky-500 sm:text-sm">
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading schools...
                  </span>
                </div>
              ) : (
                <select
                  id="school"
                  name="school"
                  required
                  className="card-sky w-full px-4 py-3 text-sky-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                  value={schoolId}
                  onChange={(e) => setSchoolId(e.target.value)}
                >
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name} ({school.airportCode})
                      {school.address ? ` - ${school.address}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting || !email || !password || !confirmPassword || !schoolId}
              className="btn-sky w-full disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>✈️</span> Create Account
                </span>
              )}
            </button>
          </div>
          <div className="text-center">
            <p className="text-sm text-sky-600">
              Already have an account?{' '}
              <a href="/login" className="font-semibold text-sky-700 hover:text-sky-800 underline">
                Sign in
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}


