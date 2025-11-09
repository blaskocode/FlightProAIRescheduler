'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SquawkReportForm } from '@/components/squawks/SquawkReportForm';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Aircraft {
  id: string;
  tailNumber: string;
  status: string;
  aircraftType: {
    make: string;
    model: string;
  };
}

export function SquawkReportCard() {
  const { user, authUser } = useAuth();
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [selectedAircraftId, setSelectedAircraftId] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAircraft() {
      if (!user || !authUser || (authUser.role !== 'instructor' && authUser.role !== 'admin')) {
        setLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/aircraft', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch aircraft');
        }

        const data = await response.json();
        setAircraft(data);
      } catch (error) {
        console.error('Error fetching aircraft:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAircraft();
  }, [user, authUser]);

  // Only show for instructors and admins
  if (!authUser || (authUser.role !== 'instructor' && authUser.role !== 'admin')) {
    return null;
  }

  const selectedAircraft = aircraft.find(a => a.id === selectedAircraftId);

  const handleSuccess = () => {
    setShowForm(false);
    setSelectedAircraftId('');
    // Optionally refresh aircraft list to show updated status
    window.location.reload();
  };

  if (loading) {
    return (
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Report Aircraft Squawk</h2>
        <p className="text-sm text-gray-500">Loading aircraft...</p>
      </Card>
    );
  }

  if (aircraft.length === 0) {
    return (
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Report Aircraft Squawk</h2>
        <p className="text-sm text-gray-500">No aircraft available.</p>
      </Card>
    );
  }

  if (!showForm) {
    return (
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Report Aircraft Squawk</h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-2 block">Select Aircraft</label>
            <Select value={selectedAircraftId} onValueChange={setSelectedAircraftId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an aircraft" />
              </SelectTrigger>
              <SelectContent>
                {aircraft.map((ac) => (
                  <SelectItem key={ac.id} value={ac.id}>
                    {ac.tailNumber} - {ac.aircraftType.make} {ac.aircraftType.model} ({ac.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            disabled={!selectedAircraftId}
            className="w-full"
          >
            Report Squawk
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-4">Report Aircraft Squawk</h2>
      {selectedAircraft && (
        <SquawkReportForm
          aircraftId={selectedAircraft.id}
          aircraftTailNumber={selectedAircraft.tailNumber}
          onSuccess={handleSuccess}
          onCancel={() => {
            setShowForm(false);
            setSelectedAircraftId('');
          }}
        />
      )}
    </Card>
  );
}

