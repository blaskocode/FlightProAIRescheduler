'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Squawk {
  id: string;
  title: string;
  description: string;
  severity: 'MINOR' | 'MAJOR' | 'GROUNDING';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'DEFERRED';
  reportedAt: string;
  aircraft: {
    tailNumber: string;
  };
}

export function SquawkList() {
  const [squawks, setSquawks] = useState<Squawk[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('all');

  useEffect(() => {
    fetchSquawks();
  }, [filter]);

  async function fetchSquawks() {
    try {
      const url = filter === 'all' ? '/api/squawks' : `/api/squawks?status=${filter}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setSquawks(data);
      }
    } catch (error) {
      console.error('Error fetching squawks:', error);
    } finally {
      setLoading(false);
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'GROUNDING':
        return 'bg-red-100 text-red-800';
      case 'MAJOR':
        return 'bg-orange-100 text-orange-800';
      case 'MINOR':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'OPEN':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="p-4">Loading squawks...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('OPEN')}
          className={`px-3 py-1 rounded ${filter === 'OPEN' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Open
        </button>
        <button
          onClick={() => setFilter('IN_PROGRESS')}
          className={`px-3 py-1 rounded ${filter === 'IN_PROGRESS' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          In Progress
        </button>
        <button
          onClick={() => setFilter('RESOLVED')}
          className={`px-3 py-1 rounded ${filter === 'RESOLVED' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Resolved
        </button>
      </div>

      {squawks.length === 0 ? (
        <div className="p-4 text-center text-gray-500">No squawks found</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aircraft</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reported</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {squawks.map((squawk) => (
              <TableRow key={squawk.id}>
                <TableCell>{squawk.aircraft.tailNumber}</TableCell>
                <TableCell>{squawk.title}</TableCell>
                <TableCell>
                  <Badge className={getSeverityColor(squawk.severity)}>
                    {squawk.severity}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(squawk.status)}>
                    {squawk.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(squawk.reportedAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

