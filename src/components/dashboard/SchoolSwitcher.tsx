'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface School {
  id: string;
  name: string;
  airportCode: string;
}

export function SchoolSwitcher() {
  const { authUser } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [currentSchoolId, setCurrentSchoolId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchools();
    fetchCurrentSchool();
  }, [authUser]);

  async function fetchSchools() {
    try {
      const response = await fetch('/api/schools');
      if (response.ok) {
        const data = await response.json();
        setSchools(data);
      }
    } catch (err) {
      console.error('Error fetching schools:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCurrentSchool() {
    if (!authUser) return;

    try {
      // Get user's school from their role
      let schoolId: string | null = null;

      if (authUser.role === 'student') {
        const response = await fetch(`/api/students/${authUser.id}`);
        if (response.ok) {
          const student = await response.json();
          schoolId = student.schoolId;
        }
      } else if (authUser.role === 'instructor') {
        const response = await fetch(`/api/instructors/${authUser.id}`);
        if (response.ok) {
          const instructor = await response.json();
          schoolId = instructor.schoolId;
        }
      } else if (authUser.role === 'admin') {
        const response = await fetch(`/api/admins/${authUser.id}`);
        if (response.ok) {
          const admin = await response.json();
          schoolId = admin.schoolId; // null for super admin
        }
      }

      setCurrentSchoolId(schoolId);
    } catch (err) {
      console.error('Error fetching current school:', err);
    }
  }

  async function handleSchoolChange(schoolId: string) {
    // Store selected school in localStorage for this session
    localStorage.setItem('selectedSchoolId', schoolId);
    setCurrentSchoolId(schoolId);
    
    // Reload page to refresh data with new school context
    window.location.reload();
  }

  if (loading || !authUser) {
    return null;
  }

  // Only show switcher for super admins (who can access all schools)
  if (authUser.role !== 'admin' || currentSchoolId !== null) {
    // Regular users see their school name only
    const userSchool = schools.find(s => s.id === currentSchoolId);
    if (userSchool) {
      return (
        <div className="text-sm text-gray-600">
          {userSchool.name} ({userSchool.airportCode})
        </div>
      );
    }
    return null;
  }

  // Super admin - show school switcher
  const selectedSchoolId = localStorage.getItem('selectedSchoolId') || schools[0]?.id;

  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="school-switcher" className="text-sm font-medium text-gray-700">
        School:
      </label>
      <select
        id="school-switcher"
        value={selectedSchoolId || ''}
        onChange={(e) => handleSchoolChange(e.target.value)}
        className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="">All Schools</option>
        {schools.map((school) => (
          <option key={school.id} value={school.id}>
            {school.name} ({school.airportCode})
          </option>
        ))}
      </select>
    </div>
  );
}

