'use client';

import { Button } from '@/components/ui/button';

// Loading skeleton component
export function FlightSkeleton() {
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
export function ErrorDisplay({ error, onRetry }: { error: Error; onRetry: () => void }) {
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
export function EmptyState({ 
  onCreateTestFlights, 
  creatingTestFlights 
}: { 
  onCreateTestFlights?: () => void; 
  creatingTestFlights?: boolean;
}) {
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

