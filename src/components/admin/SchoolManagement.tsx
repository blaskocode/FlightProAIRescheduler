'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface School {
  id: string;
  name: string;
  airportCode: string;
  address?: string;
  phone?: string;
  email?: string;
  weatherApiEnabled: boolean;
  _count?: {
    students: number;
    instructors: number;
    aircraft: number;
    flights: number;
  };
}

export function SchoolManagement() {
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSchools();
  }, []);

  async function fetchSchools() {
    try {
      setLoading(true);
      const response = await fetch('/api/schools');
      if (response.ok) {
        const data = await response.json();
        setSchools(data);
        if (data.length > 0 && !selectedSchool) {
          setSelectedSchool(data[0]);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch schools');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!selectedSchool) return;

    try {
      setSaving(true);
      setError(null);
      
      // Get current user's UID (in production, get from auth context)
      const uid = localStorage.getItem('firebase_uid'); // Temporary - should come from auth context
      
      const response = await fetch(`/api/schools/${selectedSchool.id}?uid=${uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedSchool.name,
          phone: selectedSchool.phone,
          email: selectedSchool.email,
          address: selectedSchool.address,
          weatherApiEnabled: selectedSchool.weatherApiEnabled,
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setSelectedSchool(updated);
        setSchools(schools.map(s => s.id === updated.id ? updated : s));
        alert('School settings saved successfully');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div>Loading schools...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>School Management</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="school-select">Select School</Label>
              <select
                id="school-select"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={selectedSchool?.id || ''}
                onChange={(e) => {
                  const school = schools.find(s => s.id === e.target.value);
                  setSelectedSchool(school || null);
                }}
              >
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name} ({school.airportCode})
                  </option>
                ))}
              </select>
            </div>

            {selectedSchool && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">School Name</Label>
                  <Input
                    id="name"
                    value={selectedSchool.name}
                    onChange={(e) =>
                      setSelectedSchool({ ...selectedSchool, name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="airportCode">Airport Code</Label>
                  <Input
                    id="airportCode"
                    value={selectedSchool.airportCode}
                    disabled
                    className="bg-gray-100"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Airport code cannot be changed
                  </p>
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={selectedSchool.address || ''}
                    onChange={(e) =>
                      setSelectedSchool({ ...selectedSchool, address: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={selectedSchool.phone || ''}
                    onChange={(e) =>
                      setSelectedSchool({ ...selectedSchool, phone: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={selectedSchool.email || ''}
                    onChange={(e) =>
                      setSelectedSchool({ ...selectedSchool, email: e.target.value })
                    }
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="weatherApi"
                    checked={selectedSchool.weatherApiEnabled}
                    onCheckedChange={(checked) =>
                      setSelectedSchool({ ...selectedSchool, weatherApiEnabled: checked })
                    }
                  />
                  <Label htmlFor="weatherApi">Enable WeatherAPI.com (paid)</Label>
                </div>

                {selectedSchool._count && (
                  <div className="rounded-md bg-gray-50 p-4">
                    <h4 className="font-semibold mb-2">School Statistics</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Students:</span>{' '}
                        <span className="font-semibold">{selectedSchool._count.students}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Instructors:</span>{' '}
                        <span className="font-semibold">{selectedSchool._count.instructors}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Aircraft:</span>{' '}
                        <span className="font-semibold">{selectedSchool._count.aircraft}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Flights:</span>{' '}
                        <span className="font-semibold">{selectedSchool._count.flights}</span>
                      </div>
                    </div>
                  </div>
                )}

                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

