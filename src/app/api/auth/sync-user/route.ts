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

    // Check if user already exists by firebaseUid
    let existingUser = await prisma.student.findUnique({
      where: { firebaseUid: uid },
    });

    if (existingUser) {
      console.log(`Found existing student by firebaseUid: ${uid}`);
      return NextResponse.json({
        success: true,
        message: 'User already exists',
        user: {
          id: existingUser.id,
          role: 'student',
        },
      });
    }

    // Also check by email in case firebaseUid is missing or different
    existingUser = await prisma.student.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      // Update firebaseUid if it's missing or different
      if (!existingUser.firebaseUid || existingUser.firebaseUid !== uid) {
        console.log(`Updating student firebaseUid from ${existingUser.firebaseUid} to ${uid}`);
        await prisma.student.update({
          where: { id: existingUser.id },
          data: { firebaseUid: uid },
        });
      }
      return NextResponse.json({
        success: true,
        message: 'User already exists (updated firebaseUid)',
        user: {
          id: existingUser.id,
          role: 'student',
        },
      });
    }

    // Check instructor by firebaseUid
    existingUser = await prisma.instructor.findUnique({
      where: { firebaseUid: uid },
    });

    if (existingUser) {
      console.log(`Found existing instructor by firebaseUid: ${uid}`);
      return NextResponse.json({
        success: true,
        message: 'User already exists',
        user: {
          id: existingUser.id,
          role: 'instructor',
        },
      });
    }

    // Also check by email
    existingUser = await prisma.instructor.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      // Update firebaseUid if it's missing or different
      if (!existingUser.firebaseUid || existingUser.firebaseUid !== uid) {
        console.log(`Updating instructor firebaseUid from ${existingUser.firebaseUid} to ${uid}`);
        await prisma.instructor.update({
          where: { id: existingUser.id },
          data: { firebaseUid: uid },
        });
      }
      return NextResponse.json({
        success: true,
        message: 'User already exists (updated firebaseUid)',
        user: {
          id: existingUser.id,
          role: 'instructor',
        },
      });
    }

    // Check admin by firebaseUid
    existingUser = await prisma.admin.findUnique({
      where: { firebaseUid: uid },
    });

    if (existingUser) {
      console.log(`Found existing admin by firebaseUid: ${uid}`);
      return NextResponse.json({
        success: true,
        message: 'User already exists',
        user: {
          id: existingUser.id,
          role: 'admin',
        },
      });
    }

    // Also check by email
    existingUser = await prisma.admin.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      // Update firebaseUid if it's missing or different
      if (!existingUser.firebaseUid || existingUser.firebaseUid !== uid) {
        console.log(`Updating admin firebaseUid from ${existingUser.firebaseUid} to ${uid}`);
        await prisma.admin.update({
          where: { id: existingUser.id },
          data: { firebaseUid: uid },
        });
      }
      return NextResponse.json({
        success: true,
        message: 'User already exists (updated firebaseUid)',
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

      console.log(`Created student with firebaseUid: ${uid}, id: ${student.id}, email: ${email}`);

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
          // Admin model doesn't have phone field
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
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      meta: error.meta,
      stack: error.stack,
    });
    
    // Handle unique constraint violations (user already exists)
    if (error.code === 'P2002') {
      // User already exists - try to find and return existing user
      try {
        // Check all tables for existing user by firebaseUid
        const existingStudent = await prisma.student.findUnique({
          where: { firebaseUid: uid },
        });
        if (existingStudent) {
          return NextResponse.json({
            success: true,
            message: 'User already exists',
            user: {
              id: existingStudent.id,
              role: 'student',
            },
          });
        }

        const existingInstructor = await prisma.instructor.findUnique({
          where: { firebaseUid: uid },
        });
        if (existingInstructor) {
          return NextResponse.json({
            success: true,
            message: 'User already exists',
            user: {
              id: existingInstructor.id,
              role: 'instructor',
            },
          });
        }

        const existingAdmin = await prisma.admin.findUnique({
          where: { firebaseUid: uid },
        });
        if (existingAdmin) {
          return NextResponse.json({
            success: true,
            message: 'User already exists',
            user: {
              id: existingAdmin.id,
              role: 'admin',
            },
          });
        }

        // If firebaseUid not found, check by email (might be a different firebaseUid)
        if (email) {
          const studentByEmail = await prisma.student.findUnique({
            where: { email },
          });
          if (studentByEmail) {
            // Update firebaseUid if different
            if (!studentByEmail.firebaseUid || studentByEmail.firebaseUid !== uid) {
              try {
                await prisma.student.update({
                  where: { id: studentByEmail.id },
                  data: { firebaseUid: uid },
                });
              } catch (updateError: any) {
                // If update fails (e.g., uid already in use), just return existing user
                console.warn('Could not update firebaseUid:', updateError);
              }
            }
            return NextResponse.json({
              success: true,
              message: 'User already exists (by email)',
              user: {
                id: studentByEmail.id,
                role: 'student',
              },
            });
          }

          const instructorByEmail = await prisma.instructor.findUnique({
            where: { email },
          });
          if (instructorByEmail) {
            if (!instructorByEmail.firebaseUid || instructorByEmail.firebaseUid !== uid) {
              try {
                await prisma.instructor.update({
                  where: { id: instructorByEmail.id },
                  data: { firebaseUid: uid },
                });
              } catch (updateError: any) {
                console.warn('Could not update firebaseUid:', updateError);
              }
            }
            return NextResponse.json({
              success: true,
              message: 'User already exists (by email)',
              user: {
                id: instructorByEmail.id,
                role: 'instructor',
              },
            });
          }

          const adminByEmail = await prisma.admin.findUnique({
            where: { email },
          });
          if (adminByEmail) {
            if (!adminByEmail.firebaseUid || adminByEmail.firebaseUid !== uid) {
              try {
                await prisma.admin.update({
                  where: { id: adminByEmail.id },
                  data: { firebaseUid: uid },
                });
              } catch (updateError: any) {
                console.warn('Could not update firebaseUid:', updateError);
              }
            }
            return NextResponse.json({
              success: true,
              message: 'User already exists (by email)',
              user: {
                id: adminByEmail.id,
                role: 'admin',
              },
            });
          }
        }
      } catch (findError: any) {
        console.error('Error finding existing user:', findError);
      }
      
      // If we can't find the user, return success anyway (user exists somewhere)
      return NextResponse.json({
        success: true,
        message: 'User already exists (constraint violation)',
      });
    }

    // Return detailed error for debugging
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        code: error.code,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

