'use client';

import React, { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';

interface MaintenanceSchedule {
  aircraftId: string;
  tailNumber: string;
  maintenanceType: string;
  lastCompleted: string | null;
  nextDue: string | null;
  nextDueHobbs: number | null;
  currentHobbs: number;
  hoursRemaining: number | null;
  daysRemaining: number | null;
  status: 'CURRENT' | 'DUE_SOON' | 'DUE' | 'OVERDUE';
  alertLevel: 'NONE' | 'WARNING' | 'URGENT' | 'CRITICAL';
}

export function MaintenanceDashboard({ schoolId }: { schoolId?: string }) {
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMaintenanceData() {
      try {
        const url = schoolId
          ? `/api/maintenance/due?schoolId=${schoolId}&thresholdDays=30`
          : '/api/maintenance/due?thresholdDays=30';
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch maintenance data');
        }
        
        const data = await response.json();
        setSchedules(data.schedules || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchMaintenanceData();
  }, [schoolId]);

  const getStatusBadge = (status: string, alertLevel: string) => {
    const colors: Record<string, string> = {
      'CURRENT': 'bg-green-100 text-green-800',
      'DUE_SOON': 'bg-yellow-100 text-yellow-800',
      'DUE': 'bg-orange-100 text-orange-800',
      'OVERDUE': 'bg-red-200 text-red-900',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status} {alertLevel !== 'NONE' ? `(${alertLevel})` : ''}
      </span>
    );
  };

  const formatMaintenanceType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return <div className="p-4">Loading maintenance data...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Maintenance Scheduling</h2>
        <p className="text-sm text-gray-500">
          Aircraft due for maintenance within 30 days
        </p>
      </div>

      {schedules.length === 0 ? (
        <div className="p-4 border rounded-lg bg-white">
          <p className="text-gray-500">No aircraft due for maintenance in the next 30 days.</p>
        </div>
      ) : (
        <div className="p-4 border rounded-lg bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aircraft</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Maintenance Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Completed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Due</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Hobbs</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remaining</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {schedules.map((schedule, idx) => (
                  <tr key={`${schedule.aircraftId}-${schedule.maintenanceType}-${idx}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {schedule.tailNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {formatMaintenanceType(schedule.maintenanceType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {schedule.lastCompleted
                        ? format(parseISO(schedule.lastCompleted), 'MMM d, yyyy')
                        : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {schedule.nextDue
                        ? format(parseISO(schedule.nextDue), 'MMM d, yyyy')
                        : schedule.nextDueHobbs
                        ? `${schedule.nextDueHobbs.toFixed(1)} hours`
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {schedule.currentHobbs.toFixed(1)} hours
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {schedule.daysRemaining !== null
                        ? `${schedule.daysRemaining} days`
                        : schedule.hoursRemaining !== null
                        ? `${schedule.hoursRemaining.toFixed(1)} hours`
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(schedule.status, schedule.alertLevel)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

