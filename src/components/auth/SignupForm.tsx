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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8 sm:px-6 lg:px-8 pb-20 md:pb-12">
      <div className="w-full max-w-md space-y-6 md:space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Flight Schedule Pro AI Rescheduler
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                  {error.includes('already registered') && (
                    <p className="mt-2 text-xs text-red-700">
                      Already have an account? <a href="/login" className="underline font-medium">Sign in here</a>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="-space-y-px rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full rounded-t-md border-0 px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="relative block w-full border-0 px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="relative block w-full border-0 px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="school" className="sr-only">
                Flight School
              </label>
              {loadingSchools ? (
                <div className="relative block w-full rounded-b-md border-0 px-3 py-2 text-gray-500 ring-1 ring-inset ring-gray-300 sm:text-sm sm:leading-6">
                  Loading schools...
                </div>
              ) : (
                <select
                  id="school"
                  name="school"
                  required
                  className="relative block w-full rounded-b-md border-0 px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
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
              className="group relative flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Sign up'
              )}
            </button>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <a href="/login" className="font-medium text-primary-600 hover:text-primary-500">
                Sign in
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}


