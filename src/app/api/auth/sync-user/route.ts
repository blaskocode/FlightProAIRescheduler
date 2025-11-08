import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/auth/sync-user
 * Create or sync a user in the database after Firebase authentication
 * This is called after signup to create the database record
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, email, role = 'student', schoolId, firstName, lastName, phone } = body;

    if (!uid || !email) {
      return NextResponse.json(
        { error: 'UID and email are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    let existingUser = await prisma.student.findUnique({
      where: { firebaseUid: uid },
    });

    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: 'User already exists',
        user: {
          id: existingUser.id,
          role: 'student',
        },
      });
    }

    // Check instructor
    existingUser = await prisma.instructor.findUnique({
      where: { firebaseUid: uid },
    });

    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: 'User already exists',
        user: {
          id: existingUser.id,
          role: 'instructor',
        },
      });
    }

    // Check admin
    existingUser = await prisma.admin.findUnique({
      where: { firebaseUid: uid },
    });

    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: 'User already exists',
        user: {
          id: existingUser.id,
          role: 'admin',
        },
      });
    }

    // Create new user based on role
    if (role === 'student') {
      // Get school - use provided schoolId or fall back to first school (for development)
      const school = schoolId
        ? await prisma.school.findUnique({ where: { id: schoolId } })
        : await prisma.school.findFirst();

      if (!school) {
        return NextResponse.json(
          { error: 'No school found. Please create a school first.' },
          { status: 400 }
        );
      }

      const student = await prisma.student.create({
        data: {
          schoolId: school.id,
          email,
          firebaseUid: uid,
          firstName: firstName || email.split('@')[0],
          lastName: lastName || 'User',
          phone: phone || '',
        },
      });

      return NextResponse.json({
        success: true,
        user: {
          id: student.id,
          role: 'student',
        },
      });
    } else if (role === 'instructor') {
      if (!schoolId) {
        return NextResponse.json(
          { error: 'schoolId is required for instructors' },
          { status: 400 }
        );
      }

      const school = await prisma.school.findUnique({ where: { id: schoolId } });
      if (!school) {
        return NextResponse.json(
          { error: 'School not found' },
          { status: 404 }
        );
      }

      const instructor = await prisma.instructor.create({
        data: {
          schoolId: school.id,
          email,
          firebaseUid: uid,
          firstName: firstName || email.split('@')[0],
          lastName: lastName || 'User',
          phone: phone || '',
        },
      });

      return NextResponse.json({
        success: true,
        user: {
          id: instructor.id,
          role: 'instructor',
        },
      });
    } else if (role === 'admin') {
      const admin = await prisma.admin.create({
        data: {
          email,
          firebaseUid: uid,
          firstName: firstName || email.split('@')[0],
          lastName: lastName || 'User',
          phone: phone || '',
        },
      });

      return NextResponse.json({
        success: true,
        user: {
          id: admin.id,
          role: 'admin',
        },
      });
    }

    return NextResponse.json(
      { error: 'Invalid role' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error syncing user:', error);
    
    // Handle unique constraint violations (user already exists)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'User with this email or Firebase UID already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

