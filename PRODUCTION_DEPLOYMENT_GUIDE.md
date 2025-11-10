# FlightPro AI - Production Deployment Guide

## Overview
This guide will walk you through deploying FlightPro AI to production using:
- **Frontend/API**: Vercel (Free Tier)
- **Database**: Neon PostgreSQL (Free Tier)
- **Redis**: Upstash (Free Tier)
- **Background Jobs**: Vercel Cron Jobs (Free)
- **Auth**: Firebase (Free Tier)

**Total Monthly Cost**: $0 for demo/low traffic 🎉

---

## Prerequisites

Before starting, ensure you have:
- [x] GitHub account (for code hosting)
- [ ] Vercel account (vercel.com)
- [ ] Neon account (neon.tech)
- [ ] Upstash account (upstash.com)
- [ ] Firebase project (firebase.google.com)
- [ ] WeatherAPI.com API key (optional, for weather features)

---

## Step 1: Set Up Neon PostgreSQL

1. **Create Account**:
   - Go to https://neon.tech
   - Sign up with GitHub (recommended)

2. **Create Project**:
   - Click "New Project"
   - Name: `flightpro-prod`
   - Region: Choose closest to your users (e.g., US East for North America)
   - Click "Create Project"

3. **Get Connection String**:
   - Click "Connection Details"
   - Copy the **Pooled connection** string
   - Format: `postgresql://user:password@host/dbname?sslmode=require`
   - Save this - you'll need it for Vercel

4. **Enable Pooling** (Important for serverless):
   - Already enabled by default for pooled connections
   - Vercel serverless functions work best with pooled connections

---

## Step 2: Set Up Upstash Redis

1. **Create Account**:
   - Go to https://upstash.com
   - Sign up with GitHub

2. **Create Database**:
   - Click "Create Database"
   - Name: `flightpro-prod`
   - Type: **Regional** (free tier)
   - Region: Choose same as Neon if possible
   - Click "Create"

3. **Get Connection Details**:
   - On database page, go to "REST API" tab
   - Copy:
     - `UPSTASH_REDIS_REST_URL`
     - `UPSTASH_REDIS_REST_TOKEN`
   - Save these for Vercel

---

## Step 3: Prepare Firebase for Production

1. **Go to Firebase Console**: https://console.firebase.google.com

2. **Select Your Project** (or create one)

3. **Get Service Account**:
   - Go to Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Download the JSON file
   - Extract these values:
     - `project_id`
     - `private_key`
     - `client_email`

4. **Enable Authentication**:
   - Go to Authentication → Sign-in method
   - Enable Email/Password
   - Add authorized domain: `your-app.vercel.app`

5. **Get Web Config**:
   - Go to Project Settings → General
   - Scroll to "Your apps" → Web app
   - Copy config values:
     - `apiKey`
     - `authDomain`
     - `projectId`
     - `storageBucket`
     - `messagingSenderId`
     - `appId`

---

## Step 4: Configure Vercel Project

### A. Install Vercel CLI (if not already installed)

```bash
npm install -g vercel
```

### B. Login to Vercel

```bash
vercel login
```

### C. Link Project

```bash
cd /Users/courtneyblaskovich/Documents/Projects/FlightProAIRescheduler
vercel link
```

Follow prompts:
- Set up and deploy? → **No** (we'll configure first)
- Which scope? → Select your account
- Link to existing project? → **No**
- What's your project's name? → `flightpro-ai-rescheduler`
- In which directory is your code located? → `./` (press enter)

### D. Set Environment Variables

Run this command to set each variable (replace values with your own):

```bash
# Database
vercel env add DATABASE_URL
# Paste your Neon pooled connection string

# Redis
vercel env add UPSTASH_REDIS_REST_URL
# Paste your Upstash REST URL

vercel env add UPSTASH_REDIS_REST_TOKEN
# Paste your Upstash REST token

# Firebase Admin (for backend)
vercel env add FIREBASE_ADMIN_PROJECT_ID
# Your Firebase project ID

vercel env add FIREBASE_ADMIN_CLIENT_EMAIL
# Your service account email

vercel env add FIREBASE_ADMIN_PRIVATE_KEY
# Your service account private key (with \n preserved)

# Firebase Client (for frontend)
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID

# Weather API (optional)
vercel env add WEATHER_API_KEY
# Your WeatherAPI.com key

# Email (optional - for notifications)
vercel env add RESEND_API_KEY
# Your Resend.com API key (if using email notifications)

# App URL (will be set after first deploy)
vercel env add NEXT_PUBLIC_APP_URL
# https://your-app.vercel.app
```

**Important**: For each variable, select:
- **Production**: Yes
- **Preview**: Yes (optional)
- **Development**: No (use .env.local locally)

---

## Step 5: Run Database Migrations

Before deploying, we need to push the database schema to Neon:

```bash
# Update DATABASE_URL in .env to point to Neon
echo "DATABASE_URL=your_neon_pooled_connection_string" > .env

# Push schema
npx prisma db push

# (Optional) Seed demo data
npx tsx scripts/create-demo-accounts.ts
```

---

## Step 6: Deploy to Production

### A. First Deployment

```bash
vercel --prod
```

This will:
1. Build your application
2. Deploy to production
3. Return your production URL (e.g., `https://flightpro-ai-rescheduler.vercel.app`)

### B. Update App URL

After deployment, update the `NEXT_PUBLIC_APP_URL` variable:

```bash
vercel env add NEXT_PUBLIC_APP_URL production
# Enter your production URL
```

### C. Redeploy with Updated URL

```bash
vercel --prod
```

---

## Step 7: Set Up Cron Jobs (Weather Checks)

Create `vercel.json` in project root (already exists, verify content):

```json
{
  "crons": [
    {
      "path": "/api/cron/weather-check",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/cleanup-old-alerts",
      "schedule": "0 0 * * *"
    }
  ]
}
```

**Note**: Vercel cron jobs only work on **Pro plans** ($20/month). For free tier:
- Use external cron service (cron-job.org - free)
- Or manually trigger weather checks from admin panel

---

## Step 8: Configure Firebase Authorized Domains

1. Go to Firebase Console → Authentication → Settings
2. Under "Authorized domains", add:
   - `your-app.vercel.app`
   - Any custom domain you're using

---

## Step 9: Verify Deployment

### A. Health Check

Visit: `https://your-app.vercel.app/api/health`

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-10T..."
}
```

### B. Test Authentication

1. Go to `https://your-app.vercel.app`
2. Click a demo account badge
3. Log in
4. Verify dashboard loads

### C. Test Core Features

- [ ] View flights
- [ ] Book a flight
- [ ] View weather alerts
- [ ] Request reschedule
- [ ] Confirm reschedule (as instructor)

---

## Step 10: Monitor and Maintain

### Vercel Dashboard

- **Analytics**: Monitor page views, performance
- **Logs**: View function execution logs
- **Deployments**: Rollback if needed

### Neon Dashboard

- **Usage**: Monitor database usage (500MB limit on free tier)
- **Branches**: Create branches for testing

### Upstash Dashboard

- **Commands**: Monitor Redis usage (10k commands/day on free tier)

---

## Troubleshooting

### Issue: "Database connection error"

**Solution**:
1. Verify `DATABASE_URL` is correct in Vercel
2. Ensure connection string uses **pooled** endpoint
3. Check Neon database is active (auto-pauses after inactivity)

### Issue: "Authentication required"

**Solution**:
1. Verify all Firebase env variables are set
2. Check Firebase authorized domains include your Vercel URL
3. Verify service account key is formatted correctly (preserve \n)

### Issue: "Redis connection failed"

**Solution**:
1. Verify Upstash REST URL and token are correct
2. Check Upstash database is active
3. Ensure you're using REST API credentials (not native)

### Issue: "Weather checks not running"

**Solution**:
- Free tier: Use external cron service or manual triggers
- Pro tier: Verify `vercel.json` cron configuration

---

## Scaling Considerations

### When to Upgrade

**Database (Neon)**:
- Storage > 500MB → Neon Pro ($19/month)
- Need more compute → Neon Scale (usage-based)

**Redis (Upstash)**:
- Commands > 10k/day → Upstash Pro ($10/month minimum)
- Need more storage → Usage-based pricing

**Hosting (Vercel)**:
- Need cron jobs → Vercel Pro ($20/month)
- Bandwidth > 100GB → Vercel Pro
- Need custom domain SSL → Free on all tiers

---

## Security Best Practices

1. **Never commit secrets** to git
2. **Use environment variables** for all sensitive data
3. **Enable 2FA** on Vercel, Neon, Firebase
4. **Rotate keys** regularly (quarterly)
5. **Monitor logs** for suspicious activity
6. **Keep dependencies updated** (`npm audit`)

---

## Backup Strategy

### Database

Neon automatically backs up:
- Point-in-time recovery (7 days on free tier)
- Manual backups via `pg_dump`:

```bash
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

### Code

- Push to GitHub regularly
- Tag releases: `git tag v1.0.0`
- Use Vercel's deployment history for rollbacks

---

## Custom Domain (Optional)

1. **Buy domain** (e.g., Namecheap, Google Domains)
2. **Add to Vercel**:
   - Project Settings → Domains
   - Add your domain
   - Update DNS records as instructed
3. **Update Firebase**:
   - Add custom domain to authorized domains
4. **Update env variable**:
   ```bash
   vercel env add NEXT_PUBLIC_APP_URL production
   # Enter: https://your-custom-domain.com
   ```

---

## Cost Summary

### Free Tier (Recommended for Demo)

| Service | Free Tier Limits | Estimated Usage |
|---------|------------------|-----------------|
| Vercel | 100GB bandwidth, 100hrs functions | ~5GB, ~10hrs |
| Neon | 500MB storage, 1 compute | ~50MB, always on |
| Upstash | 10k commands/day, 256MB | ~1k/day, ~10MB |
| Firebase | 50k reads/day, 20k writes/day | ~100 reads/day |
| **Total** | **$0/month** | Well within limits |

### If You Need to Scale

- **Light usage** (100 users/day): Still $0
- **Medium usage** (1000 users/day): ~$20/month (Vercel Pro)
- **Heavy usage** (10k users/day): ~$100/month (all paid tiers)

---

## Next Steps After Deployment

1. [ ] Set up monitoring (Sentry, LogRocket)
2. [ ] Configure analytics (Vercel Analytics, Google Analytics)
3. [ ] Set up status page (status.io)
4. [ ] Document API endpoints
5. [ ] Create user onboarding guide
6. [ ] Set up automated testing (GitHub Actions)

---

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Neon database status
3. Review this guide's troubleshooting section
4. Contact support: [Your support email]

---

**Deployment Checklist**:
- [ ] Neon database created
- [ ] Upstash Redis created
- [ ] Firebase configured
- [ ] Vercel project linked
- [ ] All environment variables set
- [ ] Database schema pushed
- [ ] Demo accounts created
- [ ] First deployment successful
- [ ] Health check passes
- [ ] Core features tested
- [ ] Firebase domains updated
- [ ] Monitoring set up

**You're ready for production!** 🚀

