# User Testing Guide: Flight Schedule Pro AI Rescheduler

## Overview

This guide provides comprehensive testing scenarios for the Flight Schedule Pro AI Rescheduler application. It covers all user personas, key workflows, edge cases, and performance considerations.

**Last Updated**: Based on MVP + Phase 2 + Phase 3 (PR-21 through PR-30) completion

---

## Table of Contents

1. [Test Environment Setup](#test-environment-setup)
2. [User Personas & Test Accounts](#user-personas--test-accounts)
3. [Core Workflow Testing](#core-workflow-testing)
4. [Role-Specific Testing](#role-specific-testing)
5. [Edge Cases & Error Scenarios](#edge-cases--error-scenarios)
6. [Performance Testing](#performance-testing)
7. [Mobile & Responsive Testing](#mobile--responsive-testing)
8. [Integration Testing](#integration-testing)
9. [Accessibility Testing](#accessibility-testing)
10. [Test Checklist](#test-checklist)

---

## Test Environment Setup

### Prerequisites

1. **Development Environment**
   - Local development server running (`npm run dev`)
   - Database migrations synced (`npx prisma migrate dev`)
   - Database seeded with test data (`npx prisma db seed`)
   - All environment variables configured (`.env.local`)

2. **External Services**
   - Firebase project configured
   - OpenAI API key (for AI rescheduling)
   - Resend API key (for email notifications)
   - Redis/Upstash connection (for job queue)
   - WeatherAPI.com key (optional, for enhanced weather)

3. **Test Data**
   - 3 flight schools
   - 20 students (various training levels)
   - 5 instructors
   - 5 aircraft
   - 50+ flights (mix of upcoming, past, canceled)
   - 40 lessons in syllabus

### Browser Testing Matrix

- **Desktop**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile**: iOS Safari, Chrome Mobile, Samsung Internet
- **Tablet**: iPad Safari, Android Chrome

---

## User Personas & Test Accounts

### Test Accounts Setup

Create these test accounts in your seed data or manually:

#### Student Accounts
- **Early Student** (0-10 hours): `student.early@test.com`
- **Mid-Stage Student** (10-30 hours): `student.mid@test.com`
- **Advanced Student** (30+ hours): `student.advanced@test.com`
- **Post-Certificate Student**: `student.certified@test.com`

#### Instructor Accounts
- **Regular Instructor**: `instructor@test.com`
- **Chief Instructor**: `chief.instructor@test.com`

#### Admin Accounts
- **School Admin**: `admin@test.com`
- **Super Admin** (multi-school): `super.admin@test.com`

**Default Password**: `TestPassword123!` (or as configured)

---

## Core Workflow Testing

### 1. Authentication & Onboarding

#### Test: User Sign-Up Flow
**Steps:**
1. Navigate to `/signup`
2. Fill in registration form:
   - Email: `newstudent@test.com`
   - Password: `SecurePass123!`
   - Confirm password
   - Select school from dropdown
   - Select role: "Student"
3. Submit form
4. Verify Firebase account created
5. Verify user synced to database
6. Verify redirect to dashboard

**Expected Results:**
- ✅ Account created successfully
- ✅ User redirected to appropriate dashboard
- ✅ User role correctly assigned
- ✅ School association saved

**Edge Cases:**
- Invalid email format
- Weak password
- Email already exists
- School selection required

#### Test: User Login Flow
**Steps:**
1. Navigate to `/login`
2. Enter credentials
3. Submit form
4. Verify authentication
5. Verify redirect to dashboard

**Expected Results:**
- ✅ Successful login
- ✅ Auth state persists
- ✅ Protected routes accessible
- ✅ Role-based dashboard shown

**Edge Cases:**
- Invalid credentials
- Account doesn't exist
- Network error during login

#### Test: Session Management
**Steps:**
1. Log in
2. Close browser tab
3. Reopen application
4. Verify still logged in
5. Log out
6. Verify session cleared

**Expected Results:**
- ✅ Session persists across tabs
- ✅ Logout clears all auth state
- ✅ Protected routes redirect after logout

---

### 2. Weather Monitoring & Alerts

#### Test: Automatic Weather Checking
**Steps:**
1. Log in as admin
2. Navigate to admin settings
3. Verify weather check job is running (hourly)
4. Check weather logs in database
5. Verify weather checks for all upcoming flights

**Expected Results:**
- ✅ Weather checks run automatically
- ✅ Weather data stored in database
- ✅ Flights with conflicts flagged

**Verification:**
- Check `/api/weather/alerts` endpoint
- Review WeatherCheck records in database
- Verify weather status on flight cards

#### Test: Manual Weather Refresh
**Steps:**
1. Log in as admin
2. Navigate to admin settings
3. Click "Run Manual Weather Check"
4. Wait for completion
5. Verify weather data updated

**Expected Results:**
- ✅ Manual refresh triggers immediately
- ✅ All flights checked
- ✅ Results displayed in UI
- ✅ Rate limiting prevents abuse

#### Test: Weather Alert Display
**Steps:**
1. Log in as student with upcoming flight
2. Navigate to dashboard
3. Check for weather alerts
4. Verify alert details:
   - Flight information
   - Weather conditions
   - Confidence level
   - Recommended action

**Expected Results:**
- ✅ Alerts visible on dashboard
- ✅ Alert details accurate
- ✅ Confidence levels displayed
- ✅ Action buttons functional

**Edge Cases:**
- No weather data available
- Weather API timeout
- Invalid airport code
- Multiple alerts for same flight

---

### 3. AI-Powered Rescheduling

#### Test: Weather Conflict Detection
**Steps:**
1. Create test flight with unsafe weather conditions
2. Trigger weather check job
3. Verify conflict detected
4. Verify AI rescheduling triggered

**Expected Results:**
- ✅ Conflict detected correctly
- ✅ AI suggestions generated
- ✅ RescheduleRequest created
- ✅ Notifications sent

#### Test: AI Suggestion Generation
**Steps:**
1. Log in as student
2. Receive weather alert for upcoming flight
3. View reschedule suggestions
4. Verify 3 options provided
5. Check suggestion details:
   - Date/time
   - Instructor
   - Aircraft
   - Reasoning
   - Weather forecast

**Expected Results:**
- ✅ Exactly 3 suggestions provided
- ✅ Suggestions are valid (no conflicts)
- ✅ Reasoning is clear and helpful
- ✅ Weather forecast included
- ✅ Options ranked by priority

**Verification:**
- Check database for RescheduleRequest records
- Verify suggestions don't conflict with existing bookings
- Confirm instructor/aircraft availability

#### Test: Student Accepts Reschedule
**Steps:**
1. Log in as student
2. View reschedule suggestions
3. Select preferred option
4. Confirm selection
5. Verify status updated

**Expected Results:**
- ✅ Selection saved
- ✅ Status: "pending_instructor_confirmation"
- ✅ Instructor notified
- ✅ Original flight marked for cancellation
- ✅ New flight slot reserved (temporarily)

#### Test: Instructor Confirms Reschedule
**Steps:**
1. Log in as instructor
2. View pending reschedule request
3. Review student's selection
4. Confirm or suggest alternative
5. Verify final confirmation

**Expected Results:**
- ✅ Confirmation saved
- ✅ Original flight canceled
- ✅ New flight created
- ✅ Both parties notified
- ✅ Calendar updated (if integrated)

#### Test: Rejection Flow
**Steps:**
1. Student rejects all 3 suggestions
2. System generates 3 new options
3. Student reviews new options
4. If rejected again, escalate to admin

**Expected Results:**
- ✅ New suggestions generated
- ✅ Escalation works if needed
- ✅ Admin can manually schedule

**Edge Cases:**
- All suggested slots become unavailable
- AI service unavailable (fallback to rule-based)
- Student/instructor unavailable for all options
- Timeout on reschedule request

---

### 4. Flight Management

#### Test: View Flight List
**Steps:**
1. Log in as student
2. Navigate to dashboard
3. View flight list
4. Test filtering:
   - By date range
   - By status (upcoming, past, canceled)
   - By aircraft
   - By instructor
5. Test sorting:
   - By date (ascending/descending)
   - By status
   - By aircraft

**Expected Results:**
- ✅ Flights displayed correctly
- ✅ Filters work as expected
- ✅ Sorting works correctly
- ✅ Pagination functional (if implemented)
- ✅ Loading states shown
- ✅ Empty states displayed when no flights

#### Test: Create New Flight
**Steps:**
1. Log in as student
2. Navigate to booking page
3. Fill in flight details:
   - Date/time
   - Instructor
   - Aircraft
   - Lesson type
4. Submit booking
5. Verify flight created

**Expected Results:**
- ✅ Flight created successfully
- ✅ Availability checked
- ✅ Conflicts prevented
- ✅ Confirmation shown
- ✅ Notifications sent

**Edge Cases:**
- Double-booking attempt
- Booking in past
- Booking outside availability
- Aircraft unavailable (maintenance)

#### Test: Cancel Flight
**Steps:**
1. Log in as student
2. View upcoming flight
3. Click cancel
4. Confirm cancellation
5. Verify flight canceled

**Expected Results:**
- ✅ Flight status updated
- ✅ Cancellation reason recorded
- ✅ Instructor notified
- ✅ Aircraft slot freed
- ✅ Reschedule options offered (if applicable)

---

### 5. Progress Tracking

#### Test: View Training Progress
**Steps:**
1. Log in as student
2. Navigate to progress page
3. View progress tracker
4. Verify information:
   - Current stage
   - Current lesson
   - Total hours
   - Solo hours
   - Cross-country hours
   - Next milestone

**Expected Results:**
- ✅ Progress displayed accurately
- ✅ Visual progress bar correct
- ✅ Milestones highlighted
- ✅ Currency status shown

#### Test: Complete Lesson
**Steps:**
1. Log in as instructor
2. View student's completed flight
3. Mark lesson as complete
4. Update progress
5. Verify progress updated

**Expected Results:**
- ✅ Lesson marked complete
- ✅ Progress updated
- ✅ Next lesson suggested
- ✅ Student notified

#### Test: Currency Tracking
**Steps:**
1. Log in as student approaching 90-day limit
2. Verify currency warning displayed
3. Check currency dashboard
4. Verify days since last flight calculated

**Expected Results:**
- ✅ Currency warnings at 60/75/85/90 days
- ✅ Dashboard shows currency status
- ✅ Alerts sent to instructor/admin
- ✅ Priority flagging for at-risk students

---

### 6. Aircraft Squawk System

#### Test: Report Squawk
**Steps:**
1. Log in as instructor/student
2. Navigate to squawk reporting
3. Fill in squawk form:
   - Aircraft
   - Severity (minor/major/grounding)
   - Description
4. Submit report
5. Verify squawk created

**Expected Results:**
- ✅ Squawk ticket created
- ✅ Maintenance notified
- ✅ If grounding: flights auto-canceled
- ✅ Affected students notified
- ✅ Reschedule options offered

#### Test: Grounding Cascading Cancellation
**Steps:**
1. Report grounding squawk
2. Verify all future flights for aircraft canceled
3. Verify students notified
4. Verify reschedule options generated

**Expected Results:**
- ✅ All flights canceled
- ✅ Notifications sent
- ✅ AI rescheduling triggered
- ✅ Aircraft blocked from new bookings

#### Test: Resolve Squawk
**Steps:**
1. Log in as maintenance/admin
2. View open squawks
3. Mark squawk as resolved
4. Add resolution notes
5. Verify aircraft released

**Expected Results:**
- ✅ Squawk status updated
- ✅ Aircraft available again
- ✅ Resolution logged
- ✅ Affected parties notified

---

## Role-Specific Testing

### Student Role Testing

#### Test: Student Dashboard
**Steps:**
1. Log in as student
2. View dashboard
3. Verify sections:
   - Upcoming flights
   - Weather alerts
   - Training progress
   - Currency status
4. Test interactions:
   - Click flight for details
   - Request reschedule
   - View progress

**Expected Results:**
- ✅ Dashboard loads quickly (<2 seconds)
- ✅ All sections visible
- ✅ Real-time updates (Firebase)
- ✅ Mobile-responsive

#### Test: Student Reschedule Request
**Steps:**
1. Log in as student
2. View flight with weather alert
3. Click "Request Reschedule"
4. View AI suggestions
5. Select option
6. Wait for instructor confirmation

**Expected Results:**
- ✅ Suggestions displayed clearly
- ✅ Selection process intuitive
- ✅ Confirmation status visible
- ✅ Notifications received

#### Test: Student Availability Update
**Steps:**
1. Log in as student
2. Navigate to settings
3. Update availability preferences
4. Verify saved
5. Verify used in AI rescheduling

**Expected Results:**
- ✅ Availability saved
- ✅ Used in future suggestions
- ✅ Can update anytime

---

### Instructor Role Testing

#### Test: Instructor Dashboard
**Steps:**
1. Log in as instructor
2. View dashboard
3. Verify sections:
   - My schedule
   - My students
   - Weather alerts
   - Currency warnings
4. Test student list
5. Test schedule view

**Expected Results:**
- ✅ All students listed
- ✅ Schedule displayed clearly
- ✅ Weather indicators visible
- ✅ Student status badges shown

#### Test: Instructor Confirms Reschedule
**Steps:**
1. Log in as instructor
2. View pending reschedule requests
3. Review student's selection
4. Confirm or suggest alternative
5. Verify confirmation sent

**Expected Results:**
- ✅ Requests clearly displayed
- ✅ Flight details visible
- ✅ Easy confirmation process
- ✅ Alternative suggestion option

#### Test: Instructor Currency Tracking
**Steps:**
1. Log in as instructor
2. View currency dashboard
3. Check approaching expiry list
4. Verify warnings displayed

**Expected Results:**
- ✅ Currency status accurate
- ✅ Warnings at thresholds
- ✅ Students prioritized correctly

#### Test: Instructor Reports Squawk
**Steps:**
1. Log in as instructor
2. Navigate to squawk reporting
3. Report aircraft issue
4. Verify cascading cancellations

**Expected Results:**
- ✅ Squawk created
- ✅ Flights canceled if grounding
- ✅ Students notified
- ✅ Reschedule options offered

---

### Admin Role Testing

#### Test: Admin Dashboard
**Steps:**
1. Log in as admin
2. View admin dashboard
3. Verify metrics:
   - Weather impact summary
   - Resource utilization
   - Student progress heatmap
   - Active alerts
4. Test date range filters
5. Test drill-down views

**Expected Results:**
- ✅ All metrics displayed
- ✅ Data accurate
- ✅ Filters work
- ✅ Charts/graphs render
- ✅ Export options (if available)

#### Test: Admin Settings
**Steps:**
1. Log in as admin
2. Navigate to admin settings
3. Test settings:
   - Weather API toggle (FAA/WeatherAPI.com)
   - Weather check frequency
   - Notification preferences
   - School settings
4. Save changes
5. Verify applied

**Expected Results:**
- ✅ Settings saved
- ✅ Changes take effect
- ✅ Validation works
- ✅ Error handling

#### Test: Manual Weather Override
**Steps:**
1. Log in as admin
2. View flight with weather conflict
3. Override weather status
4. Verify override applied
5. Verify flight status updated

**Expected Results:**
- ✅ Override saved
- ✅ Flight status updated
- ✅ Override logged (audit)
- ✅ Notifications sent

#### Test: School Management
**Steps:**
1. Log in as super admin
2. Navigate to school management
3. View school list
4. Test school switching
5. Verify data isolation

**Expected Results:**
- ✅ Schools listed
- ✅ Switching works
- ✅ Data properly scoped
- ✅ Cross-school analytics (super admin)

#### Test: Permission Management
**Steps:**
1. Log in as admin
2. Navigate to permissions page
3. View role templates
4. Test permission assignment
5. Verify permissions enforced

**Expected Results:**
- ✅ Permissions displayed
- ✅ Assignment works
- ✅ Enforcement correct
- ✅ Audit logs created

---

## Edge Cases & Error Scenarios

### Network & API Failures

#### Test: Weather API Failure
**Steps:**
1. Simulate weather API failure
2. Trigger weather check
3. Verify fallback behavior
4. Verify error handling

**Expected Results:**
- ✅ Graceful error handling
- ✅ User-friendly error message
- ✅ Cached data used if available
- ✅ Retry mechanism works

#### Test: OpenAI API Failure
**Steps:**
1. Simulate OpenAI API failure
2. Trigger AI rescheduling
3. Verify fallback to rule-based
4. Verify suggestions still generated

**Expected Results:**
- ✅ Fallback activated
- ✅ Rule-based suggestions provided
- ✅ Error logged
- ✅ User notified

#### Test: Database Connection Loss
**Steps:**
1. Simulate database connection loss
2. Attempt various operations
3. Verify error handling

**Expected Results:**
- ✅ Error messages displayed
- ✅ Operations fail gracefully
- ✅ Retry options provided
- ✅ No data corruption

### Data Validation

#### Test: Invalid Flight Data
**Steps:**
1. Attempt to create flight with:
   - Past date
   - Invalid time
   - Non-existent aircraft
   - Non-existent instructor
2. Verify validation

**Expected Results:**
- ✅ Validation errors shown
- ✅ Invalid data rejected
- ✅ Clear error messages
- ✅ No database corruption

#### Test: Race Conditions
**Steps:**
1. Two users attempt to book same slot simultaneously
2. Verify only one succeeds
3. Verify other user notified

**Expected Results:**
- ✅ No double-booking
- ✅ Transaction safety
- ✅ Second user notified
- ✅ Alternative suggested

### Boundary Conditions

#### Test: Maximum Flights
**Steps:**
1. Create maximum number of flights
2. Attempt to create one more
3. Verify handling

**Expected Results:**
- ✅ Limit enforced
- ✅ User notified
- ✅ Suggestion to reschedule existing

#### Test: Extreme Weather Conditions
**Steps:**
1. Test with extreme weather:
   - Hurricane conditions
   - Blizzard conditions
   - Perfect conditions
2. Verify appropriate handling

**Expected Results:**
- ✅ All conditions handled
- ✅ Appropriate alerts
- ✅ Safety prioritized

---

## Performance Testing

### Load Testing

#### Test: Dashboard Load Time
**Steps:**
1. Measure dashboard load time
2. Test with various data volumes:
   - 10 flights
   - 100 flights
   - 1000 flights
3. Verify performance targets

**Expected Results:**
- ✅ Loads in <2 seconds (target)
- ✅ Pagination for large datasets
- ✅ Lazy loading implemented
- ✅ Optimized queries

#### Test: API Response Times
**Steps:**
1. Test API endpoints:
   - `/api/flights`
   - `/api/weather/check`
   - `/api/reschedule/suggestions`
2. Measure response times
3. Verify p95 <500ms

**Expected Results:**
- ✅ All endpoints <500ms (p95)
- ✅ Caching working
- ✅ Database queries optimized
- ✅ No N+1 queries

#### Test: Concurrent Users
**Steps:**
1. Simulate 50+ concurrent users
2. Test various operations
3. Monitor performance

**Expected Results:**
- ✅ System handles load
- ✅ No degradation
- ✅ Error rate <1%
- ✅ Response times acceptable

### Database Performance

#### Test: Query Optimization
**Steps:**
1. Enable query logging
2. Test common queries
3. Verify indexes used
4. Check for N+1 queries

**Expected Results:**
- ✅ Indexes utilized
- ✅ No N+1 queries
- ✅ Query times <100ms
- ✅ Connection pooling working

#### Test: Read Replica Usage
**Steps:**
1. Verify read operations use replicas
2. Verify write operations use primary
3. Test failover

**Expected Results:**
- ✅ Read/write split working
- ✅ Replica health monitored
- ✅ Failover automatic

---

## Mobile & Responsive Testing

### Mobile Device Testing

#### Test: Mobile Dashboard
**Steps:**
1. Open app on mobile device
2. View dashboard
3. Test interactions:
   - Tap flight cards
   - Swipe gestures
   - Pull to refresh
   - Bottom navigation
4. Verify responsive layout

**Expected Results:**
- ✅ Layout adapts to screen
- ✅ Touch targets ≥44x44px
- ✅ Gestures work
- ✅ Navigation accessible
- ✅ No horizontal scrolling

#### Test: Mobile Reschedule Flow
**Steps:**
1. Open app on mobile
2. View weather alert
3. Request reschedule
4. Select option
5. Verify confirmation

**Expected Results:**
- ✅ Flow works on mobile
- ✅ Modals mobile-optimized
- ✅ Forms usable
- ✅ Buttons accessible

#### Test: PWA Functionality
**Steps:**
1. Install PWA on mobile
2. Test offline mode
3. Test push notifications
4. Test app-like experience

**Expected Results:**
- ✅ PWA installable
- ✅ Offline mode works
- ✅ Notifications received
- ✅ App-like experience

### Responsive Design Testing

#### Test: Breakpoint Testing
**Steps:**
1. Test at various screen sizes:
   - Mobile (375px, 414px)
   - Tablet (768px, 1024px)
   - Desktop (1280px, 1920px)
2. Verify layout adapts
3. Verify no content cut off

**Expected Results:**
- ✅ All breakpoints work
- ✅ Content readable
- ✅ Navigation accessible
- ✅ Forms usable

---

## Integration Testing

### External Service Integration

#### Test: Firebase Integration
**Steps:**
1. Test authentication
2. Test real-time notifications
3. Test presence tracking
4. Verify error handling

**Expected Results:**
- ✅ Auth works
- ✅ Real-time updates work
- ✅ Presence accurate
- ✅ Errors handled

#### Test: Email Notifications (Resend)
**Steps:**
1. Trigger various notifications
2. Verify emails sent
3. Check email content
4. Verify delivery

**Expected Results:**
- ✅ Emails sent
- ✅ Content accurate
- ✅ Templates correct
- ✅ Delivery reliable

#### Test: SMS Notifications (Twilio)
**Steps:**
1. Enable SMS for user
2. Trigger notification
3. Verify SMS sent
4. Check content

**Expected Results:**
- ✅ SMS sent
- ✅ Content within 160 chars
- ✅ Opt-in/out works
- ✅ Cost tracked

#### Test: Google Calendar Integration
**Steps:**
1. Connect Google Calendar
2. Export flight to calendar
3. Import availability
4. Test conflict detection
5. Test bidirectional sync

**Expected Results:**
- ✅ OAuth flow works
- ✅ Export successful
- ✅ Import works
- ✅ Conflicts detected
- ✅ Sync bidirectional

### Background Jobs

#### Test: Weather Check Job
**Steps:**
1. Verify job runs hourly
2. Check job processing
3. Verify results stored
4. Test manual trigger

**Expected Results:**
- ✅ Job runs on schedule
- ✅ Processing successful
- ✅ Results accurate
- ✅ Manual trigger works

#### Test: Currency Check Job
**Steps:**
1. Verify job runs daily
2. Check currency calculations
3. Verify warnings sent
4. Test thresholds

**Expected Results:**
- ✅ Job runs on schedule
- ✅ Calculations accurate
- ✅ Warnings sent correctly
- ✅ Thresholds correct

#### Test: Maintenance Reminder Job
**Steps:**
1. Verify job runs daily
2. Check maintenance due dates
3. Verify alerts sent
4. Test aircraft blocking

**Expected Results:**
- ✅ Job runs on schedule
- ✅ Due dates calculated correctly
- ✅ Alerts sent
- ✅ Blocking works

---

## Accessibility Testing

### WCAG Compliance

#### Test: Keyboard Navigation
**Steps:**
1. Navigate entire app using only keyboard
2. Test all interactive elements
3. Verify focus indicators
4. Test tab order

**Expected Results:**
- ✅ All elements keyboard accessible
- ✅ Focus indicators visible
- ✅ Logical tab order
- ✅ No keyboard traps

#### Test: Screen Reader Support
**Steps:**
1. Use screen reader (VoiceOver/NVDA)
2. Navigate app
3. Verify announcements
4. Test form labels

**Expected Results:**
- ✅ All content announced
- ✅ Form labels present
- ✅ Buttons have text
- ✅ Images have alt text
- ✅ ARIA labels where needed

#### Test: Color Contrast
**Steps:**
1. Check color contrast ratios
2. Verify WCAG AA compliance
3. Test with color blindness simulators

**Expected Results:**
- ✅ Contrast ratios ≥4.5:1 (text)
- ✅ Contrast ratios ≥3:1 (UI)
- ✅ Color not sole indicator
- ✅ Accessible to color blind users

#### Test: Responsive Text
**Steps:**
1. Test text scaling (200%)
2. Verify no content loss
3. Verify layout adapts

**Expected Results:**
- ✅ Text scales properly
- ✅ No content cut off
- ✅ Layout remains usable

---

## Test Checklist

### Pre-Release Checklist

#### Functionality
- [ ] All user roles can log in
- [ ] All core workflows functional
- [ ] Weather monitoring working
- [ ] AI rescheduling generating suggestions
- [ ] Notifications sending
- [ ] Progress tracking accurate
- [ ] Squawk system working
- [ ] Admin controls functional

#### Performance
- [ ] Dashboard loads <2 seconds
- [ ] API responses <500ms (p95)
- [ ] No N+1 queries
- [ ] Caching working
- [ ] Database optimized

#### Mobile
- [ ] Mobile responsive
- [ ] Touch targets adequate
- [ ] PWA installable
- [ ] Offline mode works
- [ ] Mobile navigation functional

#### Integration
- [ ] Firebase working
- [ ] Email notifications sending
- [ ] SMS working (if enabled)
- [ ] Calendar sync working (if enabled)
- [ ] Background jobs running

#### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast compliant
- [ ] Text scales properly

#### Security
- [ ] Authentication secure
- [ ] Role-based access enforced
- [ ] Data properly scoped (school isolation)
- [ ] Audit logs working
- [ ] Input validation working

#### Error Handling
- [ ] Graceful error messages
- [ ] Network failures handled
- [ ] API failures handled
- [ ] Database errors handled
- [ ] User-friendly error pages

---

## Test Data Scenarios

### Scenario 1: Typical Weather Cancellation
**Setup:**
- Student: Mid-stage (15 hours)
- Flight: Tomorrow 2:00 PM
- Weather: Winds 18kt (exceeds 12kt limit)

**Expected Flow:**
1. Weather check detects conflict
2. AI generates 3 suggestions
3. Student receives email + in-app notification
4. Student selects option
5. Instructor confirms
6. Flight rescheduled

### Scenario 2: Aircraft Grounding
**Setup:**
- Aircraft: C172-234
- Future flights: 5 scheduled
- Squawk: Grounding severity

**Expected Flow:**
1. Squawk reported
2. All 5 flights auto-canceled
3. Students notified
4. AI rescheduling triggered for each
5. Aircraft blocked
6. Maintenance resolves
7. Aircraft released

### Scenario 3: Student Currency Warning
**Setup:**
- Student: 85 days since last flight
- Currency requirement: 90 days

**Expected Flow:**
1. Currency check job runs
2. Warning generated
3. Student notified
4. Instructor notified
5. Student flagged for priority
6. Dashboard shows warning

### Scenario 4: Multi-School Isolation
**Setup:**
- School A: 10 students, 20 flights
- School B: 15 students, 30 flights
- Admin: Super admin (cross-school access)

**Expected Flow:**
1. School A admin sees only School A data
2. School B admin sees only School B data
3. Super admin sees both
4. School switching works
5. Data properly isolated

---

## Reporting Issues

### Issue Template

When reporting bugs or issues, include:

1. **User Role**: Student/Instructor/Admin
2. **Browser/Device**: Chrome 120 / iPhone 14
3. **Steps to Reproduce**: Detailed steps
4. **Expected Result**: What should happen
5. **Actual Result**: What actually happened
6. **Screenshots**: If applicable
7. **Console Errors**: Browser console output
8. **Network Logs**: API request/response (if relevant)
9. **Frequency**: Always/Sometimes/Rarely
10. **Severity**: Critical/High/Medium/Low

---

## Test Execution Schedule

### Recommended Testing Phases

**Phase 1: Smoke Testing** (1-2 hours)
- Critical paths only
- All user roles can log in
- Core workflows functional

**Phase 2: Functional Testing** (4-6 hours)
- All features tested
- All user roles tested
- Edge cases covered

**Phase 3: Integration Testing** (2-3 hours)
- External services
- Background jobs
- Data flow

**Phase 4: Performance Testing** (2-3 hours)
- Load testing
- Response times
- Database performance

**Phase 5: Accessibility Testing** (1-2 hours)
- WCAG compliance
- Keyboard navigation
- Screen readers

**Phase 6: Mobile Testing** (2-3 hours)
- Responsive design
- Mobile workflows
- PWA functionality

**Total Estimated Time**: 12-19 hours

---

## Continuous Testing

### Automated Testing Recommendations

1. **Unit Tests**: Services, utilities, helpers
2. **Integration Tests**: API endpoints, database operations
3. **E2E Tests**: Critical user flows (Playwright/Cypress)
4. **Performance Tests**: Load testing, response time monitoring
5. **Visual Regression**: UI component testing

### Manual Testing Schedule

- **Before each release**: Full test checklist
- **Weekly**: Smoke testing of critical paths
- **After major changes**: Full regression testing
- **User acceptance**: Before production deployment

---

## Conclusion

This testing guide provides comprehensive coverage of the Flight Schedule Pro AI Rescheduler application. Use this guide to ensure quality and reliability before each release.

**Remember**: Testing is an iterative process. Update this guide as new features are added and new edge cases are discovered.

---

**Questions or Issues?** Document them and update this guide accordingly.

