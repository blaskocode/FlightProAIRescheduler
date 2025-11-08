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
    
    const userRole = await getUserRole(uid);
    
    if (!userRole) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(userRole);
  } catch (error) {
    console.error('Error getting user role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

