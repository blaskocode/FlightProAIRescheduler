'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  disabled?: boolean;
}

export function PullToRefresh({ onRefresh, children, disabled = false }: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const PULL_THRESHOLD = 80; // Distance in pixels to trigger refresh
  const MAX_PULL = 120; // Maximum pull distance

  useEffect(() => {
    if (disabled || typeof window === 'undefined') return;

    const container = containerRef.current;
    if (!container) return;

    let touchStartY = 0;
    let isTouching = false;

    const handleTouchStart = (e: TouchEvent) => {
      // Only allow pull-to-refresh when at the top of the page
      if (container.scrollTop > 0) return;
      
      touchStartY = e.touches[0].clientY;
      isTouching = true;
      startY.current = touchStartY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTouching) return;
      
      currentY.current = e.touches[0].clientY;
      const distance = currentY.current - touchStartY;

      if (distance > 0 && container.scrollTop === 0) {
        e.preventDefault();
        setIsPulling(true);
        setPullDistance(Math.min(distance, MAX_PULL));
      }
    };

    const handleTouchEnd = async () => {
      if (!isTouching) return;
      
      isTouching = false;
      
      if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
        setIsRefreshing(true);
        setPullDistance(PULL_THRESHOLD);
        
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          setIsPulling(false);
          setPullDistance(0);
        }
      } else {
        setIsPulling(false);
        setPullDistance(0);
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onRefresh, pullDistance, isRefreshing, disabled]);

  const pullProgress = Math.min(pullDistance / PULL_THRESHOLD, 1);

  return (
    <div ref={containerRef} className="relative h-full overflow-auto">
      {/* Pull-to-refresh indicator */}
      {(isPulling || isRefreshing) && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center bg-blue-50 transition-all duration-200"
          style={{
            height: `${Math.min(pullDistance, PULL_THRESHOLD)}px`,
            opacity: pullProgress,
          }}
        >
          {isRefreshing ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
              <span className="text-sm text-blue-600">Refreshing...</span>
            </div>
          ) : (
            <span className="text-sm text-blue-600">
              {pullDistance >= PULL_THRESHOLD ? 'Release to refresh' : 'Pull to refresh'}
            </span>
          )}
        </div>
      )}

      {/* Content */}
      <div
        style={{
          transform: isPulling ? `translateY(${Math.min(pullDistance, PULL_THRESHOLD)}px)` : 'translateY(0)',
          transition: isPulling ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}

