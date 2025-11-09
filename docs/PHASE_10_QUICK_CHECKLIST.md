# Phase 10: Integration Testing - Quick Checklist

**Time**: 20 minutes  
**Status**: Ready to Execute

---

## ✅ Pre-Test Checklist

- [ ] Development server running (`npm run dev`)
- [ ] Database connected and seeded
- [ ] Firebase configured (check `.env.local`)
- [ ] Resend API key configured (check `.env.local`)
- [ ] Redis connected (check `.env.local`)
- [ ] Test accounts created

---

## Step 10.1: Email Notifications (7 min)

### Test 1: Weather Alert Email
- [ ] Log in as admin → `/admin/settings`
- [ ] Click "Run Manual Weather Check"
- [ ] Wait 10-15 seconds
- [ ] Check email inbox for weather alerts
- [ ] Verify email content (flight details, weather, links)

### Test 2: Reschedule Suggestion Email
- [ ] Log in as student → `/flights`
- [ ] Click "Reschedule" on flight with alert
- [ ] Wait for AI suggestions
- [ ] Check email inbox for reschedule options
- [ ] Verify 3 options listed, links work

### Test 3: Confirmation Email
- [ ] Log in as instructor → `/flights`
- [ ] Confirm pending reschedule
- [ ] Check email inbox (student + instructor)
- [ ] Verify confirmation emails sent

**Result**: ✅ Pass / ⚠️ Partial / ❌ Fail

---

## Step 10.2: Firebase Realtime (6 min)

### Test 1: Real-Time Flight Updates
- [ ] Open 2 browser windows, same student logged in
- [ ] Navigate to `/flights` in both
- [ ] In Window 1: Accept reschedule
- [ ] In Window 2: Watch for auto-update (no refresh)
- [ ] Verify update appears within 2 seconds

### Test 2: Real-Time Weather Alerts
- [ ] Open 2 browser windows, same student
- [ ] Navigate to `/dashboard` in both
- [ ] In admin browser: Trigger weather check
- [ ] In student windows: Watch for alert
- [ ] Verify alert appears without refresh

### Test 3: Real-Time Notifications
- [ ] Open 2 browser windows, same student
- [ ] Navigate to `/dashboard` in both
- [ ] In instructor browser: Confirm reschedule
- [ ] In student windows: Watch notification badge
- [ ] Verify notification count updates

**Result**: ✅ Pass / ⚠️ Partial / ❌ Fail

---

## Step 10.3: Background Jobs (7 min)

### Test 1: Weather Check Job
- [ ] Log in as admin → `/admin/settings`
- [ ] Click "Run Manual Weather Check"
- [ ] Wait 10-15 seconds
- [ ] Check success/failure counts displayed
- [ ] Verify weather checks in database (Prisma Studio)
- [ ] Verify weather alerts created

### Test 2: Currency Check Job
- [ ] Trigger currency check (API or UI):
  ```bash
  curl -X POST http://localhost:3000/api/jobs/currency-check
  ```
- [ ] Wait 5-10 seconds
- [ ] Check database for currency warnings
- [ ] Verify notifications sent

### Test 3: Maintenance Reminder Job
- [ ] Trigger maintenance reminder (API or UI):
  ```bash
  curl -X POST http://localhost:3000/api/jobs/maintenance-reminder
  ```
- [ ] Wait 5-10 seconds
- [ ] Check database for maintenance alerts
- [ ] Verify aircraft blocked if due soon

### Test 4: Reschedule Expiration Job
- [ ] Create reschedule request (from previous tests)
- [ ] Trigger expiration job:
  ```bash
  curl -X POST http://localhost:3000/api/jobs/reschedule-expiration
  ```
- [ ] Check database for expired requests
- [ ] Verify status updated to EXPIRED

**Result**: ✅ Pass / ⚠️ Partial / ❌ Fail

---

## Final Results

**Date**: _______________

### Email Notifications
- Status: ✅ / ⚠️ / ❌
- Notes: _________________________________

### Firebase Realtime
- Status: ✅ / ⚠️ / ❌
- Notes: _________________________________

### Background Jobs
- Status: ✅ / ⚠️ / ❌
- Notes: _________________________________

### Overall Integration Test
- Status: ✅ Pass / ⚠️ Partial / ❌ Fail
- Issues: _________________________________
- Ready for Production: Yes / No

---

## Quick Commands

```bash
# Test Weather Check Job
curl -X POST http://localhost:3000/api/jobs/weather-check \
  -H "Content-Type: application/json" \
  -d '{"flightId":"YOUR_FLIGHT_ID","checkType":"MANUAL"}'

# Test Currency Check Job
curl -X POST http://localhost:3000/api/jobs/currency-check

# Test Maintenance Reminder Job
curl -X POST http://localhost:3000/api/jobs/maintenance-reminder

# Test Reschedule Expiration Job
curl -X POST http://localhost:3000/api/jobs/reschedule-expiration

# Check Weather Alerts
curl http://localhost:3000/api/weather/alerts

# Check Redis Connection
redis-cli ping  # Should return: PONG
```

---

## Troubleshooting

**Emails not sending?**
- Check `RESEND_API_KEY` in `.env.local`
- Verify domain in Resend dashboard
- Check email address format

**Real-time not working?**
- Check Firebase config in `.env.local`
- Verify Firebase Realtime Database rules
- Check browser console for errors

**Jobs not processing?**
- Check `REDIS_URL` in `.env.local`
- Verify Redis connection: `redis-cli ping`
- Check workers are running
- Review console logs for errors

---

**For detailed instructions, see**: `docs/PHASE_10_INTEGRATION_TESTING.md`

