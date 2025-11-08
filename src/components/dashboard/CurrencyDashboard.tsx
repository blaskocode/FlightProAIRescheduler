'use client';

import React, { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface StudentCurrencyStatus {
  studentId: string;
  studentName: string;
  lastFlightDate: string | null;
  daysSinceLastFlight: number;
  soloCurrentUntil: string | null;
  soloDaysRemaining: number | null;
  status: 'CURRENT' | 'WARNING' | 'URGENT' | 'CRITICAL' | 'EXPIRED';
  nextThreshold: number | null;
  recommendations: string[];
}

interface InstructorCurrencyStatus {
  instructorId: string;
  instructorName: string;
  lastInstructionalFlight: string | null;
  daysSinceLastFlight: number;
  status: 'CURRENT' | 'WARNING' | 'URGENT' | 'CRITICAL' | 'EXPIRED';
  nextThreshold: number | null;
  recommendations: string[];
}

export function CurrencyDashboard({ schoolId }: { schoolId?: string }) {
  const [students, setStudents] = useState<StudentCurrencyStatus[]>([]);
  const [instructors, setInstructors] = useState<InstructorCurrencyStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCurrencyData() {
      try {
        const url = schoolId
          ? `/api/currency/approaching-expiry?schoolId=${schoolId}&threshold=30`
          : '/api/currency/approaching-expiry?threshold=30';
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch currency data');
        }
        
        const data = await response.json();
        setStudents(data.students || []);
        setInstructors(data.instructors || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchCurrencyData();
  }, [schoolId]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'CURRENT': 'default',
      'WARNING': 'outline',
      'URGENT': 'secondary',
      'CRITICAL': 'destructive',
      'EXPIRED': 'destructive',
    };
    
    const colors: Record<string, string> = {
      'CURRENT': 'bg-green-100 text-green-800',
      'WARNING': 'bg-yellow-100 text-yellow-800',
      'URGENT': 'bg-orange-100 text-orange-800',
      'CRITICAL': 'bg-red-100 text-red-800',
      'EXPIRED': 'bg-red-200 text-red-900',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return <div className="p-4">Loading currency data...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Currency Tracking Dashboard</h2>
        <p className="text-sm text-gray-500">
          Showing students and instructors approaching currency expiry (within 30 days)
        </p>
      </div>

      {/* Students Section */}
      <div className="p-4 border rounded-lg bg-white">
        <h3 className="text-lg font-semibold mb-4">
          Students Approaching Expiry ({students.length})
        </h3>
        {students.length === 0 ? (
          <p className="text-gray-500">No students approaching currency expiry.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Flight</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Since</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Solo Currency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recommendations</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student.studentId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {student.studentName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {student.lastFlightDate
                        ? format(parseISO(student.lastFlightDate), 'MMM d, yyyy')
                        : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {student.daysSinceLastFlight} days
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {student.soloDaysRemaining !== null
                        ? student.soloDaysRemaining > 0
                          ? `${student.soloDaysRemaining} days remaining`
                          : 'Expired'
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(student.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <ul className="list-disc list-inside">
                        {student.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Instructors Section */}
      <div className="p-4 border rounded-lg bg-white">
        <h3 className="text-lg font-semibold mb-4">
          Instructors Approaching Expiry ({instructors.length})
        </h3>
        {instructors.length === 0 ? (
          <p className="text-gray-500">No instructors approaching currency expiry.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Instructor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Instructional Flight</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Since</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recommendations</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {instructors.map((instructor) => (
                  <tr key={instructor.instructorId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {instructor.instructorName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {instructor.lastInstructionalFlight
                        ? format(parseISO(instructor.lastInstructionalFlight), 'MMM d, yyyy')
                        : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {instructor.daysSinceLastFlight} days
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(instructor.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <ul className="list-disc list-inside">
                        {instructor.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

