import { prisma } from '@/lib/prisma';
import { AuthUser } from '@/lib/auth';

export type AuditAction =
  | 'flight.created'
  | 'flight.updated'
  | 'flight.deleted'
  | 'flight.cancelled'
  | 'flight.rescheduled'
  | 'weather.override'
  | 'maintenance.created'
  | 'maintenance.updated'
  | 'maintenance.completed'
  | 'squawk.reported'
  | 'squawk.resolved'
  | 'permission.granted'
  | 'permission.revoked'
  | 'role.changed'
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'settings.updated'
  | 'school.created'
  | 'school.updated';

export interface AuditLogData {
  action: AuditAction;
  userId: string;
  userRole: string;
  resourceType: string; // e.g., 'flight', 'user', 'settings'
  resourceId?: string;
  schoolId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: data.action,
        userId: data.userId,
        userRole: data.userRole,
        resourceType: data.resourceType,
        resourceId: data.resourceId || null,
        schoolId: data.schoolId || null,
        metadata: data.metadata || {},
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
      },
    });
  } catch (error) {
    // Don't fail the operation if audit logging fails
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Create audit log from AuthUser
 */
export async function auditLog(
  authUser: AuthUser,
  action: AuditAction,
  resourceType: string,
  options: {
    resourceId?: string;
    schoolId?: string;
    metadata?: Record<string, any>;
    request?: Request;
  } = {}
): Promise<void> {
  let ipAddress: string | undefined;
  let userAgent: string | undefined;

  if (options.request) {
    ipAddress = options.request.headers.get('x-forwarded-for') || 
                options.request.headers.get('x-real-ip') || 
                undefined;
    userAgent = options.request.headers.get('user-agent') || undefined;
  }

  await createAuditLog({
    action,
    userId: authUser.uid,
    userRole: authUser.role,
    resourceType,
    resourceId: options.resourceId,
    schoolId: options.schoolId,
    metadata: options.metadata,
    ipAddress,
    userAgent,
  });
}

