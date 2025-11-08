'use client';

import { useOfflineDetection } from '@/hooks/useOfflineDetection';
import { WifiOff, Wifi } from 'lucide-react';

export function OfflineBanner() {
  const { isOnline, wasOffline } = useOfflineDetection();

  if (isOnline && !wasOffline) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 text-center text-sm font-medium transition-transform duration-300 ${
        isOnline
          ? 'bg-green-500 text-white transform translate-y-0'
          : 'bg-red-500 text-white transform translate-y-0'
      }`}
    >
      <div className="flex items-center justify-center space-x-2">
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4" />
            <span>Connection restored</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span>You're offline. Some features may be unavailable.</span>
          </>
        )}
      </div>
    </div>
  );
}

