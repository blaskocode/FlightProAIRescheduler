require('dotenv').config({ path: '.env' });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.log('❌ DATABASE_URL not found in .env file');
  process.exit(1);
}

// Check format
if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
  // Mask password for display
  const masked = dbUrl.replace(/:[^:@]+@/, ':****@');
  console.log('✅ DATABASE_URL found:');
  console.log(`   ${masked}`);
  console.log('\n📋 Format looks correct!');
  console.log('\n📝 Next steps:');
  console.log('   1. Run: npm run db:generate (generate Prisma client)');
  console.log('   2. Run: npm run db:migrate (create database tables)');
  console.log('   3. Run: npm run db:seed (optional - populate test data)');
} else {
  console.log('⚠️  DATABASE_URL format might be incorrect');
  console.log('   Expected: postgres:// or postgresql://');
  console.log(`   Got: ${dbUrl.substring(0, 20)}...`);
}
