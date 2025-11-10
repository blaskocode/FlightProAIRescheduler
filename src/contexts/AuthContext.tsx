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
  // Start with loading=false to prevent UI hang - we'll check auth in background
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // CRITICAL: If Firebase Auth isn't available, we're done immediately
    if (!auth) {
      console.warn('Firebase Auth not available');
      return;
    }

    let isMounted = true;
    let loadingTimeout: NodeJS.Timeout | null = null;
    let callbackFired = false;

    // Set loading to true ONLY when we start checking (brief moment)
    setLoading(true);

    // AGGRESSIVE timeout: Resolve loading after 2 seconds MAX
    loadingTimeout = setTimeout(() => {
      if (isMounted) {
        console.warn('⚠️ Auth check timeout (2s) - resolving loading');
        setLoading(false);
      }
    }, 2000); // 2 second max timeout

    // Try to get current user immediately (synchronous check)
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        // User is already authenticated - set immediately and resolve loading
        setUser(currentUser);
        setLoading(false);
        if (loadingTimeout) {
          clearTimeout(loadingTimeout);
          loadingTimeout = null;
        }
        
        // Fetch role in background (non-blocking)
        fetch(`/api/auth/user-role?uid=${currentUser.uid}`)
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (isMounted && data) {
              setAuthUser(data);
            }
          })
          .catch(() => {});
        
        return () => {
          isMounted = false;
          if (loadingTimeout) clearTimeout(loadingTimeout);
        };
      }
    } catch (e) {
      console.warn('Error checking current user:', e);
      setLoading(false);
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        loadingTimeout = null;
      }
    }

    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (!isMounted) return;
        callbackFired = true;

        setUser(firebaseUser);
        
        // Resolve loading IMMEDIATELY - don't wait for role fetch
        setLoading(false);
        if (loadingTimeout) {
          clearTimeout(loadingTimeout);
          loadingTimeout = null;
        }
        
        if (firebaseUser) {
          // Fetch role in background (non-blocking)
          try {
            const response = await fetch(`/api/auth/user-role?uid=${firebaseUser.uid}`);
            
            if (response.ok) {
              const roleData = await response.json();
              if (isMounted) {
                setAuthUser(roleData);
              }
            } else if (response.status === 404) {
              // User doesn't exist in database - try to sync them (in background)
              console.log('User not found in database, attempting to sync...', firebaseUser.uid);
              
              // Sync in background - don't block UI
              (async () => {
                try {
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

                  let role: 'student' | 'instructor' | 'admin' = 'student';
                  if (firebaseUser.email === 'admin.demo@flightpro.com' || firebaseUser.email?.includes('admin')) {
                    role = 'admin';
                  } else if (firebaseUser.email === 'instructor.demo@flightpro.com' || firebaseUser.email?.includes('instructor')) {
                    role = 'instructor';
                  } else if (firebaseUser.email === 'student.demo@flightpro.com' || firebaseUser.email?.includes('student')) {
                    role = 'student';
                  }

                  const syncResponse = await fetch('/api/auth/sync-user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      uid: firebaseUser.uid,
                      email: firebaseUser.email,
                      role: role,
                      schoolId: role === 'admin' ? undefined : schoolId,
                    }),
                  });

                  if (syncResponse.ok || syncResponse.status === 409) {
                    // Retry fetching user role after sync
                    for (let attempt = 0; attempt < 3; attempt++) {
                      await new Promise(resolve => setTimeout(resolve, 300 * (attempt + 1)));
                      if (!isMounted) break;
                      
                      const retryResponse = await fetch(`/api/auth/user-role?uid=${firebaseUser.uid}`);
                      if (retryResponse.ok) {
                        const roleData = await retryResponse.json();
                        if (isMounted) {
                          setAuthUser(roleData);
                        }
                        break;
                      }
                    }
                  } else if (syncResponse.status === 503) {
                    // Database connection error - retry with exponential backoff
                    const errorData = await syncResponse.json().catch(() => ({ error: 'Database connection error' }));
                    console.error('Database connection error during sync:', errorData);
                    
                    // Retry sync with exponential backoff (up to 3 attempts)
                    for (let retryAttempt = 0; retryAttempt < 3; retryAttempt++) {
                      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryAttempt)));
                      if (!isMounted) break;
                      
                      try {
                        const retrySyncResponse = await fetch('/api/auth/sync-user', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            role: role,
                            schoolId: role === 'admin' ? undefined : schoolId,
                          }),
                        });
                        
                        if (retrySyncResponse.ok || retrySyncResponse.status === 409) {
                          // Sync succeeded, now fetch user role
                          for (let attempt = 0; attempt < 3; attempt++) {
                            await new Promise(resolve => setTimeout(resolve, 300 * (attempt + 1)));
                            if (!isMounted) break;
                            
                            const retryResponse = await fetch(`/api/auth/user-role?uid=${firebaseUser.uid}`);
                            if (retryResponse.ok) {
                              const roleData = await retryResponse.json();
                              if (isMounted) {
                                setAuthUser(roleData);
                              }
                              break;
                            }
                          }
                          break;
                        }
                      } catch (retryError) {
                        console.error(`Retry attempt ${retryAttempt + 1} failed:`, retryError);
                      }
                    }
                  } else {
                    // Log sync error for debugging
                    const errorData = await syncResponse.json().catch(() => ({ error: 'Unknown error' }));
                    console.error('Failed to sync user:', syncResponse.status, errorData);
                  }
                } catch (syncError) {
                  console.error('Error syncing user (non-blocking):', syncError);
                }
              })();
            }
          } catch (error) {
            console.error('Error fetching user role (non-blocking):', error);
          }
        } else {
          if (isMounted) {
            setAuthUser(null);
          }
        }
      },
      (error) => {
        // Error callback - resolve loading immediately
        console.error('Firebase Auth error:', error);
        if (isMounted) {
          setLoading(false);
          if (loadingTimeout) {
            clearTimeout(loadingTimeout);
            loadingTimeout = null;
          }
        }
      }
    );

    // Fallback: If callback doesn't fire within 1.5 seconds, resolve anyway
    setTimeout(() => {
      if (isMounted && !callbackFired) {
        console.warn('⚠️ Auth callback not fired within 1.5s - resolving loading');
        setLoading(false);
        if (loadingTimeout) {
          clearTimeout(loadingTimeout);
          loadingTimeout = null;
        }
      }
    }, 1500);

    return () => {
      isMounted = false;
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
      unsubscribe();
    };
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

