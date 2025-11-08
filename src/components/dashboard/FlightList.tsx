'use client';

import { useEffect, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface Flight {
  id: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: string;
  lessonTitle: string | null;
  student: {
    firstName: string;
    lastName: string;
  };
  instructor: {
    firstName: string;
    lastName: string;
  } | null;
  aircraft: {
    tailNumber: string;
  };
}

// Loading skeleton component
function FlightSkeleton() {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
        <div className="h-6 bg-gray-200 rounded-full w-20"></div>
      </div>
    </div>
  );
}

// Error boundary component
function ErrorDisplay({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Flights</h3>
      <p className="text-sm text-red-600 mb-4">{error.message}</p>
      <Button onClick={onRetry} variant="outline">
        Try Again
      </Button>
    </div>
  );
}

// Empty state component
function EmptyState({ onCreateTestFlights, creatingTestFlights }: { onCreateTestFlights?: () => void; creatingTestFlights?: boolean }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
      <div className="mx-auto w-24 h-24 bg-gray-200 rounded-full mb-4 flex items-center justify-center">
        <svg
          className="w-12 h-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Flights Found</h3>
      <p className="text-sm text-gray-600 mb-4">
        {onCreateTestFlights 
          ? "You don't have any flights scheduled. Create test flights to get started."
          : "Try adjusting your filters or check back later for new flights."}
      </p>
      {onCreateTestFlights && (
        <Button
          onClick={onCreateTestFlights}
          disabled={creatingTestFlights}
          className="mt-2"
        >
          {creatingTestFlights ? 'Creating Test Flights...' : 'Create Test Flights (5 flights)'}
        </Button>
      )}
    </div>
  );
}

export function FlightList() {
  const { user } = useAuth();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [filteredFlights, setFilteredFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [aircraftFilter, setAircraftFilter] = useState<string>('all');
  const [instructorFilter, setInstructorFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'aircraft'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [creatingTestFlights, setCreatingTestFlights] = useState(false);

  const fetchFlights = useCallback(async () => {
    if (!user) {
      setError(new Error('Please log in to view flights'));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Get Firebase auth token
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
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchFlights();
    }
  }, [user, fetchFlights]);

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
      
      // Refresh flights list
      await fetchFlights();
    } catch (err: any) {
      setError(err);
      console.error('Error creating test flights:', err);
    } finally {
      setCreatingTestFlights(false);
    }
  }, [user, fetchFlights]);

  useEffect(() => {
    applyFilters();
  }, [flights, statusFilter, aircraftFilter, instructorFilter, dateRange, sortBy, sortOrder]);

  function applyFilters() {
    let filtered = [...flights];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((f) => f.status === statusFilter);
    }

    // Aircraft filter
    if (aircraftFilter !== 'all') {
      filtered = filtered.filter((f) => f.aircraft.tailNumber === aircraftFilter);
    }

    // Instructor filter
    if (instructorFilter !== 'all') {
      filtered = filtered.filter(
        (f) => f.instructor && `${f.instructor.firstName} ${f.instructor.lastName}` === instructorFilter
      );
    }

    // Date range filter
    const now = new Date();
    if (dateRange === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      filtered = filtered.filter((f) => new Date(f.scheduledStart) >= today);
    } else if (dateRange === 'week') {
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(
        (f) => new Date(f.scheduledStart) >= now && new Date(f.scheduledStart) <= weekFromNow
      );
    } else if (dateRange === 'month') {
      const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(
        (f) => new Date(f.scheduledStart) >= now && new Date(f.scheduledStart) <= monthFromNow
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison =
          new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime();
      } else if (sortBy === 'status') {
        comparison = a.status.localeCompare(b.status);
      } else if (sortBy === 'aircraft') {
        comparison = a.aircraft.tailNumber.localeCompare(b.aircraft.tailNumber);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredFlights(filtered);
  }

  // Get unique values for filters
  const uniqueAircraft = [...new Set(flights.map((f) => f.aircraft.tailNumber))];
  const uniqueInstructors = [
    ...new Set(
      flights
        .filter((f) => f.instructor)
        .map((f) => `${f.instructor!.firstName} ${f.instructor!.lastName}`)
    ),
  ];
  const uniqueStatuses = [...new Set(flights.map((f) => f.status))];

  if (error) {
    return <ErrorDisplay error={error} onRetry={fetchFlights} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold">Upcoming Flights</h2>
        <Button onClick={fetchFlights} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {/* Filters - Mobile optimized */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {uniqueStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={aircraftFilter} onValueChange={setAircraftFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Aircraft" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Aircraft</SelectItem>
            {uniqueAircraft.map((tail) => (
              <SelectItem key={tail} value={tail}>
                {tail}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={instructorFilter} onValueChange={setInstructorFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Instructor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Instructors</SelectItem>
            {uniqueInstructors.map((instructor) => (
              <SelectItem key={instructor} value={instructor}>
                {instructor}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dates</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">Next 7 Days</SelectItem>
            <SelectItem value="month">Next 30 Days</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="status">Status</SelectItem>
            <SelectItem value="aircraft">Aircraft</SelectItem>
          </SelectContent>
        </Select>

        <Button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          variant="outline"
          size="sm"
        >
          {sortOrder === 'asc' ? '↑' : '↓'} {sortOrder.toUpperCase()}
        </Button>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <FlightSkeleton key={i} />
          ))}
        </div>
      ) : filteredFlights.length === 0 ? (
        <EmptyState 
          onCreateTestFlights={flights.length === 0 ? createTestFlights : undefined}
          creatingTestFlights={creatingTestFlights}
        />
      ) : (
        <div className="grid gap-4">
          {filteredFlights.map((flight) => (
            <div
              key={flight.id}
              className="rounded-lg border bg-white p-3 sm:p-4 shadow-sm hover:shadow-md active:shadow-lg transition-shadow touch-manipulation"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    {new Date(flight.scheduledStart).toLocaleString()}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {flight.lessonTitle || 'Flight Lesson'}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2 text-sm text-gray-500">
                    <span>
                      {flight.student.firstName} {flight.student.lastName}
                    </span>
                    {flight.instructor && (
                      <span>
                        • {flight.instructor.firstName} {flight.instructor.lastName}
                      </span>
                    )}
                    <span>• {flight.aircraft.tailNumber}</span>
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium self-start sm:self-center ${
                    flight.status === 'CONFIRMED'
                      ? 'bg-green-100 text-green-800'
                      : flight.status === 'SCHEDULED'
                      ? 'bg-blue-100 text-blue-800'
                      : flight.status === 'WEATHER_CANCELLED' || flight.status === 'MAINTENANCE_CANCELLED'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {flight.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
