-- Add notification preferences to Student, Instructor, and Admin models
-- This migration adds granular notification preferences

-- Add notification preferences JSON field to Student
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "notificationPreferences" JSONB DEFAULT '{
  "channels": {
    "email": true,
    "sms": false,
    "push": true
  },
  "timing": {
    "immediate": true,
    "dailyDigest": false,
    "weeklyDigest": false,
    "quietHours": {
      "enabled": false,
      "start": "22:00",
      "end": "07:00"
    }
  },
  "eventTypes": {
    "weather": {
      "email": true,
      "sms": false,
      "push": true
    },
    "reschedule": {
      "email": true,
      "sms": true,
      "push": true
    },
    "confirmation": {
      "email": true,
      "sms": false,
      "push": true
    },
    "currency": {
      "email": true,
      "sms": false,
      "push": false
    },
    "maintenance": {
      "email": true,
      "sms": false,
      "push": false
    }
  }
}'::jsonb;

-- Add notification preferences JSON field to Instructor
ALTER TABLE "Instructor" ADD COLUMN IF NOT EXISTS "notificationPreferences" JSONB DEFAULT '{
  "channels": {
    "email": true,
    "sms": false,
    "push": true
  },
  "timing": {
    "immediate": true,
    "dailyDigest": false,
    "weeklyDigest": false,
    "quietHours": {
      "enabled": false,
      "start": "22:00",
      "end": "07:00"
    }
  },
  "eventTypes": {
    "weather": {
      "email": true,
      "sms": false,
      "push": true
    },
    "reschedule": {
      "email": true,
      "sms": true,
      "push": true
    },
    "confirmation": {
      "email": true,
      "sms": false,
      "push": true
    },
    "currency": {
      "email": true,
      "sms": false,
      "push": false
    },
    "maintenance": {
      "email": true,
      "sms": false,
      "push": false
    }
  }
}'::jsonb;

-- Add notification preferences JSON field to Admin
ALTER TABLE "Admin" ADD COLUMN IF NOT EXISTS "notificationPreferences" JSONB DEFAULT '{
  "channels": {
    "email": true,
    "sms": false,
    "push": true
  },
  "timing": {
    "immediate": true,
    "dailyDigest": false,
    "weeklyDigest": false,
    "quietHours": {
      "enabled": false,
      "start": "22:00",
      "end": "07:00"
    }
  },
  "eventTypes": {
    "weather": {
      "email": true,
      "sms": false,
      "push": true
    },
    "reschedule": {
      "email": true,
      "sms": false,
      "push": true
    },
    "confirmation": {
      "email": true,
      "sms": false,
      "push": true
    },
    "currency": {
      "email": true,
      "sms": false,
      "push": false
    },
    "maintenance": {
      "email": true,
      "sms": false,
      "push": false
    }
  }
}'::jsonb;

