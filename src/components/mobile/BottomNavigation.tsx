'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: string; // SVG path or emoji
  roles?: string[]; // If specified, only show for these roles
}

const allNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: '🏠' },
  { label: 'Flights', href: '/flights', icon: '✈️' },
  { label: 'Profile', href: '/profile', icon: '👤' },
  { label: 'Settings', href: '/admin/settings', icon: '⚙️', roles: ['admin', 'super_admin'] },
];

export function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, authUser } = useAuth();
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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-cloud-200 shadow-cloud md:hidden safe-area-bottom">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full min-h-[44px] min-w-[44px]',
                'transition-all duration-200 touch-manipulation',
                isActive
                  ? 'text-sky-600 scale-110'
                  : 'text-sky-400 active:text-sky-600 active:scale-105'
              )}
              aria-label={item.label}
            >
              <span className="text-2xl mb-1">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

