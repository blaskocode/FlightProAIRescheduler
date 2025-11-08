'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserRole, AuthUser } from '@/lib/auth';

if (!auth) {
  console.warn('Firebase Auth not initialized. Authentication features will not work.');
}

interface AuthContextType {
  user: User | null;
  authUser: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Fetch user role from API using Firebase UID
          const response = await fetch(`/api/auth/user-role?uid=${firebaseUser.uid}`);
          
          if (response.ok) {
            const roleData = await response.json();
            setAuthUser(roleData);
          } else if (response.status === 404) {
            // User doesn't exist in database - try to sync them
            console.log('User not found in database, attempting to sync...', firebaseUser.uid);
            try {
              const syncResponse = await fetch('/api/auth/sync-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  role: 'student', // Default to student
                }),
              });

              if (syncResponse.ok) {
                const syncData = await syncResponse.json();
                console.log('User synced successfully:', syncData);
                
                // Retry fetching user role after sync (with a small delay to ensure DB is updated)
                await new Promise(resolve => setTimeout(resolve, 100));
                const retryResponse = await fetch(`/api/auth/user-role?uid=${firebaseUser.uid}`);
                if (retryResponse.ok) {
                  const roleData = await retryResponse.json();
                  setAuthUser(roleData);
                } else {
                  console.error('Failed to fetch user role after sync:', await retryResponse.text());
                  setAuthUser(null);
                }
              } else {
                const errorData = await syncResponse.json().catch(() => ({ error: 'Unknown error' }));
                console.error('Failed to sync user:', errorData);
                setAuthUser(null);
              }
            } catch (syncError) {
              console.error('Error syncing user to database:', syncError);
              setAuthUser(null);
            }
          } else {
            console.error('Unexpected error fetching user role:', response.status, await response.text().catch(() => ''));
            setAuthUser(null);
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          setAuthUser(null);
        }
      } else {
        setAuthUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    if (!auth) return;
    const { signOut: firebaseSignOut } = await import('firebase/auth');
    await firebaseSignOut(auth);
    setUser(null);
    setAuthUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, authUser, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

