# System Patterns: Flight Schedule Pro AI Rescheduler

## Architecture Overview

The system follows a **layered architecture** with clear separation between:
- Client Layer (React frontend)
- API Layer (Next.js serverless functions)
- Business Logic Layer (service modules)
- Data Layer (PostgreSQL, Redis, Firebase)

## Key Architectural Decisions

### 1. Serverless API Architecture
- **Pattern**: Next.js 14 API Routes (serverless functions)
- **Rationale**: Automatic scaling, cost-effective, easy deployment on Vercel
- **Trade-off**: Cold starts possible, mitigated by Vercel's edge network

### 2. Database Strategy
- **Primary**: PostgreSQL (Vercel Postgres) for all relational data
- **Cache**: Redis (Upstash) for weather data and job queue
- **Realtime**: Firebase Realtime Database for live notifications
- **Future**: Read replicas (Phase 2), horizontal sharding (Phase 3)

### 3. Background Job Processing
- **Pattern**: BullMQ with Redis
- **Jobs**: Hourly weather checks, pre-flight briefings, currency checks, maintenance reminders
- **Rationale**: Reliable, scalable, supports retries and monitoring

### 4. AI Integration Pattern
- **Service**: OpenAI GPT-4 API
- **Pattern**: Prompt engineering with structured JSON output
- **Validation**: Always validate AI suggestions against database before presenting
- **Fallback**: Rule-based rescheduling if AI fails

### 5. Weather Data Strategy
- **Primary**: FAA Aviation Weather Center (free, unlimited)
- **Secondary**: WeatherAPI.com (optional, off by default)
- **Caching**: Multi-tier (in-memory → Redis → Database)
- **Rationale**: Minimize API costs, ensure reliability

## Design Patterns in Use

### Service Layer Pattern
All business logic encapsulated in service modules:
```
/src/lib/services/
  weather-service.ts
  ai-reschedule-service.ts
  booking-service.ts
  notification-service.ts
  progress-service.ts
  squawk-service.ts
```

### Repository Pattern (via Prisma)
Prisma ORM provides type-safe database access:
- Centralized schema definition
- Type-safe queries
- Migration management
- Relationship handling

### Observer Pattern (Notifications)
- Firebase Realtime Database for push notifications
- Email notifications via Resend
- Event-driven architecture for weather alerts

### Strategy Pattern (Weather Providers)
Weather service uses adapter pattern for multiple providers:
```typescript
interface WeatherProvider {
  getCurrentWeather(location: string): Promise<WeatherData>;
  getForecast(location: string): Promise<ForecastData>;
}
```

### Transaction Pattern (Booking)
All booking operations use database transactions to prevent race conditions:
- Row-level locking
- Optimistic concurrency control
- Atomic operations

## Navigation Architecture

### Unified Navigation System
The app uses a responsive navigation pattern:
- **Desktop**: Top navigation bar (sticky, always visible)
- **Mobile**: Bottom navigation bar (fixed, always accessible)
- **Both**: Same navigation items (Dashboard, Flights, Profile, Settings*)
- **Role-based**: Settings only shows for admins/super admins

### Navigation Components
- `TopNavigation.tsx`: Desktop navigation (hidden on mobile via `hidden md:block`)
- `BottomNavigation.tsx`: Mobile navigation (hidden on desktop via `md:hidden`)
- Both components:
  - Filter items based on user role
  - Show only when user is authenticated (`user` from Firebase)
  - Hide on auth pages (`/login`, `/signup`, `/`)
  - Prevent hydration errors with `mounted` state

### Page Structure
- **Dashboard** (`/dashboard`): Overview page with metrics, quick actions, weather alerts
- **Flights** (`/flights`): Dedicated page for flight management (filtering, sorting, rescheduling)
- **Profile** (`/profile`): User profile information and sign out
- **Settings** (`/admin/settings`): Admin-only settings page

## Component Relationships

### Frontend Components
```
RootLayout
  ├── TopNavigation (desktop only, hidden on mobile)
  ├── BottomNavigation (mobile only, hidden on desktop)
  └── Page Content
      ├── Dashboard (overview page with metrics and quick actions)
      ├── Flights (dedicated flight management page)
      ├── Profile (user profile page)
      └── Admin Settings (admin only)

Dashboard (Student/Instructor/Admin)
  ├── MetricsDashboard (admin/metrics view)
  ├── WeatherAnalyticsDashboard (admin/analytics view)
  ├── Quick Actions Card
  ├── StudentList (instructor only)
  ├── SquawkReportCard (instructor/admin only)
  └── WeatherAlerts

Flights Page
  └── FlightList
      ├── FlightCard
      │   ├── RescheduleModal
      │   └── WeatherOverrideModal
      └── Filters & Sorting
```

### Service Dependencies
```
WeatherService
  └── FAA API / WeatherAPI.com
  └── Redis Cache

AIService
  └── OpenAI API
  └── BookingService (for availability)
  └── WeatherService (for forecasts)

BookingService
  └── Prisma (database)
  └── NotificationService

NotificationService
  └── Resend (email)
  └── Firebase Realtime (in-app)
```

## Data Flow Patterns

### Weather Check Flow
```
1. Background Job (BullMQ) triggers hourly
2. Fetch upcoming flights from database
3. For each flight:
   a. Get weather data (check cache first)
   b. Calculate weather minimums (student level + aircraft)
   c. Compare weather vs. minimums
   d. If conflict: Trigger AI rescheduling
   e. Send notifications
4. Log results to database
```

### Rescheduling Flow
```
1. Weather conflict detected
2. AI Service gathers context:
   - Student availability
   - Instructor availability
   - Aircraft availability
   - Weather forecasts
3. AI generates 3 suggestions
4. Validation layer checks actual availability
5. Suggestions sent to student
6. Student selects option
7. Instructor confirms
8. Booking created/updated
9. Notifications sent
```

### Booking Confirmation Flow
```
1. Student selects reschedule option
2. System locks slot temporarily (2 hour window)
3. Instructor receives notification
4. Instructor confirms or rejects
5. If confirmed: Booking finalized, both parties notified
6. If rejected: Return to step 1 with new suggestions
7. If expired: Auto-reject, generate new suggestions
```

## Security Patterns

### Authentication
- Firebase Auth for user authentication
- JWT tokens for API authorization
- Role-based access control (RBAC)

### Data Isolation
- School-scoped queries (all data filtered by schoolId)
- User can only access their own data (students) or assigned data (instructors)
- Admin roles for cross-school access

### API Security
- Protected routes via middleware
- Rate limiting on public endpoints
- Input validation on all endpoints
- SQL injection prevention (Prisma parameterized queries)

## Error Handling Patterns

### Graceful Degradation
- Weather API fails → Use cached data
- AI API fails → Fall back to rule-based rescheduling
- Redis fails → Direct database queries
- Email fails → Retry with exponential backoff

### Error Logging
- Sentry for error tracking
- Structured logging for debugging
- Audit trail for sensitive operations

## Performance Patterns

### Caching Strategy
- **L1**: In-memory (5 min TTL) - weather data
- **L2**: Redis (15 min TTL) - weather, availability
- **L3**: Database (historical) - weather logs

### Query Optimization
- Database indexes on foreign keys and common filters
- Read replicas for dashboard queries (Phase 2)
- Batch operations where possible
- Connection pooling

### Background Processing
- Long-running operations moved to BullMQ jobs
- Async processing for notifications
- Scheduled jobs for periodic tasks

## Testing Patterns

### Unit Tests
- Service layer functions
- Utility functions
- Weather parsing logic

### Integration Tests
- API endpoints
- Database operations
- External API integrations

### E2E Tests
- Complete user workflows
- Weather cancellation → reschedule → confirmation
- Booking race conditions

## Deployment Patterns

### CI/CD Pipeline
- GitHub Actions for testing
- Vercel preview deployments for PRs
- Automatic production deployment on main branch
- Database migrations run automatically

### Environment Management
- `.env.local` for development
- Vercel environment variables for staging/production
- Secrets management via Vercel dashboard

