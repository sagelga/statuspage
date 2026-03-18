import React, { useState, useEffect } from 'react';
import './RefreshTimer.style.css';

interface RefreshTimerProps {
  lastUpdated: string;
  refreshInterval?: number;
  onRefresh?: () => void;
}

export const RefreshTimer: React.FC<RefreshTimerProps> = ({ lastUpdated, refreshInterval = 60, onRefresh }) => {
  const [remaining, setRemaining] = useState(refreshInterval);
  const [flashing, setFlashing] = useState(false);
  const size = 16;
  const strokeWidth = 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const calculateNextRefresh = () => {
      const now = new Date();
      const seconds = now.getSeconds();

      // Time until next minute (in seconds)
      const secondsToNextMinute = 60 - seconds;

      // If less than 2 seconds to next minute, add 60 seconds (wait for the minute after)
      if (secondsToNextMinute < 2) {
        return secondsToNextMinute + 60;
      }
      return secondsToNextMinute;
    };

    const update = () => {
      setRemaining(prev => {
        const next = prev - 1;
        if (next <= 0) {
          setFlashing(true);
          setTimeout(() => setFlashing(false), 500);
          onRefresh?.();
          // After auto-refresh, calculate time to next minute boundary
          return calculateNextRefresh();
        }
        return next;
      });
    };

    // On mount or when lastUpdated changes (manual refresh/page load),
    // calculate time to next minute boundary
    const initialRefresh = calculateNextRefresh();
    setRemaining(initialRefresh);

    const intervalId = setInterval(update, 1000);
    return () => clearInterval(intervalId);
  }, [lastUpdated, onRefresh]);

  const progress = Math.max(0, Math.min(1, remaining / refreshInterval));
  const offset = circumference * (1 - progress);

  const formatTime = (time: number) => {
    if (time <= 0) return '...';
    return `${Math.ceil(time)}s`;
  };

  return (
    <div className={`refresh-timer-container${flashing ? ' refresh-flash' : ''}`}>
      <div className="refresh-timer">
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
          />
          <circle
            className="timer-progress"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.35s linear' }}
          />
        </svg>
        <svg className="timer-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </div>
      <span className="refresh-timer-text">
        <span className="refresh-timer-label">รีเฟรชใน</span>
        <span className="refresh-timer-value">{formatTime(remaining)}</span>
      </span>
    </div>
  );
};
