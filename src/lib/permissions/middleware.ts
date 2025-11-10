import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { hasPermission } from './check';
import { Permission } from './types';

/**
 * Middleware to require a specific permission
 * Use this in API routes to protect endpoints
 */
export function requirePermission(permission: Permission) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    try {
      const authUser = await requireAuth();
      
      const hasAccess = await hasPermission(authUser, permission);
      
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      // Store authUser in request for use in route handler
      (request as any).authUser = authUser;
      
      return null; // Continue to route handler
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Authentication required' },
        { status: 401 }
      );
    }
  };
}

/**
 * Middleware to require any of the specified permissions
 */
export function requireAnyPermission(permissions: Permission[]) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    try {
      const authUser = await requireAuth();
      
      for (const permission of permissions) {
        if (await hasPermission(authUser, permission)) {
          (request as any).authUser = authUser;
          return null; // Continue to route handler
        }
      }

      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Authentication required' },
        { status: 401 }
      );
    }
  };
}

/**
 * Middleware to require all of the specified permissions
 */
export function requireAllPermissions(permissions: Permission[]) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    try {
      const authUser = await requireAuth();
      
      for (const permission of permissions) {
        if (!(await hasPermission(authUser, permission))) {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          );
        }
      }

      (request as any).authUser = authUser;
      return null; // Continue to route handler
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Authentication required' },
        { status: 401 }
      );
    }
  };
}

