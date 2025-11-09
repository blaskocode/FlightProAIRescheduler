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
  const [requestingReschedule, setRequestingReschedule] = useState(false);
  const [confirmingReschedule, setConfirmingReschedule] = useState(false);

  const handleRequestReschedule = useCallback(async (flightId: string) => {
    if (!user) return;
    
    setSelectedFlightId(flightId);
    setRescheduleModalOpen(true);
    setRescheduleSuggestions([]);
    setRequestingReschedule(true);
    
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
  useEffect(() => {
    async function fetchAlertsAndReschedules() {
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
        
        // Store pending reschedule requests for instructor confirmation
        if (authUser.role === 'instructor') {
          const instructorRequests = allPendingReschedules.filter(
            (req: any) => req.status === 'PENDING_INSTRUCTOR'
          );
          const requestsMap = new Map<string, any>();
          instructorRequests.forEach((req: any) => {
            requestsMap.set(req.flightId, req);
          });
          setPendingRescheduleRequests(requestsMap);
        }
        
        setPendingReschedulesLoaded(true);
      } catch (error) {
        console.error('Error fetching alerts and reschedules:', error);
        setPendingReschedulesLoaded(true);
      }
    }
    
    fetchAlertsAndReschedules();
  }, [user, authUser, authLoading]);

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
    requestingReschedule,
    confirmingReschedule,
    setRescheduleModalOpen,
    setSelectedFlightId,
    setRescheduleRequestId,
    setRescheduleSuggestions,
    handleRequestReschedule,
    handleAcceptReschedule,
    handleRejectReschedule,
    handleConfirmReschedule,
  };
}

