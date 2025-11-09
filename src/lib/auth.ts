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
  schoolId?: string;
  firstName?: string;
  lastName?: string;
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
      select: { id: true, email: true, schoolId: true, firstName: true, lastName: true },
    });
    if (student) {
      return {
        uid: firebaseUid,
        email: student.email,
        role: 'student',
        studentId: student.id,
        schoolId: student.schoolId || undefined,
        firstName: student.firstName,
        lastName: student.lastName,
      };
    }

    // Check instructor
    const instructor = await prisma.instructor.findUnique({
      where: { firebaseUid },
      select: { id: true, email: true, schoolId: true, firstName: true, lastName: true },
    });
    if (instructor) {
      return {
        uid: firebaseUid,
        email: instructor.email,
        role: 'instructor',
        instructorId: instructor.id,
        schoolId: instructor.schoolId || undefined,
        firstName: instructor.firstName,
        lastName: instructor.lastName,
      };
    }

    // Check admin
    const admin = await prisma.admin.findUnique({
      where: { firebaseUid },
      select: { id: true, email: true, firstName: true, lastName: true },
    });
    if (admin) {
      return {
        uid: firebaseUid,
        email: admin.email,
        role: 'admin',
        adminId: admin.id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        // Admins don't have schoolId (they're system-level)
      };
    }

    // Debug: Check if user exists with different casing or check all tables
    console.log(`User not found with firebaseUid: ${firebaseUid}`);
    return null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

/**
 * Require authentication - throws error if not authenticated
 * For server-side API routes, pass the request to extract token from headers
 */
export async function requireAuth(request?: any): Promise<AuthUser> {
  // If request is provided (server-side), try to get UID from token
  if (request) {
    const authHeader = request.headers?.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        // Decode token to get UID (simple base64 decode for development)
        // In production, use Firebase Admin SDK to verify token
        const parts = token.split('.');
        if (parts.length === 3) {
          // Firebase JWT uses base64url encoding, need to handle padding
          let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          const padding = base64.length % 4;
          if (padding) {
            base64 += '='.repeat(4 - padding);
          }
          const payload = JSON.parse(Buffer.from(base64, 'base64').toString());
          const uid = payload.user_id || payload.sub || payload.uid;
          console.log('Decoded token UID:', uid);
          if (uid) {
            const authUser = await getUserRole(uid);
            if (authUser) {
              console.log('Found auth user:', authUser.role);
              return authUser;
            } else {
              console.warn('User not found in database for UID:', uid);
            }
          }
        }
      } catch (error) {
        // Token decode failed, fall through to client-side method
        console.warn('Token decode failed:', error);
      }
    }
  }
  
  // Client-side or fallback: use existing method
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

