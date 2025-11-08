import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../config/firebase';
import * as SecureStore from 'expo-secure-store';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  userRole: 'student' | 'instructor' | 'admin' | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'student' | 'instructor' | 'admin' | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Fetch user role from API
        try {
          const token = await firebaseUser.getIdToken();
          const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/user-role`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            setUserRole(data.role);
            await SecureStore.setItemAsync('userRole', data.role);
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          // Try to get from secure store
          const storedRole = await SecureStore.getItemAsync('userRole');
          if (storedRole) {
            setUserRole(storedRole as 'student' | 'instructor' | 'admin');
          }
        }
      } else {
        setUserRole(null);
        await SecureStore.deleteItemAsync('userRole');
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    const { createUserWithEmailAndPassword } = await import('firebase/auth');
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    await auth.signOut();
    await SecureStore.deleteItemAsync('userRole');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, userRole }}>
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

