import { prisma } from '@/lib/prisma';
import { AuthUser } from '@/lib/auth';

/**
 * Get the schoolId for the current user based on their role
 * Returns null for super admins (who can access all schools)
 */
export async function getUserSchoolId(authUser: AuthUser | null): Promise<string | null> {
  if (!authUser) return null;

  if (authUser.role === 'student' && authUser.studentId) {
    const student = await prisma.student.findUnique({
      where: { id: authUser.studentId },
      select: { schoolId: true },
    });
    return student?.schoolId || null;
  }

  if (authUser.role === 'instructor' && authUser.instructorId) {
    const instructor = await prisma.instructor.findUnique({
      where: { id: authUser.instructorId },
      select: { schoolId: true },
    });
    return instructor?.schoolId || null;
  }

  if (authUser.role === 'admin' && authUser.adminId) {
    const admin = await prisma.admin.findUnique({
      where: { id: authUser.adminId },
      select: { schoolId: true, role: true },
    });
    // Super admin (role === 'super_admin' or schoolId === null) can access all schools
    if (admin?.role === 'super_admin' || !admin?.schoolId) {
      return null; // null means all schools
    }
    return admin.schoolId;
  }

  return null;
}

/**
 * Check if user has access to a specific school
 */
export async function canAccessSchool(
  authUser: AuthUser | null,
  schoolId: string
): Promise<boolean> {
  if (!authUser) return false;

  const userSchoolId = await getUserSchoolId(authUser);
  
  // Super admin (null) can access all schools
  if (userSchoolId === null && authUser.role === 'admin') {
    const admin = await prisma.admin.findUnique({
      where: { id: authUser.id },
      select: { role: true },
    });
    if (admin?.role === 'super_admin') {
      return true;
    }
  }

  // User's school must match
  return userSchoolId === schoolId;
}

/**
 * Get school-scoped where clause for Prisma queries
 * Returns undefined if user can access all schools (super admin)
 */
export async function getSchoolScopedWhere(
  authUser: AuthUser | null,
  requestedSchoolId?: string
): Promise<{ schoolId: string } | undefined> {
  if (!authUser) {
    throw new Error('User not authenticated');
  }

  // If specific school requested, check access
  if (requestedSchoolId) {
    const hasAccess = await canAccessSchool(authUser, requestedSchoolId);
    if (!hasAccess) {
      throw new Error('Access denied to this school');
    }
    return { schoolId: requestedSchoolId };
  }

  // Get user's school
  const userSchoolId = await getUserSchoolId(authUser);
  
  // Super admin can access all (return undefined = no filter)
  if (userSchoolId === null && authUser.role === 'admin') {
    const admin = await prisma.admin.findUnique({
      where: { id: authUser.id },
      select: { role: true },
    });
    if (admin?.role === 'super_admin') {
      return undefined; // No filter = all schools
    }
  }

  // Regular user - filter by their school
  if (userSchoolId) {
    return { schoolId: userSchoolId };
  }

  throw new Error('User has no associated school');
}

