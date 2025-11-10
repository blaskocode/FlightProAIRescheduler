'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
// Simple Switch component
function Switch({ id, checked, onCheckedChange }: { id: string; checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-blue-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

// Simple Card components
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-lg border bg-white ${className}`}>{children}</div>;
}

function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="p-6 pb-4">{children}</div>;
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-semibold">{children}</h3>;
}

function CardDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-600 mt-1">{children}</p>;
}

function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-6 pt-0 ${className}`}>{children}</div>;
}

interface Settings {
  weatherApiEnabled: boolean;
  weatherCheckFrequency: string;
}

export function SettingsPage() {
  const { user, authUser } = useAuth();
  const [settings, setSettings] = useState<Settings>({
    weatherApiEnabled: false,
    weatherCheckFrequency: 'hourly',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState<string | null>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [loadingCacheStats, setLoadingCacheStats] = useState(false);
  const [warmingCache, setWarmingCache] = useState(false);
  const [invalidatingCache, setInvalidatingCache] = useState(false);
  const [invalidateAirportCode, setInvalidateAirportCode] = useState('');

  useEffect(() => {
    // Only fetch settings when user is authenticated and synced
    if (user && authUser) {
      fetchSettings();
      fetchCacheStats();
    }
  }, [user, authUser]);

  async function fetchCacheStats() {
    try {
      setLoadingCacheStats(true);
      const response = await fetch('/api/weather/cache/stats');
      if (response.ok) {
        const data = await response.json();
        setCacheStats(data);
      }
    } catch (err: any) {
      console.error('Error fetching cache stats:', err);
    } finally {
      setLoadingCacheStats(false);
    }
  }

  async function handleWarmCache() {
    try {
      setWarmingCache(true);
      const response = await fetch('/api/weather/cache/warm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hoursAhead: 24 }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        await fetchCacheStats();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to warm cache');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to warm cache');
    } finally {
      setWarmingCache(false);
    }
  }

  async function handleInvalidateCache() {
    if (!invalidateAirportCode.trim()) {
      setError('Please enter an airport code');
      return;
    }

    try {
      setInvalidatingCache(true);
      const response = await fetch('/api/weather/cache/invalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ airportCode: invalidateAirportCode.trim().toUpperCase() }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        setInvalidateAirportCode('');
        await fetchCacheStats();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to invalidate cache');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to invalidate cache');
    } finally {
      setInvalidatingCache(false);
    }
  }

  async function fetchSettings() {
    try {
      setLoading(true);
      setError(null);
      
      // Wait for user to be authenticated and synced
      if (!user || !authUser) {
        console.log('Waiting for user authentication...');
        return;
      }

      // Get Firebase token for authentication
      let token: string | null = null;
      if (user) {
        token = await user.getIdToken();
      }
      
      // Get selected schoolId for super admins
      const schoolId = typeof window !== 'undefined' ? localStorage.getItem('selectedSchoolId') : null;
      const url = schoolId ? `/api/admin/settings?schoolId=${schoolId}` : '/api/admin/settings';
      
      const response = await fetch(url, {
        headers: token ? { 
          'Authorization': `Bearer ${token}` 
        } : {},
      });
      
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Settings fetch error:', response.status, errorData);
        
        // If school not found, clear invalid schoolId from localStorage and retry
        if (response.status === 404 && errorData.error?.includes('School not found')) {
          const schoolId = typeof window !== 'undefined' ? localStorage.getItem('selectedSchoolId') : null;
          if (schoolId) {
            console.warn('Invalid schoolId in localStorage, clearing:', schoolId);
            localStorage.removeItem('selectedSchoolId');
            // Retry without schoolId
            setTimeout(() => fetchSettings(), 100);
            return;
          }
        }
        
        setError(errorData.error || `Failed to load settings (${response.status})`);
      }
    } catch (err: any) {
      console.error('Settings fetch exception:', err);
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      // Get Firebase token for authentication
      let token: string | null = null;
      if (user) {
        token = await user.getIdToken();
      }

      // Get selected schoolId for super admins
      const schoolId = typeof window !== 'undefined' ? localStorage.getItem('selectedSchoolId') : null;
      const body = schoolId ? { ...settings, schoolId } : settings;

      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Settings save error:', response.status, errorData);
        
        // If school not found, clear invalid schoolId from localStorage and retry
        if (response.status === 404 && errorData.error?.includes('School not found')) {
          const schoolId = typeof window !== 'undefined' ? localStorage.getItem('selectedSchoolId') : null;
          if (schoolId) {
            console.warn('Invalid schoolId in localStorage, clearing:', schoolId);
            localStorage.removeItem('selectedSchoolId');
            // Retry without schoolId
            const retryBody = { ...settings };
            const retryResponse = await fetch('/api/admin/settings', {
              method: 'PATCH',
              headers: { 
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
              },
              body: JSON.stringify(retryBody),
            });
            
            if (retryResponse.ok) {
              setSuccess(true);
              setTimeout(() => setSuccess(false), 3000);
              return;
            }
          }
        }
        
        throw new Error(errorData.error || `Failed to save settings (${response.status})`);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  async function handleManualWeatherRefresh() {
    try {
      setRefreshing(true);
      setError(null);
      setRefreshResult('Queuing weather checks...'); // Show immediate feedback

      // Get Firebase token for authentication
      let token: string | null = null;
      if (user) {
        token = await user.getIdToken();
      }

      const response = await fetch('/api/weather/refresh', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}), // Empty body = refresh all upcoming flights
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to refresh weather');
      }

      const data = await response.json();
      
      // Format result message with success/failure counts
      let resultMessage: string;
      if (data.async && (data.flightIds?.length || data.jobIds?.length)) {
        // Asynchronous mode - poll for completion
        const count = data.queued || data.flightIds?.length || data.jobIds?.length;
        resultMessage = `Queued ${count} weather checks. Processing...`;
        setRefreshResult(resultMessage);
        
        // Use flightIds if available (new approach), otherwise fall back to jobIds (legacy)
        if (data.flightIds) {
          pollJobStatusByFlightIds(data.flightIds, token);
        } else if (data.jobIds) {
          pollJobStatus(data.jobIds, token);
        }
      } else if (data.success !== undefined && data.failed !== undefined) {
        // Detailed completion message (synchronous mode)
        resultMessage = `Weather checks completed: ${data.success} succeeded, ${data.failed} failed`;
        if (data.queued !== undefined) {
          resultMessage += ` (${data.queued} total queued)`;
        }
        setRefreshResult(resultMessage);
        setTimeout(() => setRefreshResult(null), 15000);
      } else if (data.message) {
        // Use API message if available
        resultMessage = data.message;
        setRefreshResult(resultMessage);
        setTimeout(() => setRefreshResult(null), 15000);
      } else if (data.queued !== undefined) {
        // Fallback to queued count
        resultMessage = `Queued ${data.queued} weather checks`;
        setRefreshResult(resultMessage);
        setTimeout(() => setRefreshResult(null), 15000);
      } else {
        // Final fallback
        resultMessage = 'Weather refresh completed';
        setRefreshResult(resultMessage);
        setTimeout(() => setRefreshResult(null), 15000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to refresh weather');
      setRefreshResult(null); // Clear result on error
    } finally {
      setRefreshing(false);
    }
  }

  async function pollJobStatusByFlightIds(flightIds: string[], token: string | null, attempt: number = 0) {
    const maxAttempts = 150; // Poll for up to 5 minutes (150 * 2 seconds = 300 seconds)
    const pollInterval = 2000; // Poll every 2 seconds

    if (attempt >= maxAttempts) {
      setRefreshResult('Weather checks are still processing. Check back later for results.');
      setTimeout(() => setRefreshResult(null), 30000);
      return;
    }

    try {
      const flightIdsParam = flightIds.join(',');
      const response = await fetch(`/api/weather/refresh/status?flightIds=${flightIdsParam}`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        // If status check fails, continue polling
        setTimeout(() => pollJobStatusByFlightIds(flightIds, token, attempt + 1), pollInterval);
        return;
      }

      const status = await response.json();
      const { counts, debug, recentJobsInfo } = status;
      
      // Log debug info for troubleshooting
      if (debug) {
        console.log('Job status debug:', { ...debug, counts, recentJobsInfo });
      }
      
      const total = status.total || (counts.completed + counts.failed + counts.active + counts.waiting + counts.not_found);
      const finished = counts.completed + counts.failed;
      
      if (total === 0) {
        if (attempt < 10) {
          setTimeout(() => pollJobStatusByFlightIds(flightIds, token, attempt + 1), pollInterval);
        } else {
          setRefreshResult('Weather checks completed (job status unavailable)');
          setTimeout(() => setRefreshResult(null), 30000);
        }
        return;
      }

      if (finished === total && counts.active === 0 && counts.waiting === 0) {
        const resultMessage = `Weather checks completed: ${counts.completed} succeeded, ${counts.failed} failed (${total} total)`;
        setRefreshResult(resultMessage);
        setTimeout(() => setRefreshResult(null), 30000);
      } else {
        const progress = total > 0 ? Math.round((finished / total) * 100) : 0;
        setRefreshResult(`Processing weather checks... ${finished}/${total} complete (${progress}%) - ${counts.active} active, ${counts.waiting} waiting`);
        setTimeout(() => pollJobStatusByFlightIds(flightIds, token, attempt + 1), pollInterval);
      }
    } catch (error) {
      setTimeout(() => pollJobStatusByFlightIds(flightIds, token, attempt + 1), pollInterval);
    }
  }

  async function pollJobStatus(jobIds: string[], token: string | null, attempt: number = 0) {
    const maxAttempts = 150; // Poll for up to 5 minutes (150 * 2 seconds = 300 seconds)
    const pollInterval = 2000; // Poll every 2 seconds

    if (attempt >= maxAttempts) {
      setRefreshResult('Weather checks are still processing. Check back later for results.');
      setTimeout(() => setRefreshResult(null), 30000);
      return;
    }

    try {
      const jobIdsParam = jobIds.join(',');
      const response = await fetch(`/api/weather/refresh/status?jobIds=${jobIdsParam}`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        // If status check fails, continue polling
        setTimeout(() => pollJobStatus(jobIds, token, attempt + 1), pollInterval);
        return;
      }

      const status = await response.json();
      const { counts, debug, recentJobsInfo } = status;
      
      // Log debug info for troubleshooting
      if (debug) {
        console.log('Job status debug:', {
          ...debug,
          counts,
          recentJobsInfo,
        });
      }
      
      // Check if we found our specific jobs
      const specificJobsFound = counts.completed + counts.failed + counts.active + counts.waiting;
      const allJobsNotFound = counts.not_found >= jobIds.length * 0.8; // 80% or more not found
      
      // If we can't find our specific jobs, use fallback tracking
      if (allJobsNotFound && debug) {
        // Try recent jobs first (more accurate)
        if (recentJobsInfo && recentJobsInfo.total > 0) {
          const { total, completed, failed, active, waiting } = recentJobsInfo;
          const finished = completed + failed;
          
          if (finished === total && active === 0 && waiting === 0) {
            const resultMessage = `Weather checks completed: ${completed} succeeded, ${failed} failed (${total} total)`;
            setRefreshResult(resultMessage);
            setTimeout(() => setRefreshResult(null), 30000);
            return;
          } else if (total > 0) {
            const progress = Math.round((finished / total) * 100);
            setRefreshResult(
              `Processing weather checks... ${finished}/${total} complete (${progress}%) - ${active} active, ${waiting} waiting`
            );
            setTimeout(() => pollJobStatus(jobIds, token, attempt + 1), pollInterval);
            return;
          }
        }
        
        // Fallback to overall queue counts
        const queueTotal = (debug.waitingJobsCount || 0) + (debug.activeJobsCount || 0) + 
                          (debug.completedJobsCount || 0) + (debug.failedJobsCount || 0);
        const queueFinished = (debug.completedJobsCount || 0) + (debug.failedJobsCount || 0);
        
        if (queueTotal > 0) {
          if (queueFinished === queueTotal) {
            const resultMessage = `Weather checks completed: ${debug.completedJobsCount || 0} succeeded, ${debug.failedJobsCount || 0} failed (${queueTotal} total)`;
            setRefreshResult(resultMessage);
            setTimeout(() => setRefreshResult(null), 30000);
            return;
          } else {
            const progress = Math.round((queueFinished / queueTotal) * 100);
            setRefreshResult(
              `Processing weather checks... ${queueFinished}/${queueTotal} complete (${progress}%) - ${debug.activeJobsCount || 0} active, ${debug.waitingJobsCount || 0} waiting`
            );
            setTimeout(() => pollJobStatus(jobIds, token, attempt + 1), pollInterval);
            return;
          }
        }
      }
      
      // Use specific job tracking if we found our jobs
      const total = status.total || (counts.completed + counts.failed + counts.active + counts.waiting + counts.not_found);
      const finished = counts.completed + counts.failed;
      
      if (total === 0) {
        // No jobs found at all
        if (attempt < 10) {
          setTimeout(() => pollJobStatus(jobIds, token, attempt + 1), pollInterval);
        } else {
          setRefreshResult('Weather checks completed (job status unavailable)');
          setTimeout(() => setRefreshResult(null), 30000);
        }
        return;
      }

      if (finished === total && counts.active === 0 && counts.waiting === 0) {
        // All jobs are complete
        const resultMessage = `Weather checks completed: ${counts.completed} succeeded, ${counts.failed} failed (${total} total)`;
        setRefreshResult(resultMessage);
        setTimeout(() => setRefreshResult(null), 30000);
      } else {
        // Still processing - update message and continue polling
        const progress = total > 0 ? Math.round((finished / total) * 100) : 0;
        setRefreshResult(
          `Processing weather checks... ${finished}/${total} complete (${progress}%) - ${counts.active} active, ${counts.waiting} waiting`
        );
        setTimeout(() => pollJobStatus(jobIds, token, attempt + 1), pollInterval);
      }
    } catch (error) {
      // On error, continue polling
      setTimeout(() => pollJobStatus(jobIds, token, attempt + 1), pollInterval);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Settings</h1>
        <p className="text-gray-600 mt-2">Configure system-wide settings and preferences</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-800">Settings saved successfully!</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Weather API Configuration</CardTitle>
          <CardDescription>
            Configure weather data sources and check frequency
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weather-api">Enable WeatherAPI.com</Label>
              <p className="text-sm text-gray-500">
                Use paid WeatherAPI.com as alternative to free FAA data
              </p>
            </div>
            <Switch
              id="weather-api"
              checked={settings.weatherApiEnabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, weatherApiEnabled: checked })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="check-frequency">Weather Check Frequency</Label>
            <Select
              value={settings.weatherCheckFrequency}
              onValueChange={(value) =>
                setSettings({ ...settings, weatherCheckFrequency: value })
              }
            >
              <SelectTrigger id="check-frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="every-30-min">Every 30 Minutes</SelectItem>
                <SelectItem value="every-15-min">Every 15 Minutes</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              How often to automatically check weather for upcoming flights
            </p>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Manual Weather Refresh</Label>
                <p className="text-sm text-gray-500">
                  Manually trigger weather checks for all upcoming flights (next 48 hours)
                </p>
              </div>
              <Button
                onClick={handleManualWeatherRefresh}
                disabled={refreshing}
                variant="outline"
              >
                {refreshing ? 'Refreshing...' : 'Run Manual Weather Check'}
              </Button>
            </div>
            {refreshResult && (
              <div className={`mt-3 rounded-lg border p-3 ${
                refreshResult.includes('Queuing') 
                  ? 'border-yellow-200 bg-yellow-50' 
                  : refreshResult.includes('failed') && !refreshResult.includes('succeeded')
                  ? 'border-red-200 bg-red-50'
                  : 'border-green-200 bg-green-50'
              }`}>
                <p className={`text-sm font-medium ${
                  refreshResult.includes('Queuing')
                    ? 'text-yellow-800'
                    : refreshResult.includes('failed') && !refreshResult.includes('succeeded')
                    ? 'text-red-800'
                    : 'text-green-800'
                }`}>
                  {refreshResult}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cache Management */}
      <Card>
        <CardHeader>
          <CardTitle>Weather Cache Management</CardTitle>
          <CardDescription>
            Manage weather data caching for improved performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cache Stats */}
          {loadingCacheStats ? (
            <p className="text-sm text-gray-500">Loading cache statistics...</p>
          ) : cacheStats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-gray-600">Total Cached</p>
                <p className="text-xl font-bold">{cacheStats.totalCached || 0}</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-gray-600">Hit Rate</p>
                <p className="text-xl font-bold">
                  {cacheStats.hitRate ? `${cacheStats.hitRate.toFixed(1)}%` : 'N/A'}
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-gray-600">Cache Size</p>
                <p className="text-xl font-bold">
                  {cacheStats.cacheSize ? `${(cacheStats.cacheSize / 1024).toFixed(1)} KB` : 'N/A'}
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-gray-600">Last Updated</p>
                <p className="text-sm font-semibold">
                  {cacheStats.lastUpdated 
                    ? new Date(cacheStats.lastUpdated).toLocaleTimeString()
                    : 'Never'}
                </p>
              </div>
            </div>
          ) : null}

          {/* Cache Actions */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Warm Cache</Label>
                <p className="text-sm text-gray-500">
                  Preload weather data for upcoming flights (next 24 hours)
                </p>
              </div>
              <Button
                onClick={handleWarmCache}
                disabled={warmingCache}
                variant="outline"
              >
                {warmingCache ? 'Warming...' : 'Warm Cache'}
              </Button>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 space-y-0.5">
                <Label htmlFor="invalidate-airport">Invalidate Cache</Label>
                <p className="text-sm text-gray-500">
                  Clear cached weather data for a specific airport
                </p>
              </div>
              <div className="flex gap-2">
                <Input
                  id="invalidate-airport"
                  type="text"
                  placeholder="KAUS"
                  value={invalidateAirportCode}
                  onChange={(e) => setInvalidateAirportCode(e.target.value)}
                  className="w-24"
                  maxLength={4}
                />
                <Button
                  onClick={handleInvalidateCache}
                  disabled={invalidatingCache || !invalidateAirportCode.trim()}
                  variant="outline"
                  size="sm"
                >
                  {invalidatingCache ? 'Invalidating...' : 'Invalidate'}
                </Button>
              </div>
            </div>

            <Button
              onClick={fetchCacheStats}
              disabled={loadingCacheStats}
              variant="outline"
              size="sm"
            >
              {loadingCacheStats ? 'Refreshing...' : 'Refresh Stats'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button onClick={fetchSettings} variant="outline" disabled={saving}>
          Reset
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}

