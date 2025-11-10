import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserRole } from '@/lib/auth';

/**
 * POST /api/schools/onboard
 * Create a new school (super admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      airportCode,
      latitude,
      longitude,
      timezone,
      phone,
      email,
      address,
    } = body;

    // Get auth user
    const uid = request.nextUrl.searchParams.get('uid');
    if (!uid) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const authUser = await getUserRole(uid);
    if (!authUser || authUser.role !== 'admin' || !authUser.adminId) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Check if super admin
    const admin = await prisma.admin.findUnique({
      where: { id: authUser.adminId },
      select: { role: true },
    });

    if (admin?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    // Validate required fields
    if (!name || !airportCode || !latitude || !longitude || !timezone) {
      return NextResponse.json(
        { error: 'Missing required fields: name, airportCode, latitude, longitude, timezone' },
        { status: 400 }
      );
    }

    // Check if airport code already exists
    const existing = await prisma.school.findUnique({
      where: { airportCode: airportCode.toUpperCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'School with this airport code already exists' },
        { status: 409 }
      );
    }

    // Create school
    const school = await prisma.school.create({
      data: {
        name,
        airportCode: airportCode.toUpperCase(),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        timezone,
        phone: phone || null,
        email: email || null,
        address: address || null,
        weatherApiEnabled: false,
      },
    });

    return NextResponse.json({
      success: true,
      school,
      message: 'School created successfully',
    });
  } catch (error: any) {
    console.error('Error creating school:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'School with this airport code already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

