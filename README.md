# Flight Schedule Pro AI Rescheduler

AI-Powered Weather Cancellation & Rescheduling System for Flight Schools

## Overview

Flight Schedule Pro AI Rescheduler is an intelligent system that automates weather conflict detection and provides AI-powered rescheduling to minimize training disruption and revenue loss for flight schools.

## Features

- **Weather Monitoring**: Real-time weather monitoring using FAA Aviation Weather Center (METAR/TAF)
- **AI-Powered Rescheduling**: Intelligent rescheduling suggestions using OpenAI GPT-4
- **Multi-Party Confirmations**: Streamlined workflow for student and instructor confirmations
- **Progress Tracking**: Comprehensive flight syllabus and student progress tracking
- **Aircraft Management**: Squawk reporting and maintenance scheduling
- **Real-time Notifications**: Email and in-app notifications via Firebase

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Node.js 20+
- **Database**: PostgreSQL 15+ (Prisma ORM)
- **Caching/Queue**: Redis (BullMQ)
- **Real-time**: Firebase Realtime Database
- **AI**: OpenAI GPT-4
- **Email**: Resend
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 20+ 
- npm or yarn
- PostgreSQL 15+ (or Vercel Postgres)
- Redis (or Upstash Redis)
- Firebase project
- OpenAI API key
- Resend API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/blaskocode/FlightProAIRescheduler.git
cd FlightProAIRescheduler
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment template:
```bash
cp env.template .env.local
```

4. Configure your `.env.local` file with your API keys and database URLs.

5. Run database migrations (after setting up Prisma in PR-02):
```bash
npx prisma migrate dev
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run type-check` - Run TypeScript type checking
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

### Project Structure

```
/src
  /app          # Next.js app directory (routes)
  /components   # React components
  /lib          # Utilities, services
  /types        # TypeScript types
  /hooks        # Custom React hooks
/prisma         # Database schema
/public         # Static assets
```

## Deployment

This project is configured for deployment on Vercel. The `vercel.json` configuration file is included.

1. Push your code to GitHub
2. Import the project in Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy!

## Documentation

- [Product Requirements Document](../flight-rescheduler_PRD.md)
- [Development Task List](../flight-rescheduler_tasklist.md)
- [Architecture Diagram](../flight-rescheduler_mermaid.md)

## License

ISC

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

