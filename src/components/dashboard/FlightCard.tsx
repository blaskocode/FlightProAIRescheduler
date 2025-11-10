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
  const hasRoute = false; // Route info not available in current Flight type

  const getStatusBadgeClass = (status: string) => {
    // Treat RESCHEDULE_CONFIRMED as CONFIRMED (for backwards compatibility)
    const displayStatus = status === 'RESCHEDULE_CONFIRMED' ? 'CONFIRMED' : status;
    
    if (displayStatus === 'CONFIRMED') return 'bg-aviation-green-100 text-aviation-green-700 border border-aviation-green-200';
    if (displayStatus === 'PENDING') return 'bg-sky-100 text-sky-700 border border-sky-200';
    if (displayStatus === 'RESCHEDULE_PENDING') return 'bg-amber-100 text-amber-700 border border-amber-200';
    if (displayStatus === 'IN_PROGRESS') return 'bg-sky-200 text-sky-800 border border-sky-300';
    if (displayStatus === 'COMPLETED') return 'bg-cloud-200 text-cloud-800 border border-cloud-300';
    if (['WEATHER_CANCELLED', 'MAINTENANCE_CANCELLED', 'STUDENT_CANCELLED', 'INSTRUCTOR_CANCELLED'].includes(displayStatus)) {
      return 'bg-aviation-red-100 text-aviation-red-700 border border-aviation-red-200';
    }
    if (displayStatus === 'RESCHEDULED') return 'bg-cloud-200 text-cloud-700 border border-cloud-300';
    return 'bg-cloud-100 text-cloud-700 border border-cloud-200';
  };

  // Get display status (show CONFIRMED even if it was rescheduled)
  const getDisplayStatus = (status: string) => {
    return status === 'RESCHEDULE_CONFIRMED' ? 'CONFIRMED' : status;
  };

  const renderRescheduleButton = () => {
    // Show reschedule options for students
    if (authUser?.role === 'student') {
      const hasAlert = weatherAlerts.has(flight.id);
      
      // If flight status is RESCHEDULE_PENDING, show "View Reschedule Status"
      if (flight.status === 'RESCHEDULE_PENDING') {
        return (
          <Button
            onClick={() => {
              console.log(`[FlightCard] Clicked "View Reschedule Status" for flight ${flight.id} (RESCHEDULE_PENDING)`);
              onViewRescheduleOptions(flight.id);
            }}
            size="sm"
            variant="default"
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
          >
            View Reschedule Status
          </Button>
        );
      }
      
      // For cancelled flights, show "View Reschedule Options"
      if (['WEATHER_CANCELLED', 'MAINTENANCE_CANCELLED', 'STUDENT_CANCELLED', 'INSTRUCTOR_CANCELLED'].includes(flight.status)) {
        return (
          <Button
            onClick={() => {
              console.log(`[FlightCard] Clicked "View Reschedule Options" for cancelled flight ${flight.id}`);
              onViewRescheduleOptions(flight.id);
            }}
            size="sm"
            variant="default"
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
          >
            View Reschedule Options
          </Button>
        );
      }
      
      // For confirmed flights with weather alerts, show "Request Reschedule"
      if (hasAlert && pendingReschedulesLoaded) {
        return (
          <Button
            onClick={() => {
              console.log(`[FlightCard] Clicked "Request Reschedule" for flight ${flight.id}`);
              onRequestReschedule(flight.id);
            }}
            disabled={requestingReschedule}
            size="sm"
            variant="destructive"
            className="text-xs w-full sm:w-auto"
          >
            {requestingReschedule && selectedFlightId === flight.id
              ? 'Requesting...'
              : 'Request Reschedule'}
          </Button>
        );
      }
      
      return null;
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
    if ((authUser?.role === 'instructor' || authUser?.role === 'admin') &&
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
    <div className="card-elevated p-4 sm:p-5 touch-manipulation w-full group">
      <div className="flex flex-col gap-4 sm:gap-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1">
              <h3 className="font-bold text-lg sm:text-xl text-sky-900 break-words">
                {new Date(flight.scheduledStart).toLocaleString()}
              </h3>
              <p className="text-sm sm:text-base text-sky-600 mt-1 break-words font-medium">
                {flight.lessonTitle || 'Flight Lesson'}
              </p>
            </div>
            <span className="text-3xl opacity-20 group-hover:opacity-30 transition-opacity">✈️</span>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 mt-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 rounded-full">
              <span className="text-xs">👤</span>
              <span className="text-xs sm:text-sm text-sky-700 font-medium break-words">
                {flight.student.firstName} {flight.student.lastName}
              </span>
            </div>
            {flight.instructor && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 rounded-full">
                <span className="text-xs">👨‍✈️</span>
                <span className="text-xs sm:text-sm text-sky-700 font-medium break-words">
                  {flight.instructor.firstName} {flight.instructor.lastName}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 rounded-full">
              <span className="text-xs">🛩️</span>
              <span className="text-xs sm:text-sm text-sky-700 font-medium break-words">
                {showRescheduledAircraft 
                  ? `${flight.aircraft.tailNumber} → ${rescheduleDetail.newAircraftTailNumber}`
                  : flight.aircraft.tailNumber}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pt-3 border-t border-cloud-200">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <span
                className={`rounded-full px-3 py-1.5 text-xs font-semibold self-start ${getStatusBadgeClass(flight.status)}`}
              >
                {getDisplayStatus(flight.status).replace(/_/g, ' ')}
              </span>
              {(flight.rescheduledFromId || flight.status === 'RESCHEDULE_CONFIRMED') && (
                <span className="text-xs text-sky-600 font-medium flex items-center gap-1 self-start">
                  <span>🔄</span> Rescheduled
                </span>
              )}
              {weatherAlerts.has(flight.id) && (
                <span className="text-xs text-red-600 font-semibold flex items-center gap-1 self-start">
                  <span>🌩️</span> Weather Alert
                </span>
              )}
            </div>
            {flight.weatherOverride && (
              <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                <span>⚠️</span> Weather Overridden
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
                className="text-xs w-full sm:w-auto border-sky-300 text-sky-700 hover:bg-sky-50 hover:border-sky-400"
              >
                {showRoute ? '🗺️ Hide Route' : '🗺️ Show Route'}
              </Button>
            )}
          </div>
        </div>
        {showRoute && hasRoute && (
          <div className="mt-4 pt-4 border-t border-cloud-200">
            <RouteVisualization
              route={undefined}
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

