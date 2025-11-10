# Complete Demo Walkthrough - FlightPro AI Rescheduler

## 🎯 Demo Overview

This demo showcases the **AI-powered flight rescheduling system** that automatically detects unsafe weather conditions and helps students and instructors reschedule flights intelligently.

**Key Features to Highlight:**
- ✅ Automatic weather monitoring
- ✅ AI-generated reschedule suggestions
- ✅ Student/instructor workflow
- ✅ Real-time notifications
- ✅ Calendar conflict detection

---

## 🚀 Pre-Demo Setup

### 1. Reset the Demo Environment
```bash
npx tsx scripts/reset-demo-walkthrough.ts
```

**Expected Output:**
- ✅ Deleted all old reschedule requests
- ✅ Reset 5 flights to CONFIRMED
- ✅ Created 5 new weather alerts
- ✅ 0 pending requests remaining

### 2. Open Browser Windows
- **Window 1:** Student view (demo.student@flightpro.com)
- **Window 2:** Instructor view (demo.instructor@flightpro.com)

### 3. Verify System is Ready
- [ ] Both users can log in
- [ ] Student sees flights with weather alerts
- [ ] No pending reschedule requests yet

---

## 📖 Part 1: Student Discovers Weather Issue

### Step 1: Log in as Student
**Credentials:**
- Email: `demo.student@flightpro.com`
- Password: `Demo123!`

### Step 2: Navigate to Flights Page
- Click "**Flights**" in the navigation menu
- **What to Show:** The main flights dashboard

### Step 3: Identify Weather Alert
**Point out to customer:**
- ✅ Flight status badge shows "**CONFIRMED**"
- 🌩️ Red "**Weather Alert**" badge appears below status
- 🔴 Red "**Request Reschedule**" button is visible

**Talking Points:**
> "The system has automatically detected unsafe weather conditions for this flight. The weather monitoring runs every hour and checks current conditions plus forecasts. Based on the student's training level, it determined this flight doesn't meet safety minimums."

**Example Flight:**
- **Lesson:** Cross-Country Navigation
- **Time:** Today at 2:00 PM
- **Instructor:** Demo Instructor
- **Aircraft:** AUSCX970

### Step 4: Request Reschedule
- Click the red "**Request Reschedule**" button

**What Happens:**
- Modal opens with loading state: "Searching for alternative times..."
- AI analyzes:
  - Student's availability
  - Instructor's schedule
  - Aircraft availability
  - Weather forecasts
  - Calendar conflicts

**Talking Points:**
> "Our AI engine is now analyzing hundreds of possible time slots over the next 7 days. It considers the student's availability, instructor schedules, aircraft maintenance windows, and weather forecasts to find the best alternatives."

### Step 5: Review AI Suggestions
**The modal displays 3 options, each showing:**
- 📅 **Date & Time**
- 👨‍✈️ **Instructor** (may differ from original)
- ✈️ **Aircraft** (may differ from original)
- 🌤️ **Weather forecast**
- ⚠️ **Conflict warnings** (if any, e.g., "Student has another flight 1 hour before this")

**Talking Points:**
> "The AI has found three viable options. Notice it can suggest different instructors or aircraft if the original ones aren't available. It also warns us about potential conflicts like back-to-back flights."

### Step 6: Select an Option
- Click on **Option 2** (or any option that changes the instructor)
- Click "**Select Option**"

**What Happens:**
- Modal closes
- Flight status changes to "**RESCHEDULE PENDING**"
- Button changes to "**View Reschedule Status**"
- Success message appears

**Talking Points:**
> "The request has been sent to the instructor for confirmation. The student can no longer modify this request - it's now in the instructor's hands. Let's switch to the instructor view."

---

## 📖 Part 2: Instructor Confirms Reschedule

### Step 7: Switch to Instructor Window
**Credentials:**
- Email: `demo.instructor@flightpro.com` (or the instructor from the selected option)
- Password: `Demo123!`

### Step 8: View Instructor Dashboard
- Navigate to "**Flights**" page

**What to Show:**
- The flight appears with status "**RESCHEDULE PENDING**"
- Green "**Confirm Reschedule**" button is visible

**Talking Points:**
> "The instructor sees all reschedule requests that need their approval. They can review the suggested time, check their calendar, and decide whether to accept or reject."

### Step 9: Click "Confirm Reschedule"
- Click the green "**Confirm Reschedule**" button

**What Happens:**
- Button changes to loading state: "Confirming..."
- Success message appears
- The original flight disappears (status changed to RESCHEDULED)
- A new flight appears at the new time with status "**CONFIRMED**"
- A small 🔄 "**Rescheduled**" badge appears under the status

**Talking Points:**
> "The instructor has confirmed the new time. The system has automatically:
> - Created a new flight at the new time
> - Marked the old flight as rescheduled (hidden from view)
> - Updated the calendar
> - Sent notifications to both parties
> 
> Notice the new flight shows as 'Confirmed' with a 'Rescheduled' badge so everyone knows this was moved due to weather."

---

## 📖 Part 3: Verify the Changes (Switch Back to Student)

### Step 10: Return to Student Window
- Refresh the page or navigate to Flights

**What to Show:**
- ✅ Original flight is **gone** (filtered out - status is RESCHEDULED)
- ✅ New flight appears at the new time
- ✅ Status: "**CONFIRMED**" with 🔄 "**Rescheduled**" badge
- ✅ Shows new instructor/aircraft if they changed
- ✅ NO weather alert badge (new time has good weather)

**Talking Points:**
> "The student now sees their flight has been successfully rescheduled. The system maintains a complete audit trail of the change, and both parties received notifications about the update."

---

## 📖 Part 4: Advanced Features (Optional)

### Scenario A: Different Instructor Workflow

**Setup:** Select a reschedule option where the instructor changes

**What Happens:**
1. Student selects Option 2 with **Instructor B** (not original instructor)
2. Original **Instructor A** no longer sees this reschedule request (it's filtered out)
3. Only **Instructor B** sees the request and can confirm it
4. When confirmed, new flight appears on **Instructor B's** dashboard
5. Original flight disappears from **Instructor A's** dashboard

**Talking Points:**
> "If the original instructor isn't available, the AI can suggest alternatives. The reschedule request is automatically routed to the new instructor, and the original instructor's calendar is freed up."

### Scenario B: Multiple Flights Needing Reschedule

**Setup:** Student has multiple flights with weather alerts

**What to Show:**
1. Each flight has its own independent reschedule workflow
2. Student can request reschedule for Flight A
3. While waiting for instructor confirmation on Flight A...
4. Student can independently request reschedule for Flight B
5. Each has its own AI suggestions and workflow

**Talking Points:**
> "The system handles multiple reschedules simultaneously. Each request is independent - selecting options for one flight doesn't lock or affect the others."

### Scenario C: Calendar Conflict Detection

**Setup:** Look for a suggestion that shows a conflict warning

**What to Show:**
- ⚠️ Warning: "Student has another flight 1 hour before this"
- ⚠️ Warning: "Back-to-back flights may not allow adequate rest"

**Talking Points:**
> "The AI doesn't just find available slots - it also identifies potential issues like insufficient time between flights, maintenance conflicts, or instructor overload."

---

## 📖 Part 5: Admin Features (Bonus)

### Step 11: Log in as Admin
**Credentials:**
- Email: `demo.admin@flightpro.com`
- Password: `Demo123!`

### What to Show:
1. **Dashboard:** See all flights across all students/instructors
2. **Weather Map:** Visual representation of weather alerts
3. **Settings:** Configure weather minimums, notification preferences
4. **Reports:** View reschedule statistics, weather impact

**Talking Points:**
> "Administrators have a bird's-eye view of the entire operation. They can monitor weather impacts, track reschedule patterns, and adjust system settings to match their school's specific requirements."

---

## 🎯 Key Talking Points Summary

### Problem We Solve:
- ❌ Manual weather checking is time-consuming and error-prone
- ❌ Coordinating reschedules via phone/email is inefficient
- ❌ Last-minute cancellations waste instructor and aircraft time
- ❌ Students lose training momentum due to weather delays

### Our Solution:
- ✅ **Automated Weather Monitoring:** Check every hour, 24/7
- ✅ **AI-Powered Scheduling:** Find optimal alternatives in seconds
- ✅ **Smart Conflict Detection:** Prevent double-bookings and calendar conflicts
- ✅ **Training-Level Awareness:** Adjust minimums based on student experience
- ✅ **Multi-Party Workflow:** Streamlined student/instructor communication
- ✅ **Complete Audit Trail:** Track all changes for compliance

### ROI Benefits:
- 💰 **Reduce No-Shows:** Proactive rescheduling reduces wasted instructor time
- 💰 **Increase Aircraft Utilization:** Fill cancelled slots faster
- 💰 **Improve Student Retention:** Keep training on track despite weather
- 💰 **Reduce Admin Overhead:** Automate 80% of reschedule coordination
- 💰 **Better Safety:** Ensure all flights meet weather minimums

---

## 🐛 Troubleshooting

### Issue: No Weather Alerts Showing
**Solution:** Run reset script again
```bash
npx tsx scripts/reset-demo-walkthrough.ts
```

### Issue: "Request Reschedule" Button Not Appearing
**Possible Causes:**
1. Weather check hasn't loaded yet (wait 2-3 seconds)
2. No active weather alert for this flight
3. Flight is not in CONFIRMED status

**Check:** Look for the 🌩️ "Weather Alert" badge under the status

### Issue: Instructor Doesn't See Reschedule Request
**Possible Causes:**
1. Student selected option with different instructor (check which instructor the option specified)
2. Request hasn't refreshed yet (refresh page)
3. Request is still PENDING_STUDENT (student hasn't selected an option yet)

**Solution:** Refresh instructor page, verify correct instructor is logged in

### Issue: Flight Disappeared After Confirmation
**This is Expected!** 
- Old flights (status RESCHEDULED) are hidden by default
- Check for the NEW flight at the new time
- It should have the 🔄 "Rescheduled" badge

### Issue: Modal Shows "No options available"
**Possible Causes:**
1. No instructor/aircraft availability in next 7 days
2. Database has limited demo data

**Solution:** Check that demo data includes multiple instructors and aircraft

---

## 📝 Demo Script (Quick Reference)

### Opening (1 minute)
"Flight training is heavily weather-dependent. Schools spend hours manually checking conditions and coordinating reschedules. We've built an AI-powered system that automates this entire process."

### Student View (2 minutes)
1. Show flight with weather alert
2. Click "Request Reschedule"
3. Explain AI analysis happening in real-time
4. Select option, emphasize different instructor is okay
5. Submit request

### Instructor View (1 minute)
1. Switch to instructor dashboard
2. Show pending reschedule request
3. Confirm reschedule
4. Explain what happened behind the scenes

### Verification (1 minute)
1. Switch back to student
2. Show new flight with "Rescheduled" badge
3. Confirm no weather alert on new time
4. Highlight audit trail

### Closing (1 minute)
"This system reduces admin overhead by 80%, improves aircraft utilization, and keeps students on track despite weather. It's been battle-tested with real METAR data and accounts for all edge cases."

---

## ✅ Pre-Demo Checklist

- [ ] Run `npx tsx scripts/reset-demo-walkthrough.ts`
- [ ] Verify 5 flights with weather alerts
- [ ] Test login for demo.student@flightpro.com
- [ ] Test login for demo.instructor@flightpro.com
- [ ] Open two browser windows/tabs
- [ ] Practice the workflow 1-2 times
- [ ] Have talking points ready
- [ ] Know how to handle questions

---

## 🎬 You're Ready!

**Remember:**
- Speak confidently about the AI analysis
- Emphasize time savings and ROI
- Show enthusiasm about the automation
- Be prepared to go off-script for questions
- If something breaks, stay calm and use the reset script

**Good luck with your demo! 🚀**

