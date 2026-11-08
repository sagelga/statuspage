'use client';

import React, { useEffect, useRef, useState } from 'react';
import './RefreshTimer.style.css';

interface RefreshTimerProps {
  /** ISO timestamp of the data currently displayed. */
  lastUpdated: string;
  /** Seconds between refreshes (default 60). */
  refreshInterval?: number;
  onRefresh?: () => void;
}

const MIN_REFRESH_GAP_MS = 5_000;

/**
 * Countdown ring that calls `onRefresh` once the data is older than
 * `refreshInterval`. Derived from `lastUpdated`, so returning to a tab with
 * stale data refreshes on the next tick instead of waiting for a full cycle.
 */
export const RefreshTimer: React.FC<RefreshTimerProps> = ({
  lastUpdated,
  refreshInterval = 60,
  onRefresh,
}) => {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [flashing, setFlashing] = useState(false);
  const onRefreshRef = useRef(onRefresh);
  const deadlineRef = useRef(0);
  const lastRefreshAtRef = useRef(0);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    const updatedAt = Date.parse(lastUpdated);
    const base = Number.isNaN(updatedAt) ? Date.now() : updatedAt;
    deadlineRef.current = base + refreshInterval * 1000;
  }, [lastUpdated, refreshInterval]);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const remainingMs = deadlineRef.current - now;

      if (remainingMs <= 0) {
        // A payload whose checkedAt is already stale must not trigger a
        // refresh loop when every response carries the same stale timestamp.
        if (now - lastRefreshAtRef.current < MIN_REFRESH_GAP_MS) {
          setRemaining(
            Math.max(
              1,
              Math.ceil((MIN_REFRESH_GAP_MS - (now - lastRefreshAtRef.current)) / 1000),
            ),
          );
          return;
        }

        lastRefreshAtRef.current = now;
        deadlineRef.current = now + refreshInterval * 1000;
        setRemaining(refreshInterval);
        setFlashing(true);
        if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
        flashTimerRef.current = setTimeout(() => setFlashing(false), 500);
        onRefreshRef.current?.();
        return;
      }

      setRemaining(Math.ceil(remainingMs / 1000));
    };

    const intervalId = setInterval(tick, 1000);
    return () => {
      clearInterval(intervalId);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, [refreshInterval]);

  const displayedRemaining = remaining ?? refreshInterval;
  const size = 16;
  const strokeWidth = 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, displayedRemaining / refreshInterval));
  const offset = circumference * (1 - progress);

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
        <svg
          className="timer-icon"
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </div>
      <span className="refresh-timer-text">
        <span className="refresh-timer-label">รีเฟรชใน</span>
        <span className="refresh-timer-value">
          {displayedRemaining <= 0 ? '...' : `${Math.ceil(displayedRemaining)}s`}
        </span>
      </span>
    </div>
  );
};
