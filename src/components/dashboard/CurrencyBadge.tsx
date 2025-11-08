'use client';

import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';

interface CurrencyStatus {
  status: 'CURRENT' | 'WARNING' | 'URGENT' | 'CRITICAL' | 'EXPIRED';
  daysRemaining?: number | null;
}

interface CurrencyBadgeProps {
  userId: string;
  userType: 'student' | 'instructor';
}

export function CurrencyBadge({ userId, userType }: CurrencyBadgeProps) {
  const [status, setStatus] = useState<CurrencyStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCurrencyStatus() {
      try {
        const endpoint = userType === 'student'
          ? `/api/currency/student/${userId}`
          : `/api/currency/instructor/${userId}`;
        
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error('Failed to fetch currency status');
        }
        
        const data = await response.json();
        setStatus({
          status: data.status,
          daysRemaining: data.nextThreshold,
        });
      } catch (error) {
        console.error('Error fetching currency status:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchCurrencyStatus();
  }, [userId, userType]);

  if (loading || !status) {
    return null;
  }

  const getBadgeColor = () => {
    switch (status.status) {
      case 'CURRENT':
        return 'bg-green-100 text-green-800';
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800';
      case 'URGENT':
        return 'bg-orange-100 text-orange-800';
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      case 'EXPIRED':
        return 'bg-red-200 text-red-900';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getBadgeText = () => {
    if (status.status === 'CURRENT') {
      return `Current (${status.daysRemaining} days remaining)`;
    } else if (status.status === 'EXPIRED') {
      return 'Expired';
    } else {
      return `${status.status} (${status.daysRemaining} days remaining)`;
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBadgeColor()}`}>
      {getBadgeText()}
    </span>
  );
}

