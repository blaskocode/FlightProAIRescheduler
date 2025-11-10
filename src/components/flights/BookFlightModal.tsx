'use client';

import { useState, FormEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { User } from 'firebase/auth';

interface Instructor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Aircraft {
  id: string;
  tailNumber: string;
  status: string;
  aircraftType: {
    make: string;
    model: string;
  };
}

interface BookFlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BookFlightModal({ isOpen, onClose, onSuccess }: BookFlightModalProps) {
  const { user, authUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [formData, setFormData] = useState({
    instructorId: '',
    aircraftId: '',
    scheduledDate: '',
    scheduledTime: '10:00',
    duration: '2', // hours
    lessonTitle: '',
    lessonNumber: '',
    departureAirport: '',
    destinationAirport: '',
    route: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchInstructors();
      fetchAircraft();
      // Set default departure airport from school if available
      if (authUser?.schoolId) {
        // We'll need to get this from the school, but for now leave it empty
      }
    }
  }, [isOpen, authUser]);

  async function fetchInstructors() {
    try {
      if (!user) return;
      const token = await user.getIdToken();
      const response = await fetch('/api/instructors', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setInstructors(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, instructorId: data[0].id }));
        }
      }
    } catch (err) {
      console.error('Error fetching instructors:', err);
    }
  }

  async function fetchAircraft() {
    try {
      if (!user) return;
      const token = await user.getIdToken();
      const response = await fetch('/api/aircraft', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        // Filter to only available aircraft
        const available = data.filter((ac: Aircraft) => ac.status === 'AVAILABLE');
        setAircraft(available);
        if (available.length > 0) {
          setFormData(prev => ({ ...prev, aircraftId: available[0].id }));
        }
      }
    } catch (err) {
      console.error('Error fetching aircraft:', err);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !authUser?.studentId) {
      setError('You must be logged in as a student to book flights');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      
      // Parse date and time
      const [hours, minutes] = formData.scheduledTime.split(':').map(Number);
      const scheduledDate = new Date(formData.scheduledDate);
      scheduledDate.setHours(hours, minutes, 0, 0);
      
      const durationHours = parseFloat(formData.duration);
      const scheduledEnd = new Date(scheduledDate);
      scheduledEnd.setHours(scheduledEnd.getHours() + durationHours);

      // Get student's schoolId
      const studentResponse = await fetch('/api/students', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!studentResponse.ok) {
        throw new Error('Failed to fetch student information');
      }
      
      const students = await studentResponse.json();
      const currentStudent = students.find((s: any) => s.id === authUser.studentId);
      
      if (!currentStudent || !currentStudent.schoolId) {
        throw new Error('Student school not found');
      }

      const response = await fetch('/api/flights', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schoolId: currentStudent.schoolId,
          studentId: authUser.studentId,
          instructorId: formData.instructorId || undefined,
          aircraftId: formData.aircraftId,
          scheduledStart: scheduledDate.toISOString(),
          scheduledEnd: scheduledEnd.toISOString(),
          flightType: 'DUAL_INSTRUCTION',
          lessonNumber: formData.lessonNumber ? parseInt(formData.lessonNumber) : undefined,
          lessonTitle: formData.lessonTitle || 'Flight Lesson',
          departureAirport: formData.departureAirport || 'KAUS',
          destinationAirport: formData.destinationAirport || undefined,
          route: formData.route || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to book flight');
      }

      const flight = await response.json();
      console.log('Flight booked successfully:', flight);
      
      // Close modal and trigger refresh
      onClose();
      onSuccess();
      
      // Reset form
      setFormData({
        instructorId: instructors.length > 0 ? instructors[0].id : '',
        aircraftId: aircraft.length > 0 ? aircraft[0].id : '',
        scheduledDate: '',
        scheduledTime: '10:00',
        duration: '2',
        lessonTitle: '',
        lessonNumber: '',
        departureAirport: '',
        destinationAirport: '',
        route: '',
      });
    } catch (err: any) {
      console.error('Error booking flight:', err);
      setError(err.message || 'Failed to book flight. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-sky-900">Book a New Flight</h2>
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </Button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="scheduledDate">Date *</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  required
                  min={today}
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="scheduledTime">Time *</Label>
                <Input
                  id="scheduledTime"
                  type="time"
                  required
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="duration">Duration (hours) *</Label>
                <Input
                  id="duration"
                  type="number"
                  min="0.5"
                  max="8"
                  step="0.5"
                  required
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="instructorId">Instructor *</Label>
                <select
                  id="instructorId"
                  required
                  value={formData.instructorId}
                  onChange={(e) => setFormData(prev => ({ ...prev, instructorId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">Select an instructor</option>
                  {instructors.map((instructor) => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.firstName} {instructor.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="aircraftId">Aircraft *</Label>
                <select
                  id="aircraftId"
                  required
                  value={formData.aircraftId}
                  onChange={(e) => setFormData(prev => ({ ...prev, aircraftId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">Select an aircraft</option>
                  {aircraft.map((ac) => (
                    <option key={ac.id} value={ac.id}>
                      {ac.tailNumber} ({ac.aircraftType.make} {ac.aircraftType.model})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="lessonTitle">Lesson Title</Label>
                <Input
                  id="lessonTitle"
                  type="text"
                  placeholder="e.g., Basic Maneuvers, Pattern Work"
                  value={formData.lessonTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, lessonTitle: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="lessonNumber">Lesson Number</Label>
                <Input
                  id="lessonNumber"
                  type="number"
                  min="1"
                  placeholder="Optional"
                  value={formData.lessonNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, lessonNumber: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="departureAirport">Departure Airport</Label>
                <Input
                  id="departureAirport"
                  type="text"
                  placeholder="e.g., KAUS"
                  value={formData.departureAirport}
                  onChange={(e) => setFormData(prev => ({ ...prev, departureAirport: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="destinationAirport">Destination Airport</Label>
                <Input
                  id="destinationAirport"
                  type="text"
                  placeholder="e.g., KHYI (optional)"
                  value={formData.destinationAirport}
                  onChange={(e) => setFormData(prev => ({ ...prev, destinationAirport: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="route">Route</Label>
              <Input
                id="route"
                type="text"
                placeholder="e.g., KAUS-KHYI-KAUS (optional)"
                value={formData.route}
                onChange={(e) => setFormData(prev => ({ ...prev, route: e.target.value }))}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-sky-600 hover:bg-sky-700 text-white"
              >
                {loading ? 'Booking...' : 'Book Flight'}
              </Button>
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

