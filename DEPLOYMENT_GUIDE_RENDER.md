# FlightPro AI Rescheduler - Render Deployment Guide

## Prerequisites

- ✅ Render Pro account
- ✅ GitHub repository connected to Render
- ✅ Firebase project configured
- ✅ OpenAI API key
- ✅ Weather API key

## Step-by-Step Deployment

### 1. Create PostgreSQL Database

1. Go to Render Dashboard → **New** → **PostgreSQL**
2. Name: `flightpro-db`
3. Plan: **Free** (for testing) or **Starter** (for production)
4. Region: Choose closest to your users
5. Click **Create Database**
6. **Save the connection details** (Internal Database URL)

### 2. Create Redis Instance

1. Go to Render Dashboard → **New** → **Redis**
2. Name: `flightpro-redis`
3. Plan: **Free** (for testing) or **Starter** (for production)
4. Click **Create Redis**
5. **Save the connection URL**

### 3. Create Web Service

1. Go to Render Dashboard → **New** → **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `flightpro-app`
   - **Environment**: `Node`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Build Command**: 
     ```bash
     npm install && npx prisma generate && npm run build
     ```
   - **Start Command**: 
     ```bash
     npm start
     ```
   - **Plan**: **Starter** ($7/mo minimum)

### 4. Set Environment Variables

In your Web Service settings, add these environment variables:

#### Database
```bash
DATABASE_URL=${{flightpro-db.DATABASE_URL}}
```

#### Redis
```bash
REDIS_URL=${{flightpro-redis.REDIS_URL}}
```

#### Firebase Public Config
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

#### Firebase Admin (Server-side)
```bash
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

⚠️ **Important**: For `FIREBASE_ADMIN_PRIVATE_KEY`, copy the ENTIRE private key including the header/footer and all newlines.

#### API Keys
```bash
OPENAI_API_KEY=sk-...
WEATHER_API_KEY=your_weather_api_key
```

#### App Configuration
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.onrender.com
```

### 5. Initial Deployment

1. Click **Create Web Service**
2. Render will automatically:
   - Clone your repo
   - Install dependencies
   - Run Prisma generate
   - Build Next.js
   - Start the server

3. **Wait for deployment** (5-10 minutes for first deploy)

### 6. Run Database Migrations

After first deployment, open the **Shell** in Render:

```bash
npx prisma migrate deploy
```

If you have seed data:
```bash
npx prisma db seed
```

### 7. Set Up Cron Jobs (Background Tasks)

1. Go to your Web Service → **Cron Jobs**
2. Add these jobs:

**Hourly Weather Check:**
- **Name**: Weather Check
- **Schedule**: `0 * * * *` (every hour)
- **Command**: 
  ```bash
  curl -X POST https://your-app.onrender.com/api/weather/check-all \
    -H "Authorization: Bearer YOUR_CRON_SECRET"
  ```

**Daily Cleanup:**
- **Name**: Daily Cleanup
- **Schedule**: `0 2 * * *` (2 AM daily)
- **Command**: 
  ```bash
  curl -X POST https://your-app.onrender.com/api/maintenance/cleanup \
    -H "Authorization: Bearer YOUR_CRON_SECRET"
  ```

💡 **Tip**: Generate a `CRON_SECRET` and add it to your environment variables for security.

### 8. Configure Custom Domain (Optional)

1. Go to **Settings** → **Custom Domains**
2. Add your domain: `flightpro.yourdomain.com`
3. Update DNS records as shown
4. SSL certificate auto-generated

### 9. Health Checks

Render automatically monitors:
- **HTTP endpoint**: `https://your-app.onrender.com/`
- **Response time**: Alerts if > 30s
- **Uptime**: 99.9% SLA

Add a health check endpoint (recommended):

```typescript
// src/app/api/health/route.ts
export async function GET() {
  return Response.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
}
```

Configure in Render: **Settings** → **Health Check Path** → `/api/health`

## Post-Deployment Checklist

- [ ] Database migrations applied
- [ ] Seed data created (demo accounts)
- [ ] Firebase authentication working
- [ ] Weather API calls successful
- [ ] Redis caching working
- [ ] Cron jobs scheduled
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Health checks passing
- [ ] Error monitoring set up (Sentry recommended)

## Monitoring & Logs

### View Logs
```bash
# In Render Dashboard → Logs tab
# Or via CLI:
render logs -s your-app
```

### Metrics
- CPU usage
- Memory usage
- Request count
- Response times

All available in **Metrics** tab.

## Troubleshooting

### Build Fails

**Error**: `Prisma Client not generated`
**Fix**: Ensure `npx prisma generate` is in build command

**Error**: `Module not found`
**Fix**: Check `package.json` dependencies, run `npm install`

### Database Connection Issues

**Error**: `Can't reach database server`
**Fix**: 
1. Verify `DATABASE_URL` is set correctly
2. Use **Internal Database URL** (not External)
3. Check database is running

### Redis Connection Issues

**Error**: `Redis connection failed`
**Fix**:
1. Verify `REDIS_URL` is set
2. Check Redis instance is running
3. Ensure same region as web service

### Cold Starts

**Issue**: First request after inactivity is slow
**Fix**: 
- Upgrade to **Standard** plan ($25/mo) for always-on
- Or keep free tier and accept 30s cold start

### Memory Issues

**Error**: `JavaScript heap out of memory`
**Fix**: Upgrade to larger plan with more RAM

## Scaling

### Horizontal Scaling
- **Standard plan**: 1 instance
- **Pro plan**: Multiple instances with load balancer

### Vertical Scaling
- Increase RAM/CPU via plan upgrade

### Database Scaling
- Upgrade PostgreSQL plan for more storage/connections
- Enable connection pooling (Prisma supports this)

## Cost Optimization

### Free Tier Setup (Testing)
- Web Service: **Free** (spins down after inactivity)
- PostgreSQL: **Free** (1GB storage)
- Redis: **Free** (25MB)
- **Total: $0/mo** ✅

⚠️ **Limitations**:
- Spins down after 15 min inactivity (30s cold start)
- Limited resources
- Not suitable for production

### Production Setup (Recommended)
- Web Service: **Starter** ($7/mo)
- PostgreSQL: **Starter** ($7/mo, 10GB)
- Redis: **Starter** ($10/mo, 256MB)
- **Total: $24/mo** ✅

### High-Traffic Setup
- Web Service: **Standard** ($25/mo, always on)
- PostgreSQL: **Standard** ($25/mo, 50GB)
- Redis: **Standard** ($25/mo, 1GB)
- **Total: $75/mo**

## Security Checklist

- [ ] All environment variables set
- [ ] CRON_SECRET configured for cron jobs
- [ ] Firebase Admin private key secured
- [ ] API keys not exposed in frontend
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] SQL injection protection (Prisma handles this)
- [ ] XSS protection enabled
- [ ] HTTPS enforced (automatic on Render)

## Backup Strategy

### Database Backups
- **Free/Starter**: Daily automatic backups (7 days retention)
- **Standard+**: Daily + on-demand backups (30 days retention)

### Manual Backup
```bash
pg_dump $DATABASE_URL > backup.sql
```

### Restore
```bash
psql $DATABASE_URL < backup.sql
```

## Rollback Strategy

1. **Via Render Dashboard**:
   - Go to **Deploys** tab
   - Find previous successful deploy
   - Click **Redeploy**

2. **Via Git**:
   ```bash
   git revert HEAD
   git push
   ```

## Support Resources

- **Render Docs**: https://render.com/docs
- **Render Status**: https://status.render.com
- **Community**: https://community.render.com
- **Support**: hello@render.com (Pro plan includes support)

## Next Steps

1. **Set up monitoring**: Integrate Sentry or LogRocket
2. **Configure alerts**: Email/Slack notifications for errors
3. **Load testing**: Use Artillery or k6
4. **Performance optimization**: Enable caching, CDN
5. **Documentation**: Update README with production URL

---

🎉 **Congratulations!** Your FlightPro AI Rescheduler is now live on Render!

For questions or issues, refer to the troubleshooting section or contact Render support.

