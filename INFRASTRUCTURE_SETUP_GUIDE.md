# Infrastructure Setup Guide

This guide walks you through setting up all required infrastructure services for the Flight Schedule Pro AI Rescheduler.

## Prerequisites

- Node.js 20+ installed
- npm or yarn installed
- Git repository (optional, for deployment)

---

## Step 1: Create Environment File

1. **Copy the template**:
   ```bash
   cp .env.template .env.local
   ```

2. **Important**: `.env.local` is in `.gitignore` - it will NOT be committed to git

---

## Step 2: Firebase Setup

Firebase provides authentication and real-time notifications.

### 2.1 Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click "Add project" or "Create a project"
3. Enter project name: `flight-pro-ai-rescheduler` (or your choice)
4. Disable Google Analytics (optional)
5. Click "Create project"

### 2.2 Enable Authentication

1. In Firebase Console, go to **Authentication** > **Get started**
2. Click **Sign-in method** tab
3. Enable **Email/Password** provider
4. Click **Save**

### 2.3 Enable Realtime Database

1. Go to **Realtime Database** > **Create database**
2. Choose location (closest to your users)
3. Start in **test mode** (we'll secure it later)
4. Click **Enable**

### 2.4 Get Configuration Values

1. Go to **Project Settings** (gear icon) > **General**
2. Scroll to **Your apps** section
3. Click **Web** icon (`</>`)
4. Register app with nickname: "Flight Pro Web"
5. Copy the config values:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

6. Get Realtime Database URL:
   - Go to **Realtime Database**
   - Copy the URL (e.g., `https://your-project-default-rtdb.firebaseio.com`)

### 2.5 Add to .env.local

```bash
NEXT_PUBLIC_FIREBASE_API_KEY="AIza..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abcdef"
FIREBASE_DATABASE_URL="https://your-project-default-rtdb.firebaseio.com"
```

✅ **Firebase Setup Complete!**

---

## Step 3: Database Setup (PostgreSQL)

You need a PostgreSQL database. Options:

### Option A: Vercel Postgres (Recommended for Vercel deployment)

1. Go to https://vercel.com/dashboard
2. Create/select your project
3. Go to **Storage** tab
4. Click **Create Database** > **Postgres**
5. Choose plan (Hobby is free for development)
6. Select region
7. Click **Create**
8. Copy the connection string from **.env.local** tab
9. It will look like: `postgres://default:password@host:5432/verceldb`

### Option B: Supabase (Free tier available)

1. Go to https://supabase.com
2. Sign up / Log in
3. Click **New Project**
4. Fill in details:
   - Name: `flight-pro-ai-rescheduler`
   - Database Password: (save this!)
   - Region: (choose closest)
5. Wait for project to be created (~2 minutes)
6. Go to **Settings** > **Database**
7. Copy **Connection string** > **URI**
8. It will look like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`

### Option C: Railway (Easy setup)

1. Go to https://railway.app
2. Sign up / Log in
3. Click **New Project** > **Provision PostgreSQL**
4. Click on the PostgreSQL service
5. Go to **Variables** tab
6. Copy **DATABASE_URL**

### Option D: Local PostgreSQL (Development only)

1. Install PostgreSQL locally
2. Create database:
   ```bash
   createdb flightpro
   ```
3. Connection string:
   ```
   postgresql://localhost:5432/flightpro
   ```

### Add to .env.local

```bash
DATABASE_URL="postgresql://user:password@host:5432/database"
```

### Run Migrations

After setting DATABASE_URL:

```bash
npm run db:migrate
```

This will:
- Create all database tables
- Set up relationships
- Add indexes

### Seed Database (Optional but Recommended)

```bash
npm run db:seed
```

This populates with:
- 3 flight schools
- 20 students
- 5 instructors
- 5 aircraft
- 50 upcoming flights
- 40-lesson syllabus

✅ **Database Setup Complete!**

---

## Step 4: Redis Setup (for Job Queue)

BullMQ requires Redis for background jobs.

### Option A: Upstash (Recommended - Free tier)

1. Go to https://upstash.com
2. Sign up / Log in
3. Click **Create Database**
4. Choose:
   - Type: **Regional** (or Global for multi-region)
   - Name: `flight-pro-jobs`
   - Region: (choose closest)
   - Primary region: (same as above)
5. Click **Create**
6. Copy **UPSTASH_REDIS_REST_URL** or **UPSTASH_REDIS_REST_TOKEN**
7. For ioredis, you need the Redis URL format:
   - Go to **Details** tab
   - Copy **Endpoint** and **Port**
   - Format: `redis://default:password@endpoint:port`
   - Or use REST API (see below)

**For ioredis connection**, use:
```
REDIS_URL="redis://default:your-password@your-endpoint.upstash.io:6379"
```

Or if using REST API (alternative):
```bash
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
```

### Option B: Vercel KV (if deploying to Vercel)

1. In Vercel project, go to **Storage**
2. Click **Create Database** > **KV**
3. Choose plan
4. Copy connection details

### Option C: Redis Cloud (Free tier)

1. Go to https://redis.com/try-free/
2. Sign up
3. Create database
4. Copy connection string

### Option D: Local Redis (Development only)

```bash
# macOS
brew install redis
brew services start redis

# Connection string:
REDIS_URL="redis://localhost:6379"
```

### Add to .env.local

```bash
REDIS_URL="redis://default:password@host:6379"
```

✅ **Redis Setup Complete!**

---

## Step 5: OpenAI Setup

Required for AI-powered rescheduling.

1. Go to https://platform.openai.com
2. Sign up / Log in
3. Go to **API keys** (https://platform.openai.com/api-keys)
4. Click **Create new secret key**
5. Name it: `Flight Pro AI Rescheduler`
6. **Copy the key immediately** (you won't see it again!)
7. Save it securely

### Add to .env.local

```bash
OPENAI_API_KEY="sk-..."
```

### Cost Note

- GPT-4 is more expensive but better quality
- Consider using `gpt-3.5-turbo` for development/testing
- Monitor usage at https://platform.openai.com/usage

✅ **OpenAI Setup Complete!**

---

## Step 6: Resend Setup (Email Service)

Required for sending email notifications.

1. Go to https://resend.com
2. Sign up / Log in
3. Go to **API Keys** (https://resend.com/api-keys)
4. Click **Create API Key**
5. Name it: `Flight Pro Production` (or Development)
6. Copy the key

### Domain Verification (Required for Production)

1. Go to **Domains** (https://resend.com/domains)
2. Click **Add Domain**
3. Enter your domain (e.g., `yourdomain.com`)
4. Add DNS records to your domain:
   - SPF record
   - DKIM records
   - DMARC record (optional)
5. Wait for verification (~5 minutes)

### For Development/Testing

You can use Resend's test domain:
- From email: `onboarding@resend.dev`
- No domain verification needed
- Limited to 100 emails/day

### Add to .env.local

```bash
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="noreply@yourdomain.com"
# Or for testing:
RESEND_FROM_EMAIL="onboarding@resend.dev"
```

✅ **Resend Setup Complete!**

---

## Step 7: Application URL

Set the base URL for your application.

### Development

```bash
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Production (after deployment)

```bash
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
```

### Add to .env.local

```bash
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

---

## Step 8: Verify Setup

### 8.1 Check Environment Variables

```bash
# Make sure .env.local exists and has all variables
cat .env.local
```

### 8.2 Test Database Connection

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Test connection (opens Prisma Studio)
npm run db:studio
```

### 8.3 Test Redis Connection

Create a test file:

```typescript
// test-redis.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

redis.ping()
  .then(() => console.log('✅ Redis connected!'))
  .catch(err => console.error('❌ Redis error:', err))
  .finally(() => redis.quit());
```

Run it:
```bash
tsx test-redis.ts
```

### 8.4 Test Firebase

Start the dev server:
```bash
npm run dev
```

Try to access `/login` - if Firebase is configured, the page should load without errors.

### 8.5 Test OpenAI

You can test in the browser console after starting the app, or create a test API route.

---

## Step 9: Job Scheduling (Cron Jobs)

### Option A: Vercel Cron (Recommended for Vercel)

Update `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "crons": [
    {
      "path": "/api/jobs/hourly-weather",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/jobs/currency-check",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/jobs/maintenance-reminder",
      "schedule": "0 9 * * *"
    }
  ]
}
```

### Option B: External Cron Service

1. Use cron-job.org or similar
2. Set up hourly call to: `https://your-app.vercel.app/api/jobs/hourly-weather`
3. Set up daily call to: `https://your-app.vercel.app/api/jobs/currency-check`

---

## Step 10: Deployment Checklist

Before deploying to production:

- [ ] All environment variables set in Vercel (or your hosting platform)
- [ ] Database migrations run
- [ ] Firebase security rules configured
- [ ] Domain verified in Resend
- [ ] Cron jobs configured
- [ ] Test all API endpoints
- [ ] Monitor OpenAI usage/costs

---

## Troubleshooting

### Database Connection Issues

- Check DATABASE_URL format
- Verify database is accessible
- Check firewall/network settings
- Try connecting with `psql` or database client

### Redis Connection Issues

- Verify REDIS_URL format
- Check if Redis requires SSL (some providers do)
- Test with `redis-cli` if local

### Firebase Issues

- Verify all NEXT_PUBLIC_ variables are set
- Check Firebase project is active
- Verify Realtime Database rules allow access

### OpenAI Issues

- Verify API key is correct
- Check account has credits
- Verify model name (gpt-4 or gpt-3.5-turbo)

### Resend Issues

- Verify domain is verified (for production)
- Check API key is correct
- Use test domain for development

---

## Next Steps

After infrastructure is set up:

1. ✅ Run database migrations
2. ✅ Seed database with test data
3. ✅ Test authentication flow
4. ✅ Test weather checking
5. ✅ Test AI rescheduling
6. ✅ Build missing UI components
7. ✅ Deploy to Vercel

---

## Quick Reference

**All Required Environment Variables:**

```bash
# Database
DATABASE_URL="postgresql://..."

# Redis
REDIS_URL="redis://..."

# Firebase (7 variables)
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="..."
FIREBASE_DATABASE_URL="https://..."

# OpenAI
OPENAI_API_KEY="sk-..."

# Resend
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

Good luck! 🚀

