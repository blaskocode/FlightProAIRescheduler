/**
 * Hook to handle authentication guards with timeout protection
 * Prevents infinite loading screens
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface UseAuthGuardOptions {
  redirectTo?: string;
  requireAuth?: boolean;
  maxLoadingTime?: number; // milliseconds
}

export function useAuthGuard(options: UseAuthGuardOptions = {}) {
  const { redirectTo = '/login', requireAuth = true, maxLoadingTime = 3000 } = options;
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // User exists - show page immediately
      setShowLoading(false);
    } else if (!loading) {
      // Loading finished but no user - don't show loading screen
      setShowLoading(false);
      if (requireAuth) {
        // Redirect after a brief delay to allow state to settle
        const timeout = setTimeout(() => {
          router.push(redirectTo);
        }, 100);
        return () => clearTimeout(timeout);
      }
    }
    
    // Safety timeout: never show loading for more than maxLoadingTime
    const timeout = setTimeout(() => {
      setShowLoading(false);
    }, maxLoadingTime);
    
    return () => clearTimeout(timeout);
  }, [user, loading, requireAuth, redirectTo, router, maxLoadingTime]);

  return {
    showLoading: showLoading && loading && !user,
    shouldRedirect: !loading && !user && requireAuth,
    isAuthenticated: !!user,
  };
}

