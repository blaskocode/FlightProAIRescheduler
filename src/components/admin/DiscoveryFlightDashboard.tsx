'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface DiscoveryFlightMetrics {
  total: number;
  scheduled: number;
  completed: number;
  converted: number;
  conversionRate: number;
  cancelled: number;
}

interface DiscoveryFlight {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  surveySent: boolean;
  surveyCompleted: boolean;
  enrollmentOfferSent: boolean;
  convertedToStudentId: string | null;
  flight: {
    id: string;
    scheduledStart: string;
    status: string;
  };
  createdAt: string;
}

export function DiscoveryFlightDashboard({ schoolId }: { schoolId: string }) {
  const [metrics, setMetrics] = useState<DiscoveryFlightMetrics | null>(null);
  const [flights, setFlights] = useState<DiscoveryFlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFlights, setLoadingFlights] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFlight, setSelectedFlight] = useState<DiscoveryFlight | null>(null);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMetrics();
    fetchFlights();
  }, [schoolId]);

  async function fetchFlights() {
    try {
      setLoadingFlights(true);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 90);

      const response = await fetch(
        `/api/discovery-flights?schoolId=${schoolId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );

      if (response.ok) {
        const data = await response.json();
        // If API returns list, use it; otherwise fetch separately
        if (Array.isArray(data)) {
          setFlights(data);
        }
      }
    } catch (err: any) {
      console.error('Error fetching discovery flights:', err);
    } finally {
      setLoadingFlights(false);
    }
  }

  async function handleSendSurvey(flightId: string) {
    try {
      setSubmitting(true);
      const response = await fetch(`/api/discovery-flights/${flightId}/survey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses: {
            interestLevel: 'high',
            preferredContactMethod: 'email',
            timeline: 'within_month',
          },
        }),
      });

      if (response.ok) {
        await fetchFlights();
        setShowSurveyModal(false);
        setSelectedFlight(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to send survey');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send survey');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConvert(flightId: string, firebaseUid: string) {
    try {
      setSubmitting(true);
      const response = await fetch(`/api/discovery-flights/${flightId}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebaseUid }),
      });

      if (response.ok) {
        await fetchFlights();
        await fetchMetrics();
        setShowConvertModal(false);
        setSelectedFlight(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to convert discovery flight');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to convert discovery flight');
    } finally {
      setSubmitting(false);
    }
  }

  async function fetchMetrics() {
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 90);

      const response = await fetch(
        `/api/discovery-flights?schoolId=${schoolId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );

      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch metrics');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div>Loading discovery flight metrics...</div>;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Discovery Flight Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return <div>No metrics available</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Discovery Flight Metrics (Last 90 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold">{metrics.total}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-gray-600">Scheduled</p>
              <p className="text-2xl font-bold text-blue-600">{metrics.scheduled}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{metrics.completed}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-gray-600">Converted</p>
              <p className="text-2xl font-bold text-purple-600">{metrics.converted}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-gray-600">Cancelled</p>
              <p className="text-2xl font-bold text-red-600">{metrics.cancelled}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Discovery Flights List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Discovery Flights</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingFlights ? (
            <p>Loading flights...</p>
          ) : flights.length === 0 ? (
            <p className="text-gray-500">No discovery flights found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Flight Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {flights.map((flight) => (
                    <tr key={flight.id}>
                      <td className="px-4 py-3 text-sm">
                        {flight.firstName} {flight.lastName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{flight.email}</td>
                      <td className="px-4 py-3 text-sm">
                        <Badge
                          className={
                            flight.status === 'CONVERTED'
                              ? 'bg-green-100 text-green-800'
                              : flight.status === 'COMPLETED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {flight.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(flight.flight.scheduledStart).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          {flight.status === 'COMPLETED' && !flight.surveySent && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedFlight(flight);
                                setShowSurveyModal(true);
                              }}
                            >
                              Send Survey
                            </Button>
                          )}
                          {flight.status === 'COMPLETED' && !flight.convertedToStudentId && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => {
                                setSelectedFlight(flight);
                                setShowConvertModal(true);
                              }}
                            >
                              Convert to Student
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Survey Modal */}
      {showSurveyModal && selectedFlight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="text-lg font-semibold mb-4">Send Post-Flight Survey</h3>
            <p className="text-sm text-gray-600 mb-4">
              Send a survey to {selectedFlight.firstName} {selectedFlight.lastName} ({selectedFlight.email})?
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSurveyModal(false);
                  setSelectedFlight(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleSendSurvey(selectedFlight.id)}
                disabled={submitting}
              >
                {submitting ? 'Sending...' : 'Send Survey'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Convert Modal */}
      {showConvertModal && selectedFlight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="text-lg font-semibold mb-4">Convert to Student Account</h3>
            <p className="text-sm text-gray-600 mb-4">
              Convert {selectedFlight.firstName} {selectedFlight.lastName} to a full student account?
              They will need to create a Firebase account first.
            </p>
            <div className="mb-4">
              <Label htmlFor="firebaseUid">Firebase UID (optional - can be set later)</Label>
              <input
                id="firebaseUid"
                type="text"
                className="w-full mt-1 px-3 py-2 border rounded-md"
                placeholder="Leave empty if not yet created"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowConvertModal(false);
                  setSelectedFlight(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const input = document.getElementById('firebaseUid') as HTMLInputElement;
                  handleConvert(selectedFlight.id, input.value || '');
                }}
                disabled={submitting}
              >
                {submitting ? 'Converting...' : 'Convert'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

