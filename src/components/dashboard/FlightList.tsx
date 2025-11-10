'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { RescheduleModal } from '@/components/flights/RescheduleModal';
import { WeatherOverrideModal } from '@/components/flights/WeatherOverrideModal';
import { PullToRefresh } from '@/components/mobile/PullToRefresh';
import { Flight } from './FlightListTypes';
import { FlightSkeleton, ErrorDisplay, EmptyState } from './FlightListComponents';
import { useFlightListReschedule } from './useFlightListReschedule';
import { useFlightListFilters } from './useFlightListFilters';
import { FlightCard } from './FlightCard';

interface FlightListProps {
  onFlightBooked?: () => void;
}

export function FlightList({ onFlightBooked }: FlightListProps = {}) {
  const { user, authUser, loading: authLoading } = useAuth();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [creatingTestFlights, setCreatingTestFlights] = useState(false);
  
  // Weather override state
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideFlightId, setOverrideFlightId] = useState<string | null>(null);
  const [overrideFlightDate, setOverrideFlightDate] = useState<string>('');
  const [overriding, setOverriding] = useState(false);

  const fetchFlights = useCallback(async () => {
    if (!user) {
      setError(new Error('Please log in to view flights'));
      setLoading(false);
      return;
    }

    if (!authUser) {
      if (authLoading) {
        return;
      }
      setError(new Error('User account not fully set up. Please try refreshing the page.'));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const token = await user.getIdToken();
      
      const response = await fetch('/api/flights', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API Error:', response.status, errorData);
        if (response.status === 401) {
          throw new Error('Please log in to view flights');
        }
        if (response.status === 403) {
          throw new Error('You do not have permission to view flights');
        }
        throw new Error(errorData.error || 'Failed to fetch flights');
      }
      const data = await response.json();
      console.log('Fetched flights:', data.length, 'flights');
      setFlights(data);
    } catch (err: any) {
      setError(err);
      console.error('Error fetching flights:', err);
    } finally {
      setLoading(false);
    }
  }, [user, authUser, authLoading]);

  useEffect(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }

    if (user && authUser && !authLoading) {
      setError(null);
      fetchFlights();
    } else if (!authLoading && user && !authUser) {
      setError(null);
      setLoading(true);
      
      syncTimeoutRef.current = setTimeout(() => {
        setError(new Error('User account not fully set up. Please try refreshing the page.'));
        setLoading(false);
        syncTimeoutRef.current = null;
      }, 3000);
    } else if (authLoading || (user && !authUser)) {
      setError(null);
      setLoading(true);
    }

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
    };
  }, [user, authUser, authLoading, fetchFlights]);

  const createTestFlights = useCallback(async () => {
    if (!user) return;
    
    try {
      setCreatingTestFlights(true);
      const token = await user.getIdToken();
      
      const response = await fetch('/api/flights/create-test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to create test flights');
      }
      
      const data = await response.json();
      console.log('Created test flights:', data);
      await fetchFlights();
    } catch (err: any) {
      setError(err);
      console.error('Error creating test flights:', err);
    } finally {
      setCreatingTestFlights(false);
    }
  }, [user, fetchFlights]);

  // Use reschedule hook
  const reschedule = useFlightListReschedule({
    user,
    authUser,
    authLoading,
    fetchFlights,
  });

  // Use filters hook
  const filters = useFlightListFilters({ flights });

  const handleViewRescheduleOptions = useCallback(async (flightId: string) => {
    if (!user) return;
    
    console.log(`[handleViewRescheduleOptions] Starting for flight ${flightId}`);
    
    try {
      const token = await user.getIdToken();
      // Check for both PENDING_STUDENT and PENDING_INSTRUCTOR statuses
      const [response1, response2] = await Promise.all([
        fetch(`/api/reschedule?flightId=${flightId}&status=PENDING_STUDENT`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
        fetch(`/api/reschedule?flightId=${flightId}&status=PENDING_INSTRUCTOR`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
      ]);
      
      let request = null;
      if (response1.ok) {
        const requests = await response1.json();
        if (requests.length > 0) {
          request = requests[0];
        }
      }
      if (!request && response2.ok) {
        const requests = await response2.json();
        if (requests.length > 0) {
          request = requests[0];
        }
      }
      
      console.log(`[handleViewRescheduleOptions] Found request for ${flightId}:`, request ? { id: request.id, status: request.status } : 'none');
      
      // IMPORTANT: Always set selectedFlightId FIRST, then clear status, then check for request
      reschedule.setSelectedFlightId(flightId);
      
      if (request) {
        // If request is PENDING_INSTRUCTOR, check if user wants to create a new one
        // For students, if they click "View Reschedule Options" on a flight with PENDING_INSTRUCTOR,
        // they might want to create a NEW request (maybe the old one is stale or they want different options)
        // So we'll show the existing request as read-only, but also allow them to create a new one
        if (request.status === 'PENDING_INSTRUCTOR' && authUser?.role === 'student') {
          console.log(`[handleViewRescheduleOptions] Found PENDING_INSTRUCTOR request for ${flightId}, but allowing new request creation`);
          // Clear status and create a new request instead
          reschedule.setRescheduleRequestStatusForFlight(flightId, undefined);
          reschedule.setRescheduleSelectedOptionForFlight(flightId, null);
          reschedule.handleRequestReschedule(flightId);
          return;
        }
        
        const suggestions = Array.isArray(request.suggestions)
          ? request.suggestions
          : JSON.parse(request.suggestions || '[]');
        reschedule.setRescheduleRequestId(request.id);
        reschedule.setRescheduleSuggestions(suggestions);
        // Store request status and selected option per flight ID
        reschedule.setRescheduleRequestStatusForFlight(flightId, request.status);
        reschedule.setRescheduleSelectedOptionForFlight(flightId, request.selectedOption ?? null);
        console.log(`[handleViewRescheduleOptions] Set status ${request.status} for ${flightId}`);
        reschedule.setRescheduleModalOpen(true);
      } else {
        // No request found - this means we should allow creating a new request
        // But if hasPending is true, it means the flight is in the pendingReschedules Set
        // which might be from a different request or stale data
        // Clear status and redirect to handleRequestReschedule
        console.log(`[handleViewRescheduleOptions] No request found for ${flightId}, clearing status and calling handleRequestReschedule`);
        reschedule.setRescheduleRequestStatusForFlight(flightId, undefined);
        reschedule.setRescheduleSelectedOptionForFlight(flightId, null);
        // Call handleRequestReschedule to create a new request
        reschedule.handleRequestReschedule(flightId);
      }
    } catch (err) {
      console.error('Error fetching reschedule request:', err);
    }
  }, [user, authUser, reschedule]);

  const handleOverrideWeather = useCallback((flightId: string) => {
    const flight = flights.find(f => f.id === flightId);
    if (flight) {
      setOverrideFlightId(flightId);
      setOverrideFlightDate(flight.scheduledStart);
      setOverrideModalOpen(true);
    }
  }, [flights]);

  const handleSubmitOverride = useCallback(async (reason: string) => {
    if (!user || !overrideFlightId) return;
    
    try {
      setOverriding(true);
      const token = await user.getIdToken();
      
      const response = await fetch(`/api/flights/${overrideFlightId}/override`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ overrideReason: reason }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to override weather decision');
      }
      
      // Refresh flights to show updated status
      await fetchFlights();
      
      // Close modal
      setOverrideModalOpen(false);
      setOverrideFlightId(null);
      setOverrideFlightDate('');
    } catch (err: any) {
      console.error('Error overriding weather:', err);
      throw err;
    } finally {
      setOverriding(false);
    }
  }, [user, overrideFlightId, fetchFlights]);

  const handleRefresh = useCallback(async () => {
    await fetchFlights();
    // Note: Weather alerts and pending reschedules are automatically refreshed
    // by the useEffect in useFlightListReschedule hook
  }, [fetchFlights]);

  if (error) {
    return <ErrorDisplay error={error} onRetry={fetchFlights} />;
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <h2 className="text-xl sm:text-2xl font-bold">Upcoming Flights</h2>
          <Button onClick={fetchFlights} variant="outline" size="sm" className="w-full sm:w-auto">
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="space-y-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
                Status
              </Label>
              <Select value={filters.statusFilter} onValueChange={filters.setStatusFilter}>
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {filters.uniqueStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="aircraft-filter" className="text-sm font-medium text-gray-700">
                Aircraft
              </Label>
              <Select value={filters.aircraftFilter} onValueChange={filters.setAircraftFilter}>
                <SelectTrigger id="aircraft-filter">
                  <SelectValue placeholder="Aircraft" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Aircraft</SelectItem>
                  {filters.uniqueAircraft.map((tail) => (
                    <SelectItem key={tail} value={tail}>
                      {tail}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {authUser?.role === 'admin' && (
              <div className="space-y-1.5">
                <Label htmlFor="instructor-filter" className="text-sm font-medium text-gray-700">
                  Instructor
                </Label>
                <Select value={filters.instructorFilter} onValueChange={filters.setInstructorFilter}>
                  <SelectTrigger id="instructor-filter">
                    <SelectValue placeholder="Instructor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Instructors</SelectItem>
                    {filters.uniqueInstructors.map((instructor) => (
                      <SelectItem key={instructor} value={instructor}>
                        {instructor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="date-range-filter" className="text-sm font-medium text-gray-700">
                Date Range
              </Label>
              <Select value={filters.dateRange} onValueChange={(v: any) => filters.setDateRange(v)}>
                <SelectTrigger id="date-range-filter">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Next 7 Days</SelectItem>
                  <SelectItem value="month">Next 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sort-by-filter" className="text-sm font-medium text-gray-700">
                Sort By
              </Label>
              <Select value={filters.sortBy} onValueChange={(v: any) => filters.setSortBy(v)}>
                <SelectTrigger id="sort-by-filter">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="aircraft">Aircraft</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sort-order-button" className="text-sm font-medium text-gray-700">
                Order
              </Label>
              <Button
                id="sort-order-button"
                onClick={() => filters.setSortOrder(filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {filters.sortOrder === 'asc' ? '↑' : '↓'} {filters.sortOrder.toUpperCase()}
              </Button>
            </div>
          </div>
        </div>

      {/* Results */}
      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <FlightSkeleton key={i} />
          ))}
        </div>
      ) : filters.filteredFlights.length === 0 ? (
        <EmptyState 
          onCreateTestFlights={flights.length === 0 ? createTestFlights : undefined}
          creatingTestFlights={creatingTestFlights}
        />
      ) : (
        <div className="grid gap-4">
          {filters.filteredFlights.map((flight) => (
            <FlightCard
              key={flight.id}
              flight={flight}
              authUser={authUser}
              user={user}
              weatherAlerts={reschedule.weatherAlerts}
              pendingReschedules={reschedule.pendingReschedules}
              pendingReschedulesLoaded={reschedule.pendingReschedulesLoaded}
              pendingRescheduleRequests={reschedule.pendingRescheduleRequests}
              rescheduleDetails={reschedule.rescheduleDetails}
              requestingReschedule={reschedule.requestingReschedule}
              confirmingReschedule={reschedule.confirmingReschedule}
              selectedFlightId={reschedule.selectedFlightId}
              onRequestReschedule={reschedule.handleRequestReschedule}
              onConfirmReschedule={reschedule.handleConfirmReschedule}
              onViewRescheduleOptions={handleViewRescheduleOptions}
              onOverrideWeather={handleOverrideWeather}
              setRescheduleRequestId={reschedule.setRescheduleRequestId}
              setRescheduleSuggestions={reschedule.setRescheduleSuggestions}
              setSelectedFlightId={reschedule.setSelectedFlightId}
              setRescheduleModalOpen={reschedule.setRescheduleModalOpen}
            />
          ))}
        </div>
      )}
      
      {/* Reschedule Modal */}
      {/* Key prop forces remount when flightId changes, ensuring clean state */}
      {reschedule.rescheduleModalOpen && reschedule.selectedFlightId && (
        <RescheduleModal
          key={reschedule.selectedFlightId}
          flightId={reschedule.selectedFlightId}
          rescheduleRequestId={reschedule.rescheduleRequestId || undefined}
          suggestions={reschedule.rescheduleSuggestions}
          isSearching={reschedule.requestingReschedule}
          requestStatus={reschedule.rescheduleRequestStatus}
          selectedOption={reschedule.rescheduleSelectedOption}
          onAccept={reschedule.handleAcceptReschedule}
          onReject={reschedule.handleRejectReschedule}
          onClose={reschedule.handleRejectReschedule}
        />
      )}
      
      {/* Weather Override Modal */}
      {overrideModalOpen && overrideFlightId && (
        <WeatherOverrideModal
          flightId={overrideFlightId}
          flightDate={overrideFlightDate}
          isOpen={overrideModalOpen}
          onClose={() => {
            setOverrideModalOpen(false);
            setOverrideFlightId(null);
            setOverrideFlightDate('');
          }}
          onOverride={handleSubmitOverride}
          isSubmitting={overriding}
        />
      )}
      </div>
    </PullToRefresh>
  );
}
