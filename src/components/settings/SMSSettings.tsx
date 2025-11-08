'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface SMSStatus {
  phoneNumber?: string;
  phoneVerified: boolean;
  smsOptIn: boolean;
  smsNotifications: boolean;
}

export function SMSSettings() {
  const [status, setStatus] = useState<SMSStatus | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Fetch current SMS status
    // This would come from user profile API
    setStatus({
      phoneVerified: false,
      smsOptIn: false,
      smsNotifications: false,
    });
  }, []);

  async function handleVerify() {
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/sms/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber,
          optIn: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setStatus({
          phoneNumber: data.phoneNumber,
          phoneVerified: true,
          smsOptIn: true,
          smsNotifications: true,
        });
        setSuccess('Phone number verified and SMS enabled!');
        setPhoneNumber('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to verify phone number');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify phone number');
    } finally {
      setLoading(false);
    }
  }

  async function handleOptOut() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/sms/opt-out', {
        method: 'POST',
      });

      if (response.ok) {
        setStatus((prev) => prev ? {
          ...prev,
          smsOptIn: false,
          smsNotifications: false,
        } : null);
        setSuccess('SMS notifications disabled');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to opt out');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to opt out');
    } finally {
      setLoading(false);
    }
  }

  if (!status) {
    return <div>Loading SMS settings...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>SMS Notifications</CardTitle>
        <CardDescription>
          Receive important flight updates via text message
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

        {status.phoneVerified ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold">Phone Number</p>
                <p className="text-sm text-gray-600">{status.phoneNumber}</p>
              </div>
              <Badge variant="outline" className="bg-green-100 text-green-800">
                Verified
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold">SMS Status</p>
                <p className="text-sm text-gray-600">
                  {status.smsOptIn ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              <Badge variant={status.smsOptIn ? 'default' : 'outline'}>
                {status.smsOptIn ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            {status.smsOptIn && (
              <Button
                onClick={handleOptOut}
                variant="outline"
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Disabling...' : 'Disable SMS Notifications'}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-2">
                Phone Number
              </label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500">
                We'll send a verification code to confirm your number
              </p>
            </div>
            <Button
              onClick={handleVerify}
              disabled={loading || !phoneNumber.trim()}
              className="w-full"
            >
              {loading ? 'Verifying...' : 'Verify & Enable SMS'}
            </Button>
          </div>
        )}

        <div className="pt-4 border-t text-xs text-gray-500">
          <p>
            By enabling SMS notifications, you agree to receive automated text messages.
            Message and data rates may apply. Reply STOP to opt out at any time.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

