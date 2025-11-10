import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { getUserSchoolId } from '@/lib/auth/school-scope';

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/admin/settings - Starting...');
    let authUser;
    try {
      authUser = await requireAuth(request);
    } catch (authError: any) {
      console.error('Authentication error:', authError);
      return NextResponse.json(
        { error: authError.message || 'Authentication required' },
        { status: 401 }
      );
    }
    console.log('Auth user:', { role: authUser.role, adminId: authUser.adminId, studentId: authUser.studentId, instructorId: authUser.instructorId });
    
    // Get schoolId: from user's school or from query param (for super admins)
    const schoolIdParam = request.nextUrl.searchParams.get('schoolId');
    let schoolId: string | null = null;
    
    if (schoolIdParam) {
      // Validate that the schoolId exists before using it
      const schoolExists = await prisma.school.findUnique({
        where: { id: schoolIdParam },
        select: { id: true },
      });
      
      if (schoolExists) {
        schoolId = schoolIdParam;
        console.log('Using schoolId from query param:', schoolId);
      } else {
        console.warn('Invalid schoolId from query param, ignoring:', schoolIdParam);
        // Fall through to get user's school
      }
    }
    
    // If no valid schoolId from param, get user's school
    if (!schoolId) {
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
    
    // Handle authentication errors
    if (error.message?.includes('Authentication') || error.message?.includes('not found')) {
      return NextResponse.json(
        { error: error.message || 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    let authUser;
    try {
      authUser = await requireAuth(request);
    } catch (authError: any) {
      console.error('Authentication error:', authError);
      return NextResponse.json(
        { error: authError.message || 'Authentication required' },
        { status: 401 }
      );
    }
    const body = await request.json();
    const { weatherApiEnabled, weatherCheckFrequency, schoolId: schoolIdParam } = body;

    // Get schoolId: from body param (for super admins) or from user's school
    let schoolId: string | null = null;
    
    if (schoolIdParam) {
      // Validate that the schoolId exists before using it
      const schoolExists = await prisma.school.findUnique({
        where: { id: schoolIdParam },
        select: { id: true },
      });
      
      if (schoolExists) {
        schoolId = schoolIdParam;
        console.log('Using schoolId from body param:', schoolId);
      } else {
        console.warn('Invalid schoolId from body param, ignoring:', schoolIdParam);
        // Fall through to get user's school
      }
    }
    
    // If no valid schoolId from param, get user's school
    if (!schoolId) {
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
    console.error('Error stack:', error.stack);
    
    // Handle authentication errors
    if (error.message?.includes('Authentication') || error.message?.includes('not found')) {
      return NextResponse.json(
        { error: error.message || 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

