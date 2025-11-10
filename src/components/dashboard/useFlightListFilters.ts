'use client';

import { useState, useEffect, useMemo } from 'react';
import { Flight } from './FlightListTypes';

interface UseFlightListFiltersProps {
  flights: Flight[];
}

export function useFlightListFilters({ flights }: UseFlightListFiltersProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [aircraftFilter, setAircraftFilter] = useState<string>('all');
  const [instructorFilter, setInstructorFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'aircraft'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filteredFlights, setFilteredFlights] = useState<Flight[]>([]);

  // Get unique values for filters
  const uniqueAircraft = useMemo(() => 
    [...new Set(flights.map((f) => f.aircraft.tailNumber))],
    [flights]
  );
  
  const uniqueInstructors = useMemo(() => 
    [...new Set(
      flights
        .filter((f) => f.instructor)
        .map((f) => `${f.instructor!.firstName} ${f.instructor!.lastName}`)
    )],
    [flights]
  );
  
  const uniqueStatuses = useMemo(() => 
    [...new Set(flights.map((f) => f.status))],
    [flights]
  );

  useEffect(() => {
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
      
      // By default ('all'), only show upcoming flights (not past flights)
      // This is appropriate for the "Upcoming Flights" section
      if (dateRange === 'all') {
        filtered = filtered.filter((f) => new Date(f.scheduledStart) >= now);
      } else if (dateRange === 'today') {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        filtered = filtered.filter((f) => {
          const flightDate = new Date(f.scheduledStart);
          return flightDate >= today && flightDate < tomorrow;
        });
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

    applyFilters();
  }, [flights, statusFilter, aircraftFilter, instructorFilter, dateRange, sortBy, sortOrder]);

  return {
    statusFilter,
    setStatusFilter,
    aircraftFilter,
    setAircraftFilter,
    instructorFilter,
    setInstructorFilter,
    dateRange,
    setDateRange,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    filteredFlights,
    uniqueAircraft,
    uniqueInstructors,
    uniqueStatuses,
  };
}

