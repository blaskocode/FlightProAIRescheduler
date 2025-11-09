'use client';

import { useOfflineDetection } from '@/hooks/useOfflineDetection';
import { offlineQueue } from '@/lib/offline/offline-queue';
import { WifiOff, Wifi, Loader2 } from 'lucide-react';

export function OfflineBanner() {
  const { isOnline, wasOffline, syncing, syncResults } = useOfflineDetection();
  const queueSize = offlineQueue?.size() || 0;

  if (isOnline && !wasOffline && !syncing && !syncResults && queueSize === 0) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 text-center text-sm font-medium transition-transform duration-300 ${
        isOnline
          ? syncResults
            ? syncResults.failed > 0
              ? 'bg-yellow-500 text-white transform translate-y-0'
              : 'bg-green-500 text-white transform translate-y-0'
            : syncing
            ? 'bg-blue-500 text-white transform translate-y-0'
            : 'bg-green-500 text-white transform translate-y-0'
          : 'bg-red-500 text-white transform translate-y-0'
      }`}
    >
      <div className="flex items-center justify-center space-x-2">
        {isOnline ? (
          syncing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Syncing {queueSize} queued actions...</span>
            </>
          ) : syncResults ? (
            <>
              <Wifi className="h-4 w-4" />
              <span>
                Synced {syncResults.succeeded} actions
                {syncResults.failed > 0 && `, ${syncResults.failed} failed`}
              </span>
            </>
          ) : (
            <>
              <Wifi className="h-4 w-4" />
              <span>Connection restored</span>
            </>
          )
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span>
              You're offline. {queueSize > 0 && `${queueSize} action${queueSize > 1 ? 's' : ''} queued.`}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

