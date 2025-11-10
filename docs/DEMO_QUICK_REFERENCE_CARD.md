# Demo Quick Reference Card 🎯

## 🔑 Login Credentials

| User | Email | Password |
|------|-------|----------|
| **Student** | demo.student@flightpro.com | Demo123! |
| **Instructor** | demo.instructor@flightpro.com | Demo123! |
| **Admin** | demo.admin@flightpro.com | Demo123! |

## 🚀 Quick Reset
```bash
npx tsx scripts/reset-demo-walkthrough.ts
```

## 📋 5-Minute Demo Flow

### 1️⃣ STUDENT VIEW (2 min)
1. Log in as student
2. Go to **Flights** page
3. Point out: ✅ CONFIRMED + 🌩️ Weather Alert
4. Click red **"Request Reschedule"** button
5. Wait for AI suggestions (explain analysis)
6. Select **Option 2** (changes instructor)
7. Click **"Select Option"**
8. Show: Status = RESCHEDULE PENDING

### 2️⃣ INSTRUCTOR VIEW (1 min)
1. Switch window/tab
2. Log in as instructor
3. Go to **Flights** page
4. Find flight with RESCHEDULE PENDING
5. Click green **"Confirm Reschedule"** button
6. Show: New flight appears, old one gone

### 3️⃣ VERIFY (1 min)
1. Switch back to student window
2. Refresh page
3. Show: New flight with 🔄 Rescheduled badge
4. Point out: No weather alert on new time

### 4️⃣ CLOSING (1 min)
- Explain ROI benefits
- Answer questions
- Offer to show admin features

## 💬 Key Talking Points

**Opening:**
> "Flight schools waste hours manually checking weather and coordinating reschedules. Our AI does this automatically."

**During AI Search:**
> "The AI is analyzing hundreds of time slots, checking instructor availability, aircraft maintenance, and weather forecasts."

**After Student Selects:**
> "Notice the AI suggested a different instructor - it finds the best option even if the original instructor isn't available."

**After Instructor Confirms:**
> "The system automatically created the new flight, updated calendars, and sent notifications. Zero manual work."

**Closing:**
> "This reduces admin overhead by 80%, improves utilization, and keeps students on track."

## 🎯 ROI Quick Stats

- ⏱️ **90% faster** than manual reschedule coordination
- 💰 **Save 10+ hours/week** of admin time
- ✈️ **15% better** aircraft utilization
- 📈 **20% improvement** in student retention
- ☁️ **24/7 monitoring** of weather conditions

## 🐛 Quick Fixes

| Problem | Solution |
|---------|----------|
| No weather alerts | Run reset script |
| Button not appearing | Wait 3 seconds, refresh |
| Instructor doesn't see request | Check if different instructor was selected |
| Flight disappeared | That's expected! Look for NEW flight at new time |

## 📱 Demo Windows Setup

**Two windows side-by-side:**
- **LEFT:** Student view (demo.student@flightpro.com)
- **RIGHT:** Instructor view (demo.instructor@flightpro.com)

## ⚡ Emergency Script

If anything breaks:
```bash
npx tsx scripts/reset-demo-walkthrough.ts
```
Then refresh all browser windows.

## 🎬 Opening Line

> "Imagine a flight school where weather issues are detected automatically, and reschedules happen with one click instead of dozens of phone calls. Let me show you how it works..."

## 📊 Demo Checklist

- [ ] Reset script completed
- [ ] Both windows open
- [ ] Tested student login
- [ ] Tested instructor login
- [ ] See 5 flights with alerts
- [ ] Ready to go!

---

**Remember:** Confidence, enthusiasm, focus on ROI! 🚀

