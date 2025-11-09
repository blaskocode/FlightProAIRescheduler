'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface NavItem {
  label: string;
  href: string;
  icon: string; // Emoji or icon
  roles?: string[]; // If specified, only show for these roles
}

const allNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: '🏠' },
  { label: 'Flights', href: '/flights', icon: '✈️' },
  { label: 'Profile', href: '/profile', icon: '👤' },
  { label: 'Settings', href: '/admin/settings', icon: '⚙️', roles: ['admin', 'super_admin'] },
];

export function TopNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, authUser, signOut } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Only render after client-side hydration to avoid hydration mismatches
  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter nav items based on user role
  const navItems = allNavItems.filter((item) => {
    if (!item.roles) return true; // Show if no role restriction
    if (!authUser) return false; // Hide if user not loaded
    return item.roles.includes(authUser.role);
  });

  // Don't render on login/signup pages
  if (pathname === '/login' || pathname === '/signup' || pathname === '/') {
    return null;
  }

  // Don't render until mounted to prevent hydration errors
  if (!mounted) {
    return null;
  }

  // Don't render if no user is authenticated (check Firebase user, not database user)
  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm hidden md:block">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <span className="text-xl font-bold text-blue-600 mr-4">FlightPro</span>
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={cn(
                    'flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors',
                    'min-h-[44px] touch-manipulation',
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  )}
                  aria-label={item.label}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-4">
            {authUser && (
              <span className="text-sm text-gray-600 hidden lg:inline">
                {authUser.email}
              </span>
            )}
            <Button
              variant="outline"
              onClick={handleSignOut}
              size="sm"
              className="min-h-[44px]"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

