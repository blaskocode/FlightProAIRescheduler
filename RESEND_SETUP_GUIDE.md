# Resend Setup Guide

Resend is required for sending email notifications (weather alerts, reschedule suggestions, confirmations, etc.).

## Quick Setup Steps

### Step 1: Sign Up for Resend

1. Go to https://resend.com
2. Click **"Sign Up"** (can use GitHub, Google, or email)
3. Complete the sign-up process

### Step 2: Get API Key

1. After logging in, go to **API Keys** (https://resend.com/api-keys)
2. Click **"Create API Key"**
3. Name it: `Flight Pro Production` (or `Flight Pro Development`)
4. Select permissions: **"Full Access"** (or "Sending Access" if available)
5. Click **"Add"**
6. **Copy the API key immediately** - it starts with `re_` and you won't see it again!

### Step 3: Domain Setup (Two Options)

#### Option A: Use Resend Test Domain (Quick - For Development)

For development and testing, you can use Resend's test domain:
- **From Email**: `onboarding@resend.dev`
- **No domain verification needed**
- **Limited to 100 emails/day**
- **Perfect for testing**

#### Option B: Verify Your Own Domain (For Production)

1. Go to **Domains** (https://resend.com/domains)
2. Click **"Add Domain"**
3. Enter your domain (e.g., `yourdomain.com`)
4. Add DNS records to your domain:
   - **SPF record**: `v=spf1 include:resend.com ~all`
   - **DKIM records**: (Resend will provide these)
   - **DMARC record** (optional): `v=DMARC1; p=none;`
5. Wait for verification (~5-10 minutes)
6. Once verified, you can use: `noreply@yourdomain.com`

---

## Add to .env File

Add these two variables to your `.env` file:

**For Development (using test domain):**
```bash
RESEND_API_KEY="re_AbCdEf1234567890..."
RESEND_FROM_EMAIL="onboarding@resend.dev"
```

**For Production (using your domain):**
```bash
RESEND_API_KEY="re_AbCdEf1234567890..."
RESEND_FROM_EMAIL="noreply@yourdomain.com"
```

---

## Verify Setup

After adding the variables, you can test the connection by starting your dev server:

```bash
npm run dev
```

Then try accessing a page that would send an email (like triggering a weather alert or reschedule notification).

---

## What Resend is Used For

Resend sends these email notifications:
- ⚠️ Weather conflict alerts
- 🔄 Reschedule suggestions
- ✅ Reschedule confirmations
- 📧 Pre-flight weather briefings (30 min before)
- ⏰ Currency warnings (approaching 90 days)
- 🔧 Maintenance alerts
- ✈️ Flight reminders

---

## Free Tier Limits

- **100 emails/day** on free tier
- **3,000 emails/month** on free tier
- Perfect for development and small production use

---

## Troubleshooting

**"Invalid API key" error:**
- Verify the API key starts with `re_`
- Check for extra spaces or quotes
- Make sure you copied the full key

**"Domain not verified" error:**
- Use `onboarding@resend.dev` for testing
- Or verify your domain in Resend dashboard

**Emails not sending:**
- Check Resend dashboard for delivery logs
- Verify `RESEND_FROM_EMAIL` matches verified domain
- Check spam folder

---

## Next Steps After Resend

Once Resend is configured:
1. ✅ Firebase - DONE
2. ✅ Database - DONE
3. ✅ Redis - (if you set it up)
4. ✅ OpenAI - DONE
5. ✅ Resend - DONE

**Then you can:**
- Test the full system end-to-end
- Run database seed to populate test data
- Test authentication flow
- Test weather checking
- Test AI rescheduling
- Test email notifications

---

## Quick Reference

**API Key Format:**
```
RESEND_API_KEY="re_AbCdEf1234567890GhIjKlMnOpQrStUvWxYz"
```

**Test Email (Development):**
```
RESEND_FROM_EMAIL="onboarding@resend.dev"
```

**Production Email:**
```
RESEND_FROM_EMAIL="noreply@yourdomain.com"
```

