'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
  const { user, authUser, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

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
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Profile</h1>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm md:text-base text-gray-600">
            Manage your account information
          </p>
        </div>

        <div className="bg-white rounded-lg border shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div>
            <h2 className="text-sm font-medium text-gray-500 mb-1">Email</h2>
            <p className="text-base sm:text-lg text-gray-900">{authUser?.email || user.email}</p>
          </div>

          <div>
            <h2 className="text-sm font-medium text-gray-500 mb-1">Role</h2>
            <p className="text-base sm:text-lg text-gray-900 capitalize">
              {loading || !authUser ? (
                <span className="inline-block w-16 h-4 bg-gray-200 rounded animate-pulse"></span>
              ) : (
                authUser.role
              )}
            </p>
          </div>

          {authUser?.schoolId && (
            <div>
              <h2 className="text-sm font-medium text-gray-500 mb-1">School</h2>
              <p className="text-base sm:text-lg text-gray-900">
                {authUser.schoolId}
              </p>
            </div>
          )}

          <div className="pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="w-full sm:w-auto min-h-[44px]"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

