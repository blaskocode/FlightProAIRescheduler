'use client';

import { useState, useRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  className?: string;
  enableHaptic?: boolean;
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  className,
  enableHaptic = true,
}: SwipeableCardProps) {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef<number>(0);
  const currentX = useRef<number>(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const hapticTriggered = useRef(false);

  const SWIPE_THRESHOLD = 100; // Minimum distance to trigger swipe
  const MAX_OFFSET = 120; // Maximum swipe distance

  const triggerHaptic = () => {
    if (enableHaptic && 'vibrate' in navigator && !hapticTriggered.current) {
      navigator.vibrate(30);
      hapticTriggered.current = true;
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    currentX.current = startX.current;
    setIsDragging(true);
    hapticTriggered.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    currentX.current = e.touches[0].clientX;
    const delta = currentX.current - startX.current;
    
    // Limit swipe distance
    const newOffset = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, delta));
    setOffset(newOffset);
    
    // Trigger haptic feedback when threshold is reached
    if (Math.abs(newOffset) >= SWIPE_THRESHOLD && !hapticTriggered.current) {
      triggerHaptic();
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    if (Math.abs(offset) >= SWIPE_THRESHOLD) {
      // Stronger haptic feedback on successful swipe
      if (enableHaptic && 'vibrate' in navigator) {
        navigator.vibrate(100);
      }
      
      if (offset < 0 && onSwipeLeft) {
        onSwipeLeft();
      } else if (offset > 0 && onSwipeRight) {
        onSwipeRight();
      }
    }
    
    // Reset position
    setOffset(0);
    hapticTriggered.current = false;
  };

  return (
    <div className="relative overflow-hidden" ref={cardRef}>
      {/* Background actions */}
      <div className="absolute inset-0 flex">
        {leftAction && (
          <div className="flex-1 bg-red-500 flex items-center justify-end pr-4">
            {leftAction}
          </div>
        )}
        {rightAction && (
          <div className="flex-1 bg-green-500 flex items-center justify-start pl-4">
            {rightAction}
          </div>
        )}
      </div>

      {/* Card content */}
      <div
        className={cn('relative bg-white transition-transform duration-200', className)}
        style={{
          transform: `translateX(${offset}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

