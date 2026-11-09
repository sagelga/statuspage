import React from 'react';
import { statusFromUptime } from '@/lib/status-policy';
import type { ServiceResult, ServiceStatus } from '@/types';

interface UptimeBarsProps {
  serviceName: string;
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
  visibleDays: number;
  onHover: (dayIndex: number, dateIso: string, label: string) => void;
  onClick: (dayIndex: number, dateIso: string, label: string) => void;
}

const BAR_STATUS_LABELS: Record<ServiceStatus | 'nodata', string> = {
  operational: 'ทำงานปกติ',
  degraded: 'ล่าช้า',
  down: 'ล่ม',
  nodata: 'ไม่มีข้อมูล',
};

/**
 * 30-day bar strip. Desktop shows the full history; phones show the last 14
 * days so each bar is large enough to tap. While history is still loading
 * every bar is a skeleton except today's, which previews the current status.
 */
export function UptimeBars({
  serviceName,
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
  visibleDays,
  onHover,
  onClick,
}: UptimeBarsProps) {
  const firstVisibleIndex = 30 - visibleDays;
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
    <div
      className={containerClass}
      role="group"
      aria-label={`ประวัติความพร้อมใช้งาน ${visibleDays} วันของ ${serviceName}`}
      aria-busy={barsHistoryLoading || !isLoaded}
    >
      {barsHistoryLoading && <span className="sr-only">กำลังโหลดประวัติ {visibleDays} วัน</span>}

      {Array.from({ length: visibleDays }).map((_, offset) => {
        const index = firstVisibleIndex + offset;

        if (!isLoaded || barsHistoryLoading) {
          const showTodayStatus = barsHistoryLoading && index === 29;
          return (
            <button
              key={index}
              type="button"
              disabled
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
              aria-label={showTodayStatus ? `${dateLabels[index]} · ${BAR_STATUS_LABELS[loaded!.status]}` : 'กำลังโหลด'}
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

        const isToday = index === 29;
        const effectiveStatus = isToday && (loaded!.status === 'down' || loaded!.status === 'degraded')
          ? loaded!.status
          : statusFromUptime(
              dailyUptime?.[index] ?? null,
              dailyFuncUptime?.[index] ?? null,
              fallbackStatus,
            );
        const isSelected = isExpanded && selectedDayIndex === index;

        return (
          <button
            key={index}
            type="button"
            className={`uptime-bar ${effectiveStatus}${isSelected ? ' selected' : ''}`}
            style={{ '--bar-delay': `${offset * 14}ms` } as React.CSSProperties}
            onMouseEnter={() => onHover(index, dateIso[index], dateLabels[index])}
            onClick={() => onClick(index, dateIso[index], dateLabels[index])}
            title={dateLabels[index]}
            aria-label={`${dateLabels[index]} · ${BAR_STATUS_LABELS[effectiveStatus]}`}
            aria-pressed={isSelected}
            aria-expanded={isSelected}
          />
        );
      })}
    </div>
  );
}
