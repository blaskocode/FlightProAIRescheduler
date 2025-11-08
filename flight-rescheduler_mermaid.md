graph TB
    subgraph ClientLayer["Client Layer"]
        WEB["Web App - React + TypeScript"]
        MOBILE["Mobile Responsive UI"]
    end

    subgraph Authentication["Authentication"]
        AUTH["Firebase Auth"]
    end

    subgraph APILayer["API Layer - Next.js"]
        API["API Routes"]
        FLIGHT_API["/api/flights"]
        WEATHER_API["/api/weather"]
        BOOKING_API["/api/bookings"]
        STUDENT_API["/api/students"]
        AI_API["/api/ai/reschedule"]
        NOTIFY_API["/api/notifications"]
    end

    subgraph BusinessLogic["Business Logic Layer"]
        WEATHER_SERVICE["Weather Service"]
        AI_SERVICE["AI Reschedule Service"]
        BOOKING_SERVICE["Booking Service"]
        NOTIFY_SERVICE["Notification Service"]
        PROGRESS_SERVICE["Progress Tracking Service"]
        SQUAWK_SERVICE["Squawk Service"]
    end

    subgraph BackgroundJobs["Background Jobs - BullMQ"]
        QUEUE["Redis Queue"]
        HOURLY_CHECK["Hourly Weather Check Job"]
        BRIEFING_CHECK["Pre-Flight Briefing Check"]
        CURRENCY_CHECK["Student Currency Check"]
        MAINT_REMINDER["Maintenance Reminder Job"]
    end

    subgraph ExternalAPIs["External APIs"]
        FAA["FAA Aviation Weather<br/>METAR/TAF - FREE"]
        WEATHER_ALT["WeatherAPI.com<br/>Optional - OFF by default"]
        OPENAI["OpenAI GPT-4<br/>AI Rescheduling"]
        RESEND["Resend<br/>Email Notifications"]
    end

    subgraph DataLayer["Data Layer"]
        POSTGRES[("PostgreSQL<br/>Primary Database")]
        REDIS[("Redis<br/>Cache + Queue")]
        FIREBASE_RT[("Firebase Realtime<br/>Live Notifications")]
    end

    subgraph DatabaseSchema["Database Schema - Primary Tables"]
        TBL_SCHOOLS["schools"]
        TBL_STUDENTS["students"]
        TBL_INSTRUCTORS["instructors"]
        TBL_AIRCRAFT["aircraft"]
        TBL_FLIGHTS["flights"]
        TBL_BOOKINGS["bookings"]
        TBL_WEATHER_LOGS["weather_logs"]
        TBL_SQUAWKS["squawks"]
        TBL_LESSONS["lesson_syllabus"]
        TBL_PROGRESS["student_progress"]
    end

    subgraph Monitoring["Monitoring & Analytics"]
        METRICS["Metrics Dashboard"]
        SENTRY["Sentry Error Tracking"]
        LOGS["Vercel Logs"]
    end

    WEB --> AUTH
    MOBILE --> AUTH
    AUTH --> API
    
    WEB --> API
    MOBILE --> API
    
    API --> FLIGHT_API
    API --> WEATHER_API
    API --> BOOKING_API
    API --> STUDENT_API
    API --> AI_API
    API --> NOTIFY_API
    
    FLIGHT_API --> BOOKING_SERVICE
    WEATHER_API --> WEATHER_SERVICE
    BOOKING_API --> BOOKING_SERVICE
    STUDENT_API --> PROGRESS_SERVICE
    AI_API --> AI_SERVICE
    NOTIFY_API --> NOTIFY_SERVICE
    
    WEATHER_SERVICE --> FAA
    WEATHER_SERVICE --> WEATHER_ALT
    WEATHER_SERVICE --> REDIS
    
    AI_SERVICE --> OPENAI
    AI_SERVICE --> BOOKING_SERVICE
    AI_SERVICE --> POSTGRES
    
    NOTIFY_SERVICE --> RESEND
    NOTIFY_SERVICE --> FIREBASE_RT
    
    BOOKING_SERVICE --> POSTGRES
    PROGRESS_SERVICE --> POSTGRES
    SQUAWK_SERVICE --> POSTGRES
    
    QUEUE --> HOURLY_CHECK
    QUEUE --> BRIEFING_CHECK
    QUEUE --> CURRENCY_CHECK
    QUEUE --> MAINT_REMINDER
    
    HOURLY_CHECK --> WEATHER_SERVICE
    BRIEFING_CHECK --> WEATHER_SERVICE
    CURRENCY_CHECK --> PROGRESS_SERVICE
    MAINT_REMINDER --> SQUAWK_SERVICE
    
    HOURLY_CHECK --> AI_SERVICE
    BRIEFING_CHECK --> NOTIFY_SERVICE
    
    POSTGRES --> TBL_SCHOOLS
    POSTGRES --> TBL_STUDENTS
    POSTGRES --> TBL_INSTRUCTORS
    POSTGRES --> TBL_AIRCRAFT
    POSTGRES --> TBL_FLIGHTS
    POSTGRES --> TBL_BOOKINGS
    POSTGRES --> TBL_WEATHER_LOGS
    POSTGRES --> TBL_SQUAWKS
    POSTGRES --> TBL_LESSONS
    POSTGRES --> TBL_PROGRESS
    
    API --> SENTRY
    QUEUE --> LOGS
    POSTGRES --> METRICS
    
    WEB --> FIREBASE_RT
    MOBILE --> FIREBASE_RT

    classDef external fill:#e1f5ff,stroke:#01579b
    classDef storage fill:#fff3e0,stroke:#e65100
    classDef service fill:#f3e5f5,stroke:#4a148c
    classDef queue fill:#e8f5e9,stroke:#1b5e20
    
    class FAA,WEATHER_ALT,OPENAI,RESEND external
    class POSTGRES,REDIS,FIREBASE_RT storage
    class WEATHER_SERVICE,AI_SERVICE,BOOKING_SERVICE,NOTIFY_SERVICE,PROGRESS_SERVICE,SQUAWK_SERVICE service
    class QUEUE,HOURLY_CHECK,BRIEFING_CHECK,CURRENCY_CHECK,MAINT_REMINDER queue