# Phase 10: Integration Testing - Execution Guide

**Date**: November 8, 2025  
**Estimated Time**: 20 minutes  
**Status**: Ready for Execution

---

## Overview

Phase 10 integration testing verifies that all external services and systems work together correctly:
- Email notifications (Resend)
- Firebase Realtime Database
- Background job processing (BullMQ)

---

## Prerequisites

Before starting, ensure:
- ✅ Development server running (`npm run dev`)
- ✅ Database connected and seeded
- ✅ Firebase configured (check `.env.local`)
- ✅ Resend API key configured (check `.env.local`)
- ✅ Redis connected (check `.env.local`)
- ✅ Test accounts created (student, instructor, admin)

---

## Step 10.1: Test Email Notifications (7 minutes)

### Objective
Verify that email notifications are sent correctly when events occur.

### Test Scenarios

#### Scenario 1: Weather Alert Email

**Steps:**
1. **Log in as admin** (`admin.test@example.com`)
2. **Navigate to**: `/admin/settings`
3. **Click**: "Run Manual Weather Check"
4. **Wait**: 10-15 seconds for processing
5. **Check email inbox** (the email configured in Resend)
   - Look for weather alert emails
   - Check spam folder if not in inbox

**Expected Results:**
- ✅ Weather check job completes
- ✅ Email sent to affected students/instructors
- ✅ Email contains:
  - Flight details
  - Weather conditions
  - Recommended action
  - Link to dashboard

**Verification:**
```bash
# Check Resend dashboard for sent emails
# Or check email inbox for test account
```

**✅ Check:**
- [ ] Email sent (if Resend configured)
- [ ] Content accurate (flight info, weather details)
- [ ] Links functional (dashboard link works)
- [ ] Email formatting correct

---

#### Scenario 2: Reschedule Suggestion Email

**Steps:**
1. **Log in as student** (`student.test@example.com`)
2. **Navigate to**: `/flights`
3. **Find a flight with weather alert** (or create test flight)
4. **Click**: "Reschedule" button
5. **Wait**: 10-15 seconds for AI suggestions
6. **Check email inbox**

**Expected Results:**
- ✅ Reschedule request created
- ✅ AI generates 3 suggestions
- ✅ Email sent with reschedule options
- ✅ Email contains links to accept/reject

**Verification:**
```bash
# Check database for RescheduleRequest
# Check Resend dashboard for sent emails
```

**✅ Check:**
- [ ] Email sent with reschedule suggestions
- [ ] 3 options listed in email
- [ ] Links to accept/reject work
- [ ] Email formatting correct

---

#### Scenario 3: Reschedule Confirmation Email

**Steps:**
1. **Complete Scenario 2** (student receives reschedule email)
2. **Log in as instructor** (`instructor.test@example.com`)
3. **Navigate to**: `/flights`
4. **Find pending reschedule request**
5. **Click**: "Confirm" button
6. **Check email inbox** (both student and instructor)

**Expected Results:**
- ✅ Reschedule confirmed
- ✅ Email sent to student (confirmation)
- ✅ Email sent to instructor (confirmation)
- ✅ Both emails contain updated flight details

**✅ Check:**
- [ ] Confirmation emails sent to both parties
- [ ] Email content accurate
- [ ] Updated flight details in email
- [ ] Links to view flight work

---

### Troubleshooting Email Notifications

**If emails not sending:**
1. **Check Resend API key** in `.env.local`:
   ```bash
   RESEND_API_KEY=re_...
   ```

2. **Check Resend domain** is verified:
   - Go to Resend dashboard
   - Verify domain is verified
   - Check DNS records

3. **Check email address** in database:
   - Verify student/instructor emails are valid
   - Check email format

4. **Check console logs**:
   - Look for Resend API errors
   - Check for rate limiting

5. **Test Resend API directly**:
   ```bash
   curl -X POST https://api.resend.com/emails \
     -H "Authorization: Bearer $RESEND_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"from":"test@yourdomain.com","to":"test@example.com","subject":"Test","html":"<p>Test email</p>"}'
   ```

---

## Step 10.2: Test Firebase Realtime (6 minutes)

### Objective
Verify that real-time updates work across multiple browser windows/sessions.

### Test Scenarios

#### Scenario 1: Real-Time Flight Status Updates

**Steps:**
1. **Open two browser windows** (or tabs)
2. **Log in as same student** in both windows
3. **Navigate to**: `/flights` in both windows
4. **In Window 1**: Accept a reschedule request
5. **In Window 2**: Watch for automatic update (no refresh needed)

**Expected Results:**
- ✅ Window 1: Reschedule accepted, status updates
- ✅ Window 2: Flight list updates automatically (within 1-2 seconds)
- ✅ No page refresh needed in Window 2
- ✅ Status changes visible in real-time

**✅ Check:**
- [ ] Real-time updates work
- [ ] No refresh needed
- [ ] Updates appear quickly (<2 seconds)
- [ ] Status changes accurate

---

#### Scenario 2: Real-Time Weather Alert Updates

**Steps:**
1. **Open two browser windows**
2. **Log in as same student** in both windows
3. **Navigate to**: `/dashboard` in both windows
4. **In separate browser** (admin): Trigger weather check
5. **In student windows**: Watch for weather alert to appear

**Expected Results:**
- ✅ Weather alert appears in both windows
- ✅ Alert appears without refresh
- ✅ Alert details accurate
- ✅ Alert appears within 5-10 seconds

**✅ Check:**
- [ ] Weather alerts appear in real-time
- [ ] No refresh needed
- [ ] Alerts appear quickly
- [ ] Alert content accurate

---

#### Scenario 3: Real-Time Notification Updates

**Steps:**
1. **Open two browser windows**
2. **Log in as same student** in both windows
3. **Navigate to**: `/dashboard` in both windows
4. **In separate browser** (instructor): Confirm reschedule
5. **In student windows**: Watch notification bell/badge update

**Expected Results:**
- ✅ Notification count updates in both windows
- ✅ New notification appears in notification list
- ✅ Updates appear without refresh
- ✅ Updates appear within 2-3 seconds

**✅ Check:**
- [ ] Notification updates in real-time
- [ ] Notification count accurate
- [ ] New notifications appear automatically
- [ ] No refresh needed

---

### Troubleshooting Firebase Realtime

**If real-time updates not working:**
1. **Check Firebase config** in `.env.local`:
   ```bash
   FIREBASE_API_KEY=...
   FIREBASE_AUTH_DOMAIN=...
   FIREBASE_PROJECT_ID=...
   FIREBASE_DATABASE_URL=...
   ```

2. **Check Firebase Realtime Database rules**:
   - Go to Firebase Console
   - Navigate to Realtime Database
   - Check rules allow read/write for authenticated users

3. **Check browser console**:
   - Look for Firebase connection errors
   - Check for WebSocket connection issues
   - Verify authentication status

4. **Check Firebase listeners**:
   - Verify `useFirebaseRealtime` hook is working
   - Check component is subscribed to updates
   - Verify Firebase paths are correct

5. **Test Firebase connection**:
   ```javascript
   // In browser console
   import { getDatabase, ref, onValue } from 'firebase/database';
   const db = getDatabase();
   const testRef = ref(db, 'test');
   onValue(testRef, (snapshot) => {
     console.log('Firebase connected:', snapshot.val());
   });
   ```

---

## Step 10.3: Test Background Jobs (7 minutes)

### Objective
Verify that background jobs execute correctly and process tasks as expected.

### Test Scenarios

#### Scenario 1: Weather Check Job

**Steps:**
1. **Log in as admin**
2. **Navigate to**: `/admin/settings`
3. **Click**: "Run Manual Weather Check"
4. **Wait**: 10-15 seconds
5. **Check results**:
   - Weather check status (success/failure count)
   - Weather alerts created
   - Database records (WeatherCheck table)

**Expected Results:**
- ✅ Job queued successfully
- ✅ Job processes within 10-15 seconds
- ✅ Weather checks created in database
- ✅ Weather alerts generated (if conflicts found)
- ✅ Success/failure counts displayed

**Verification:**
```bash
# Check database
npx prisma studio
# Navigate to WeatherCheck table
# Verify records created

# Check Redis (if accessible)
redis-cli
> KEYS bull:*
> Check job queue status
```

**✅ Check:**
- [ ] Job queued successfully
- [ ] Job processes correctly
- [ ] Results stored in database
- [ ] No errors in logs
- [ ] Status displayed in UI

---

#### Scenario 2: Currency Check Job

**Steps:**
1. **Log in as admin**
2. **Navigate to**: `/admin/settings` (or job trigger endpoint)
3. **Trigger currency check job** (if UI available, or via API):
   ```bash
   curl -X POST http://localhost:3000/api/jobs/currency-check \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
4. **Wait**: 5-10 seconds
5. **Check results**:
   - Currency warnings created
   - Notifications sent
   - Database records updated

**Expected Results:**
- ✅ Job queued successfully
- ✅ Currency status calculated
- ✅ Warnings sent for at-risk students/instructors
- ✅ Notifications created

**Verification:**
```bash
# Check database
npx prisma studio
# Navigate to Notification table
# Check for currency warnings
```

**✅ Check:**
- [ ] Job processes correctly
- [ ] Currency status calculated
- [ ] Warnings sent appropriately
- [ ] No errors in logs

---

#### Scenario 3: Maintenance Reminder Job

**Steps:**
1. **Log in as admin**
2. **Trigger maintenance reminder job** (if UI available, or via API):
   ```bash
   curl -X POST http://localhost:3000/api/jobs/maintenance-reminder \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
3. **Wait**: 5-10 seconds
4. **Check results**:
   - Maintenance alerts created
   - Aircraft blocked (if due soon)
   - Notifications sent

**Expected Results:**
- ✅ Job queued successfully
- ✅ Maintenance due dates checked
- ✅ Alerts created for approaching due dates
- ✅ Aircraft blocked proactively

**✅ Check:**
- [ ] Job processes correctly
- [ ] Maintenance checks accurate
- [ ] Alerts created appropriately
- [ ] No errors in logs

---

#### Scenario 4: Reschedule Expiration Job

**Steps:**
1. **Create a reschedule request** (from previous testing)
2. **Note the expiration time** (48 hours from creation)
3. **Manually trigger expiration job** (or wait for scheduled run):
   ```bash
   curl -X POST http://localhost:3000/api/jobs/reschedule-expiration \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
4. **Check results**:
   - Expired requests marked as EXPIRED
   - Notifications sent
   - Status updated

**Expected Results:**
- ✅ Job processes expired requests
- ✅ Requests marked as EXPIRED
- ✅ Notifications sent
- ✅ Status updated correctly

**✅ Check:**
- [ ] Job processes expired requests
- [ ] Status updates correct
- [ ] Notifications sent
- [ ] No errors in logs

---

### Troubleshooting Background Jobs

**If jobs not processing:**
1. **Check Redis connection**:
   ```bash
   # Test Redis connection
   redis-cli ping
   # Should return: PONG
   ```

2. **Check Redis URL** in `.env.local`:
   ```bash
   REDIS_URL=redis://...
   # Or
   REDIS_URL=rediss://... (for SSL)
   ```

3. **Check BullMQ workers**:
   - Workers need to be running to process jobs
   - In development: May need separate process
   - In production: Vercel Cron or separate worker process

4. **Check job queue status**:
   ```bash
   # If Redis CLI available
   redis-cli
   > KEYS bull:*
   > Check job queue names
   ```

5. **Check console logs**:
   - Look for job processing errors
   - Check for Redis connection errors
   - Verify job data format

6. **Manual job trigger** (for testing):
   - Use API endpoints to trigger jobs manually
   - Check job status in response
   - Verify job completes

---

## Integration Test Checklist

### Email Notifications
- [ ] Weather alert emails sent
- [ ] Reschedule suggestion emails sent
- [ ] Confirmation emails sent
- [ ] Email content accurate
- [ ] Email links functional
- [ ] Email formatting correct

### Firebase Realtime
- [ ] Real-time flight status updates work
- [ ] Real-time weather alerts work
- [ ] Real-time notifications work
- [ ] Updates appear quickly (<2 seconds)
- [ ] No refresh needed
- [ ] Multiple windows sync correctly

### Background Jobs
- [ ] Weather check job processes
- [ ] Currency check job processes
- [ ] Maintenance reminder job processes
- [ ] Reschedule expiration job processes
- [ ] Jobs store results in database
- [ ] Jobs send notifications
- [ ] No errors in job processing

---

## Test Results Summary

**Date**: _______________  
**Tester**: _______________

### Email Notifications
- **Status**: ✅ Pass / ⚠️ Partial / ❌ Fail
- **Notes**: _________________________________

### Firebase Realtime
- **Status**: ✅ Pass / ⚠️ Partial / ❌ Fail
- **Notes**: _________________________________

### Background Jobs
- **Status**: ✅ Pass / ⚠️ Partial / ❌ Fail
- **Notes**: _________________________________

### Overall Integration Test
- **Status**: ✅ Pass / ⚠️ Partial / ❌ Fail
- **Issues Found**: _________________________________
- **Ready for Production**: Yes / No

---

## Next Steps

1. **Document any issues** found during testing
2. **Fix critical issues** before proceeding
3. **Re-test** fixed issues
4. **Proceed to Phase 11**: Accessibility Testing
5. **Proceed to Phase 12**: Final Checklist

---

## Quick Reference

### Test Accounts
```
Student:    student.test@example.com / TestPass123!
Instructor: instructor.test@example.com / TestPass123!
Admin:      admin.test@example.com / TestPass123!
```

### Key URLs
```
Login:        http://localhost:3000/login
Dashboard:    http://localhost:3000/dashboard
Admin:        http://localhost:3000/admin/settings
Weather API:  http://localhost:3000/api/weather/alerts
```

### Job Trigger Endpoints
```bash
# Weather Check
POST /api/jobs/weather-check

# Currency Check
POST /api/jobs/currency-check

# Maintenance Reminder
POST /api/jobs/maintenance-reminder

# Reschedule Expiration
POST /api/jobs/reschedule-expiration
```

---

**Good luck with your integration testing! 🚀**

