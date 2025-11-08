import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions/check';
import { getUserPermissions } from '@/lib/permissions/check';
import { Permission } from '@/lib/permissions/types';

/**
 * GET /api/permissions
 * Get current user's permissions
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth();
    const permissions = await getUserPermissions(authUser);

    return NextResponse.json({
      permissions,
      role: authUser.role,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/permissions/check
 * Check if user has specific permission(s)
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth();
    const body = await request.json();
    const { permission, permissions } = body;

    if (permission) {
      const hasAccess = await hasPermission(authUser, permission as Permission);
      return NextResponse.json({ hasAccess });
    }

    if (permissions && Array.isArray(permissions)) {
      const results: Record<string, boolean> = {};
      for (const perm of permissions) {
        results[perm] = await hasPermission(authUser, perm as Permission);
      }
      return NextResponse.json({ permissions: results });
    }

    return NextResponse.json(
      { error: 'Either "permission" or "permissions" array required' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

