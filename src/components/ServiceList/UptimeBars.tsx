import React from 'react';
import { statusFromUptime } from '@/lib/status-policy';
import type { ServiceResult, ServiceStatus } from '@/types';

interface UptimeBarsProps {
  loaded?: ServiceResult;
  history?: (ServiceStatus | 'nodata')[];
  dailyUptime?: (number | null)[];
  dailyFuncUptime?: (number | null)[];
  dateLabels: string[];
  dateIso: string[];
  barsHistoryLoading: boolean;
  isLoaded: boolean;
  isExpanded: boolean;
  selectedDayIndex?: number;
  onHover: (dayIndex: number, dateIso: string, label: string) => void;
  onClick: (dayIndex: number, dateIso: string, label: string) => void;
}

/**
 * 30-day bar strip. While history is still loading every bar is a skeleton
 * except today's, which previews the already-known current status.
 */
export function UptimeBars({
  loaded,
  history,
  dailyUptime,
  dailyFuncUptime,
  dateLabels,
  dateIso,
  barsHistoryLoading,
  isLoaded,
  isExpanded,
  selectedDayIndex,
  onHover,
  onClick,
}: UptimeBarsProps) {
  const containerClass = [
    'uptime-bars',
    !isLoaded ? 'loading' : '',
    barsHistoryLoading ? 'history-loading' : '',
    isLoaded && !barsHistoryLoading ? 'bars-loaded' : '',
    isExpanded ? 'has-selection' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClass} aria-busy={barsHistoryLoading || !isLoaded}>
      {barsHistoryLoading && <span className="sr-only">กำลังโหลดประวัติ 30 วัน</span>}

      {Array.from({ length: 30 }).map((_, index) => {
        if (!isLoaded || barsHistoryLoading) {
          const showTodayStatus = barsHistoryLoading && index === 29;
          return (
            <div
              key={index}
              className={
                showTodayStatus
                  ? `uptime-bar status-loaded ${loaded!.status}`
                  : 'uptime-bar loading'
              }
              style={
                showTodayStatus
                  ? ({ '--bar-delay': '0ms' } as React.CSSProperties)
                  : undefined
              }
              title={dateLabels[index]}
            />
          );
        }

        const historyStatus = history?.[index];
        const fallbackStatus =
          historyStatus && historyStatus !== 'nodata'
            ? historyStatus
            : index === 29
              ? loaded!.status
              : 'nodata';

        const effectiveStatus = statusFromUptime(
          dailyUptime?.[index] ?? null,
          dailyFuncUptime?.[index] ?? null,
          fallbackStatus,
        );
        const isSelected = isExpanded && selectedDayIndex === index;

        return (
          <div
            key={index}
            className={`uptime-bar ${effectiveStatus}${isSelected ? ' selected' : ''}`}
            style={{ '--bar-delay': `${index * 14}ms` } as React.CSSProperties}
            onMouseEnter={() => onHover(index, dateIso[index], dateLabels[index])}
            onClick={() => onClick(index, dateIso[index], dateLabels[index])}
            title={dateLabels[index]}
          />
        );
      })}
    </div>
  );
}
