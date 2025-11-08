'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CalendarStatus {
  connected: boolean;
  syncEnabled: boolean;
  syncDirection?: string;
  calendarId?: string;
  lastSyncAt?: string;
  lastSyncStatus?: string;
  lastSyncError?: string;
}

export function CalendarSettings() {
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    syncEnabled: false,
    syncDirection: 'bidirectional',
    calendarId: 'primary',
  });

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      setLoading(true);
      const response = await fetch('/api/calendar/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        if (data.connected) {
          setSettings({
            syncEnabled: data.syncEnabled,
            syncDirection: data.syncDirection || 'bidirectional',
            calendarId: data.calendarId || 'primary',
          });
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch calendar status');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch calendar status');
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    try {
      const response = await fetch('/api/calendar/auth');
      if (response.ok) {
        const data = await response.json();
        window.location.href = data.authUrl;
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to initiate connection');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect');
    }
  }

  async function handleDisconnect() {
    if (!confirm('Are you sure you want to disconnect Google Calendar?')) {
      return;
    }

    try {
      const response = await fetch('/api/calendar/status', {
        method: 'DELETE',
      });

      if (response.ok) {
        setStatus({ connected: false, syncEnabled: false });
        setSuccess('Google Calendar disconnected');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to disconnect');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect');
    }
  }

  async function handleUpdateSettings() {
    try {
      const response = await fetch('/api/calendar/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        const data = await response.json();
        setStatus((prev) => prev ? { ...prev, ...data } : null);
        setSuccess('Settings updated');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update settings');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update settings');
    }
  }

  if (loading) {
    return <div>Loading calendar settings...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Google Calendar Integration</CardTitle>
        <CardDescription>
          Sync your flights with Google Calendar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        {success && (
          <div className="rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {!status?.connected ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Connect your Google Calendar to automatically sync flight schedules.
            </p>
            <Button onClick={handleConnect} className="w-full">
              Connect Google Calendar
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold">Connection Status</p>
                <p className="text-sm text-gray-600">Connected to Google Calendar</p>
              </div>
              <Badge variant="outline" className="bg-green-100 text-green-800">
                Connected
              </Badge>
            </div>

            {status.lastSyncAt && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-semibold mb-1">Last Sync</p>
                <p className="text-xs text-gray-600">
                  {new Date(status.lastSyncAt).toLocaleString()}
                </p>
                {status.lastSyncStatus && (
                  <Badge
                    variant={status.lastSyncStatus === 'success' ? 'default' : 'destructive'}
                    className="mt-2"
                  >
                    {status.lastSyncStatus}
                  </Badge>
                )}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="syncEnabled">Enable Sync</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <input
                    type="checkbox"
                    id="syncEnabled"
                    checked={settings.syncEnabled}
                    onChange={(e) =>
                      setSettings({ ...settings, syncEnabled: e.target.checked })
                    }
                    className="h-4 w-4"
                  />
                  <label htmlFor="syncEnabled" className="text-sm">
                    Automatically sync flights to Google Calendar
                  </label>
                </div>
              </div>

              <div>
                <Label htmlFor="syncDirection">Sync Direction</Label>
                <select
                  id="syncDirection"
                  value={settings.syncDirection}
                  onChange={(e) =>
                    setSettings({ ...settings, syncDirection: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="export">Export only (Flights → Calendar)</option>
                  <option value="import">Import only (Calendar → Flights)</option>
                  <option value="bidirectional">Bidirectional (Both ways)</option>
                </select>
              </div>

              <div>
                <Label htmlFor="calendarId">Calendar ID</Label>
                <Input
                  id="calendarId"
                  value={settings.calendarId}
                  onChange={(e) =>
                    setSettings({ ...settings, calendarId: e.target.value })
                  }
                  placeholder="primary"
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Leave as "primary" to use your default calendar
                </p>
              </div>

              <Button onClick={handleUpdateSettings} className="w-full">
                Update Settings
              </Button>
            </div>

            <div className="pt-4 border-t">
              <Button
                onClick={handleDisconnect}
                variant="outline"
                className="w-full"
              >
                Disconnect Google Calendar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

