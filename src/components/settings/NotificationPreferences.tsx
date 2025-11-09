'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface NotificationPreferences {
  channels: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  timing: {
    immediate: boolean;
    dailyDigest: boolean;
    weeklyDigest: boolean;
    quietHours: {
      enabled: boolean;
      start: string;
      end: string;
    };
  };
  eventTypes: {
    weather: { email: boolean; sms: boolean; push: boolean };
    reschedule: { email: boolean; sms: boolean; push: boolean };
    confirmation: { email: boolean; sms: boolean; push: boolean };
    currency: { email: boolean; sms: boolean; push: boolean };
    maintenance: { email: boolean; sms: boolean; push: boolean };
  };
}

export function NotificationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const token = await user.getIdToken();
      const response = await fetch('/api/notifications/preferences', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
      } else {
        setError('Failed to load preferences');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user || !preferences) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const token = await user.getIdToken();
      const response = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ preferences }),
      });

      if (response.ok) {
        setSuccess('Preferences saved successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save preferences');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (path: string[], value: any) => {
    if (!preferences) return;

    const newPrefs = { ...preferences };
    let current: any = newPrefs;

    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }

    current[path[path.length - 1]] = value;
    setPreferences(newPrefs);
  };

  if (loading) {
    return <div className="p-4">Loading preferences...</div>;
  }

  if (!preferences) {
    return <div className="p-4 text-red-500">Failed to load preferences</div>;
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold">Notification Preferences</h2>
        {success && (
          <div className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded">
            {success}
          </div>
        )}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded">
            {error}
          </div>
        )}
      </div>

      {/* Channel Preferences */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-lg font-semibold mb-4">Notification Channels</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-channel">Email Notifications</Label>
            <Switch
              id="email-channel"
              checked={preferences.channels.email}
              onCheckedChange={(checked) =>
                updatePreference(['channels', 'email'], checked)
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="sms-channel">SMS Notifications</Label>
            <Switch
              id="sms-channel"
              checked={preferences.channels.sms}
              onCheckedChange={(checked) =>
                updatePreference(['channels', 'sms'], checked)
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="push-channel">Push Notifications</Label>
            <Switch
              id="push-channel"
              checked={preferences.channels.push}
              onCheckedChange={(checked) =>
                updatePreference(['channels', 'push'], checked)
              }
            />
          </div>
        </div>
      </Card>

      {/* Timing Preferences */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-lg font-semibold mb-4">Timing Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="immediate">Immediate Notifications</Label>
            <Switch
              id="immediate"
              checked={preferences.timing.immediate}
              onCheckedChange={(checked) =>
                updatePreference(['timing', 'immediate'], checked)
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="daily-digest">Daily Digest</Label>
            <Switch
              id="daily-digest"
              checked={preferences.timing.dailyDigest}
              onCheckedChange={(checked) =>
                updatePreference(['timing', 'dailyDigest'], checked)
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="weekly-digest">Weekly Digest</Label>
            <Switch
              id="weekly-digest"
              checked={preferences.timing.weeklyDigest}
              onCheckedChange={(checked) =>
                updatePreference(['timing', 'weeklyDigest'], checked)
              }
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="quiet-hours">Quiet Hours</Label>
              <Switch
                id="quiet-hours"
                checked={preferences.timing.quietHours.enabled}
                onCheckedChange={(checked) =>
                  updatePreference(['timing', 'quietHours', 'enabled'], checked)
                }
              />
            </div>
            {preferences.timing.quietHours.enabled && (
              <div className="flex items-center gap-2 mt-2">
                <Input
                  type="time"
                  value={preferences.timing.quietHours.start}
                  onChange={(e) =>
                    updatePreference(['timing', 'quietHours', 'start'], e.target.value)
                  }
                  className="w-32"
                />
                <span className="text-gray-500">to</span>
                <Input
                  type="time"
                  value={preferences.timing.quietHours.end}
                  onChange={(e) =>
                    updatePreference(['timing', 'quietHours', 'end'], e.target.value)
                  }
                  className="w-32"
                />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Event Type Preferences */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-lg font-semibold mb-4">Event-Specific Preferences</h3>
        <div className="space-y-6">
          {Object.entries(preferences.eventTypes).map(([eventType, channels]) => (
            <div key={eventType} className="border-b pb-4 last:border-b-0">
              <h4 className="font-medium mb-3 capitalize">{eventType} Events</h4>
              <div className="space-y-2 ml-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`${eventType}-email`} className="text-sm">Email</Label>
                  <Switch
                    id={`${eventType}-email`}
                    checked={channels.email}
                    onCheckedChange={(checked) =>
                      updatePreference(['eventTypes', eventType, 'email'], checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor={`${eventType}-sms`} className="text-sm">SMS</Label>
                    <Switch
                      id={`${eventType}-sms`}
                      checked={channels.sms}
                      onCheckedChange={(checked) =>
                        updatePreference(['eventTypes', eventType, 'sms'], checked)
                      }
                    />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor={`${eventType}-push`} className="text-sm">Push</Label>
                  <Switch
                    id={`${eventType}-push`}
                    checked={channels.push}
                    onCheckedChange={(checked) =>
                      updatePreference(['eventTypes', eventType, 'push'], checked)
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          onClick={savePreferences}
          disabled={saving}
          className="w-full sm:w-auto"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
}

