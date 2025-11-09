'use client';

import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface QuickRescheduleButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export function QuickRescheduleButton({
  onClick,
  disabled = false,
  className,
}: QuickRescheduleButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = async () => {
    if (disabled || isProcessing) return;
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    setIsProcessing(true);
    try {
      await onClick();
    } finally {
      // Reset after a short delay to show feedback
      setTimeout(() => {
        setIsProcessing(false);
      }, 500);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || isProcessing}
      className={`min-h-[44px] min-w-[44px] ${className || ''}`}
      variant="default"
    >
      {isProcessing ? (
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          <span>Processing...</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span>⚡</span>
          <span>Quick Reschedule</span>
        </div>
      )}
    </Button>
  );
}

