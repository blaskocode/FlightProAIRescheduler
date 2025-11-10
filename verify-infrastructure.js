// Infrastructure Verification Script
// Run with: node verify-infrastructure.js

require('dotenv').config({ path: '.env' });

console.log('🔍 Verifying Infrastructure Setup...\n');

const checks = {
  firebase: {
    name: 'Firebase',
    vars: [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID',
      'FIREBASE_DATABASE_URL',
    ],
  },
  database: {
    name: 'Database (PostgreSQL)',
    vars: ['DATABASE_URL'],
  },
  redis: {
    name: 'Redis',
    vars: ['REDIS_URL'],
    optional: true,
  },
  openai: {
    name: 'OpenAI',
    vars: ['OPENAI_API_KEY'],
  },
  resend: {
    name: 'Resend',
    vars: ['RESEND_API_KEY', 'RESEND_FROM_EMAIL'],
  },
};

let allPassed = true;
let optionalMissing = [];

Object.entries(checks).forEach(([key, check]) => {
  console.log(`\n📦 ${check.name}:`);
  
  let checkPassed = true;
  check.vars.forEach(varName => {
    const value = process.env[varName];
    if (value && value.trim() !== '' && !value.includes('placeholder')) {
      const display = varName.includes('KEY') || varName.includes('PASSWORD')
        ? `${value.substring(0, 10)}...`
        : value;
      console.log(`   ✅ ${varName}: ${display}`);
    } else {
      if (check.optional) {
        console.log(`   ⚠️  ${varName}: MISSING (optional)`);
        optionalMissing.push(`${check.name} - ${varName}`);
      } else {
        console.log(`   ❌ ${varName}: MISSING`);
        checkPassed = false;
        allPassed = false;
      }
    }
  });
  
  if (checkPassed) {
    console.log(`   ✅ ${check.name} - Complete`);
  } else if (check.optional) {
    console.log(`   ⚠️  ${check.name} - Optional (can add later`);
  } else {
    console.log(`   ❌ ${check.name} - Incomplete`);
  }
});

// Check OpenAI model
const model = process.env.OPENAI_MODEL || 'gpt-4';
console.log(`\n🤖 OpenAI Model: ${model} (${model === 'gpt-3.5-turbo' ? 'Development mode - cheaper' : 'Production mode - better quality'})`);

// Summary
console.log('\n' + '='.repeat(50));
if (allPassed) {
  console.log('✅ All required infrastructure is configured!');
  console.log('\n📋 Next Steps:');
  console.log('   1. Run: npm run db:seed (populate test data)');
  console.log('   2. Start dev server: npm run dev');
  console.log('   3. Test authentication: http://localhost:3000/login');
  console.log('   4. Test weather checking');
  console.log('   5. Test AI rescheduling');
} else {
  console.log('❌ Some required infrastructure is missing.');
  console.log('   Please complete the setup before proceeding.');
}

if (optionalMissing.length > 0) {
  console.log('\n⚠️  Optional services not configured:');
  optionalMissing.forEach(item => console.log(`   - ${item}`));
  console.log('   (These can be added later if needed)');
}

console.log('='.repeat(50));





