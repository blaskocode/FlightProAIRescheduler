'use client';

import { useState, useEffect } from 'react';
import { offlineQueue } from '@/lib/offline/offline-queue';

export function useOfflineDetection() {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<{ succeeded: number; failed: number } | null>(null);

  useEffect(() => {
    // Check initial state
    setIsOnline(navigator.onLine);

    const handleOnline = async () => {
      setIsOnline(true);
      if (wasOffline && offlineQueue) {
        // Show reconnection message
        console.log('Connection restored');
        
        // Process queued actions
        if (offlineQueue.size() > 0) {
          setSyncing(true);
          try {
            const results = await offlineQueue.processQueue();
            setSyncResults(results);
            console.log(`Synced ${results.succeeded} actions, ${results.failed} failed`);
            
            // Clear results after 5 seconds
            setTimeout(() => {
              setSyncResults(null);
            }, 5000);
          } catch (err) {
            console.error('Error syncing offline queue:', err);
          } finally {
            setSyncing(false);
          }
        }
        
        setWasOffline(false);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      console.log('Connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  return { isOnline, wasOffline, syncing, syncResults };
}

