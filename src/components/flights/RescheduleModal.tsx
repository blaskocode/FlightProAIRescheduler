'use client';

import { useState } from 'react';

interface Suggestion {
  slot: string;
  instructorId: string;
  aircraftId: string;
  priority: number;
  reasoning: string;
  confidence: 'high' | 'medium' | 'low';
  weatherForecast: string;
}

interface RescheduleModalProps {
  flightId: string;
  suggestions: Suggestion[];
  onAccept: (optionIndex: number) => void;
  onReject: () => void;
  onClose: () => void;
}

export function RescheduleModal({
  flightId,
  suggestions,
  onAccept,
  onReject,
  onClose,
}: RescheduleModalProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    if (selectedOption === null) return;

    setLoading(true);
    try {
      await fetch(`/api/reschedule/${flightId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedOption,
          confirmedBy: 'student',
        }),
      });
      onAccept(selectedOption);
    } catch (error) {
      console.error('Error accepting reschedule:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-2xl font-bold mb-4">Reschedule Options</h2>
        <p className="text-gray-600 mb-6">
          Please select your preferred reschedule option:
        </p>

        <div className="space-y-4 mb-6">
          {suggestions.map((suggestion, idx) => (
            <div
              key={idx}
              className={`rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                selectedOption === idx
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300'
              }`}
              onClick={() => setSelectedOption(idx)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="radio"
                      checked={selectedOption === idx}
                      onChange={() => setSelectedOption(idx)}
                      className="text-primary-600"
                    />
                    <h3 className="font-semibold">
                      Option {idx + 1} {idx === 0 && '(Recommended)'}
                    </h3>
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
                  <p className="text-sm text-gray-600 mb-2">
                    {suggestion.reasoning}
                  </p>
                  <p className="text-xs text-gray-500">
                    Weather: {suggestion.weatherForecast}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onReject}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            None of these work
          </button>
          <button
            onClick={handleAccept}
            disabled={selectedOption === null || loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Select Option'}
          </button>
        </div>
      </div>
    </div>
  );
}

