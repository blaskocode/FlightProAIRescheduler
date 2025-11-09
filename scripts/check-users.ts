import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  console.log('🔍 Checking existing users...\n');

  try {
    const students = await prisma.student.findMany({
      select: {
        email: true,
        firebaseUid: true,
      },
      take: 5,
    });

    const instructors = await prisma.instructor.findMany({
      select: {
        email: true,
        firebaseUid: true,
      },
      take: 5,
    });

    const admins = await prisma.admin.findMany({
      select: {
        email: true,
        firebaseUid: true,
      },
      take: 5,
    });

    console.log('👥 Existing Users:');
    console.log(`\n📚 Students (${students.length} shown):`);
    students.forEach((s, i) => {
      const hasFirebase = s.firebaseUid ? '✅' : '❌';
      console.log(`   ${i + 1}. ${s.email} ${hasFirebase}`);
    });

    console.log(`\n👨‍✈️  Instructors (${instructors.length} shown):`);
    instructors.forEach((s, i) => {
      const hasFirebase = s.firebaseUid ? '✅' : '❌';
      console.log(`   ${i + 1}. ${s.email} ${hasFirebase}`);
    });

    console.log(`\n👔 Admins (${admins.length} shown):`);
    admins.forEach((s, i) => {
      const hasFirebase = s.firebaseUid ? '✅' : '❌';
      console.log(`   ${i + 1}. ${s.email} ${hasFirebase}`);
    });

    console.log('\n' + '='.repeat(50));
    console.log('💡 Note: Users with ✅ have Firebase accounts');
    console.log('   Users with ❌ need Firebase accounts created via signup');
    console.log('='.repeat(50));
  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();

