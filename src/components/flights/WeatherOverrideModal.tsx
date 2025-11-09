'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';

interface WeatherOverrideModalProps {
  flightId: string;
  flightDate: string;
  isOpen: boolean;
  onClose: () => void;
  onOverride: (reason: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function WeatherOverrideModal({
  flightId,
  flightDate,
  isOpen,
  onClose,
  onOverride,
  isSubmitting = false,
}: WeatherOverrideModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for overriding the weather decision.');
      return;
    }

    if (reason.trim().length < 10) {
      setError('Please provide a more detailed reason (at least 10 characters).');
      return;
    }

    setError(null);
    try {
      await onOverride(reason.trim());
      setReason('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to override weather decision. Please try again.');
    }
  };

  const handleClose = () => {
    setReason('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Override Weather Decision"
      size="md"
    >
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800 font-medium mb-2">
            ⚠️ Weather Override Warning
          </p>
          <p className="text-sm text-yellow-700">
            You are about to override the automated weather safety decision for this flight.
            This action will allow the flight to proceed despite weather concerns.
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-600 mb-2">
            <strong>Flight:</strong> {new Date(flightDate).toLocaleString()}
          </p>
        </div>

        <div>
          <Label htmlFor="override-reason" className="text-sm font-medium">
            Reason for Override <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="override-reason"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError(null);
            }}
            placeholder="Explain why you are overriding the weather decision (e.g., 'Local conditions are acceptable, wind is within limits for this student's experience level')"
            className="mt-1 min-h-[100px]"
            disabled={isSubmitting}
          />
          {error && (
            <p className="text-sm text-red-600 mt-1">{error}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Minimum 10 characters required. This reason will be logged for audit purposes.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !reason.trim() || reason.trim().length < 10}
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            {isSubmitting ? 'Overriding...' : 'Override Weather Decision'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

