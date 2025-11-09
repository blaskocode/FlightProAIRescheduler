'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  trainingLevel: string;
  currentStage: string | null;
  lastFlightDate: Date | null;
  preferredInstructor: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  _count: {
    flights: number;
  };
}

export function StudentList() {
  const { user, authUser } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchStudents() {
      if (!user || !authUser || authUser.role !== 'instructor') {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const token = await user.getIdToken();
        const response = await fetch('/api/students', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch students');
        }

        const data = await response.json();
        setStudents(data);
      } catch (err: any) {
        setError(err);
        console.error('Error fetching students:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStudents();
  }, [user, authUser]);

  // Only show for instructors
  if (!authUser || authUser.role !== 'instructor') {
    return null;
  }

  if (loading) {
    return (
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">My Students</h2>
        <p className="text-sm text-gray-500">Loading...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">My Students</h2>
        <p className="text-sm text-red-500">Error loading students: {error.message}</p>
      </Card>
    );
  }

  if (students.length === 0) {
    return (
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">My Students</h2>
        <p className="text-sm text-gray-500">No students found. Students will appear here once they have scheduled flights with you.</p>
      </Card>
    );
  }

  // Calculate currency status
  const getCurrencyStatus = (lastFlightDate: Date | null) => {
    if (!lastFlightDate) return { status: 'NEVER_FLOWN', days: null };
    
    const daysSince = Math.floor(
      (Date.now() - new Date(lastFlightDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSince > 90) return { status: 'EXPIRED', days: daysSince };
    if (daysSince > 60) return { status: 'WARNING', days: daysSince };
    return { status: 'CURRENT', days: daysSince };
  };

  const getStatusBadge = (status: string, days: number | null) => {
    switch (status) {
      case 'EXPIRED':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
            Expired ({days} days)
          </span>
        );
      case 'WARNING':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
            Warning ({days} days)
          </span>
        );
      case 'CURRENT':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            Current ({days} days)
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
            Never Flown
          </span>
        );
    }
  };

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-4">My Students ({students.length})</h2>
      <div className="space-y-3">
        {students.map((student) => {
          const currency = getCurrencyStatus(student.lastFlightDate);
          return (
            <div
              key={student.id}
              className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-sm">
                    {student.firstName} {student.lastName}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">{student.email}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {student.trainingLevel && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        {student.trainingLevel}
                      </span>
                    )}
                    {student.currentStage && (
                      <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                        Stage {student.currentStage}
                      </span>
                    )}
                    {getStatusBadge(currency.status, currency.days)}
                    {student._count.flights > 0 && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                        {student._count.flights} upcoming flight{student._count.flights !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

