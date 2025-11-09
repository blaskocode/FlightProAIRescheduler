# Demo Scale Recommendations

## Recommended Demo Scale

For an impressive demo that showcases the system's capabilities, we recommend the following scale:

### **Standard Demo (Recommended)**
- **10 Schools** - Shows multi-tenant capability
- **30 Instructors per school** (300 total) - Realistic instructor-to-student ratio
- **150 Students per school** (1,500 total) - Shows scale
- **8 Aircraft per school** (80 total) - Realistic fleet size
- **200 Flights per school** (2,000 total) - Mix of past and future flights
- **100 Reschedule Requests** - Shows AI features in action

**Total Data Points:**
- ~2,000 users (students + instructors)
- ~2,000 flights
- ~100 reschedule requests
- ~500 weather checks

**Estimated Generation Time:** 5-10 minutes

### **Large Demo (Enterprise Scale)**
- **20 Schools**
- **50 Instructors per school** (1,000 total)
- **200 Students per school** (4,000 total)
- **12 Aircraft per school** (240 total)
- **500 Flights per school** (10,000 total)
- **500 Reschedule Requests**

**Estimated Generation Time:** 20-30 minutes

### **Small Demo (Quick Test)**
- **5 Schools**
- **15 Instructors per school** (75 total)
- **50 Students per school** (250 total)
- **5 Aircraft per school** (25 total)
- **100 Flights per school** (500 total)
- **50 Reschedule Requests**

**Estimated Generation Time:** 2-3 minutes

## How to Generate Demo Data

### Option 1: Use the Script (Recommended)

```bash
npm run db:demo
```

This will generate data based on the configuration in `scripts/generate-demo-data.ts`.

### Option 2: Customize the Scale

Edit `scripts/generate-demo-data.ts` and modify the `CONFIG` object:

```typescript
const CONFIG = {
  schools: 10,              // Change this
  instructorsPerSchool: 30, // Change this
  studentsPerSchool: 150,   // Change this
  aircraftPerSchool: 8,     // Change this
  flightsPerSchool: 200,    // Change this
  weatherChecks: 500,       // Change this
  rescheduleRequests: 100,  // Change this
};
```

Then run:
```bash
npm run db:demo
```

## What Gets Generated

### Schools
- Realistic airport codes (KAUS, KDAL, KHOU, etc.)
- Geographic coordinates
- Contact information
- Weather API settings

### Instructors
- Realistic names and emails
- CFI certificates and ratings
- Currency status
- Student assignments

### Students
- Realistic names and emails
- Varied training levels (Early Student → Commercial Pilot)
- Flight hours and progress
- Preferred instructors

### Aircraft
- Various aircraft types (Cessna 172, Piper Arrow, Cirrus SR20, etc.)
- Realistic tail numbers
- Maintenance schedules
- Hourly rates

### Flights
- Mix of past and future flights
- Various statuses (Confirmed, Pending, Cancelled, Completed)
- Different flight types (Dual, Solo, Cross Country, etc.)
- Realistic scheduling

### Reschedule Requests
- Linked to cancelled flights
- AI-generated suggestions
- Various statuses (Pending, Accepted, Rejected)

## Performance Considerations

### Database Size
- **Standard Demo**: ~50-100 MB database
- **Large Demo**: ~200-500 MB database

### Query Performance
- All queries are indexed for performance
- Pagination is implemented for large lists
- Metrics are calculated efficiently

### Generation Time
- Depends on database connection speed
- PostgreSQL on Vercel: ~5-10 minutes for standard demo
- Local PostgreSQL: ~2-5 minutes for standard demo

## Tips for Demo

1. **Start with Standard Demo** - It's a good balance of scale and generation time
2. **Use Realistic Data** - The script generates realistic names, emails, and data
3. **Show Variety** - The demo includes various training levels, flight types, and statuses
4. **Highlight AI Features** - Reschedule requests show the AI in action
5. **Multi-Tenant** - Switch between schools to show isolation

## Resetting Demo Data

To clear and regenerate:

```bash
# Clear existing data (optional - script does this automatically)
npx prisma migrate reset

# Generate new demo data
npm run db:demo
```

## Verification

After generation, verify the data:

```bash
# Check data counts
npx tsx scripts/check-test-data.ts
```

Or use Prisma Studio:

```bash
npm run db:studio
```

