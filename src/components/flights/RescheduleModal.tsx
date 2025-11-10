'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/contexts/AuthContext';
import { RouteVisualization } from './RouteVisualization';

interface Suggestion {
  slot: string;
  instructorId: string;
  aircraftId: string;
  priority: number;
  reasoning: string;
  confidence: 'high' | 'medium' | 'low';
  weatherForecast: string;
}

interface CalendarConflict {
  start: string;
  end: string;
  summary: string;
}

interface RescheduleModalProps {
  flightId: string;
  rescheduleRequestId?: string;
  suggestions: Suggestion[];
  isSearching?: boolean;
  onAccept: (optionIndex: number) => void;
  onReject: () => void;
  onClose: () => void;
}

export function RescheduleModal({
  flightId,
  rescheduleRequestId,
  suggestions,
  isSearching = false,
  onAccept,
  onReject,
  onClose,
}: RescheduleModalProps) {
  const { user } = useAuth();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingCalendar, setCheckingCalendar] = useState(false);
  const [calendarConflicts, setCalendarConflicts] = useState<Map<number, CalendarConflict[]>>(new Map());
  const [checkCalendarEnabled, setCheckCalendarEnabled] = useState(true);
  const [showRoute, setShowRoute] = useState(false);

  // Reset loading state when modal is shown (in case it was reopened after error)
  useEffect(() => {
    setLoading(false);
  }, [flightId]);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Check calendar conflicts for all suggestions
  useEffect(() => {
    if (suggestions.length > 0 && checkCalendarEnabled) {
      checkCalendarConflicts();
    }
  }, [suggestions, checkCalendarEnabled]);

  const checkCalendarConflicts = async () => {
    setCheckingCalendar(true);
    const conflicts = new Map<number, CalendarConflict[]>();

    try {
      // Check conflicts for each suggestion
      await Promise.all(
        suggestions.map(async (suggestion, idx) => {
          const slotDate = new Date(suggestion.slot);
          const slotEnd = new Date(slotDate.getTime() + 2 * 60 * 60 * 1000); // 2 hour flight

          try {
            if (!user) return;
            const token = await user.getIdToken();
            if (!token) return;

            const response = await fetch('/api/calendar/conflicts', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                startDate: slotDate.toISOString(),
                endDate: slotEnd.toISOString(),
              }),
            });

            if (response.ok) {
              const data = await response.json();
              if (data.conflicts && data.conflicts.length > 0) {
                conflicts.set(idx, data.conflicts);
              }
            }
          } catch (err) {
            console.error(`Error checking calendar conflicts for option ${idx + 1}:`, err);
          }
        })
      );

      setCalendarConflicts(conflicts);
    } catch (err) {
      console.error('Error checking calendar conflicts:', err);
    } finally {
      setCheckingCalendar(false);
    }
  };

  const handleAccept = () => {
    if (selectedOption === null) return;
    setLoading(true);
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    // Call parent's onAccept handler which will handle the API call
    onAccept(selectedOption);
    
    // Safety: reset loading after 10 seconds if still loading (in case parent doesn't close modal)
    setTimeout(() => {
      setLoading(false);
    }, 10000);
  };

  const handleQuickAccept = () => {
    if (suggestions.length === 0) return;
    // Accept first suggestion (recommended)
    setSelectedOption(0);
    setLoading(true);
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 30, 50]);
    }
    onAccept(0);
    
    // Safety: reset loading after 10 seconds
    setTimeout(() => {
      setLoading(false);
    }, 10000);
  };

  // Detect mobile screen size
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Use portal to render modal at document root level
  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      style={{ zIndex: 9999 }}
    >
      <div 
        className={`w-full ${isMobile ? 'h-full max-h-full rounded-none' : 'max-w-2xl max-h-[90vh] rounded-lg'} bg-white ${isMobile ? 'p-4' : 'p-6'} shadow-2xl overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
        style={{ zIndex: 10000 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>Reschedule Options</h2>
          {!isMobile && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          )}
        </div>
        
        {isSearching ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-lg text-gray-600">Searching for availability...</p>
            <p className="text-sm text-gray-500 mt-2">Finding the best reschedule options for you</p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-600">No reschedule options available at this time.</p>
          </div>
        ) : (
          <>
            <div className={`${isMobile ? 'flex-col space-y-2' : 'flex items-center justify-between'} mb-4`}>
              <p className={`text-gray-600 ${isMobile ? 'text-sm' : ''}`}>
                Please select your preferred reschedule option:
              </p>
              <label className={`flex items-center gap-2 ${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
                <input
                  type="checkbox"
                  checked={checkCalendarEnabled}
                  onChange={(e) => setCheckCalendarEnabled(e.target.checked)}
                  className="rounded min-h-[20px] min-w-[20px]"
                />
                Check Calendar Conflicts
              </label>
            </div>

            {checkingCalendar && (
              <div className="mb-4 text-sm text-gray-500 flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                Checking calendar conflicts...
              </div>
            )}

            {/* Quick Accept Button (Mobile) */}
            {isMobile && suggestions.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={handleQuickAccept}
                  disabled={loading}
                  className="w-full min-h-[48px] bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>⚡</span>
                      <span>Quick Accept (Recommended Option)</span>
                    </>
                  )}
                </button>
              </div>
            )}

            <div className={`${isMobile ? 'space-y-3' : 'space-y-4'} mb-6`}>
          {suggestions.map((suggestion, idx) => {
            const conflicts = calendarConflicts.get(idx) || [];
            const hasConflict = conflicts.length > 0;

            return (
              <div
                key={idx}
                className={`rounded-lg border-2 ${isMobile ? 'p-3' : 'p-4'} cursor-pointer transition-colors min-h-[44px] ${
                  selectedOption === idx
                    ? hasConflict
                      ? 'border-red-600 bg-red-50'
                      : 'border-primary-600 bg-primary-50'
                    : hasConflict
                    ? 'border-red-300 bg-red-50 hover:border-red-400'
                    : 'border-gray-200 hover:border-primary-300'
                }`}
                onClick={() => {
                  setSelectedOption(idx);
                  // Haptic feedback on selection
                  if ('vibrate' in navigator) {
                    navigator.vibrate(30);
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <input
                        type="radio"
                        checked={selectedOption === idx}
                        onChange={() => setSelectedOption(idx)}
                        className="text-primary-600"
                      />
                      <h3 className="font-semibold">
                        Option {idx + 1} {idx === 0 && '(Recommended)'}
                      </h3>
                      {hasConflict && (
                        <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-800 font-medium">
                          ⚠️ Calendar Conflict
                        </span>
                      )}
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          suggestion.confidence === 'high'
                            ? 'bg-green-100 text-green-800'
                            : suggestion.confidence === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {suggestion.confidence} confidence
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-2">
                      {new Date(suggestion.slot).toLocaleString()}
                    </p>
                    {hasConflict && (
                      <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                        <p className="font-medium text-red-800 mb-1">Calendar Conflicts:</p>
                        <ul className="list-disc list-inside text-red-700 space-y-1">
                          {conflicts.map((conflict, cIdx) => (
                            <li key={cIdx}>
                              {conflict.summary} ({new Date(conflict.start).toLocaleTimeString()})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <p className="text-sm text-gray-600 mb-2">
                      {suggestion.reasoning}
                    </p>
                    <p className="text-xs text-gray-500">
                      Weather: {suggestion.weatherForecast}
                    </p>
                    {/* Show route visualization button if this is a cross-country flight */}
                    {flightId && (
                      <div className="mt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowRoute(!showRoute);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          {showRoute ? 'Hide Route' : 'View Route'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
            </div>

            {/* Route Visualization */}
            {showRoute && flightId && (
              <div className="mt-4 border-t pt-4">
                <RouteVisualization
                  flightId={flightId}
                  height="300px"
                  showDetails={true}
                  compact={true}
                />
              </div>
            )}

            <div className={`flex ${isMobile ? 'flex-col gap-2' : 'gap-3 justify-end'}`}>
              <button
                onClick={onReject}
                className={`${isMobile ? 'w-full min-h-[44px]' : 'px-4 py-2'} text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200`}
              >
                None of these work
              </button>
              <button
                onClick={handleAccept}
                disabled={selectedOption === null || loading}
                className={`${isMobile ? 'w-full min-h-[44px]' : 'px-4 py-2'} bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? 'Processing...' : 'Select Option'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // Render using portal if in browser, otherwise render normally
  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}

