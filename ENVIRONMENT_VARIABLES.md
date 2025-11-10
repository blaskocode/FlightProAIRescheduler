# Production Environment Variables

This file documents all environment variables needed for production deployment.

## Required Variables

### Database (Neon PostgreSQL)
```bash
DATABASE_URL="postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"
```
- Get from: Neon Dashboard → Connection Details → Pooled connection
- **Important**: Use the **pooled** connection string for serverless

### Redis (Upstash)
```bash
UPSTASH_REDIS_REST_URL="https://xxx-xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"
```
- Get from: Upstash Dashboard → REST API tab

### Firebase Admin (Backend - Secret)
```bash
FIREBASE_ADMIN_PROJECT_ID="your-project-id"
FIREBASE_ADMIN_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com"
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\nHere\n-----END PRIVATE KEY-----\n"
```
- Get from: Firebase Console → Project Settings → Service Accounts → Generate New Private Key

**Important**: When setting `FIREBASE_ADMIN_PRIVATE_KEY` in Vercel:
- Keep the `\n` characters
- Include quotes around the entire value
- Format: `"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"`

### Firebase Client (Frontend - Public)
```bash
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789012"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789012:web:xxxxxxxxxxxxx"
```
- Get from: Firebase Console → Project Settings → General → Your apps → Web app config

### Application URL
```bash
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
```
- Set this after your first deployment
- This is your Vercel production URL

## Optional Variables

### Weather API
```bash
WEATHER_API_KEY="your-weatherapi-com-key"
```
- Get from: https://www.weatherapi.com (free tier available)
- Required for weather checking features

### Email Notifications (Resend)
```bash
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxx"
RESEND_FROM_EMAIL="noreply@your-domain.com"
```
- Get from: https://resend.com
- Required for email notifications

### Cron Job Security (Vercel Pro only)
```bash
CRON_SECRET="your-random-secure-string"
```
- Generate a random string for cron job authentication
- Optional if using Vercel's automatic cron auth

### Node Environment
```bash
NODE_ENV="production"
```
- Usually set automatically by Vercel

## Setting Variables in Vercel

### Via CLI
```bash
# Format: vercel env add VARIABLE_NAME
vercel env add DATABASE_URL

# When prompted:
# 1. Enter the value
# 2. Select environments: Production (Yes), Preview (Optional), Development (No)
```

### Via Dashboard
1. Go to your project on vercel.com
2. Settings → Environment Variables
3. Add each variable
4. Select Production environment
5. Save

## Verifying Variables

After setting all variables, run:
```bash
vercel env ls
```

You should see all variables listed for production.

## Security Notes

1. **Never commit** `.env` files with real values to git
2. **Never expose** secret keys in client-side code
3. **Use `NEXT_PUBLIC_`** prefix only for truly public values
4. **Rotate keys** regularly (quarterly recommended)
5. **Enable 2FA** on all services (Vercel, Firebase, Neon)

## Deployment Order

1. Set all required environment variables first
2. Deploy to production
3. Update `NEXT_PUBLIC_APP_URL` with your deployment URL
4. Redeploy to pick up the updated URL

## Troubleshooting

### "Environment variable not found"
- Ensure variable is set in Vercel for Production environment
- Redeploy after adding variables

### "Invalid private key"
- Verify `FIREBASE_ADMIN_PRIVATE_KEY` includes `\n` characters
- Ensure quotes are properly escaped
- Try copying directly from downloaded service account JSON

### "Database connection failed"
- Verify you're using the **pooled** connection string
- Check Neon database is active (may pause after inactivity)
- Verify SSL mode is included: `?sslmode=require`

