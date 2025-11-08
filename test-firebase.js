// Quick test script to verify Firebase configuration
// Run with: node test-firebase.js

require('dotenv').config({ path: '.env.local' });

const requiredVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'FIREBASE_DATABASE_URL',
];

console.log('🔍 Checking Firebase configuration...\n');

let allPresent = true;
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value && value.trim() !== '') {
    // Mask sensitive values
    const displayValue = varName.includes('API_KEY') || varName.includes('APP_ID')
      ? `${value.substring(0, 10)}...`
      : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`❌ ${varName}: MISSING`);
    allPresent = false;
  }
});

if (allPresent) {
  console.log('\n✅ All Firebase variables are set!');
  console.log('📝 Next steps:');
  console.log('   1. Make sure Firebase Authentication is enabled');
  console.log('   2. Make sure Realtime Database is created');
  console.log('   3. Test by visiting http://localhost:3000/login');
} else {
  console.log('\n❌ Some Firebase variables are missing. Please check your .env.local file.');
}

