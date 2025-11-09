# Step-by-Step Testing Execution Walkthrough

This guide walks you through executing the user tests for Flight Schedule Pro AI Rescheduler, one step at a time.

---

## Phase 1: Setup & Preparation (30 minutes)

### Step 1.1: Verify Environment
```bash
# 1. Check that your development server is running
npm run dev

# 2. Verify database is connected
npx prisma studio  # Should open database viewer

# 3. Check environment variables
cat .env.local | grep -E "(FIREBASE|OPENAI|RESEND|DATABASE|REDIS)"
```

**✅ Success Criteria:**
- Server starts without errors
- Database connection works
- All required env vars are set

### Step 1.2: Verify Test Data
```bash
# Check that seed data exists
npx prisma studio
# Navigate to: Students, Instructors, Flights, Aircraft
```

**✅ Success Criteria:**
- At least 3 schools exist
- At least 5 students exist
- At least 5 instructors exist
- At least 10 flights exist (mix of upcoming/past)

### Step 1.3: Create Test Accounts (if needed)

If you don't have test accounts, create them:

1. **Open the app**: `http://localhost:3000`
2. **Navigate to signup**: `http://localhost:3000/signup`
3. **Create accounts**:
   - Student: `student.test@example.com` / `TestPass123!`
   - Instructor: `instructor.test@example.com` / `TestPass123!`
   - Admin: `admin.test@example.com` / `TestPass123!`

**✅ Success Criteria:**
- All three accounts created successfully
- Each user can log in
- Each user sees appropriate dashboard

---

## Phase 2: Authentication Testing (15 minutes)

### Step 2.1: Test Student Login

1. **Open browser**: Navigate to `http://localhost:3000/login`
2. **Enter credentials**:
   - Email: `student.test@example.com`
   - Password: `TestPass123!`
3. **Click "Sign In"**
4. **Verify**:
   - ✅ Redirects to dashboard
   - ✅ Dashboard shows student view
   - ✅ No errors in browser console

**Expected Result**: Student logged in, sees their dashboard

### Step 2.2: Test Instructor Login

1. **Log out** (click profile → sign out)
2. **Log in as instructor**: `instructor.test@example.com`
3. **Verify**:
   - ✅ Redirects to instructor dashboard
   - ✅ Sees instructor-specific sections
   - ✅ Can see student list

**Expected Result**: Instructor logged in, sees instructor dashboard

### Step 2.3: Test Admin Login

1. **Log out**
2. **Log in as admin**: `admin.test@example.com`
3. **Verify**:
   - ✅ Redirects to admin dashboard
   - ✅ Sees admin controls
   - ✅ Can access settings

**Expected Result**: Admin logged in, sees admin dashboard

### Step 2.4: Test Session Persistence

1. **While logged in**, close the browser tab
2. **Reopen browser**, navigate to `http://localhost:3000`
3. **Verify**:
   - ✅ Still logged in (no redirect to login)
   - ✅ Dashboard loads automatically

**Expected Result**: Session persists across browser sessions

---

## Phase 3: Student Workflow Testing (45 minutes)

### Step 3.1: View Student Dashboard

1. **Log in as student**
2. **Observe dashboard**:
   - Upcoming flights section
   - Weather alerts (if any)
   - Training progress
   - Currency status

**✅ Check:**
- [ ] Dashboard loads in <2 seconds
- [ ] All sections visible
- [ ] No console errors
- [ ] Responsive on mobile (resize browser)

**Expected Result**: Dashboard displays correctly with all sections

### Step 3.2: View Flight List

1. **On dashboard**, find "Upcoming Flights" section
2. **Click on a flight card** (if available)
3. **Test filters** (if available):
   - Filter by date
   - Filter by status
   - Sort by date

**✅ Check:**
- [ ] Flights displayed correctly
- [ ] Flight details visible
- [ ] Filters work
- [ ] Sorting works

**Expected Result**: Flight list displays and filters work

### Step 3.3: Create Test Flights (if needed)

If student has no flights:

1. **Look for "Create Test Flights" button** on empty state
2. **Click it**
3. **Wait for flights to be created**
4. **Refresh page**
5. **Verify flights appear**

**Expected Result**: Test flights created and visible

### Step 3.4: View Weather Alert (if available)

1. **Look for weather alert** on dashboard
2. **Click on alert** (if clickable)
3. **Review alert details**:
   - Flight information
   - Weather conditions
   - Confidence level
   - Recommended action

**✅ Check:**
- [ ] Alert visible (if weather conflict exists)
- [ ] Details accurate
- [ ] Action buttons work

**Expected Result**: Weather alerts display correctly

### Step 3.5: Request Reschedule (if weather alert exists)

1. **Click "Request Reschedule"** on flight with weather alert
2. **Wait for AI suggestions** (may take 5-10 seconds)
3. **Review 3 suggestions**:
   - Date/time
   - Instructor
   - Aircraft
   - Reasoning
   - Weather forecast

**✅ Check:**
- [ ] Exactly 3 suggestions appear
- [ ] All suggestions have valid dates
- [ ] Reasoning is clear
- [ ] Weather forecast included

**Expected Result**: AI generates 3 valid reschedule options

### Step 3.6: Accept Reschedule Suggestion

1. **Select one of the 3 suggestions** (click "Select Option 1/2/3")
2. **Confirm selection**
3. **Verify status**:
   - Status shows "Pending Instructor Confirmation"
   - Original flight marked for cancellation

**✅ Check:**
- [ ] Selection saved
- [ ] Status updated
- [ ] Confirmation message shown

**Expected Result**: Student selection saved, waiting for instructor

### Step 3.7: View Training Progress

1. **Navigate to progress page** (or find progress section on dashboard)
2. **Review progress**:
   - Current stage
   - Current lesson
   - Total hours
   - Next milestone

**✅ Check:**
- [ ] Progress displayed accurately
- [ ] Visual progress bar (if present)
- [ ] Milestones highlighted

**Expected Result**: Progress tracking displays correctly

---

## Phase 4: Instructor Workflow Testing (30 minutes)

### Step 4.1: View Instructor Dashboard

1. **Log in as instructor**
2. **Observe dashboard**:
   - My schedule
   - My students
   - Weather alerts
   - Currency warnings

**✅ Check:**
- [ ] All sections visible
- [ ] Student list populated
- [ ] Schedule displayed

**Expected Result**: Instructor dashboard shows all relevant information

### Step 4.2: View Pending Reschedule Request

1. **Look for "Pending Reschedule Requests"** section
2. **Click on a request** (if student accepted a suggestion)
3. **Review details**:
   - Student's selected option
   - Original flight
   - New flight details

**✅ Check:**
- [ ] Request visible
- [ ] Details accurate
- [ ] Can see student's choice

**Expected Result**: Pending requests displayed correctly

### Step 4.3: Confirm Reschedule

1. **Click "Confirm"** on the reschedule request
2. **Wait for confirmation**
3. **Verify**:
   - Original flight canceled
   - New flight created
   - Both parties notified

**✅ Check:**
- [ ] Confirmation successful
- [ ] Flights updated correctly
- [ ] Status changed

**Expected Result**: Reschedule confirmed, flights updated

### Step 4.4: View Student List

1. **Navigate to "My Students" section**
2. **Review student list**:
   - Student names
   - Progress status
   - Currency warnings
   - Upcoming flights

**✅ Check:**
- [ ] All students listed
- [ ] Status badges visible
- [ ] Can click for details

**Expected Result**: Student list displays correctly

### Step 4.5: Report Aircraft Squawk

1. **Navigate to squawk reporting** (find in menu or dashboard)
2. **Fill in squawk form**:
   - Select aircraft
   - Select severity: "Grounding"
   - Enter description: "Test squawk - brake issue"
3. **Submit**
4. **Verify**:
   - Squawk created
   - If grounding: flights canceled
   - Students notified

**✅ Check:**
- [ ] Squawk ticket created
   - [ ] If grounding: flights auto-canceled
   - [ ] Notifications sent

**Expected Result**: Squawk system works, cascading cancellations occur

---

## Phase 5: Admin Workflow Testing (30 minutes)

### Step 5.1: View Admin Dashboard

1. **Log in as admin**
2. **Observe dashboard**:
   - Weather impact summary
   - Resource utilization
   - Student progress heatmap
   - Active alerts

**✅ Check:**
- [ ] All metrics displayed
- [ ] Charts/graphs render
- [ ] Data appears accurate

**Expected Result**: Admin dashboard shows all metrics

### Step 5.2: Test Admin Settings

1. **Navigate to Admin Settings** (`/admin/settings`)
2. **Review settings**:
   - Weather API toggle
   - Weather check frequency
   - Notification preferences
3. **Change a setting** (e.g., toggle weather API)
4. **Save**
5. **Verify**:
   - Setting saved
   - Change reflected

**✅ Check:**
- [ ] Settings page loads
- [ ] Can modify settings
- [ ] Changes persist

**Expected Result**: Admin settings work correctly

### Step 5.3: Manual Weather Refresh

1. **In admin settings**, find "Weather" section
2. **Click "Run Manual Weather Check"**
3. **Wait for completion** (may take 30-60 seconds)
4. **Verify**:
   - Job completed
   - Results displayed
   - Weather data updated

**✅ Check:**
- [ ] Manual refresh works
- [ ] Results shown
- [ ] No errors

**Expected Result**: Manual weather check executes successfully

### Step 5.4: View Analytics

1. **Navigate to analytics/metrics** (if available)
2. **Review metrics**:
   - Weather impact
   - Resource utilization
   - Cancellation patterns
3. **Test date range filters** (if available)

**✅ Check:**
- [ ] Metrics displayed
- [ ] Filters work
- [ ] Data accurate

**Expected Result**: Analytics dashboard works correctly

---

## Phase 6: Weather System Testing (20 minutes)

### Step 6.1: Trigger Weather Check

1. **Log in as admin**
2. **Run manual weather check** (from Step 5.3)
3. **Wait for completion**
4. **Check results**:
   - View weather logs
   - Check for conflicts

**✅ Check:**
- [ ] Weather check runs
- [ ] Results stored
- [ ] Conflicts detected (if unsafe weather)

**Expected Result**: Weather checking works

### Step 6.2: View Weather Alerts

1. **Log in as student** (with upcoming flight)
2. **Check dashboard for weather alerts**
3. **Or check API directly**: `http://localhost:3000/api/weather/alerts`
4. **Verify alerts** (if conflicts exist)

**✅ Check:**
- [ ] Alerts endpoint works
- [ ] Alerts displayed on dashboard
- [ ] Alert details accurate

**Expected Result**: Weather alerts system functional

### Step 6.3: Test Weather Override (Admin)

1. **Log in as admin**
2. **Find a flight with weather conflict**
3. **Override weather status** (if override feature exists)
4. **Verify**:
   - Override saved
   - Flight status updated

**✅ Check:**
- [ ] Override works
- [ ] Status updated
- [ ] Logged in audit trail

**Expected Result**: Weather override functional

---

## Phase 7: Mobile & Responsive Testing (20 minutes)

### Step 7.1: Test Mobile View

1. **Open browser DevTools** (F12)
2. **Toggle device toolbar** (Ctrl+Shift+M)
3. **Select mobile device** (iPhone 12 or similar)
4. **Navigate through app**:
   - Dashboard
   - Flight list
   - Reschedule modal
   - Settings

**✅ Check:**
- [ ] Layout adapts to mobile
- [ ] No horizontal scrolling
- [ ] Touch targets ≥44x44px
- [ ] Navigation accessible

**Expected Result**: App is mobile-responsive

### Step 7.2: Test Touch Interactions

1. **On mobile view**, test:
   - Tap flight cards
   - Swipe gestures (if implemented)
   - Pull to refresh (if implemented)
   - Bottom navigation (if implemented)

**✅ Check:**
- [ ] All interactions work
- [ ] No accidental clicks
- [ ] Gestures responsive

**Expected Result**: Touch interactions work correctly

### Step 7.3: Test PWA (if available)

1. **On mobile view**, look for "Install App" prompt
2. **Install PWA** (if available)
3. **Test offline mode**:
   - Turn off network
   - Try to use app
   - Verify offline banner

**✅ Check:**
- [ ] PWA installable
- [ ] Offline mode works
- [ ] Offline banner appears

**Expected Result**: PWA functionality works

---

## Phase 8: Performance Testing (15 minutes)

### Step 8.1: Measure Dashboard Load Time

1. **Open browser DevTools** (F12)
2. **Go to Network tab**
3. **Clear cache** (right-click → Clear browser cache)
4. **Navigate to dashboard**
5. **Check load time**:
   - Look at "Load" time in Network tab
   - Should be <2 seconds

**✅ Check:**
- [ ] Load time <2 seconds
- [ ] No slow requests
- [ ] Images optimized

**Expected Result**: Dashboard loads quickly

### Step 8.2: Test API Response Times

1. **Open DevTools → Network tab**
2. **Navigate through app**, triggering API calls
3. **Check response times**:
   - `/api/flights` should be <500ms
   - `/api/weather/alerts` should be <500ms
   - Other endpoints should be <500ms

**✅ Check:**
- [ ] All APIs <500ms (p95)
- [ ] No timeouts
- [ ] Caching working (if implemented)

**Expected Result**: API responses are fast

### Step 8.3: Test with Large Dataset

1. **Create many flights** (if possible, or use existing data)
2. **Load dashboard with 100+ flights**
3. **Verify**:
   - Still loads quickly
   - Pagination works (if implemented)
   - No performance degradation

**✅ Check:**
- [ ] Handles large datasets
- [ ] Pagination works
- [ ] No slowdown

**Expected Result**: App handles large datasets well

---

## Phase 9: Error Handling Testing (15 minutes)

### Step 9.1: Test Invalid Login

1. **Try to log in with wrong password**
2. **Verify**:
   - Error message displayed
   - No crash
   - User-friendly message

**✅ Check:**
- [ ] Error message shown
- [ ] No technical errors exposed
- [ ] Can retry

**Expected Result**: Invalid login handled gracefully

### Step 9.2: Test Network Failure

1. **Open DevTools → Network tab**
2. **Select "Offline"** from throttling dropdown
3. **Try to use app**:
   - Navigate pages
   - Submit forms
   - Load data
4. **Verify**:
   - Error messages shown
   - No crashes
   - Can retry when online

**✅ Check:**
- [ ] Graceful error handling
- [ ] User-friendly messages
- [ ] Retry options

**Expected Result**: Network failures handled gracefully

### Step 9.3: Test Invalid Data

1. **Try to create flight with**:
   - Past date
   - Invalid time
   - Non-existent aircraft
2. **Verify**:
   - Validation errors shown
   - Invalid data rejected
   - Clear error messages

**✅ Check:**
- [ ] Validation works
- [ ] Errors clear
- [ ] No data corruption

**Expected Result**: Invalid data validation works

---

## Phase 10: Integration Testing (20 minutes)

**📋 Detailed Guide**: See `docs/PHASE_10_INTEGRATION_TESTING.md` for comprehensive step-by-step instructions with troubleshooting.

**📝 Quick Checklist**: See `docs/PHASE_10_QUICK_CHECKLIST.md` for a fast execution checklist.

### Overview

Phase 10 verifies integration between:
- Email notifications (Resend)
- Firebase Realtime Database
- Background job processing (BullMQ)

### Quick Summary

**Step 10.1: Email Notifications** (7 min)
- Test weather alert emails
- Test reschedule suggestion emails
- Test confirmation emails
- Verify email content and links

**Step 10.2: Firebase Realtime** (6 min)
- Test real-time flight status updates
- Test real-time weather alerts
- Test real-time notifications
- Verify updates appear without refresh

**Step 10.3: Background Jobs** (7 min)
- Test weather check job
- Test currency check job
- Test maintenance reminder job
- Test reschedule expiration job
- Verify jobs process and store results

**✅ Expected Results**: All external services integrate correctly, real-time updates work, background jobs process successfully.

---

## Phase 11: Accessibility Testing (15 minutes)

### Step 11.1: Keyboard Navigation

1. **Use only keyboard** (no mouse):
   - Tab to navigate
   - Enter/Space to activate
   - Arrow keys for menus
2. **Navigate entire app**
3. **Verify**:
   - All elements accessible
   - Focus indicators visible
   - Logical tab order

**✅ Check:**
- [ ] All elements keyboard accessible
- [ ] Focus visible
- [ ] No keyboard traps

**Expected Result**: Full keyboard navigation works

### Step 11.2: Screen Reader Test

1. **Enable screen reader** (VoiceOver on Mac, NVDA on Windows)
2. **Navigate app**
3. **Verify**:
   - All content announced
   - Form labels present
   - Buttons have text
   - Images have alt text

**✅ Check:**
- [ ] Screen reader compatible
- [ ] All content announced
- [ ] Forms accessible

**Expected Result**: Screen reader compatible

### Step 11.3: Color Contrast

1. **Use browser extension** (e.g., WAVE, axe DevTools)
2. **Check color contrast**
3. **Verify WCAG AA compliance**

**✅ Check:**
- [ ] Contrast ratios ≥4.5:1 (text)
- [ ] Contrast ratios ≥3:1 (UI)
- [ ] Color not sole indicator

**Expected Result**: Color contrast meets WCAG standards

---

## Phase 12: Final Checklist (10 minutes)

### Step 12.1: Run Pre-Release Checklist

Go through the checklist from `USER_TESTING_GUIDE.md`:

**Functionality:**
- [ ] All user roles can log in
- [ ] All core workflows functional
- [ ] Weather monitoring working
- [ ] AI rescheduling generating suggestions
- [ ] Notifications sending
- [ ] Progress tracking accurate
- [ ] Squawk system working
- [ ] Admin controls functional

**Performance:**
- [ ] Dashboard loads <2 seconds
- [ ] API responses <500ms (p95)
- [ ] No N+1 queries
- [ ] Caching working

**Mobile:**
- [ ] Mobile responsive
- [ ] Touch targets adequate
- [ ] PWA installable (if implemented)
- [ ] Mobile navigation functional

**Integration:**
- [ ] Firebase working
- [ ] Email notifications sending
- [ ] Background jobs running

**Accessibility:**
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast compliant

**Error Handling:**
- [ ] Graceful error messages
- [ ] Network failures handled
- [ ] API failures handled

### Step 12.2: Document Issues

For any issues found:

1. **Create issue report** using template from `USER_TESTING_GUIDE.md`
2. **Include**:
   - User role
   - Browser/device
   - Steps to reproduce
   - Expected vs actual result
   - Screenshots
   - Console errors

### Step 12.3: Summary

**Create testing summary:**
- Total tests executed: ___
- Tests passed: ___
- Tests failed: ___
- Critical issues: ___
- Minor issues: ___
- Ready for production: Yes/No

---

## Quick Reference: Test Accounts

```
Student:    student.test@example.com / TestPass123!
Instructor: instructor.test@example.com / TestPass123!
Admin:     admin.test@example.com / TestPass123!
```

## Quick Reference: Key URLs

```
Login:        http://localhost:3000/login
Dashboard:    http://localhost:3000/dashboard
Admin:        http://localhost:3000/admin/settings
Weather API:  http://localhost:3000/api/weather/alerts
```

## Quick Reference: Browser DevTools

```
Open DevTools:        F12
Toggle device mode:   Ctrl+Shift+M (Windows) / Cmd+Shift+M (Mac)
Network tab:          Check API calls
Console tab:          Check for errors
Application tab:      Check storage, service workers
```

---

## Tips for Efficient Testing

1. **Use multiple browser windows**: Test different roles simultaneously
2. **Keep DevTools open**: Monitor network, console, performance
3. **Take screenshots**: Document issues as you find them
4. **Test incrementally**: Don't try to test everything at once
5. **Focus on critical paths**: Weather alerts, rescheduling, notifications
6. **Test on real devices**: Browser DevTools is good, but real devices are better

---

## Estimated Total Time

- **Phase 1**: Setup (30 min)
- **Phase 2**: Authentication (15 min)
- **Phase 3**: Student Workflow (45 min)
- **Phase 4**: Instructor Workflow (30 min)
- **Phase 5**: Admin Workflow (30 min)
- **Phase 6**: Weather System (20 min)
- **Phase 7**: Mobile Testing (20 min)
- **Phase 8**: Performance (15 min)
- **Phase 9**: Error Handling (15 min)
- **Phase 10**: Integration (20 min)
- **Phase 11**: Accessibility (15 min)
- **Phase 12**: Final Checklist (10 min)

**Total: ~4 hours** (can be split across multiple sessions)

---

## Next Steps After Testing

1. **Fix critical issues** first
2. **Re-test** fixed issues
3. **Document** all findings
4. **Update** test guide with new scenarios
5. **Prepare** for production deployment

---

Good luck with your testing! 🚀

