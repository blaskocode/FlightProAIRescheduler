# Redis Setup Guide

Redis is required for BullMQ background jobs (weather checks, currency checks, maintenance reminders).

## Quick Setup Options

### Option 1: Upstash (Recommended - Free Tier Available)

1. Go to https://upstash.com
2. Sign up / Log in (can use GitHub)
3. Click **"Create Database"**
4. Choose:
   - **Type**: Regional (or Global for multi-region)
   - **Name**: `flight-pro-jobs` (or your choice)
   - **Region**: Choose closest to you (e.g., `us-east-1`)
   - **Primary region**: Same as above
5. Click **"Create"**
6. Wait ~30 seconds for database to be created
7. Go to **Details** tab
8. Copy the **Redis URL** - it will look like:
   ```
   redis://default:AbCdEf123456@ep-cool-name-12345.upstash.io:6379
   ```

**Free Tier Limits:**
- 10,000 commands/day
- 256 MB storage
- Perfect for development and small production

---

### Option 2: Vercel KV (If Deploying to Vercel)

1. In your Vercel project dashboard
2. Go to **Storage** tab
3. Click **"Create Database"** > **KV**
4. Choose plan (Hobby is free)
5. Select region
6. Click **"Create"**
7. Copy the connection string from the **.env.local** tab

**Note**: Vercel KV uses REST API, so you might need to adjust the connection code slightly.

---

### Option 3: Redis Cloud (Free Tier)

1. Go to https://redis.com/try-free/
2. Sign up
3. Create a free database
4. Copy connection string

---

### Option 4: Local Redis (Development Only)

**macOS:**
```bash
brew install redis
brew services start redis
```

**Connection string:**
```
REDIS_URL="redis://localhost:6379"
```

**Note**: This only works locally, not for production deployment.

---

## Add to .env File

Once you have the Redis connection string, add it to your `.env` file:

```bash
REDIS_URL="redis://default:password@host:6379"
```

**Format:**
- Starts with `redis://`
- Format: `redis://[username]:[password]@[host]:[port]`
- Username is often `default`
- Port is usually `6379`

---

## Verify Redis Connection

After adding REDIS_URL, you can test the connection:

```bash
# Create a test file
cat > test-redis.js << 'EOF'
require('dotenv').config({ path: '.env' });
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL);

redis.ping()
  .then(() => {
    console.log('✅ Redis connected successfully!');
    redis.quit();
  })
  .catch(err => {
    console.error('❌ Redis connection failed:', err.message);
    process.exit(1);
  });
EOF

# Run the test
node test-redis.js
```

---

## Next Steps After Redis

Once Redis is set up:
1. ✅ Firebase - DONE
2. ✅ Database - DONE  
3. ✅ Redis - DONE
4. ⏭️ OpenAI (for AI rescheduling)
5. ⏭️ Resend (for email notifications)

---

## Troubleshooting

**Connection refused:**
- Check if Redis URL is correct
- Verify host and port
- Check if database is active in Upstash dashboard

**Authentication failed:**
- Verify password is correct
- Check if username is `default` or something else

**SSL/TLS errors:**
- Some Redis providers require SSL
- Upstash works with standard redis:// protocol
- If needed, use `rediss://` (note the double 's')

---

## Quick Reference

**Upstash Redis URL format:**
```
redis://default:password@ep-name-12345.region.upstash.io:6379
```

**Vercel KV (if using REST API):**
```
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
```

