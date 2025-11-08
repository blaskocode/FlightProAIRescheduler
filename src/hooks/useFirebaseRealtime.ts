'use client';

import { useEffect, useState } from 'react';
import { getDatabase, ref, onValue, off } from 'firebase/database';
import { initializeApp, getApps } from 'firebase/app';

// Initialize Firebase if not already initialized
function getFirebaseApp() {
  if (typeof window === 'undefined') return null;
  
  if (getApps().length === 0) {
    const firebaseConfig = {
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    };
    
    if (!firebaseConfig.databaseURL) {
      console.warn('Firebase Database URL not configured');
      return null;
    }
    
    return initializeApp(firebaseConfig);
  }
  
  return getApps()[0];
}

/**
 * Hook for listening to Firebase Realtime Database updates
 * @param path - Database path to listen to (e.g., 'notifications/user123')
 * @param enabled - Whether the listener should be active
 */
export function useFirebaseRealtime<T = any>(path: string | null, enabled: boolean = true) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !path) {
      setLoading(false);
      return;
    }

    const app = getFirebaseApp();
    if (!app) {
      setLoading(false);
      return;
    }

    const database = getDatabase(app);
    const dbRef = ref(database, path);

    const unsubscribe = onValue(
      dbRef,
      (snapshot) => {
        const value = snapshot.val();
        setData(value);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Firebase Realtime Database error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      off(dbRef);
      unsubscribe();
    };
  }, [path, enabled]);

  return { data, loading, error };
}

/**
 * Hook for listening to notifications in real-time
 */
export function useNotificationsRealtime(userId: string | null) {
  const path = userId ? `notifications/${userId}` : null;
  return useFirebaseRealtime(path, !!userId);
}

