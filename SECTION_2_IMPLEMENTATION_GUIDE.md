# Section 2 Implementation Guide

## 1. UI Components Missing

### 1.1 Admin Settings Page

**What it does**: Allows admins to configure system settings (toggle WeatherAPI.com, adjust check frequency, etc.)

**Steps to implement**:

1. **Create the component**:
```bash
# Create the file
touch src/components/admin/SettingsPage.tsx
```

2. **Implement the component**:
```typescript
// src/components/admin/SettingsPage.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function SettingsPage() {
  const { authUser } = useAuth();
  const [settings, setSettings] = useState({
    weatherApiEnabled: false,
    weatherCheckFrequency: 'hourly',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authUser?.role !== 'admin') {
      return;
    }
    
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        setLoading(false);
      });
  }, [authUser]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      
      if (response.ok) {
        alert('Settings saved!');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (authUser?.role !== 'admin') {
    return <div>Access denied</div>;
  }

  if (loading) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Settings</h1>
      
      <div className="space-y-6">
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-4">Weather API Settings</h2>
          
          <div className="space-y-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.weatherApiEnabled}
                onChange={(e) => setSettings({
                  ...settings,
                  weatherApiEnabled: e.target.checked,
                })}
                className="rounded"
              />
              <span>Enable WeatherAPI.com (paid alternative to FAA)</span>
            </label>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Weather Check Frequency
              </label>
              <select
                value={settings.weatherCheckFrequency}
                onChange={(e) => setSettings({
                  ...settings,
                  weatherCheckFrequency: e.target.value,
                })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="hourly">Hourly</option>
                <option value="every-30-min">Every 30 Minutes</option>
                <option value="every-15-min">Every 15 Minutes</option>
              </select>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
```

3. **Create the route**:
```bash
touch src/app/admin/settings/page.tsx
```

```typescript
// src/app/admin/settings/page.tsx
import { SettingsPage } from '@/components/admin/SettingsPage';

export default function AdminSettingsPage() {
  return <SettingsPage />;
}
```

4. **Add navigation link** (optional - add to dashboard):
```typescript
// In your dashboard or navigation component
{authUser?.role === 'admin' && (
  <Link href="/admin/settings">Settings</Link>
)}
```

---

### 1.2 Squawk Reporting Form

**What it does**: Allows students/instructors to report aircraft maintenance issues

**Steps to implement**:

1. **Create the component**:
```bash
touch src/components/aircraft/SquawkReportForm.tsx
```

2. **Implement the component**:
```typescript
// src/components/aircraft/SquawkReportForm.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface SquawkFormData {
  aircraftId: string;
  severity: 'MINOR' | 'MAJOR' | 'GROUNDING';
  title: string;
  description: string;
}

export function SquawkReportForm({ aircraftId, onSuccess }: { 
  aircraftId: string;
  onSuccess?: () => void;
}) {
  const { authUser } = useAuth();
  const [formData, setFormData] = useState<SquawkFormData>({
    aircraftId,
    severity: 'MINOR',
    title: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/squawks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          reportedBy: authUser?.uid || 'unknown',
        }),
      });

      if (response.ok) {
        alert('Squawk reported successfully!');
        setFormData({
          aircraftId,
          severity: 'MINOR',
          title: '',
          description: '',
        });
        onSuccess?.();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error reporting squawk:', error);
      alert('Failed to report squawk');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          Severity
        </label>
        <select
          value={formData.severity}
          onChange={(e) => setFormData({
            ...formData,
            severity: e.target.value as any,
          })}
          className="w-full border rounded px-3 py-2"
          required
        >
          <option value="MINOR">Minor - Cosmetic or non-safety issue</option>
          <option value="MAJOR">Major - Requires attention but aircraft flyable</option>
          <option value="GROUNDING">Grounding - Aircraft must not fly</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Title
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({
            ...formData,
            title: e.target.value,
          })}
          className="w-full border rounded px-3 py-2"
          placeholder="Brief description (e.g., 'Left brake squeaking')"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({
            ...formData,
            description: e.target.value,
          })}
          className="w-full border rounded px-3 py-2"
          rows={4}
          placeholder="Detailed description of the issue..."
          required
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
      >
        {submitting ? 'Submitting...' : 'Report Squawk'}
      </button>
    </form>
  );
}
```

3. **Add to flight details or aircraft page**:
```typescript
// In your flight details component
<SquawkReportForm 
  aircraftId={flight.aircraftId}
  onSuccess={() => {
    // Refresh data or show success message
  }}
/>
```

---

### 1.3 Progress Tracker Component

**What it does**: Visualizes student progress through the 40-lesson syllabus

**Steps to implement**:

1. **Create the component**:
```bash
touch src/components/progress/ProgressTracker.tsx
```

2. **Implement the component**:
```typescript
// src/components/progress/ProgressTracker.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ProgressData {
  student: {
    currentStage: string;
    currentLesson: number;
    totalFlightHours: number;
  };
  progress: Array<{
    lesson: {
      stage: string;
      lessonNumber: number;
      title: string;
    };
    status: string;
    completedDate: string | null;
  }>;
}

export function ProgressTracker() {
  const { authUser } = useAuth();
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authUser?.studentId) return;

    fetch(`/api/students/${authUser.studentId}/progress`)
      .then(res => res.json())
      .then(data => {
        setProgress(data);
        setLoading(false);
      });
  }, [authUser]);

  if (loading) {
    return <div>Loading progress...</div>;
  }

  if (!progress) {
    return <div>No progress data available</div>;
  }

  const completedLessons = progress.progress.filter(p => p.status === 'COMPLETED').length;
  const totalLessons = 40;
  const completionPercentage = (completedLessons / totalLessons) * 100;

  const stage1Lessons = progress.progress.filter(p => p.lesson.stage === 'STAGE_1_PRE_SOLO');
  const stage2Lessons = progress.progress.filter(p => p.lesson.stage === 'STAGE_2_SOLO_XC');
  const stage3Lessons = progress.progress.filter(p => p.lesson.stage === 'STAGE_3_CHECKRIDE_PREP');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2">Training Progress</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{completedLessons} / {totalLessons} lessons</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-blue-600 h-4 rounded-full transition-all"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">
            {completionPercentage.toFixed(1)}% Complete
          </p>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Current Status</h3>
        <div className="bg-gray-50 p-4 rounded">
          <p><strong>Stage:</strong> {progress.student.currentStage.replace(/_/g, ' ')}</p>
          <p><strong>Current Lesson:</strong> {progress.student.currentLesson}</p>
          <p><strong>Total Flight Hours:</strong> {progress.student.totalFlightHours.toFixed(1)}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Stage 1: Pre-Solo</h3>
          <div className="grid grid-cols-5 gap-2">
            {stage1Lessons.map((p) => (
              <div
                key={p.lesson.lessonNumber}
                className={`p-2 rounded text-xs text-center ${
                  p.status === 'COMPLETED'
                    ? 'bg-green-100 text-green-800'
                    : p.status === 'IN_PROGRESS'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-600'
                }`}
                title={p.lesson.title}
              >
                {p.lesson.lessonNumber}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Stage 2: Solo Cross-Country</h3>
          <div className="grid grid-cols-5 gap-2">
            {stage2Lessons.map((p) => (
              <div
                key={p.lesson.lessonNumber}
                className={`p-2 rounded text-xs text-center ${
                  p.status === 'COMPLETED'
                    ? 'bg-green-100 text-green-800'
                    : p.status === 'IN_PROGRESS'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-600'
                }`}
                title={p.lesson.title}
              >
                {p.lesson.lessonNumber}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Stage 3: Checkride Prep</h3>
          <div className="grid grid-cols-5 gap-2">
            {stage3Lessons.map((p) => (
              <div
                key={p.lesson.lessonNumber}
                className={`p-2 rounded text-xs text-center ${
                  p.status === 'COMPLETED'
                    ? 'bg-green-100 text-green-800'
                    : p.status === 'IN_PROGRESS'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-600'
                }`}
                title={p.lesson.title}
              >
                {p.lesson.lessonNumber}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

3. **Add to dashboard**:
```typescript
// In src/app/dashboard/page.tsx
import { ProgressTracker } from '@/components/progress/ProgressTracker';

// Add to your dashboard layout
<ProgressTracker />
```

---

### 1.4 Syllabus Overview Component

**What it does**: Displays the complete 40-lesson syllabus

**Steps to implement**:

1. **Create the component**:
```bash
touch src/components/syllabus/SyllabusOverview.tsx
```

2. **Implement the component**:
```typescript
// src/components/syllabus/SyllabusOverview.tsx
'use client';

import { useEffect, useState } from 'react';

interface Lesson {
  id: string;
  stage: string;
  lessonNumber: number;
  title: string;
  description: string;
  estimatedDuration: number;
  flightTime: number | null;
}

export function SyllabusOverview() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/syllabus')
      .then(res => res.json())
      .then(data => {
        setLessons(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Loading syllabus...</div>;
  }

  const stages = ['STAGE_1_PRE_SOLO', 'STAGE_2_SOLO_XC', 'STAGE_3_CHECKRIDE_PREP'];
  const filteredLessons = selectedStage
    ? lessons.filter(l => l.stage === selectedStage)
    : lessons;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Flight Training Syllabus</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedStage(null)}
            className={`px-3 py-1 rounded ${
              selectedStage === null ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            All Stages
          </button>
          {stages.map(stage => (
            <button
              key={stage}
              onClick={() => setSelectedStage(stage)}
              className={`px-3 py-1 rounded ${
                selectedStage === stage ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}
            >
              {stage.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {filteredLessons.map(lesson => (
          <div
            key={lesson.id}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">
                  Lesson {lesson.lessonNumber}: {lesson.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">{lesson.description}</p>
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span>Duration: {lesson.estimatedDuration}h</span>
                  {lesson.flightTime && (
                    <span>Flight Time: {lesson.flightTime}h</span>
                  )}
                </div>
              </div>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                {lesson.stage.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

3. **Create the route**:
```bash
touch src/app/syllabus/page.tsx
```

```typescript
// src/app/syllabus/page.tsx
import { SyllabusOverview } from '@/components/syllabus/SyllabusOverview';

export default function SyllabusPage() {
  return (
    <div className="container mx-auto p-6">
      <SyllabusOverview />
    </div>
  );
}
```

---

### 1.5 Notification Bell/Dropdown

**What it does**: Shows in-app notifications with a bell icon

**Steps to implement**:

1. **Create the component**:
```bash
touch src/components/notifications/NotificationBell.tsx
```

2. **Implement the component**:
```typescript
// src/components/notifications/NotificationBell.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Notification {
  id: string;
  type: string;
  subject: string;
  message: string;
  readAt: string | null;
  createdAt: string;
  flight?: {
    id: string;
    scheduledStart: string;
  };
}

export function NotificationBell() {
  const { authUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authUser?.studentId) return;

    fetch(`/api/notifications?recipientId=${authUser.studentId}&unreadOnly=true`)
      .then(res => res.json())
      .then(data => {
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.readAt).length);
        setLoading(false);
      });
  }, [authUser]);

  const markAsRead = async (notificationId: string) => {
    await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
    
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, readAt: new Date().toISOString() } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Notifications</h3>
          </div>
          {loading ? (
            <div className="p-4">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-gray-500 text-center">No notifications</div>
          ) : (
            <div className="divide-y">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer ${
                    !notification.readAt ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    if (!notification.readAt) {
                      markAsRead(notification.id);
                    }
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{notification.subject}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {notification.message.substring(0, 100)}...
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!notification.readAt && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full ml-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

3. **Add to dashboard header**:
```typescript
// In your dashboard or layout
import { NotificationBell } from '@/components/notifications/NotificationBell';

// Add to header/navbar
<NotificationBell />
```

---

### 1.6 Weather Widget

**What it does**: Displays current weather conditions

**Steps to implement**:

1. **Create the component**:
```bash
touch src/components/weather/WeatherWidget.tsx
```

2. **Implement the component**:
```typescript
// src/components/weather/WeatherWidget.tsx
'use client';

import { useState, useEffect } from 'react';

interface WeatherData {
  station: string;
  visibility: { value: number; units: string };
  ceiling: number;
  windSpeed: number;
  windDirection: number;
  temperature: number;
  conditions: string;
}

export function WeatherWidget({ airportCode }: { airportCode: string }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/weather/current/${airportCode}`)
      .then(res => res.json())
      .then(data => {
        setWeather(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [airportCode]);

  if (loading) {
    return <div className="p-4">Loading weather...</div>;
  }

  if (!weather) {
    return <div className="p-4 text-gray-500">Weather data unavailable</div>;
  }

  return (
    <div className="border rounded-lg p-4 bg-white">
      <h3 className="font-semibold mb-3">Current Weather - {airportCode}</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Visibility:</span>
          <span className="font-medium">{weather.visibility.value} {weather.visibility.units}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Ceiling:</span>
          <span className="font-medium">
            {weather.ceiling === 99999 ? 'Unlimited' : `${weather.ceiling} ft`}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Wind:</span>
          <span className="font-medium">
            {weather.windSpeed} kt @ {weather.windDirection}°
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Temperature:</span>
          <span className="font-medium">{weather.temperature}°C</span>
        </div>
        {weather.conditions && (
          <div className="flex justify-between">
            <span className="text-gray-600">Conditions:</span>
            <span className="font-medium">{weather.conditions}</span>
          </div>
        )}
      </div>
    </div>
  );
}
```

3. **Add to dashboard**:
```typescript
// In your dashboard
import { WeatherWidget } from '@/components/weather/WeatherWidget';

// Add where you want to show weather
<WeatherWidget airportCode="KAUS" />
```

---

### 1.7 Schedule Calendar

**What it does**: Calendar view of flights

**Steps to implement**:

1. **Install a calendar library** (optional, or build simple one):
```bash
npm install react-calendar @types/react-calendar
```

2. **Create the component**:
```bash
touch src/components/calendar/FlightCalendar.tsx
```

3. **Implement the component**:
```typescript
// src/components/calendar/FlightCalendar.tsx
'use client';

import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

interface Flight {
  id: string;
  scheduledStart: string;
  lessonTitle: string | null;
  status: string;
}

export function FlightCalendar() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    fetch('/api/flights')
      .then(res => res.json())
      .then(data => setFlights(data));
  }, []);

  const getFlightsForDate = (date: Date) => {
    return flights.filter(flight => {
      const flightDate = new Date(flight.scheduledStart);
      return (
        flightDate.getDate() === date.getDate() &&
        flightDate.getMonth() === date.getMonth() &&
        flightDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const tileContent = ({ date }: { date: Date }) => {
    const dayFlights = getFlightsForDate(date);
    if (dayFlights.length === 0) return null;
    
    return (
      <div className="flex gap-1 justify-center mt-1">
        {dayFlights.map(flight => (
          <div
            key={flight.id}
            className={`w-2 h-2 rounded-full ${
              flight.status === 'CONFIRMED'
                ? 'bg-green-500'
                : flight.status === 'SCHEDULED'
                ? 'bg-blue-500'
                : 'bg-gray-400'
            }`}
            title={flight.lessonTitle || 'Flight'}
          />
        ))}
      </div>
    );
  };

  const selectedDateFlights = getFlightsForDate(selectedDate);

  return (
    <div className="space-y-4">
      <Calendar
        onChange={setSelectedDate}
        value={selectedDate}
        tileContent={tileContent}
        className="w-full"
      />
      
      {selectedDateFlights.length > 0 && (
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">
            Flights on {selectedDate.toLocaleDateString()}
          </h3>
          <div className="space-y-2">
            {selectedDateFlights.map(flight => (
              <div key={flight.id} className="text-sm">
                <span className="font-medium">
                  {new Date(flight.scheduledStart).toLocaleTimeString()}
                </span>
                {' - '}
                <span>{flight.lessonTitle || 'Flight Lesson'}</span>
                {' '}
                <span className={`text-xs px-2 py-1 rounded ${
                  flight.status === 'CONFIRMED'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {flight.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### 1.8 FlightList Filtering/Sorting

**What it does**: Adds filters and sorting to the existing FlightList component

**Steps to implement**:

1. **Update the existing component**:
```typescript
// Update src/components/dashboard/FlightList.tsx
'use client';

import { useEffect, useState } from 'react';

// ... existing interfaces ...

export function FlightList() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [filteredFlights, setFilteredFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('upcoming');
  const [sortBy, setSortBy] = useState<string>('date');
  
  useEffect(() => {
    fetch('/api/flights')
      .then((res) => res.json())
      .then((data) => {
        setFlights(data);
        setFilteredFlights(data);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let filtered = [...flights];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(f => f.status === statusFilter);
    }

    // Apply date filter
    const now = new Date();
    if (dateFilter === 'upcoming') {
      filtered = filtered.filter(f => new Date(f.scheduledStart) >= now);
    } else if (dateFilter === 'past') {
      filtered = filtered.filter(f => new Date(f.scheduledStart) < now);
    } else if (dateFilter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      filtered = filtered.filter(f => {
        const flightDate = new Date(f.scheduledStart);
        return flightDate >= today && flightDate < tomorrow;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime();
      } else if (sortBy === 'status') {
        return a.status.localeCompare(b.status);
      } else if (sortBy === 'aircraft') {
        return a.aircraft.tailNumber.localeCompare(b.aircraft.tailNumber);
      }
      return 0;
    });

    setFilteredFlights(filtered);
  }, [flights, statusFilter, dateFilter, sortBy]);

  if (loading) {
    return <div className="p-4">Loading flights...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Upcoming Flights</h2>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="all">All Status</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
        </select>

        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="upcoming">Upcoming</option>
          <option value="today">Today</option>
          <option value="past">Past</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="date">Sort by Date</option>
          <option value="status">Sort by Status</option>
          <option value="aircraft">Sort by Aircraft</option>
        </select>
      </div>

      {/* Flight List */}
      {filteredFlights.length === 0 ? (
        <p className="text-gray-500">No flights found</p>
      ) : (
        <div className="grid gap-4">
          {filteredFlights.map((flight) => (
            // ... existing flight card JSX ...
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### 1.9 Real-time Firebase Listeners

**What it does**: Connects Firebase Realtime Database for live updates

**Steps to implement**:

1. **Create a hook for real-time notifications**:
```bash
touch src/hooks/useRealtimeNotifications.ts
```

```typescript
// src/hooks/useRealtimeNotifications.ts
import { useEffect, useState } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export function useRealtimeNotifications() {
  const { authUser } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!authUser?.studentId || !database) return;

    const notificationsRef = ref(database, `notifications/${authUser.studentId}`);
    
    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const notificationList = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
        }));
        setNotifications(notificationList);
      } else {
        setNotifications([]);
      }
    });

    return () => {
      off(notificationsRef);
    };
  }, [authUser]);

  return notifications;
}
```

2. **Use in NotificationBell component**:
```typescript
// Update NotificationBell.tsx
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

export function NotificationBell() {
  const realtimeNotifications = useRealtimeNotifications();
  // ... rest of component
}
```

---

### 1.10 Loading Skeletons

**What it does**: Better loading states

**Steps to implement**:

1. **Create skeleton component**:
```bash
touch src/components/ui/Skeleton.tsx
```

```typescript
// src/components/ui/Skeleton.tsx
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );
}

export function FlightListSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="border rounded-lg p-4">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

2. **Use in components**:
```typescript
// In FlightList.tsx
import { FlightListSkeleton } from '@/components/ui/Skeleton';

if (loading) {
  return <FlightListSkeleton />;
}
```

---

### 1.11 Error Boundaries

**What it does**: Catches React errors gracefully

**Steps to implement**:

1. **Create error boundary**:
```bash
touch src/components/ErrorBoundary.tsx
```

```typescript
// src/components/ErrorBoundary.tsx
'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

2. **Wrap app in layout**:
```typescript
// In src/app/layout.tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <AuthProvider>{children}</AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

---

## 2. Code TODOs

### 2.1 Airport Coordinate Lookup

**Location**: `src/lib/jobs/weather-check.job.ts` and `src/app/api/weather/check/route.ts`

**Steps to fix**:

1. **Create airport data utility**:
```bash
touch src/lib/utils/airport-data.ts
```

```typescript
// src/lib/utils/airport-data.ts

// Simple airport database (or use an API)
const AIRPORT_DATABASE: Record<string, { lat: number; lng: number }> = {
  'KAUS': { lat: 30.1945, lng: -97.6699 }, // Austin
  'KDAL': { lat: 32.8471, lng: -96.8518 }, // Dallas
  'KHOU': { lat: 29.6454, lng: -95.2789 }, // Houston
  'KDFW': { lat: 32.8969, lng: -97.0380 }, // Dallas/Fort Worth
  'KIAH': { lat: 29.9844, lng: -95.3414 }, // Houston Intercontinental
  // Add more airports as needed
};

export function getAirportCoordinates(airportCode: string): { latitude: number; longitude: number } {
  const airport = AIRPORT_DATABASE[airportCode.toUpperCase()];
  
  if (airport) {
    return {
      latitude: airport.lat,
      longitude: airport.lng,
    };
  }
  
  // Fallback: return 0,0 if airport not found
  // In production, you might want to use a geocoding API
  console.warn(`Airport coordinates not found for ${airportCode}`);
  return { latitude: 0, longitude: 0 };
}
```

2. **Update weather-check.job.ts**:
```typescript
// In src/lib/jobs/weather-check.job.ts
import { getAirportCoordinates } from '@/lib/utils/airport-data';

// Replace:
latitude: 0, // TODO: Get from airport data
longitude: 0,

// With:
const coords = getAirportCoordinates(flight.departureAirport);
latitude: coords.latitude,
longitude: coords.longitude,
```

3. **Update weather/check/route.ts**:
```typescript
// In src/app/api/weather/check/route.ts
import { getAirportCoordinates } from '@/lib/utils/airport-data';

// Replace:
latitude: 0, // TODO: Get from airport data
longitude: 0,

// With:
const coords = getAirportCoordinates(flight.departureAirport);
latitude: coords.latitude,
longitude: coords.longitude,
```

---

### 2.2 Connect Weather Check to AI Rescheduling

**Location**: `src/lib/jobs/weather-check.job.ts` (line 83)

**Steps to fix**:

1. **Update the weather check job**:
```typescript
// In src/lib/jobs/weather-check.job.ts
// After detecting UNSAFE weather, add:

if (checkResult.result === 'UNSAFE') {
  // Update flight status
  await prisma.flight.update({
    where: { id: flightId },
    data: { status: 'WEATHER_CANCELLED' },
  });

  // Trigger AI rescheduling
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/reschedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flightId }),
    });

    if (response.ok) {
      const rescheduleData = await response.json();
      job.log(`AI rescheduling triggered. Request ID: ${rescheduleData.rescheduleRequestId}`);
    } else {
      job.log(`Failed to trigger AI rescheduling: ${response.statusText}`);
    }
  } catch (error) {
    job.log(`Error triggering AI rescheduling: ${error}`);
  }
}
```

**Note**: For production, you might want to queue this as a separate job instead of making an HTTP request.

---

### 2.3 Implement Currency Check Job

**Location**: `src/lib/jobs/workers.ts` (line 21)

**Steps to implement**:

1. **Create currency check job file**:
```bash
touch src/lib/jobs/currency-check.job.ts
```

```typescript
// src/lib/jobs/currency-check.job.ts
import { Job } from 'bullmq';
import { prisma } from '@/lib/prisma';
import { sendNotification, generateWeatherConflictEmail } from '@/lib/services/notification-service';

export interface CurrencyCheckJobData {
  studentId: string;
}

export async function processCurrencyCheck(job: Job<CurrencyCheckJobData>) {
  const { studentId } = job.data;
  
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new Error(`Student ${studentId} not found`);
    }

    // Calculate days since last flight
    const lastFlightDate = student.lastFlightDate;
    if (!lastFlightDate) {
      return { message: 'Student has no flight history' };
    }

    const daysSince = Math.floor(
      (Date.now() - new Date(lastFlightDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Update student record
    await prisma.student.update({
      where: { id: studentId },
      data: { daysSinceLastFlight: daysSince },
    });

    // Check solo currency (90 days)
    const soloCurrentUntil = student.soloCurrentUntil;
    if (soloCurrentUntil) {
      const soloDaysRemaining = Math.floor(
        (new Date(soloCurrentUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      // Send warnings at thresholds
      if (soloDaysRemaining <= 7 && soloDaysRemaining > 0) {
        await sendNotification({
          recipientId: studentId,
          type: 'CURRENCY_WARNING',
          subject: '⚠️ Solo Currency Expiring Soon',
          message: `Your solo currency expires in ${soloDaysRemaining} days. Schedule a flight soon!`,
        });
      }
    }

    // Check general currency (warn at 60, 75, 85, 90 days)
    if (daysSince >= 60 && daysSince < 90) {
      const thresholds = [60, 75, 85];
      if (thresholds.includes(daysSince)) {
        await sendNotification({
          recipientId: studentId,
          type: 'CURRENCY_WARNING',
          subject: `⚠️ ${daysSince} Days Since Last Flight`,
          message: `You haven't flown in ${daysSince} days. Schedule a flight to maintain currency!`,
        });
      }
    }

    return {
      studentId,
      daysSince,
      soloDaysRemaining: soloCurrentUntil
        ? Math.floor((new Date(soloCurrentUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null,
    };
  } catch (error: any) {
    job.log(`Error processing currency check: ${error.message}`);
    throw error;
  }
}
```

2. **Update workers.ts**:
```typescript
// In src/lib/jobs/workers.ts
import { processCurrencyCheck, CurrencyCheckJobData } from './currency-check.job';

export const currencyCheckWorker = new Worker<CurrencyCheckJobData>(
  'currency-check',
  async (job) => {
    return processCurrencyCheck(job);
  },
  {
    connection,
    concurrency: 3,
  }
);
```

3. **Create API endpoint to trigger currency checks**:
```bash
touch src/app/api/jobs/currency-check/route.ts
```

```typescript
// src/app/api/jobs/currency-check/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { currencyCheckQueue } from '@/lib/jobs/queues';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Get all students
    const students = await prisma.student.findMany({
      select: { id: true },
    });

    // Queue currency checks for all students
    const jobs = await Promise.all(
      students.map((student) =>
        currencyCheckQueue.add('currency-check', {
          studentId: student.id,
        })
      )
    );

    return NextResponse.json({
      message: `Queued ${jobs.length} currency checks`,
      jobIds: jobs.map((j) => j.id),
    });
  } catch (error) {
    console.error('Error queuing currency checks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

### 2.4 Implement Maintenance Reminder Job

**Location**: `src/lib/jobs/workers.ts` (line 35)

**Steps to implement**:

1. **Create maintenance reminder job file**:
```bash
touch src/lib/jobs/maintenance-reminder.job.ts
```

```typescript
// src/lib/jobs/maintenance-reminder.job.ts
import { Job } from 'bullmq';
import { prisma } from '@/lib/prisma';
import { sendNotification } from '@/lib/services/notification-service';

export interface MaintenanceReminderJobData {
  aircraftId: string;
}

export async function processMaintenanceReminder(job: Job<MaintenanceReminderJobData>) {
  const { aircraftId } = job.data;
  
  try {
    const aircraft = await prisma.aircraft.findUnique({
      where: { id: aircraftId },
      include: {
        school: true,
      },
    });

    if (!aircraft) {
      throw new Error(`Aircraft ${aircraftId} not found`);
    }

    const reminders: string[] = [];

    // Check annual inspection
    if (aircraft.nextInspectionDue) {
      const daysUntil = Math.floor(
        (new Date(aircraft.nextInspectionDue).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntil <= 30 && daysUntil > 0) {
        reminders.push(`Annual inspection due in ${daysUntil} days`);
      } else if (daysUntil <= 0) {
        reminders.push(`Annual inspection is OVERDUE`);
      }
    }

    // Check maintenance until date
    if (aircraft.maintenanceUntil) {
      const daysUntil = Math.floor(
        (new Date(aircraft.maintenanceUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntil <= 7 && daysUntil > 0) {
        reminders.push(`Maintenance restriction expires in ${daysUntil} days`);
      }
    }

    // Send notification to admins if needed
    if (reminders.length > 0) {
      // In production, you'd fetch admin users and send to them
      // For now, just log
      job.log(`Maintenance reminders for ${aircraft.tailNumber}: ${reminders.join(', ')}`);
    }

    return {
      aircraftId,
      tailNumber: aircraft.tailNumber,
      reminders,
    };
  } catch (error: any) {
    job.log(`Error processing maintenance reminder: ${error.message}`);
    throw error;
  }
}
```

2. **Update workers.ts**:
```typescript
// In src/lib/jobs/workers.ts
import { processMaintenanceReminder, MaintenanceReminderJobData } from './maintenance-reminder.job';

export const maintenanceReminderWorker = new Worker<MaintenanceReminderJobData>(
  'maintenance-reminder',
  async (job) => {
    return processMaintenanceReminder(job);
  },
  {
    connection,
    concurrency: 2,
  }
);
```

3. **Create API endpoint**:
```bash
touch src/app/api/jobs/maintenance-reminder/route.ts
```

```typescript
// src/app/api/jobs/maintenance-reminder/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { maintenanceReminderQueue } from '@/lib/jobs/queues';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Get all aircraft
    const aircraft = await prisma.aircraft.findMany({
      select: { id: true },
    });

    // Queue maintenance reminders for all aircraft
    const jobs = await Promise.all(
      aircraft.map((ac) =>
        maintenanceReminderQueue.add('maintenance-reminder', {
          aircraftId: ac.id,
        })
      )
    );

    return NextResponse.json({
      message: `Queued ${jobs.length} maintenance reminders`,
      jobIds: jobs.map((j) => j.id),
    });
  } catch (error) {
    console.error('Error queuing maintenance reminders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 3. Infrastructure Setup

### 3.1 Environment Variables

**Steps**:

1. **Copy template**:
```bash
cp .env.template .env.local
```

2. **Fill in values** (see `.env.template` for all required variables)

3. **Firebase Setup**:
   - Go to https://console.firebase.google.com
   - Create new project
   - Enable Authentication (Email/Password)
   - Enable Realtime Database
   - Copy config values to `.env.local`

4. **Database Setup**:
   - Vercel: Add Postgres database in Vercel dashboard
   - Or use external PostgreSQL (Supabase, Railway, etc.)
   - Copy connection string to `DATABASE_URL`

5. **Redis Setup**:
   - Upstash: Create Redis database at https://upstash.com
   - Or use Vercel KV
   - Copy connection string to `REDIS_URL`

6. **OpenAI**:
   - Get API key from https://platform.openai.com
   - Add to `OPENAI_API_KEY`

7. **Resend**:
   - Sign up at https://resend.com
   - Verify domain
   - Get API key
   - Add to `RESEND_API_KEY` and `RESEND_FROM_EMAIL`

---

### 3.2 Database Setup

**Steps**:

```bash
# 1. Set DATABASE_URL in .env.local
# 2. Run migrations
npm run db:migrate

# 3. Seed database
npm run db:seed
```

---

### 3.3 Job Scheduling

**Option 1: Vercel Cron** (Recommended)

1. **Update vercel.json**:
```json
{
  "crons": [
    {
      "path": "/api/jobs/hourly-weather",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/jobs/currency-check",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/jobs/maintenance-reminder",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Option 2: External Cron Service**

- Use cron-job.org or similar
- Set up hourly calls to `/api/jobs/hourly-weather`
- Set up daily calls to `/api/jobs/currency-check`

---

## 4. Testing & Validation

### 4.1 Functional Testing Checklist

Create a test file or document:

```markdown
# Testing Checklist

## Authentication
- [ ] Sign up new user
- [ ] Log in existing user
- [ ] Protected routes redirect to login
- [ ] Role-based access works

## Weather
- [ ] Fetch current weather for airport
- [ ] Weather check returns SAFE/MARGINAL/UNSAFE
- [ ] Weather minimums calculated correctly

## AI Rescheduling
- [ ] Generate reschedule suggestions
- [ ] Suggestions are valid (no conflicts)
- [ ] Fallback works if AI fails

## Booking
- [ ] Create new flight
- [ ] Check availability
- [ ] Prevent double-booking
- [ ] Accept reschedule suggestion

## Notifications
- [ ] Email sends successfully
- [ ] In-app notifications appear
- [ ] Mark as read works

## Squawks
- [ ] Report squawk
- [ ] Grounding squawk cancels flights
- [ ] Affected students notified
```

---

This guide covers all Section 2 items. Each has step-by-step instructions with code examples. Start with infrastructure setup, then move to UI components and TODOs.

