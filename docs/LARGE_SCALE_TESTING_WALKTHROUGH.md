# Large-Scale Demo Data Testing Walkthrough

## Overview
This guide walks through testing scenarios with the large-scale demo data:
- **10 schools**
- **300 instructors** (30 per school)
- **1,500 students** (150 per school)
- **80 aircraft** (8 per school)
- **2,000 flights** (200 per school)
- **100 reschedule requests**

## Pre-Testing Setup

### 1. Verify Data Generation
```bash
# Check that data was generated successfully
npm run db:demo
```

Expected output should show:
- ✅ Created 10 schools
- ✅ Created 300 instructors
- ✅ Created 1,500 students
- ✅ Created 80 aircraft
- ✅ Created 2,000 flights
- ✅ Created 100 reschedule requests

### 2. Access the Application
1. Start the development server: `npm run dev`
2. Navigate to `http://localhost:3000`
3. You should see the landing page with demo credentials

---

## Test Scenario 1: Multi-School Dashboard Performance (5 minutes)

### Objective
Test dashboard loading and performance with large datasets across multiple schools.

### Steps
1. **Login as Admin**
   - Use: `admin.demo@flightpro.com` / `DemoPass123!`
   - Should redirect to dashboard

2. **Check Dashboard Load Time**
   - Open browser DevTools (F12) → Network tab
   - Note the time to load:
     - Weather alerts
     - Metrics dashboard
     - Weather analytics
     - Weather map

3. **Verify Metrics Display**
   - Check that all metrics show reasonable values:
     - Total flights
     - Active students
     - Weather cancellations
     - Average reschedule time
   - **Expected**: Metrics should load in < 3 seconds

4. **Test School Switcher** (if visible)
   - Switch between different schools
   - Verify data updates correctly
   - Check that metrics change per school

### Success Criteria
- ✅ Dashboard loads in < 5 seconds
- ✅ All metrics display correctly
- ✅ No console errors
- ✅ Smooth transitions when switching schools

---

## Test Scenario 2: Flight List Performance (5 minutes)

### Objective
Test flight list loading, filtering, and pagination with 2,000 flights.

### Steps
1. **Navigate to Flights Page**
   - Click "Flights" in navigation
   - Or go to `/flights`

2. **Check Initial Load**
   - Note time to load flight list
   - Check browser console for any errors
   - **Expected**: Should load in < 3 seconds

3. **Test Filtering**
   - Filter by status (e.g., "SCHEDULED", "WEATHER_CANCELLED")
   - Filter by date range
   - Filter by student or instructor
   - **Expected**: Filters should apply quickly (< 1 second)

4. **Test Search**
   - Search for a student name
   - Search for an aircraft tail number
   - Search for an airport code
   - **Expected**: Search results should appear instantly

5. **Test Pagination** (if implemented)
   - Navigate through pages
   - Check that pagination controls work
   - Verify page numbers are correct

### Success Criteria
- ✅ Flight list loads in < 3 seconds
- ✅ Filtering works correctly
- ✅ Search is responsive
- ✅ No performance degradation with large dataset

---

## Test Scenario 3: Weather Checks and Alerts (10 minutes)

### Objective
Test weather checking functionality with large number of flights.

### Steps
1. **View Weather Alerts**
   - Go to dashboard
   - Check "Weather Alerts" section
   - Verify alerts are displayed correctly

2. **Manual Weather Check**
   - Navigate to a flight with status "SCHEDULED"
   - Click "Check Weather" or similar action
   - Wait for weather check to complete
   - Verify results are displayed

3. **Test Weather Override**
   - Find a flight marked as "UNSAFE" due to weather
   - Try to override the weather decision (if you have permission)
   - Verify the override is saved

4. **Check Weather Analytics**
   - Go to Weather Analytics Dashboard
   - Verify charts and graphs load correctly
   - Check that data reflects the large dataset

### Success Criteria
- ✅ Weather alerts display correctly
- ✅ Manual weather checks complete successfully
- ✅ Weather analytics load with accurate data
- ✅ No timeout errors

---

## Test Scenario 4: Reschedule Request Workflow (10 minutes)

### Objective
Test the AI-powered rescheduling workflow with existing reschedule requests.

### Steps
1. **View Reschedule Requests**
   - Navigate to flights page
   - Filter for flights with "WEATHER_CANCELLED" status
   - Look for flights with reschedule requests

2. **Review Reschedule Request**
   - Click on a flight with a reschedule request
   - View the AI-generated suggestions
   - Check the confidence scores
   - Review the AI reasoning

3. **Test Reschedule Acceptance** (if you're an instructor)
   - Login as: `instructor.demo@flightpro.com` / `DemoPass123!`
   - Find a reschedule request
   - Accept one of the suggested times
   - Verify the flight is rescheduled

4. **Check Reschedule Metrics**
   - Go back to dashboard as admin
   - Check "Average Reschedule Time" metric
   - Verify it reflects the reschedule requests

### Success Criteria
- ✅ Reschedule requests are visible
- ✅ AI suggestions are displayed correctly
- ✅ Reschedule workflow completes successfully
- ✅ Metrics update correctly

---

## Test Scenario 5: Multi-User Concurrent Access (5 minutes)

### Objective
Test the application with multiple users accessing different schools.

### Steps
1. **Open Multiple Browser Windows**
   - Window 1: Login as admin
   - Window 2: Login as instructor from School 1
   - Window 3: Login as student from School 2

2. **Test Concurrent Actions**
   - In Window 1: View dashboard metrics
   - In Window 2: View instructor's flight list
   - In Window 3: View student's upcoming flights
   - All should work simultaneously

3. **Test Data Isolation**
   - Verify instructor only sees their school's data
   - Verify student only sees their own flights
   - Verify admin can see all schools

### Success Criteria
- ✅ Multiple users can access simultaneously
- ✅ Data is properly isolated by school/role
- ✅ No conflicts or errors

---

## Test Scenario 6: Search and Filter Performance (5 minutes)

### Objective
Test search and filtering performance with large datasets.

### Steps
1. **Student Search**
   - Go to dashboard (as instructor/admin)
   - Use student list search
   - Search for common names
   - **Expected**: Results appear instantly

2. **Flight Search**
   - Go to flights page
   - Use search bar
   - Search by various criteria
   - **Expected**: Search is responsive

3. **Aircraft Search**
   - Navigate to aircraft management (if available)
   - Search for aircraft by tail number
   - **Expected**: Quick results

4. **Complex Filters**
   - Apply multiple filters simultaneously
   - Combine date range + status + student
   - **Expected**: Filters work together correctly

### Success Criteria
- ✅ All searches are fast (< 1 second)
- ✅ Filters can be combined
- ✅ Results are accurate

---

## Test Scenario 7: Analytics and Reporting (5 minutes)

### Objective
Test analytics dashboards with large datasets.

### Steps
1. **Metrics Dashboard**
   - View all metrics on dashboard
   - Verify calculations are correct
   - Check that numbers make sense for the dataset

2. **Weather Analytics**
   - View weather analytics dashboard
   - Check charts load correctly
   - Verify data points reflect the dataset size

3. **Historical Data**
   - Check historical weather data
   - Verify past cancellations are tracked
   - Check trend analysis

### Success Criteria
- ✅ All analytics load correctly
- ✅ Charts render properly
- ✅ Data is accurate

---

## Test Scenario 8: Error Handling (5 minutes)

### Objective
Test error handling with edge cases.

### Steps
1. **Invalid Search**
   - Search for non-existent student
   - Search for invalid date range
   - **Expected**: Graceful "no results" message

2. **Network Issues**
   - Open DevTools → Network tab
   - Throttle to "Slow 3G"
   - Try to load dashboard
   - **Expected**: Loading states show, no crashes

3. **Missing Data**
   - Try to access a flight that doesn't exist
   - Try to view a student with no flights
   - **Expected**: Appropriate error messages

### Success Criteria
- ✅ Errors are handled gracefully
- ✅ User-friendly error messages
- ✅ No crashes or white screens

---

## Performance Benchmarks

### Expected Performance Targets
- **Dashboard Load**: < 5 seconds
- **Flight List Load**: < 3 seconds
- **Search Results**: < 1 second
- **Filter Application**: < 1 second
- **Weather Check**: < 5 seconds
- **Page Navigation**: < 1 second

### Monitoring
- Use browser DevTools Performance tab
- Check Network tab for slow requests
- Monitor console for errors
- Watch for memory leaks (check Memory tab)

---

## Common Issues and Solutions

### Issue: Slow Dashboard Load
**Solution**: 
- Check if metrics are being calculated on-the-fly
- Consider caching frequently accessed data
- Optimize database queries

### Issue: Flight List Takes Too Long
**Solution**:
- Implement pagination
- Add virtual scrolling
- Optimize database queries with indexes

### Issue: Search is Slow
**Solution**:
- Add database indexes on searchable fields
- Implement debouncing on search input
- Consider full-text search

### Issue: Memory Issues
**Solution**:
- Check for memory leaks in React components
- Implement proper cleanup in useEffect hooks
- Consider lazy loading for large lists

---

## Test Checklist

- [ ] Dashboard loads quickly with all metrics
- [ ] Flight list handles 2,000+ flights
- [ ] Search is responsive
- [ ] Filters work correctly
- [ ] Weather checks complete successfully
- [ ] Reschedule requests display correctly
- [ ] Multi-user access works
- [ ] Data isolation by school works
- [ ] Analytics dashboards load correctly
- [ ] Error handling is graceful
- [ ] No console errors
- [ ] No memory leaks
- [ ] Performance meets benchmarks

---

## Next Steps

After completing these tests:
1. Document any performance issues
2. Note any bugs or unexpected behavior
3. Create tickets for improvements
4. Consider load testing with even larger datasets
5. Test on different devices/browsers

---

## Notes

- All demo accounts use password: `DemoPass123!`
- Demo accounts:
  - Admin: `admin.demo@flightpro.com`
  - Instructor: `instructor.demo@flightpro.com`
  - Student: `student.demo@flightpro.com`
- Data is generated randomly, so exact numbers may vary
- Some features may require specific roles to test


