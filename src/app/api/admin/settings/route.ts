import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { getUserSchoolId } from '@/lib/auth/school-scope';

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/admin/settings - Starting...');
    const authUser = await requireAuth(request);
    console.log('Auth user:', { role: authUser.role, adminId: authUser.adminId, studentId: authUser.studentId, instructorId: authUser.instructorId });
    
    // Get schoolId: from user's school or from query param (for super admins)
    const schoolIdParam = request.nextUrl.searchParams.get('schoolId');
    let schoolId: string | null = null;
    
    if (schoolIdParam) {
      // Super admin can specify schoolId
      schoolId = schoolIdParam;
      console.log('Using schoolId from query param:', schoolId);
    } else {
      // Get user's school
      console.log('Getting user schoolId...');
      schoolId = await getUserSchoolId(authUser);
      console.log('User schoolId:', schoolId);
    }
    
    // If no schoolId, default to first school (for super admins)
    if (!schoolId) {
      console.log('No schoolId found, defaulting to first school...');
      const firstSchool = await prisma.school.findFirst({
        orderBy: { name: 'asc' },
        select: { id: true },
      });
      schoolId = firstSchool?.id || null;
      console.log('First school ID:', schoolId);
    }
    
    if (!schoolId) {
      console.error('No school found at all');
      return NextResponse.json(
        { error: 'No school found' },
        { status: 404 }
      );
    }
    
    // Fetch school settings
    console.log('Fetching school settings for:', schoolId);
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        weatherApiEnabled: true,
        weatherCheckFrequency: true,
      },
    });
    
    if (!school) {
      console.error('School not found in database:', schoolId);
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }
    
    console.log('Settings fetched successfully:', school);
    return NextResponse.json({
      weatherApiEnabled: school.weatherApiEnabled || false,
      weatherCheckFrequency: school.weatherCheckFrequency || 'hourly',
    });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Internal server error', details: error.stack },
      { status: error.message?.includes('Authentication') ? 401 : 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const body = await request.json();
    const { weatherApiEnabled, weatherCheckFrequency, schoolId: schoolIdParam } = body;

    // Get schoolId: from body param (for super admins) or from user's school
    let schoolId: string | null = null;
    
    if (schoolIdParam) {
      // Super admin can specify schoolId
      schoolId = schoolIdParam;
    } else {
      // Get user's school
      schoolId = await getUserSchoolId(authUser);
    }
    
    // If no schoolId, default to first school (for super admins)
    if (!schoolId) {
      const firstSchool = await prisma.school.findFirst({
        orderBy: { name: 'asc' },
        select: { id: true },
      });
      schoolId = firstSchool?.id || null;
    }
    
    if (!schoolId) {
      return NextResponse.json(
        { error: 'No school found' },
        { status: 404 }
      );
    }
    
    // Update school settings
    const school = await prisma.school.update({
      where: { id: schoolId },
      data: {
        weatherApiEnabled: weatherApiEnabled ?? false,
        weatherCheckFrequency: weatherCheckFrequency || 'hourly',
      },
      select: {
        id: true,
        weatherApiEnabled: true,
        weatherCheckFrequency: true,
      },
    });

    return NextResponse.json({
      success: true,
      settings: {
        weatherApiEnabled: school.weatherApiEnabled,
        weatherCheckFrequency: school.weatherCheckFrequency,
      },
    });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message?.includes('Authentication') ? 401 : 500 }
    );
  }
}

