/**
 * Permission Types
 * 
 * Granular permissions for RBAC system
 */

export type Permission =
  // Flight permissions
  | 'flights.view.own'
  | 'flights.view.all'
  | 'flights.create'
  | 'flights.update'
  | 'flights.delete'
  | 'flights.cancel'
  | 'flights.reschedule'
  // Weather permissions
  | 'weather.view'
  | 'weather.override'
  // Maintenance permissions
  | 'maintenance.view'
  | 'maintenance.manage'
  | 'maintenance.squawk'
  // Analytics permissions
  | 'analytics.view'
  | 'analytics.view.all'
  // Settings permissions
  | 'settings.view'
  | 'settings.update'
  | 'settings.manage.users'
  | 'settings.manage.schools'
  // Student permissions
  | 'students.view.own'
  | 'students.view.all'
  | 'students.update'
  | 'students.progress.view'
  // Instructor permissions
  | 'instructors.view'
  | 'instructors.manage'
  // Admin permissions
  | 'admin.full'
  | 'admin.cross_school';

export type Role = 'student' | 'instructor' | 'chief_instructor' | 'admin' | 'super_admin';

/**
 * Role template - maps roles to their default permissions
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  student: [
    'flights.view.own',
    'flights.create',
    'flights.reschedule',
    'weather.view',
    'students.view.own',
    'students.progress.view',
    'analytics.view',
  ],
  instructor: [
    'flights.view.all',
    'flights.create',
    'flights.update',
    'flights.cancel',
    'flights.reschedule',
    'weather.view',
    'weather.override',
    'maintenance.view',
    'maintenance.squawk',
    'students.view.all',
    'students.update',
    'students.progress.view',
    'analytics.view',
  ],
  chief_instructor: [
    'flights.view.all',
    'flights.create',
    'flights.update',
    'flights.delete',
    'flights.cancel',
    'flights.reschedule',
    'weather.view',
    'weather.override',
    'maintenance.view',
    'maintenance.manage',
    'maintenance.squawk',
    'students.view.all',
    'students.update',
    'students.progress.view',
    'instructors.view',
    'instructors.manage',
    'analytics.view',
    'settings.view',
    'settings.update',
  ],
  admin: [
    'admin.full',
    'flights.view.all',
    'flights.create',
    'flights.update',
    'flights.delete',
    'flights.cancel',
    'flights.reschedule',
    'weather.view',
    'weather.override',
    'maintenance.view',
    'maintenance.manage',
    'maintenance.squawk',
    'students.view.all',
    'students.update',
    'students.progress.view',
    'instructors.view',
    'instructors.manage',
    'analytics.view',
    'analytics.view.all',
    'settings.view',
    'settings.update',
    'settings.manage.users',
  ],
  super_admin: [
    'admin.full',
    'admin.cross_school',
    'flights.view.all',
    'flights.create',
    'flights.update',
    'flights.delete',
    'flights.cancel',
    'flights.reschedule',
    'weather.view',
    'weather.override',
    'maintenance.view',
    'maintenance.manage',
    'maintenance.squawk',
    'students.view.all',
    'students.update',
    'students.progress.view',
    'instructors.view',
    'instructors.manage',
    'analytics.view',
    'analytics.view.all',
    'settings.view',
    'settings.update',
    'settings.manage.users',
    'settings.manage.schools',
  ],
};

/**
 * Check if a permission is included in admin.full
 */
export function isAdminFullPermission(permission: Permission): boolean {
  return permission === 'admin.full' || permission === 'admin.cross_school';
}

/**
 * Check if permission is granted by admin.full
 */
export function isGrantedByAdminFull(permission: Permission): boolean {
  if (permission === 'admin.full' || permission === 'admin.cross_school') {
    return false; // These are meta-permissions
  }
  // admin.full grants all non-meta permissions
  return true;
}

