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
              // Get first school for fallback (for development)
              let schoolId: string | undefined;
              try {
                const schoolResponse = await fetch('/api/schools');
                if (schoolResponse.ok) {
                  const schools = await schoolResponse.json();
                  if (schools && schools.length > 0) {
                    schoolId = schools[0].id;
                  }
                }
              } catch (e) {
                console.warn('Could not fetch schools for sync:', e);
              }

              // Determine role based on email (for demo accounts) or default to student
              let role: 'student' | 'instructor' | 'admin' = 'student';
              if (firebaseUser.email === 'admin.demo@flightpro.com') {
                role = 'admin';
              } else if (firebaseUser.email === 'instructor.demo@flightpro.com') {
                role = 'instructor';
              } else if (firebaseUser.email === 'student.demo@flightpro.com') {
                role = 'student';
              }

              const syncResponse = await fetch('/api/auth/sync-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  role: role,
                  schoolId: role === 'admin' ? undefined : schoolId, // Admin doesn't need schoolId
                }),
              });

              if (syncResponse.ok || syncResponse.status === 409) {
                // 409 is now handled as success in the endpoint, but check anyway
                const syncData = await syncResponse.json();
                console.log('User synced successfully:', syncData);
                
                // Retry fetching user role after sync (with increasing delays to handle DB transaction timing)
                let roleFetched = false;
                for (let attempt = 0; attempt < 5; attempt++) {
                  await new Promise(resolve => setTimeout(resolve, 200 * (attempt + 1))); // 200ms, 400ms, 600ms, 800ms, 1000ms
                  const retryResponse = await fetch(`/api/auth/user-role?uid=${firebaseUser.uid}`);
                  if (retryResponse.ok) {
                    const roleData = await retryResponse.json();
                    setAuthUser(roleData);
                    roleFetched = true;
                    break;
                  }
                }
                
                if (!roleFetched) {
                  console.error('Failed to fetch user role after sync after multiple retries');
                  // Don't set authUser to null - user exists, just retry later
                  setTimeout(async () => {
                    const retryAgain = await fetch(`/api/auth/user-role?uid=${firebaseUser.uid}`);
                    if (retryAgain.ok) {
                      const roleData = await retryAgain.json();
                      setAuthUser(roleData);
                    }
                  }, 2000);
                }
              } else {
                const errorData = await syncResponse.json().catch(() => ({ error: 'Unknown error' }));
                console.error('Failed to sync user:', errorData);
                // Don't set authUser to null - user might have been synced by SignupForm
                // Just retry fetching user role
                setTimeout(async () => {
                  const retryResponse = await fetch(`/api/auth/user-role?uid=${firebaseUser.uid}`);
                  if (retryResponse.ok) {
                    const roleData = await retryResponse.json();
                    setAuthUser(roleData);
                  }
                }, 1000);
              }
            } catch (syncError) {
              console.error('Error syncing user to database:', syncError);
              // Don't set authUser to null - user might have been synced by SignupForm
              // Just retry fetching user role
              setTimeout(async () => {
                const retryResponse = await fetch(`/api/auth/user-role?uid=${firebaseUser.uid}`);
                if (retryResponse.ok) {
                  const roleData = await retryResponse.json();
                  setAuthUser(roleData);
                }
              }, 1000);
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
    try {
      const { signOut: firebaseSignOut } = await import('firebase/auth');
      await firebaseSignOut(auth);
      // State will be updated automatically by onAuthStateChanged listener
      // But we can also clear it immediately for faster UI update
      setUser(null);
      setAuthUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      // Still clear state even if Firebase sign out fails
      setUser(null);
      setAuthUser(null);
    }
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

