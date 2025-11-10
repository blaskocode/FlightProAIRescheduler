# Deploy to Production - Quick Start

**Time Required**: 20-30 minutes (first time)

## TL;DR

```bash
# 1. Set up services (one-time)
# - Sign up for Neon (neon.tech)
# - Sign up for Upstash (upstash.com)
# - Configure Firebase

# 2. Set environment variables in Vercel
vercel env add DATABASE_URL
vercel env add UPSTASH_REDIS_REST_URL
# ... (see ENVIRONMENT_VARIABLES.md for full list)

# 3. Push database schema
npx prisma db push

# 4. Deploy
./scripts/deploy.sh
```

## Step-by-Step Instructions

### 1. Prerequisites (5 minutes)

**Create accounts** (if you don't have them):
- [Neon](https://neon.tech) - PostgreSQL database
- [Upstash](https://upstash.com) - Redis
- [Vercel](https://vercel.com) - Hosting
- Firebase project (already set up)

### 2. Set Up Neon Database (5 minutes)

1. Go to https://neon.tech
2. Click "New Project"
3. Name: `flightpro-prod`
4. Region: US East (or closest to you)
5. Copy the **Pooled connection** string
6. Save it for step 4

### 3. Set Up Upstash Redis (3 minutes)

1. Go to https://upstash.com
2. Click "Create Database"
3. Name: `flightpro-prod`
4. Type: Regional (free)
5. Region: Same as Neon if possible
6. Go to REST API tab
7. Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
8. Save them for step 4

### 4. Configure Vercel Environment Variables (10 minutes)

**Option A: Using CLI (Recommended)**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project
cd /path/to/FlightProAIRescheduler
vercel link

# Add each variable
vercel env add DATABASE_URL
# Paste your Neon pooled connection string

vercel env add UPSTASH_REDIS_REST_URL
# Paste your Upstash REST URL

vercel env add UPSTASH_REDIS_REST_TOKEN
# Paste your Upstash token

# Continue for all variables...
# See ENVIRONMENT_VARIABLES.md for the complete list
```

**Option B: Using Vercel Dashboard**

1. Push your code to GitHub
2. Go to vercel.com
3. Import your GitHub repository
4. Go to Settings → Environment Variables
5. Add each variable from `ENVIRONMENT_VARIABLES.md`
6. Select "Production" environment
7. Save

**Required Variables**:
- `DATABASE_URL` - From Neon
- `UPSTASH_REDIS_REST_URL` - From Upstash
- `UPSTASH_REDIS_REST_TOKEN` - From Upstash
- `FIREBASE_ADMIN_PROJECT_ID` - From Firebase
- `FIREBASE_ADMIN_CLIENT_EMAIL` - From Firebase
- `FIREBASE_ADMIN_PRIVATE_KEY` - From Firebase
- `NEXT_PUBLIC_FIREBASE_API_KEY` - From Firebase
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - From Firebase
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - From Firebase
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` - From Firebase
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - From Firebase
- `NEXT_PUBLIC_FIREBASE_APP_ID` - From Firebase
- `NEXT_PUBLIC_APP_URL` - Set after first deploy

### 5. Push Database Schema (2 minutes)

```bash
# Update .env with your production DATABASE_URL
echo "DATABASE_URL=your_neon_pooled_connection" > .env

# Push schema to Neon
npx prisma db push

# Create demo accounts (optional)
npx tsx scripts/create-demo-accounts.ts
```

### 6. Deploy! (5 minutes)

```bash
# Automated deployment
./scripts/deploy.sh

# Or manual
vercel --prod
```

### 7. Post-Deployment (3 minutes)

After first deployment:

1. **Update App URL**:
   ```bash
   vercel env add NEXT_PUBLIC_APP_URL production
   # Enter: https://your-app.vercel.app
   ```

2. **Update Firebase Authorized Domains**:
   - Go to Firebase Console → Authentication → Settings
   - Add your Vercel URL to authorized domains

3. **Redeploy**:
   ```bash
   vercel --prod
   ```

4. **Verify**:
   - Visit: `https://your-app.vercel.app/api/health`
   - Should return: `{"status":"ok",...}`

### 8. Test Your Deployment

1. **Health Check**: `https://your-app.vercel.app/api/health`
2. **Login**: Use demo account badges on homepage
3. **Book Flight**: Test as student
4. **View Dashboard**: Verify all features work

## Troubleshooting

### "Build failed"
- Check `vercel logs` for errors
- Verify all environment variables are set
- Run `npm run build` locally to test

### "Database connection error"
- Verify DATABASE_URL is the **pooled** connection
- Check Neon database is active (may auto-pause)
- Ensure `?sslmode=require` is in connection string

### "Authentication required"
- Verify all Firebase env variables are set correctly
- Check Firebase authorized domains include your Vercel URL
- Ensure `FIREBASE_ADMIN_PRIVATE_KEY` preserves `\n` characters

### "Redis connection failed"
- Verify Upstash REST URL and token are correct
- Check Upstash database is active
- Ensure you're using REST API credentials

## Cost Monitoring

**Free Tier Limits**:
- Vercel: 100GB bandwidth/month
- Neon: 500MB storage, 1 compute
- Upstash: 10k commands/day, 256MB
- Firebase: 50k reads/day, 20k writes/day

**Check usage**:
- Vercel: Project → Analytics
- Neon: Dashboard → Usage
- Upstash: Database → Metrics

## Rolling Back

If something goes wrong:

```bash
# View deployments
vercel ls

# Rollback to previous
vercel rollback [deployment-url]
```

## Getting Help

1. **Check logs**: `vercel logs --follow`
2. **Read docs**: `PRODUCTION_DEPLOYMENT_GUIDE.md`
3. **Environment vars**: `ENVIRONMENT_VARIABLES.md`
4. **Contact support**: support@your-domain.com

## Success Checklist

- [ ] Neon database created and schema pushed
- [ ] Upstash Redis created
- [ ] All environment variables set in Vercel
- [ ] First deployment successful
- [ ] App URL updated in environment variables
- [ ] Firebase authorized domains updated
- [ ] Health check returns OK
- [ ] Can login with demo account
- [ ] Can book a flight
- [ ] Can reschedule a flight
- [ ] Weather alerts appear

**You're live! 🎉**

## Next Steps

- Set up monitoring (Vercel Analytics is free)
- Configure custom domain (optional)
- Set up automated backups
- Monitor usage and costs
- Share with users!

---

**Need more details?** See `PRODUCTION_DEPLOYMENT_GUIDE.md` for comprehensive documentation.

