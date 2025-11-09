# Mapbox Setup Guide

## Overview

The Weather Map feature uses Mapbox GL JS to display airport weather alerts on an interactive map.

## Getting Your Free Mapbox Token

### Step 1: Create Mapbox Account

1. Go to https://account.mapbox.com/auth/signup/
2. Sign up for a free account (no credit card required)
3. Verify your email address

### Step 2: Get Access Token

1. Log in to https://account.mapbox.com/
2. Go to "Access tokens" page
3. You'll see a "Default public token" already created
4. **Copy this token** (starts with `pk.`)

### Step 3: Add Token to Project

1. Open `.env.local` in your project root
2. Add this line:

```bash
NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here
```

3. Replace `your_token_here` with your actual token
4. Save the file
5. Restart your dev server

## Example `.env.local`

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
# ... other Firebase vars ...

# Mapbox (new)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbTM3dGR6ODMwZmVpMmtzOGdoOHVyOWxnIn0.example

# OpenAI
OPENAI_API_KEY=your_openai_key
```

## Free Tier Limits

Mapbox's free tier includes:
- ✅ **50,000 map loads per month** (plenty for this project)
- ✅ Unlimited markers
- ✅ All map styles
- ✅ No credit card required until you exceed free tier

## Map Features

Once configured, the Weather Map will show:
- Interactive map with zoom and pan
- Color-coded markers for each airport:
  - 🔴 Red = UNSAFE weather
  - 🟡 Yellow = MARGINAL weather
  - 🟢 Green = SAFE weather
- Click markers to see:
  - Airport code
  - Weather status
  - Active alerts
  - Flight times
  - Confidence levels
  - Reasons for alerts

## Troubleshooting

### Map Not Displaying

**Error**: Blank map or "Mapbox token error"

**Solution**: 
1. Check that `NEXT_PUBLIC_MAPBOX_TOKEN` is set in `.env.local`
2. Make sure token starts with `pk.`
3. Restart your dev server after adding token

### "Invalid Token" Error

**Solution**:
1. Go to https://account.mapbox.com/access-tokens/
2. Check if token is active (green status)
3. Create a new token if needed
4. Update `.env.local` with new token

### Map Shows But No Markers

**Solution**:
- This is normal if there are no weather alerts
- Create some test weather checks using the script:
  ```bash
  npm run db:weather-checks
  ```

## Production Deployment

When deploying to Vercel/Netlify:

1. Add `NEXT_PUBLIC_MAPBOX_TOKEN` to environment variables
2. Use the same token (it's a public token)
3. For production, optionally create a separate token with URL restrictions

## Optional: Token Restrictions (Recommended for Production)

1. Go to https://account.mapbox.com/access-tokens/
2. Click your token
3. Add "URL restrictions":
   - `http://localhost:3000/*` (for dev)
   - `https://your-domain.com/*` (for production)
4. Save changes

This prevents unauthorized use of your token.

## Need Help?

- Mapbox Docs: https://docs.mapbox.com/mapbox-gl-js/guides/
- Support: https://support.mapbox.com/
- Pricing: https://www.mapbox.com/pricing/

---

**Status**: Map is ready to use once token is added!

