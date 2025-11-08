# Technical Context: Flight Schedule Pro AI Rescheduler

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite (via Next.js)
- **Styling**: TailwindCSS + shadcn/ui components
- **State Management**: TanStack Query (server state), React Context (client state)
- **Date Handling**: date-fns-tz (timezone handling)
- **Real-time**: Firebase SDK (realtime database listeners)

### Backend
- **Framework**: Next.js 14 (App Router)
- **Runtime**: Node.js 20+
- **Language**: TypeScript (strict mode)
- **ORM**: Prisma
- **API Style**: RESTful API Routes

### Database
- **Primary**: PostgreSQL 15+ (Vercel Postgres)
- **Cache/Queue**: Redis (Upstash Redis)
- **Realtime**: Firebase Realtime Database

### AI/ML
- **Provider**: OpenAI GPT-4 API
- **Use Case**: Intelligent rescheduling suggestions
- **Pattern**: Prompt engineering with structured JSON output

### External APIs
- **Weather (Primary)**: FAA Aviation Weather Center (METAR/TAF) - FREE, unlimited
- **Weather (Optional)**: WeatherAPI.com - OFF by default, toggleable
- **Email**: Resend (transactional emails)
- **Auth**: Firebase Authentication

### Infrastructure
- **Hosting**: Vercel (serverless functions, edge network)
- **Database**: Vercel Postgres (managed PostgreSQL)
- **Redis**: Upstash Redis (managed Redis for BullMQ)
- **Auth/Realtime**: Firebase (Google Cloud)

### DevOps
- **CI/CD**: GitHub Actions
- **Preview Deployments**: Vercel (automatic PR previews)
- **Error Tracking**: Sentry
- **Monitoring**: Vercel Analytics, custom metrics

## Development Setup

### Prerequisites
- Node.js 20+
- npm or yarn
- PostgreSQL (local for dev, Vercel Postgres for production)
- Redis (local for dev, Upstash for production)
- Firebase project
- OpenAI API key
- Resend API key

**Status**: ✅ All prerequisites configured - Firebase, OpenAI, Resend, Database, and Redis connections established with credentials in .env files

### Environment Variables
```bash
# Database
DATABASE_URL="postgresql://..."

# Redis
REDIS_URL="redis://..."

# Firebase
FIREBASE_API_KEY="..."
FIREBASE_AUTH_DOMAIN="..."
FIREBASE_PROJECT_ID="..."
# ... (full Firebase config)

# External APIs
OPENAI_API_KEY="sk-..."
RESEND_API_KEY="re_..."
WEATHER_API_KEY="..."  # Optional

# App
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Status**: ✅ All environment variables configured and added to .env files. Ready for database migrations and testing.

### Project Structure
```
/
├── .cursor/              # Cursor rules (project intelligence)
├── memory-bank/          # Memory bank documentation
├── prisma/
│   ├── schema.prisma    # Database schema
│   ├── migrations/      # Migration files
│   └── seed.ts          # Seed data
├── public/              # Static assets
├── src/
│   ├── app/            # Next.js app directory (routes)
│   │   ├── api/        # API routes
│   │   ├── dashboard/  # Dashboard pages
│   │   └── layout.tsx
│   ├── components/     # React components
│   │   ├── ui/         # shadcn/ui components
│   │   ├── dashboard/  # Dashboard components
│   │   ├── flights/    # Flight components
│   │   └── auth/       # Auth components
│   ├── lib/            # Utilities and services
│   │   ├── services/   # Business logic services
│   │   ├── utils/     # Helper functions
│   │   ├── hooks/     # Custom React hooks
│   │   └── types/     # TypeScript types
│   └── contexts/       # React contexts
├── .env.template       # Environment variable template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Technical Constraints

### API Rate Limits
- **FAA Weather**: No official limit, but be respectful
- **OpenAI**: Based on tier, implement retry logic
- **Resend**: 100 emails/day free tier, scale as needed
- **WeatherAPI.com**: Based on subscription tier

### Database Constraints
- **Vercel Postgres**: Connection limits based on plan
- **Connection Pooling**: Use Prisma connection pooling
- **Query Performance**: Target p95 <500ms

### Serverless Constraints
- **Vercel Functions**: 10s timeout (hobby), 60s (pro)
- **Cold Starts**: Mitigated by edge network
- **Memory**: 1GB default, can increase

### Cost Considerations
- **OpenAI API**: Cache similar requests, optimize prompts
- **WeatherAPI.com**: Only use if enabled, cache aggressively
- **Resend**: Batch notifications when possible
- **Firebase**: Monitor usage, implement connection pooling

## Dependencies

### Core Dependencies
```json
{
  "next": "^14.0.0",
  "react": "^18.0.0",
  "react-dom": "^18.0.0",
  "typescript": "^5.0.0",
  "prisma": "^5.0.0",
  "@prisma/client": "^5.0.0",
  "firebase": "^10.0.0",
  "openai": "^4.0.0",
  "resend": "^2.0.0",
  "bullmq": "^5.0.0",
  "ioredis": "^5.0.0",
  "@tanstack/react-query": "^5.0.0",
  "tailwindcss": "^3.0.0",
  "date-fns": "^3.0.0",
  "date-fns-tz": "^2.0.0"
}
```

### Development Dependencies
```json
{
  "@types/node": "^20.0.0",
  "@types/react": "^18.0.0",
  "eslint": "^8.0.0",
  "prettier": "^3.0.0",
  "jest": "^29.0.0",
  "@testing-library/react": "^14.0.0",
  "playwright": "^1.40.0"
}
```

## Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Set up database
npx prisma migrate dev
npx prisma db seed

# Start dev server
npm run dev

# Run tests
npm test

# Type check
npm run type-check

# Lint
npm run lint
```

### Database Management
```bash
# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations (production)
npx prisma migrate deploy

# Open Prisma Studio
npx prisma studio

# Generate Prisma Client
npx prisma generate
```

### Deployment
```bash
# Deploy to Vercel
vercel deploy

# Deploy to production
vercel deploy --prod

# Run migrations on production
npx prisma migrate deploy
```

## Technical Decisions

### Why Next.js 14?
- Serverless API routes (no server management)
- Excellent Vercel integration
- App Router for modern React patterns
- Built-in optimizations

### Why Prisma?
- Type-safe database access
- Excellent migration system
- Great developer experience
- Works well with PostgreSQL

### Why BullMQ?
- Reliable job processing
- Built-in retry logic
- Monitoring capabilities
- Scales with Redis

### Why Firebase?
- Real-time database for live updates
- Authentication out of the box
- Free tier sufficient for MVP
- Easy integration with React

### Why OpenAI GPT-4?
- Best reasoning capabilities for complex scheduling
- Structured output support
- Good prompt engineering support
- Fallback to rule-based if needed

## Performance Targets

### API Response Times (p95)
- `GET /api/flights` - <300ms
- `GET /api/weather/current/:code` - <500ms (with cache)
- `POST /api/ai/reschedule` - <10s
- `POST /api/flights` - <400ms

### Page Load Times
- Dashboard - <2s
- Flight list - <1.5s
- Student progress - <1.8s

### Background Jobs
- Hourly weather check (50 flights) - <5 minutes
- AI reschedule generation - <10 seconds
- Email notification send - <3 seconds

## Security Considerations

### Authentication
- Firebase Auth with email/password
- JWT tokens for API authorization
- Role-based access control

### Data Protection
- Environment variables for secrets
- HTTPS only (enforced by Vercel)
- Input validation on all endpoints
- SQL injection prevention (Prisma)

### Compliance
- GDPR awareness (if expanding internationally)
- Audit logging for sensitive operations
- Secure password handling (Firebase)

## Monitoring & Observability

### Error Tracking
- Sentry for JavaScript errors
- API error logging
- Database query monitoring

### Analytics
- Vercel Analytics (Web Vitals)
- Custom metrics dashboard
- API usage tracking
- Cost monitoring (OpenAI, WeatherAPI)

### Logging
- Structured logging for debugging
- Audit trail for booking changes
- Weather check history
- Job execution logs

