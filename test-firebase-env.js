require('dotenv').config({ path: '.env' });

const vars = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
};

console.log('✅ Firebase Configuration Check:\n');
Object.entries(vars).forEach(([key, value]) => {
  if (value && value.trim() !== '' && !value.includes('placeholder')) {
    const display = key === 'apiKey' ? `${value.substring(0, 15)}...` : value;
    console.log(`✅ ${key}: ${display}`);
  } else {
    console.log(`❌ ${key}: MISSING or INVALID`);
  }
});

const allGood = Object.values(vars).every(v => v && v.trim() !== '' && !v.includes('placeholder'));
if (allGood) {
  console.log('\n🎉 All Firebase variables are properly configured!');
  console.log('\n📋 Next steps:');
  console.log('   1. ✅ Firebase config - DONE');
  console.log('   2. ⏭️  Set up Database (PostgreSQL)');
  console.log('   3. ⏭️  Set up Redis');
  console.log('   4. ⏭️  Set up OpenAI');
  console.log('   5. ⏭️  Set up Resend');
}
