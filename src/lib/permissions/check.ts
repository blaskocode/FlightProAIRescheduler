import { AuthUser } from '@/lib/auth';
import { Permission, ROLE_PERMISSIONS, isGrantedByAdminFull } from './types';
import { prisma } from '@/lib/prisma';

/**
 * Get all permissions for a user
 * Includes role-based permissions and any custom permissions from database
 */
export async function getUserPermissions(authUser: AuthUser | null): Promise<Permission[]> {
  if (!authUser) {
    return [];
  }

  // Get base permissions from role
  const rolePermissions = ROLE_PERMISSIONS[authUser.role as keyof typeof ROLE_PERMISSIONS] || [];

  // Check for custom permissions in database (if we add a UserPermission table later)
  // For now, we'll use role-based permissions only

  // Expand admin.full permissions
  const expandedPermissions = new Set<Permission>();
  
  for (const perm of rolePermissions) {
    if (perm === 'admin.full') {
      // Add all permissions that admin.full grants
      Object.values(ROLE_PERMISSIONS.super_admin).forEach((p) => {
        if (isGrantedByAdminFull(p)) {
          expandedPermissions.add(p);
        }
      });
    } else {
      expandedPermissions.add(perm);
    }
  }

  return Array.from(expandedPermissions);
}

/**
 * Check if user has a specific permission
 */
export async function hasPermission(
  authUser: AuthUser | null,
  permission: Permission
): Promise<boolean> {
  if (!authUser) {
    return false;
  }

  const userPermissions = await getUserPermissions(authUser);
  
  // Direct permission check
  if (userPermissions.includes(permission)) {
    return true;
  }

  // Check if admin.full grants this permission
  if (userPermissions.includes('admin.full') && isGrantedByAdminFull(permission)) {
    return true;
  }

  return false;
}

/**
 * Check if user has any of the specified permissions
 */
export async function hasAnyPermission(
  authUser: AuthUser | null,
  permissions: Permission[]
): Promise<boolean> {
  for (const permission of permissions) {
    if (await hasPermission(authUser, permission)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if user has all of the specified permissions
 */
export async function hasAllPermissions(
  authUser: AuthUser | null,
  permissions: Permission[]
): Promise<boolean> {
  for (const permission of permissions) {
    if (!(await hasPermission(authUser, permission))) {
      return false;
    }
  }
  return true;
}

/**
 * Check if user can view a specific flight
 * Students can only view their own flights
 */
export async function canViewFlight(
  authUser: AuthUser | null,
  flightId: string
): Promise<boolean> {
  if (!authUser) {
    return false;
  }

  // Check if user has view.all permission
  if (await hasPermission(authUser, 'flights.view.all')) {
    return true;
  }

  // Check if user has view.own and the flight belongs to them
  if (await hasPermission(authUser, 'flights.view.own')) {
    const flight = await prisma.flight.findUnique({
      where: { id: flightId },
      select: { studentId: true, instructorId: true },
    });

    if (!flight) {
      return false;
    }

    // Student can view their own flights
    if (authUser.role === 'student' && authUser.studentId === flight.studentId) {
      return true;
    }

    // Instructor can view flights they're assigned to
    if (authUser.role === 'instructor' && authUser.instructorId === flight.instructorId) {
      return true;
    }
  }

  return false;
}

/**
 * Check if user can modify a specific flight
 */
export async function canModifyFlight(
  authUser: AuthUser | null,
  flightId: string
): Promise<boolean> {
  if (!authUser) {
    return false;
  }

  // Check if user has update permission
  if (await hasPermission(authUser, 'flights.update')) {
    return true;
  }

  // Students can only modify their own flights (for rescheduling)
  if (authUser.role === 'student') {
    const flight = await prisma.flight.findUnique({
      where: { id: flightId },
      select: { studentId: true },
    });

    return flight?.studentId === authUser.studentId;
  }

  return false;
}

