import { User, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, Auth } from 'firebase/auth';
import { auth } from './firebase';
import { prisma } from './prisma';

function getAuthInstance(): Auth {
  if (!auth) {
    throw new Error('Firebase Auth not initialized. Please configure Firebase environment variables.');
  }
  return auth;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  role?: 'student' | 'instructor' | 'admin';
  studentId?: string;
  instructorId?: string;
  adminId?: string;
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
  if (!auth) return null;
  const authInstance = getAuthInstance();
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(getAuthInstance(), email, password);
}

/**
 * Sign up with email and password
 */
export async function signUp(email: string, password: string) {
  return createUserWithEmailAndPassword(getAuthInstance(), email, password);
}

/**
 * Sign out current user
 */
export async function signOut() {
  if (!auth) return;
  return firebaseSignOut(auth);
}

/**
 * Get user role from database based on Firebase UID
 */
export async function getUserRole(firebaseUid: string): Promise<AuthUser | null> {
  try {
    // Check student
    const student = await prisma.student.findUnique({
      where: { firebaseUid },
      select: { id: true, email: true },
    });
    if (student) {
      return {
        uid: firebaseUid,
        email: student.email,
        role: 'student',
        studentId: student.id,
      };
    }

    // Check instructor
    const instructor = await prisma.instructor.findUnique({
      where: { firebaseUid },
      select: { id: true, email: true },
    });
    if (instructor) {
      return {
        uid: firebaseUid,
        email: instructor.email,
        role: 'instructor',
        instructorId: instructor.id,
      };
    }

    // Check admin
    const admin = await prisma.admin.findUnique({
      where: { firebaseUid },
      select: { id: true, email: true },
    });
    if (admin) {
      return {
        uid: firebaseUid,
        email: admin.email,
        role: 'admin',
        adminId: admin.id,
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required');
  }

  const authUser = await getUserRole(user.uid);
  if (!authUser) {
    throw new Error('User not found in database');
  }

  return authUser;
}

