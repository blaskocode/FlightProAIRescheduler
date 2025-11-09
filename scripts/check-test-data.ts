import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTestData() {
  console.log('🔍 Checking test data in database...\n');

  try {
    const schools = await prisma.school.count();
    const students = await prisma.student.count();
    const instructors = await prisma.instructor.count();
    const admins = await prisma.admin.count();
    const aircraft = await prisma.aircraft.count();
    const flights = await prisma.flight.count();

    console.log('📊 Database Counts:');
    console.log(`   Schools: ${schools} ${schools >= 3 ? '✅' : '❌ (need 3+)'}`);
    console.log(`   Students: ${students} ${students >= 5 ? '✅' : '❌ (need 5+)'}`);
    console.log(`   Instructors: ${instructors} ${instructors >= 5 ? '✅' : '❌ (need 5+)'}`);
    console.log(`   Admins: ${admins} ${admins >= 1 ? '✅' : '⚠️  (optional)'}`);
    console.log(`   Aircraft: ${aircraft} ${aircraft >= 5 ? '✅' : '❌ (need 5+)'}`);
    console.log(`   Flights: ${flights} ${flights >= 10 ? '✅' : '❌ (need 10+)'}`);

    const allGood = schools >= 3 && students >= 5 && instructors >= 5 && aircraft >= 5 && flights >= 10;

    console.log('\n' + '='.repeat(50));
    if (allGood) {
      console.log('✅ Test data looks good! Ready for testing.');
    } else {
      console.log('⚠️  Some test data is missing. Run: npm run db:seed');
    }
    console.log('='.repeat(50));
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTestData();

