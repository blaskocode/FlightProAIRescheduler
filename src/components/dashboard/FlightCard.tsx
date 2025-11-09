'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RouteVisualization } from '@/components/flights/RouteVisualization';
import { Flight } from './FlightListTypes';
import { AuthUser } from '@/lib/auth';
import { User } from 'firebase/auth';

interface FlightCardProps {
  flight: Flight;
  authUser: AuthUser | null;
  user: User | null;
  weatherAlerts: Set<string>;
  pendingReschedules: Set<string>;
  pendingReschedulesLoaded: boolean;
  pendingRescheduleRequests: Map<string, any>;
  rescheduleDetails: Map<string, any>;
  requestingReschedule: boolean;
  confirmingReschedule: boolean;
  selectedFlightId: string | null;
  onRequestReschedule: (flightId: string) => void;
  onConfirmReschedule: (flightId: string) => void;
  onViewRescheduleOptions: (flightId: string) => void;
  onOverrideWeather?: (flightId: string) => void;
  setRescheduleRequestId: (id: string | null) => void;
  setRescheduleSuggestions: (suggestions: any[]) => void;
  setSelectedFlightId: (id: string | null) => void;
  setRescheduleModalOpen: (open: boolean) => void;
}

export function FlightCard({
  flight,
  authUser,
  user,
  weatherAlerts,
  pendingReschedules,
  pendingReschedulesLoaded,
  pendingRescheduleRequests,
  rescheduleDetails,
  requestingReschedule,
  confirmingReschedule,
  selectedFlightId,
  onRequestReschedule,
  onConfirmReschedule,
  onViewRescheduleOptions,
  onOverrideWeather,
  setRescheduleRequestId,
  setRescheduleSuggestions,
  setSelectedFlightId,
  setRescheduleModalOpen,
}: FlightCardProps) {
  const [showRoute, setShowRoute] = useState(false);
  const hasRoute = flight.route || (flight.departureAirport && flight.destinationAirport);

  const getStatusBadgeClass = (status: string) => {
    if (status === 'CONFIRMED') return 'bg-green-100 text-green-800';
    if (status === 'PENDING') return 'bg-blue-100 text-blue-800';
    if (status === 'RESCHEDULE_PENDING') return 'bg-yellow-100 text-yellow-800';
    if (status === 'RESCHEDULE_CONFIRMED') return 'bg-purple-100 text-purple-800';
    if (status === 'IN_PROGRESS') return 'bg-indigo-100 text-indigo-800';
    if (status === 'COMPLETED') return 'bg-gray-100 text-gray-800';
    if (['WEATHER_CANCELLED', 'MAINTENANCE_CANCELLED', 'STUDENT_CANCELLED', 'INSTRUCTOR_CANCELLED'].includes(status)) {
      return 'bg-red-100 text-red-800';
    }
    if (status === 'RESCHEDULED') return 'bg-gray-200 text-gray-700';
    return 'bg-gray-100 text-gray-800';
  };

  const renderRescheduleButton = () => {
    // Show reschedule options for students
    if (authUser?.role === 'student') {
      const hasAlert = weatherAlerts.has(flight.id);
      const hasPending = pendingReschedules.has(flight.id);
      
      // Show "View Reschedule Options" for cancelled flights with pending reschedule requests
      if (flight.status === 'MAINTENANCE_CANCELLED' && hasPending && pendingReschedulesLoaded) {
        return (
          <Button
            onClick={() => onViewRescheduleOptions(flight.id)}
            size="sm"
            variant="default"
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
          >
            View Reschedule Options
          </Button>
        );
      }
      
      // Show "Request Reschedule" button for flights with weather alerts
      const shouldShow = pendingReschedulesLoaded && hasAlert && !hasPending;
      return shouldShow ? (
        <Button
          onClick={() => onRequestReschedule(flight.id)}
          disabled={requestingReschedule}
          size="sm"
          variant="destructive"
          className="text-xs w-full sm:w-auto"
        >
          {requestingReschedule && selectedFlightId === flight.id
            ? 'Requesting...'
            : 'Request Reschedule'}
        </Button>
      ) : null;
    }
    
    // Show "Confirm Reschedule" button for instructors
    if (authUser?.role === 'instructor' && 
        flight.status === 'RESCHEDULE_PENDING' &&
        flight.instructor?.id === authUser.instructorId) {
      const rescheduleRequest = pendingRescheduleRequests.get(flight.id);
      if (rescheduleRequest) {
        return (
          <Button
            onClick={() => onConfirmReschedule(flight.id)}
            disabled={confirmingReschedule}
            size="sm"
            variant="default"
            className="text-xs bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
          >
            {confirmingReschedule ? 'Confirming...' : 'Confirm Reschedule'}
          </Button>
        );
      }
    }
    
    return null;
  };

  const renderWeatherOverrideButton = () => {
    // Show weather override button for instructors/admins on flights with weather issues
    if (!onOverrideWeather) return null;
    
    const hasWeatherIssue = flight.status === 'WEATHER_CANCELLED' || 
                           weatherAlerts.has(flight.id);
    
    // Only show for instructors/admins
    if ((authUser?.role === 'instructor' || authUser?.role === 'admin' || authUser?.role === 'super_admin') &&
        hasWeatherIssue &&
        !flight.weatherOverride) {
      // For instructors, only show if they're assigned to the flight
      if (authUser.role === 'instructor' && flight.instructor?.id !== authUser.instructorId) {
        return null;
      }
      
      return (
        <Button
          onClick={() => onOverrideWeather(flight.id)}
          size="sm"
          variant="outline"
          className="text-xs border-yellow-500 text-yellow-700 hover:bg-yellow-50 w-full sm:w-auto"
        >
          Override Weather
        </Button>
      );
    }
    
    return null;
  };

  const rescheduleDetail = rescheduleDetails.get(flight.id);
  const showRescheduledAircraft = rescheduleDetail && 
    rescheduleDetail.newAircraftTailNumber && 
    (flight.status === 'RESCHEDULE_PENDING' || flight.status === 'MAINTENANCE_CANCELLED');

  return (
    <div className="rounded-lg border bg-white p-3 sm:p-4 shadow-sm hover:shadow-md active:shadow-lg transition-shadow touch-manipulation w-full">
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base sm:text-lg break-words">
            {new Date(flight.scheduledStart).toLocaleString()}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">
            {flight.lessonTitle || 'Flight Lesson'}
          </p>
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2 text-xs sm:text-sm text-gray-500">
            <span className="break-words">
              {flight.student.firstName} {flight.student.lastName}
            </span>
            {flight.instructor && (
              <span className="break-words">
                • {flight.instructor.firstName} {flight.instructor.lastName}
              </span>
            )}
            {showRescheduledAircraft ? (
              <span className="break-words">
                • {flight.aircraft.tailNumber} → {rescheduleDetail.newAircraftTailNumber}
              </span>
            ) : (
              <span className="break-words">• {flight.aircraft.tailNumber}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
          <div className="flex flex-col gap-1">
            <span
              className={`rounded-full px-2 sm:px-3 py-1 text-xs font-medium self-start ${getStatusBadgeClass(flight.status)}`}
            >
              {flight.status}
            </span>
            {flight.weatherOverride && (
              <span className="text-xs text-yellow-600 font-medium">
                ⚠️ Weather Overridden
              </span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {renderRescheduleButton()}
            {renderWeatherOverrideButton()}
            {hasRoute && (
              <Button
                onClick={() => setShowRoute(!showRoute)}
                size="sm"
                variant="outline"
                className="text-xs w-full sm:w-auto"
              >
                {showRoute ? 'Hide Route' : 'Show Route'}
              </Button>
            )}
          </div>
        </div>
        {showRoute && hasRoute && (
          <div className="mt-4 border-t pt-4">
            <RouteVisualization
              route={flight.route || undefined}
              flightId={flight.id}
              height="300px"
              showDetails={true}
              compact={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}

