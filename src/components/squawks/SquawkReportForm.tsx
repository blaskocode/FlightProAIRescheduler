'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SquawkReportFormProps {
  aircraftId: string;
  aircraftTailNumber: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SquawkReportForm({
  aircraftId,
  aircraftTailNumber,
  onSuccess,
  onCancel,
}: SquawkReportFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'MINOR' | 'MAJOR' | 'GROUNDING'>('MINOR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/squawks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aircraftId,
          title,
          description,
          severity,
          reportedBy: 'current-user-id', // TODO: Get from auth context
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to report squawk');
      }

      const squawk = await response.json();

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to report squawk');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Aircraft</Label>
        <Input value={aircraftTailNumber} disabled />
      </div>

      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Brief description of the issue"
          required
        />
      </div>

      <div>
        <Label htmlFor="severity">Severity *</Label>
        <Select
          value={severity}
          onValueChange={(value: 'MINOR' | 'MAJOR' | 'GROUNDING') => setSeverity(value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MINOR">Minor - Can fly with caution</SelectItem>
            <SelectItem value="MAJOR">Major - Requires inspection before next flight</SelectItem>
            <SelectItem value="GROUNDING">Grounding - Aircraft must not fly</SelectItem>
          </SelectContent>
        </Select>
        {severity === 'GROUNDING' && (
          <p className="text-sm text-red-600 mt-1">
            ⚠️ Grounding severity will cancel all future flights for this aircraft
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detailed description of the issue, when it occurred, and any relevant observations"
          rows={5}
          required
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? 'Reporting...' : 'Report Squawk'}
        </Button>
      </div>
    </form>
  );
}

