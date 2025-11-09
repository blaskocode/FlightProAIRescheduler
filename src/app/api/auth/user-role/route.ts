import { NextRequest, NextResponse } from 'next/server';
import { getUserRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get Firebase UID from query parameter or header
    // In production, verify Firebase token using Admin SDK
    const uid = request.nextUrl.searchParams.get('uid');
    
    if (!uid) {
      return NextResponse.json({ error: 'UID required' }, { status: 400 });
    }
    
    // Try to get user role with a small retry in case of timing issues
    let userRole = await getUserRole(uid);
    
    // If not found, wait a bit and try again (handles database transaction timing)
    if (!userRole) {
      await new Promise(resolve => setTimeout(resolve, 100));
      userRole = await getUserRole(uid);
    }
    
    if (!userRole) {
      console.warn(`User not found in database for UID: ${uid}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(userRole);
  } catch (error) {
    console.error('Error getting user role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

