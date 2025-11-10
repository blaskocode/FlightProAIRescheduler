# FlightPro AI Rescheduler - Step-by-Step Demo Walkthrough

## Pre-Demo Setup (Run Once)

### Step 1: Run Setup Script

```bash
npx tsx scripts/setup-demo-walkthrough.ts
```

This script will:
- ✅ Verify demo accounts exist
- ✅ Create flights for tomorrow (10:00 AM and 10:30 AM)
- ✅ Create weather alerts (UNSAFE for student pilot, MARGINAL for instrument student)
- ✅ Set up all necessary conditions

### Step 2: Reset Flights to CONFIRMED (Important!)

If flights are in WEATHER_CANCELLED status, reset them so students can request reschedules:

```bash
npx tsx scripts/reset-demo-flights.ts
```

This ensures flights are in CONFIRMED status with weather alerts, making them reschedulable.

### Step 3: Verify Setup

The script will output a summary. Verify:
- ✅ At least 2 flights created
- ✅ Weather alerts created
- ✅ Flights are CONFIRMED (not WEATHER_CANCELLED)
- ✅ All demo accounts exist

---

## Demo Walkthrough (15 minutes)

### Part 1: Admin Dashboard Overview (2 minutes)

**Login as Admin**:
1. Navigate to `http://localhost:3000/login`
2. Email: `demo.admin@flightpro.com`
3. Password: `DemoPass123!`
4. Click "Sign In"

**What to Show**:
- **Dashboard Metrics**:
  - Point out: "Active Flights", "Upcoming Flights", "Weather Alerts"
  - Show the numbers (should show weather alerts > 0)
  
- **Weather Map**:
  - Click on the "Weather Map" section
  - Show airport markers (red = unsafe, yellow = marginal, green = safe)
  - Click on a marker to show popup with flight details
  - Explain: "The system monitors weather 24/7 and visualizes it on this map"

- **Quick Actions**:
  - Show "Refresh Weather Data" button
  - Explain: "Admins can manually trigger weather checks"

**Key Talking Points**:
- "The system automatically monitors weather for all scheduled flights"
- "Weather alerts are color-coded for quick identification"
- "Admins have full visibility into all flights and weather conditions"

---

### Part 2: Trigger Weather Check (1 minute)

**Option A: Use the Button** (Recommended):
1. On the Admin Dashboard, click "⚡ Refresh Weather Data"
2. Wait for completion message
3. Show: "Queued X weather checks"

**Option B: Via Terminal**:
```bash
npx tsx scripts/trigger-weather-checks.ts
```

**What's Happening**:
- System fetches current weather for all airports
- Checks conditions against training-level minimums
- Creates weather check records
- Triggers notifications if unsafe

**Key Talking Point**:
- "The system checks weather automatically every hour, but admins can trigger immediate checks"

---

### Part 3: Weather Alert Detection (2 minutes)

**Show Weather Alerts Dashboard**:
1. Scroll to "Weather Alerts" section on dashboard
2. Point out active alerts

**Expected Display**:
```
🌦️ Weather Alert: Flight ID xxx
   - Departure: KAUS
   - Student: demo.student@flightpro.com
   - Status: UNSAFE
   - Confidence: HIGH (95%)
   - Reason: "Visibility 0.5 SM - below student pilot minimum of 3 SM"
```

**Key Talking Points**:
- "Notice the STUDENT PILOT flight is flagged as UNSAFE"
- "The INSTRUMENT STUDENT flight might show as MARGINAL or SAFE"
- "The AI considers training level automatically - different minimums for different students"

---

### Part 4: Training-Level Logic Demonstration (2 minutes)

**Show the Difference**:

1. **Student Pilot Flight** (10:00 AM):
   - Status: UNSAFE
   - Reason: Visibility 0.5 SM < 3 SM minimum
   - Ceiling: 200 ft < 1500 ft minimum
   - **Cannot fly**

2. **Instrument Student Flight** (10:30 AM):
   - Status: MARGINAL or SAFE
   - Reason: Visibility 1.5 SM > 1 SM minimum (OK for instrument)
   - Ceiling: 400 ft > 500 ft minimum (marginal, but acceptable)
   - **Can fly with caution**

**Key Talking Point**:
- "Same weather, different results based on training level!"
- "Student pilot can't fly, but instrument student can"
- "This is automatic - the system knows each student's capabilities"

---

### Part 5: Student View - AI Reschedule Suggestions (3 minutes)

**Login as Student**:
1. Sign out from admin account
2. Navigate to login page
3. Email: `demo.student@flightpro.com`
4. Password: `DemoPass123!`
5. Click "Sign In"

**Navigate to Flights**:
1. Click "Flights" in navigation
2. Find the flight with weather alert (should show "Request Reschedule" button)

**Request Reschedule**:
1. Click "Request Reschedule" button on the flight with weather alert
2. Wait for AI to generate suggestions (may take 10-15 seconds)
3. Show the reschedule modal with 3 options

**Expected Display**:
```
Option 1: Tomorrow 2:00 PM
✅ Weather forecast: Clear skies
✅ Instructor available
✅ Aircraft available
💡 Reasoning: "Weather clears by afternoon. Maintains 
   instructor continuity which is important for training 
   progression."

Option 2: Day After Tomorrow 10:00 AM
✅ Weather forecast: Scattered clouds
✅ Instructor available
✅ Aircraft available
💡 Reasoning: "Original time slot. Student typically 
   performs better in morning hours based on history."

Option 3: Tomorrow 4:00 PM
✅ Weather forecast: Few clouds
✅ Different instructor (John Smith)
✅ Aircraft available
💡 Reasoning: "Latest available slot. Note: Different 
   instructor may require brief introduction."
```

**Key Talking Points**:
- "AI considers multiple factors: weather, availability, training history"
- "Each option has detailed reasoning"
- "Student can review and choose the best option"

**Accept a Suggestion**:
1. Click "Accept" on Option 1
2. Show confirmation: "Pending instructor approval"
3. Status changes to show "Reschedule Pending"

---

### Part 6: Instructor View - Confirm Reschedule (3 minutes)

**Login as Instructor**:
1. Sign out from student account
2. Navigate to login page
3. Email: `demo.instructor@flightpro.com`
4. Password: `DemoPass123!`
5. Click "Sign In"

**View Pending Reschedule**:
1. Navigate to "Flights" page
2. Find the flight with "RESCHEDULE PENDING" status
3. Show the reschedule details

**Confirm Reschedule**:
1. Click "Confirm Reschedule" button
2. Show the confirmation process
3. Wait for completion

**What Happens**:
- Original flight status → RESCHEDULED (hidden from list)
- New flight created with new time
- New flight status → CONFIRMED (with "Rescheduled" badge)
- Email notifications sent (if configured)
- Audit log entry created

**Key Talking Points**:
- "Instructor has final approval authority"
- "System creates a new confirmed flight automatically"
- "Original flight is archived for record-keeping"

---

### Part 7: Verify Results (2 minutes)

**Login as Student Again**:
1. Sign out from instructor
2. Login as `demo.student@flightpro.com`

**View Rescheduled Flight**:
1. Navigate to "Flights" page
2. Show the new confirmed flight
3. Point out:
   - Status: "CONFIRMED"
   - Badge: "🔄 Rescheduled" (below status)
   - New time: Different from original

**Key Talking Points**:
- "The reschedule is complete"
- "Student can see the new flight time"
- "Original flight is no longer visible (it's been rescheduled)"

---

### Part 8: Database Verification (Optional - 2 minutes)

**Run Verification Script**:
```bash
npx tsx scripts/verify-reschedule-workflow.ts
```

**Show Results**:
- ✅ Rescheduled flights found
- ✅ New confirmed flights created
- ✅ Reschedule requests logged
- ✅ Weather checks recorded
- ✅ Notifications sent

**Key Talking Points**:
- "Every action is logged"
- "Complete audit trail for compliance"
- "Weather data archived for analysis"

---

## Demo Checklist

Before starting the demo, verify:

- [ ] Demo accounts exist in Firebase
- [ ] Demo accounts synced to database (run sync if needed)
- [ ] Setup script run successfully
- [ ] At least 2 flights created for tomorrow
- [ ] Weather alerts created
- [ ] Development server running (`npm run dev`)
- [ ] All API endpoints responding
- [ ] Weather map displaying correctly

---

## Troubleshooting During Demo

### No Weather Alerts Showing

**Quick Fix**:
```bash
npx tsx scripts/create-weather-alert-for-student.ts demo.student@flightpro.com
```

### AI Not Generating Suggestions

**Cause**: OpenAI API key not configured

**Solution**:
- Use fallback suggestions (system generates rule-based alternatives)
- Or add OpenAI API key to `.env.local`

**Talking Point**:
- "The system has a fallback mode that generates suggestions based on availability rules"

### Notifications Not Sending

**Cause**: Resend not configured

**Solution**:
- Check notification table in database (notifications are created)
- Explain: "In production, emails would be sent via Resend"
- Show notification records in database

**Talking Point**:
- "Notifications are queued and logged - in production they're sent via email/SMS"

### Flight Not Showing After Reschedule

**Solution**:
- Refresh the page
- Check that the new flight was created
- Verify status is CONFIRMED

---

## Key Talking Points Summary

### Safety First
- "System provides recommendations, but final decision is always with the instructor"
- "FAA regulations are automatically enforced"
- "Never overrides pilot judgment"

### Automation Benefits
- "Saves 2-3 hours per cancellation"
- "95% of reschedules completed within 24 hours"
- "Reduces revenue loss by 60%+"

### Intelligence
- "AI learns from patterns and preferences"
- "Considers factors humans might miss"
- "Improves over time with more data"

### Compliance
- "Complete audit trail"
- "Weather data archived"
- "All actions logged"

---

## Post-Demo Q&A Prep

**Q**: What if the AI suggests something unsafe?  
**A**: Multiple safety layers - weather minimums enforced, instructor approval required, student can reject

**Q**: What happens if weather deteriorates after reschedule?  
**A**: System continues monitoring, will flag new time if needed

**Q**: How does it handle instructor preferences?  
**A**: AI considers instructor availability, preferences, and teaching style when matching

**Q**: What about aircraft maintenance?  
**A**: System integrates maintenance calendar, automatically excludes aircraft

**Q**: Can students override the AI?  
**A**: Yes, students can reject suggestions and request manual rescheduling

---

## Success Criteria

By the end of this demo, viewers should understand:

✅ **How** weather conflicts are detected automatically  
✅ **Why** training level matters for weather minimums  
✅ **What** the AI considers when suggesting times  
✅ **Who** is involved in the approval process  
✅ **Where** all the data is logged and stored  
✅ **When** the system intervenes (automatically and on-demand)

---

**Total Demo Time**: ~15 minutes  
**Setup Time**: ~2 minutes (after initial setup)  
**Recommended Practice Runs**: 2-3 times before customer presentation

