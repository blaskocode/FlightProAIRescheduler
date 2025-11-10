# Demo Quick Reference Card

## 🚀 Pre-Demo Setup (2 minutes)

```bash
# 1. Reset flights to CONFIRMED (if needed)
npx tsx scripts/reset-demo-flights.ts

# 2. Run full setup (creates flights + weather alerts)
npx tsx scripts/setup-demo-walkthrough.ts

# 3. Verify setup
npx tsx scripts/verify-reschedule-workflow.ts
```

**Expected Output: ✅ 2 flights created, 2 weather alerts

---

## 📋 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `demo.admin@flightpro.com` | `DemoPass123!` |
| Instructor | `demo.instructor@flightpro.com` | `DemoPass123!` |
| Student (Beginner) | `demo.student@flightpro.com` | `DemoPass123!` |
| Student (Instrument) | `demo.ir.student@flightpro.com` | `DemoPass123!` |

---

## 🎬 Demo Flow (15 minutes)

### 1. Admin Dashboard (2 min)
- Login: `demo.admin@flightpro.com`
- Show: Weather map, alerts, metrics
- **Key Point**: "Automatic 24/7 monitoring"

### 2. Weather Alerts (2 min)
- Show: 2 flights with weather issues
- **Key Point**: "Different minimums for different training levels"

### 3. Student View (3 min)
- Login: `demo.student@flightpro.com`
- Click: "Request Reschedule" on flight
- Show: AI generates 3 options
- Accept: Option 1
- **Key Point**: "AI considers multiple factors"

### 4. Instructor View (3 min)
- Login: `demo.instructor@flightpro.com`
- Show: Pending reschedule request
- Click: "Confirm Reschedule"
- **Key Point**: "Instructor has final approval"

### 5. Verify Results (2 min)
- Login: `demo.student@flightpro.com` again
- Show: New confirmed flight with "Rescheduled" badge
- **Key Point**: "Complete workflow in minutes"

---

## 🔧 Quick Fixes

### No Weather Alerts?
```bash
npx tsx scripts/create-weather-alert-for-student.ts demo.student@flightpro.com
```

### Flights Not Showing?
```bash
npx tsx scripts/reset-demo-flights.ts
```

### Need Fresh Setup?
```bash
npx tsx scripts/setup-demo-walkthrough.ts
```

---

## 💬 Key Talking Points

1. **Safety**: "System recommends, instructor decides"
2. **Automation**: "Saves 2-3 hours per cancellation"
3. **Intelligence**: "AI learns from patterns"
4. **Compliance**: "Complete audit trail"

---

## ✅ Success Checklist

Before demo:
- [ ] Setup script run successfully
- [ ] 2 flights created (10:00 AM and 10:30 AM tomorrow)
- [ ] Weather alerts exist for both flights
- [ ] Flights are CONFIRMED (not WEATHER_CANCELLED)
- [ ] Dev server running (`npm run dev`)
- [ ] All accounts can login

During demo:
- [ ] Admin dashboard shows weather alerts
- [ ] Student can see "Request Reschedule" button
- [ ] AI generates 3 suggestions
- [ ] Instructor can confirm reschedule
- [ ] New flight appears with "Rescheduled" badge

---

## 📞 Troubleshooting

**Problem**: AI not generating suggestions  
**Fix**: Check OpenAI API key in `.env.local`  
**Workaround**: System uses rule-based fallback

**Problem**: Notifications not sending  
**Fix**: Check Resend API key  
**Workaround**: Show notification records in database

**Problem**: Flight status wrong  
**Fix**: Run `npx tsx scripts/reset-demo-flights.ts`

---

**Total Time**: 15 minutes  
**Practice Runs**: 2-3 recommended

