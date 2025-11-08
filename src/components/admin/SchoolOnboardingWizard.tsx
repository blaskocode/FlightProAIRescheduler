'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface OnboardingData {
  name: string;
  airportCode: string;
  latitude: string;
  longitude: string;
  timezone: string;
  phone: string;
  email: string;
  address: string;
}

export function SchoolOnboardingWizard() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    name: '',
    airportCode: '',
    latitude: '',
    longitude: '',
    timezone: 'America/Chicago',
    phone: '',
    email: '',
    address: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Get current user's UID (in production, get from auth context)
      const uid = localStorage.getItem('firebase_uid'); // Temporary

      const response = await fetch(`/api/schools/onboard?uid=${uid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setSuccess(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create school');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create school');
    } finally {
      setLoading(false);
    }
  };

  const updateData = (field: keyof OnboardingData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>School Created Successfully!</CardTitle>
          <CardDescription>
            The new flight school has been added to the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => window.location.reload()}>Add Another School</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Onboard New Flight School</CardTitle>
        <CardDescription>
          Step {step} of 3: Add a new flight school to the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">School Name *</Label>
                <Input
                  id="name"
                  required
                  value={data.name}
                  onChange={(e) => updateData('name', e.target.value)}
                  placeholder="Austin Flight Academy"
                />
              </div>

              <div>
                <Label htmlFor="airportCode">Airport Code (ICAO) *</Label>
                <Input
                  id="airportCode"
                  required
                  value={data.airportCode}
                  onChange={(e) => updateData('airportCode', e.target.value.toUpperCase())}
                  placeholder="KAUS"
                  maxLength={4}
                />
                <p className="mt-1 text-xs text-gray-500">
                  4-letter ICAO airport code (e.g., KAUS, KORD)
                </p>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={data.address}
                  onChange={(e) => updateData('address', e.target.value)}
                  placeholder="123 Airport Blvd, Austin, TX 78719"
                />
              </div>

              <div className="flex justify-end">
                <Button type="button" onClick={() => setStep(2)}>
                  Next: Location
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="latitude">Latitude *</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  required
                  value={data.latitude}
                  onChange={(e) => updateData('latitude', e.target.value)}
                  placeholder="30.1944"
                />
              </div>

              <div>
                <Label htmlFor="longitude">Longitude *</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  required
                  value={data.longitude}
                  onChange={(e) => updateData('longitude', e.target.value)}
                  placeholder="-97.6699"
                />
              </div>

              <div>
                <Label htmlFor="timezone">Timezone *</Label>
                <select
                  id="timezone"
                  required
                  value={data.timezone}
                  onChange={(e) => updateData('timezone', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="America/Chicago">Central (America/Chicago)</option>
                  <option value="America/New_York">Eastern (America/New_York)</option>
                  <option value="America/Denver">Mountain (America/Denver)</option>
                  <option value="America/Los_Angeles">Pacific (America/Los_Angeles)</option>
                  <option value="America/Anchorage">Alaska (America/Anchorage)</option>
                  <option value="Pacific/Honolulu">Hawaii (Pacific/Honolulu)</option>
                </select>
              </div>

              <div className="flex justify-between">
                <Button type="button" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="button" onClick={() => setStep(3)}>
                  Next: Contact
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={data.phone}
                  onChange={(e) => updateData('phone', e.target.value)}
                  placeholder="(512) 555-1234"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={data.email}
                  onChange={(e) => updateData('email', e.target.value)}
                  placeholder="info@austinflightacademy.com"
                />
              </div>

              <div className="flex justify-between">
                <Button type="button" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create School'}
                </Button>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

