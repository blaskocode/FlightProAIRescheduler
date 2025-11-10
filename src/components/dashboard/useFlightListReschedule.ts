'use client';

import { useState, useCallback, useEffect } from 'react';
import { User } from 'firebase/auth';
import { AuthUser } from '@/lib/auth';

interface UseFlightListRescheduleProps {
  user: User | null;
  authUser: AuthUser | null;
  authLoading: boolean;
  fetchFlights: () => Promise<void>;
}

export function useFlightListReschedule({
  user,
  authUser,
  authLoading,
  fetchFlights,
}: UseFlightListRescheduleProps) {
  // Reschedule state
  const [weatherAlerts, setWeatherAlerts] = useState<Set<string>>(new Set());
  const [pendingReschedules, setPendingReschedules] = useState<Set<string>>(new Set());
  const [pendingReschedulesLoaded, setPendingReschedulesLoaded] = useState(false);
  const [pendingRescheduleRequests, setPendingRescheduleRequests] = useState<Map<string, any>>(new Map());
  const [rescheduleDetails, setRescheduleDetails] = useState<Map<string, any>>(new Map());
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
  const [rescheduleRequestId, setRescheduleRequestId] = useState<string | null>(null);
  const [rescheduleSuggestions, setRescheduleSuggestions] = useState<any[]>([]);
  const [rescheduleRequestStatuses, setRescheduleRequestStatuses] = useState<Map<string, 'PENDING_STUDENT' | 'PENDING_INSTRUCTOR' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'>>(new Map());
  const [rescheduleSelectedOptions, setRescheduleSelectedOptions] = useState<Map<string, number | null>>(new Map());
  const [requestingReschedule, setRequestingReschedule] = useState(false);
  const [confirmingReschedule, setConfirmingReschedule] = useState(false);

  const handleRequestReschedule = useCallback(async (flightId: string) => {
    if (!user) return;
    
    console.log(`[handleRequestReschedule] Starting for flight ${flightId}`);
    
    // CRITICAL: Set selectedFlightId FIRST, then clear status BEFORE opening modal
    setSelectedFlightId(flightId);
    
    // Explicitly clear status for this flight - ensures it's not read-only
    setRescheduleRequestStatuses(prev => {
      const newMap = new Map(prev);
      const hadStatus = newMap.has(flightId);
      newMap.delete(flightId);
      console.log(`[handleRequestReschedule] Cleared status for ${flightId}, hadStatus=${hadStatus}, newMap size=${newMap.size}`);
      return newMap;
    });
    setRescheduleSelectedOptions(prev => {
      const newMap = new Map(prev);
      newMap.delete(flightId);
      return newMap;
    });
    setRescheduleRequestId(null);
    setRescheduleSuggestions([]);
    setRequestingReschedule(true);
    // Open modal AFTER clearing status
    setRescheduleModalOpen(true);
    
    try {
      const token = await user.getIdToken();
      
      // Check for existing pending requests
      const [existingRequestResponse1, existingRequestResponse2] = await Promise.all([
        fetch(`/api/reschedule?flightId=${flightId}&status=PENDING_STUDENT`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`/api/reschedule?flightId=${flightId}&status=PENDING_INSTRUCTOR`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);
      
      let existingRequests: any[] = [];
      if (existingRequestResponse1.ok) {
        const requests1 = await existingRequestResponse1.json();
        existingRequests = existingRequests.concat(requests1);
      }
      if (existingRequestResponse2.ok) {
        const requests2 = await existingRequestResponse2.json();
        existingRequests = existingRequests.concat(requests2);
      }
      
      if (existingRequests.length > 0) {
        const existingRequest = existingRequests[0];
        setRescheduleRequestId(existingRequest.id);
        const suggestions = Array.isArray(existingRequest.suggestions)
          ? existingRequest.suggestions
          : JSON.parse(existingRequest.suggestions || '[]');
        setRescheduleSuggestions(suggestions);
        // Store status and selected option per flight ID (only if request exists)
        setRescheduleRequestStatuses(prev => new Map(prev).set(flightId, existingRequest.status));
        setRescheduleSelectedOptions(prev => new Map(prev).set(flightId, existingRequest.selectedOption ?? null));
        setRescheduleModalOpen(true);
        setRequestingReschedule(false);
        return;
      }
      
      // No existing request, create a new one
      const response = await fetch(`/api/flights/${flightId}/reschedule`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        
        if (response.status === 409 && errorData.rescheduleRequestId) {
          const existingRequestResponse = await fetch(`/api/reschedule?flightId=${flightId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          
          if (existingRequestResponse.ok) {
            const allRequests = await existingRequestResponse.json();
            const existingRequest = allRequests.find((r: any) => r.id === errorData.rescheduleRequestId) || allRequests[0];
            
            if (existingRequest) {
              setRescheduleRequestId(existingRequest.id);
              const suggestions = Array.isArray(existingRequest.suggestions)
                ? existingRequest.suggestions
                : JSON.parse(existingRequest.suggestions || '[]');
              setRescheduleSuggestions(suggestions);
              setRescheduleModalOpen(true);
              setRequestingReschedule(false);
              return;
            }
          }
        }
        
        throw new Error(errorData.error || 'Failed to request reschedule');
      }
      
      const data = await response.json();
      const suggestions = Array.isArray(data.suggestions) 
        ? data.suggestions 
        : JSON.parse(data.suggestions || '[]');
      
      setRescheduleSuggestions(suggestions);
      setRescheduleModalOpen(true);
    } catch (err: any) {
      console.error('Error requesting reschedule:', err);
      alert(err.message || 'Failed to request reschedule. Please try again.');
    } finally {
      setRequestingReschedule(false);
    }
  }, [user]);

  const handleAcceptReschedule = useCallback(async (optionIndex: number) => {
    if (!selectedFlightId || !user) {
      alert('Flight ID not found. Please try again.');
      return;
    }
    
    const flightIdToProcess = selectedFlightId;
    const suggestionsToProcess = rescheduleSuggestions;
    const requestIdToUse = rescheduleRequestId;
    
    // Immediately update state to hide button and close modal
    setPendingReschedules(prev => new Set(prev).add(flightIdToProcess));
    setRescheduleModalOpen(false);
    setSelectedFlightId(null);
    setRescheduleRequestId(null);
    setRescheduleSuggestions([]);
    
    try {
      const token = await user.getIdToken();
      
      let response;
      if (requestIdToUse) {
        response = await fetch(`/api/reschedule/${requestIdToUse}/accept`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            selectedOption: optionIndex,
            confirmedBy: 'student',
          }),
        });
      } else {
        response = await fetch(`/api/reschedule/accept`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            flightId: flightIdToProcess,
            selectedOption: optionIndex,
            suggestions: suggestionsToProcess,
            priorityFactors: {},
          }),
        });
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to accept reschedule');
      }
      
      const result = await response.json();
      await fetchFlights();
      
      // Refresh pending reschedules
      if (user) {
        try {
          const token = await user.getIdToken();
          const [reschedulesResponse1, reschedulesResponse2] = await Promise.all([
            fetch('/api/reschedule?status=PENDING_STUDENT', {
              headers: { 'Authorization': `Bearer ${token}` },
            }),
            fetch('/api/reschedule?status=PENDING_INSTRUCTOR', {
              headers: { 'Authorization': `Bearer ${token}` },
            }),
          ]);
          
          const allPendingReschedules: any[] = [];
          if (reschedulesResponse1.ok) {
            allPendingReschedules.push(...await reschedulesResponse1.json());
          }
          if (reschedulesResponse2.ok) {
            allPendingReschedules.push(...await reschedulesResponse2.json());
          }
          
          const flightIdsWithPendingReschedules = new Set(
            allPendingReschedules.map((req: any) => req.flightId)
          );
          setPendingReschedules(flightIdsWithPendingReschedules);
          setPendingReschedulesLoaded(true);
        } catch (error) {
          console.error('Error refreshing pending reschedules:', error);
        }
      }
      
      alert(result.message || 'Reschedule request submitted! Waiting for instructor confirmation.');
    } catch (err: any) {
      console.error('Error accepting reschedule:', err);
      setPendingReschedules(prev => {
        const newSet = new Set(prev);
        newSet.delete(flightIdToProcess);
        return newSet;
      });
      setRescheduleModalOpen(true);
      setSelectedFlightId(flightIdToProcess);
      setRescheduleSuggestions(suggestionsToProcess);
      alert(err.message || 'Failed to accept reschedule. Please try again.');
    }
  }, [user, selectedFlightId, rescheduleSuggestions, rescheduleRequestId, fetchFlights]);

  const handleRejectReschedule = useCallback(() => {
    setRescheduleModalOpen(false);
    setSelectedFlightId(null);
    setRescheduleRequestId(null);
    setRescheduleSuggestions([]);
  }, []);

  const handleConfirmReschedule = useCallback(async (flightId: string) => {
    if (!user || !authUser || authUser.role !== 'instructor') return;
    
    const rescheduleRequest = pendingRescheduleRequests.get(flightId);
    if (!rescheduleRequest) {
      alert('Reschedule request not found');
      return;
    }

    setConfirmingReschedule(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/reschedule/${rescheduleRequest.id}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          confirmedBy: 'instructor',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to confirm reschedule');
      }

      await fetchFlights();
      
      setPendingRescheduleRequests(prev => {
        const next = new Map(prev);
        next.delete(flightId);
        return next;
      });
      setPendingReschedules(prev => {
        const next = new Set(prev);
        next.delete(flightId);
        return next;
      });

      alert('Reschedule confirmed! A new flight has been created.');
    } catch (err: any) {
      console.error('Error confirming reschedule:', err);
      alert(`Error confirming reschedule: ${err.message}`);
    } finally {
      setConfirmingReschedule(false);
    }
  }, [user, authUser, pendingRescheduleRequests, fetchFlights]);

  // Fetch weather alerts and pending reschedule requests
  const fetchAlertsAndReschedules = useCallback(async () => {
      if (!user || !authUser || authLoading) {
        setPendingReschedulesLoaded(false);
        return;
      }
      
      try {
        const token = await user.getIdToken();
        
        // Fetch weather alerts
        const alertsResponse = await fetch('/api/weather/alerts');
        if (alertsResponse.ok) {
          const alerts = await alertsResponse.json();
          const flightIdsWithAlerts = new Set(alerts.map((alert: any) => alert.flightId));
          console.log('[useFlightListReschedule] Weather alerts fetched:', alerts.length);
          console.log('[useFlightListReschedule] Flight IDs with alerts:', Array.from(flightIdsWithAlerts));
          setWeatherAlerts(flightIdsWithAlerts);
        }
        
        // Fetch pending reschedule requests
        const [reschedulesResponse1, reschedulesResponse2] = await Promise.all([
          fetch('/api/reschedule?status=PENDING_STUDENT', {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
          fetch('/api/reschedule?status=PENDING_INSTRUCTOR', {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
        ]);
        
        const allPendingReschedules: any[] = [];
        if (reschedulesResponse1.ok) {
          allPendingReschedules.push(...await reschedulesResponse1.json());
        }
        if (reschedulesResponse2.ok) {
          allPendingReschedules.push(...await reschedulesResponse2.json());
        }
        
        const flightIdsWithPendingReschedules = new Set(
          allPendingReschedules.map((req: any) => req.flightId)
        );
        setPendingReschedules(flightIdsWithPendingReschedules);
        
        console.log(`[useFlightListReschedule] Fetched ${allPendingReschedules.length} pending reschedule requests`);
        
        // Store request statuses and selected options per flight ID
        const statusesMap = new Map<string, 'PENDING_STUDENT' | 'PENDING_INSTRUCTOR' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'>();
        const selectedOptionsMap = new Map<string, number | null>();
        
        for (const req of allPendingReschedules) {
          statusesMap.set(req.flightId, req.status);
          selectedOptionsMap.set(req.flightId, req.selectedOption ?? null);
        }
        
        setRescheduleRequestStatuses(statusesMap);
        setRescheduleSelectedOptions(selectedOptionsMap);
        console.log(`[useFlightListReschedule] Populated statuses:`, Array.from(statusesMap.entries()).map(([id, status]) => ({ flightId: id, status })));
        
        // Store reschedule details
        const detailsMap = new Map<string, any>();
        const aircraftIdsToFetch = new Set<string>();
        
        for (const req of allPendingReschedules) {
          if (req.selectedOption !== null && req.selectedOption !== undefined) {
            const suggestions = Array.isArray(req.suggestions)
              ? req.suggestions
              : JSON.parse(req.suggestions || '[]');
            const selectedOption = suggestions[req.selectedOption];
            if (selectedOption) {
              detailsMap.set(req.flightId, {
                selectedOption: req.selectedOption,
                newAircraftId: selectedOption.aircraftId,
                newInstructorId: selectedOption.instructorId,
                newSlot: selectedOption.slot,
              });
              if (selectedOption.aircraftId) {
                aircraftIdsToFetch.add(selectedOption.aircraftId);
              }
            }
          }
        }
        
        // Fetch aircraft details
        if (aircraftIdsToFetch.size > 0) {
          try {
            const aircraftResponse = await fetch('/api/aircraft', {
              headers: { 'Authorization': `Bearer ${token}` },
            });
            if (aircraftResponse.ok) {
              const allAircraft = await aircraftResponse.json();
              const aircraftMap = new Map(allAircraft.map((ac: any) => [ac.id, ac]));
              
              for (const [flightId, detail] of detailsMap.entries()) {
                const aircraft = aircraftMap.get(detail.newAircraftId);
                if (aircraft) {
                  detailsMap.set(flightId, {
                    ...detail,
                    newAircraftTailNumber: aircraft.tailNumber,
                  });
                }
              }
            }
          } catch (error) {
            console.error('Error fetching aircraft details:', error);
          }
        }
        
        setRescheduleDetails(detailsMap);
        
        // Store ALL pending reschedule requests (for both students and instructors)
        const requestsMap = new Map<string, any>();
        allPendingReschedules.forEach((req: any) => {
          requestsMap.set(req.flightId, req);
        });
        setPendingRescheduleRequests(requestsMap);
        console.log(`[useFlightListReschedule] Populated pendingRescheduleRequests:`, Array.from(requestsMap.entries()).map(([id, req]) => ({ flightId: id, requestId: req.id, status: req.status })));
        
        setPendingReschedulesLoaded(true);
      } catch (error) {
        console.error('Error fetching alerts and reschedules:', error);
        setPendingReschedulesLoaded(true);
      }
  }, [user, authUser, authLoading]);
  
  // Initial fetch and polling for instructors
  useEffect(() => {
    fetchAlertsAndReschedules();
    
    // For instructors, poll every 10 seconds to check for new reschedule requests
    // This ensures they see new requests quickly without manual refresh
    if (authUser?.role === 'instructor') {
      console.log('[useFlightListReschedule] Starting polling for instructor (every 10s)');
      const intervalId = setInterval(() => {
        console.log('[useFlightListReschedule] Polling for new reschedule requests');
        fetchAlertsAndReschedules();
      }, 10000); // Poll every 10 seconds
      
      return () => {
        console.log('[useFlightListReschedule] Stopping polling for instructor');
        clearInterval(intervalId);
      };
    }
  }, [fetchAlertsAndReschedules, authUser?.role]);

  // Get status and selected option for the currently selected flight
  // If no entry exists in the Map, explicitly return undefined (not read-only)
  const rescheduleRequestStatus = selectedFlightId && rescheduleRequestStatuses.has(selectedFlightId) 
    ? rescheduleRequestStatuses.get(selectedFlightId) 
    : undefined;
  const rescheduleSelectedOption = selectedFlightId && rescheduleSelectedOptions.has(selectedFlightId)
    ? rescheduleSelectedOptions.get(selectedFlightId) ?? null
    : null;
  
  // Debug logging
  useEffect(() => {
    if (selectedFlightId) {
      console.log(`[useFlightListReschedule] Flight ${selectedFlightId}: status=${rescheduleRequestStatus}, hasStatus=${rescheduleRequestStatuses.has(selectedFlightId)}, allStatuses=`, Array.from(rescheduleRequestStatuses.entries()));
    }
  }, [selectedFlightId, rescheduleRequestStatus, rescheduleRequestStatuses]);

  // Expose setters for storing status per flight
  const setRescheduleRequestStatusForFlight = useCallback((flightId: string, status: 'PENDING_STUDENT' | 'PENDING_INSTRUCTOR' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | undefined) => {
    if (status) {
      setRescheduleRequestStatuses(prev => new Map(prev).set(flightId, status));
    } else {
      setRescheduleRequestStatuses(prev => {
        const newMap = new Map(prev);
        newMap.delete(flightId);
        return newMap;
      });
    }
  }, []);

  const setRescheduleSelectedOptionForFlight = useCallback((flightId: string, option: number | null) => {
    setRescheduleSelectedOptions(prev => new Map(prev).set(flightId, option));
  }, []);

  return {
    weatherAlerts,
    pendingReschedules,
    pendingReschedulesLoaded,
    pendingRescheduleRequests,
    rescheduleDetails,
    rescheduleModalOpen,
    selectedFlightId,
    rescheduleRequestId,
    rescheduleSuggestions,
    rescheduleRequestStatus,
    rescheduleSelectedOption,
    requestingReschedule,
    confirmingReschedule,
    setRescheduleModalOpen,
    setSelectedFlightId,
    setRescheduleRequestId,
    setRescheduleSuggestions,
    setRescheduleRequestStatusForFlight,
    setRescheduleSelectedOptionForFlight,
    handleRequestReschedule,
    handleAcceptReschedule,
    handleRejectReschedule,
    handleConfirmReschedule,
  };
}

