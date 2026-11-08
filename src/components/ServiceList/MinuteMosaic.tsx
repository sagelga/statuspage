import React from 'react';
import type { ServiceStatus } from '@/types';

const AXIS_LABELS = ['15m', '30m', '45m', '60m'] as const;

interface MosaicHalfProps {
  minutes: (ServiceStatus | 'nodata')[];
  startHour: number;
  loading: boolean;
}

/**
 * 12-hour half of the minute mosaic.
 * Each hour row is rotated so :01 is first and the next hour's :00 is last.
 */
function MosaicHalf({ minutes, startHour, loading }: MosaicHalfProps) {
  return (
    <>
      <div className={`mosaic-half-grid${loading ? ' mosaic-loading' : ''}`}>
        {Array.from({ length: 12 * 60 }, (_, index) => {
          const hourOffset = Math.floor(index / 60);
          const positionInHour = index % 60;
          const sourceIndex = (startHour + hourOffset) * 60 + positionInHour + 1;
          const minute =
            (sourceIndex < 1440 ? minutes[sourceIndex] : undefined) ?? 'nodata';
          const hh = String(Math.floor(sourceIndex / 60) % 24).padStart(2, '0');
          const mm = String(sourceIndex % 60).padStart(2, '0');

          return (
            <div
              key={index}
              className={`mosaic-cell ${minute}`}
              title={`${hh}:${mm}`}
            />
          );
        })}
      </div>
      <div className="mosaic-axis" aria-hidden="true">
        <span className="ma-s">{AXIS_LABELS[0]}</span>
        <span className="ma-q1">{AXIS_LABELS[1]}</span>
        <span className="ma-h">{AXIS_LABELS[2]}</span>
        <span className="ma-q3">{AXIS_LABELS[3]}</span>
      </div>
    </>
  );
}

interface MinuteMosaicProps {
  dateLabel: string;
  timezoneLabel: string;
  minutes: (ServiceStatus | 'nodata')[];
  loading: boolean;
  uptimePct: string | null;
  uptimeColor: string;
}

/** Expandable per-minute drill-down for a single day. */
export function MinuteMosaic({
  dateLabel,
  timezoneLabel,
  minutes,
  loading,
  uptimePct,
  uptimeColor,
}: MinuteMosaicProps) {
  return (
    <div className="mosaic-inline-panel">
      <div className="mosaic-inline-header">
        <span className="mosaic-inline-date">
          {dateLabel}
          <span className="mosaic-tz-label">{timezoneLabel}</span>
        </span>
        <span className="mosaic-inline-pct" style={{ color: uptimeColor }}>
          {loading ? (
            <span className="mono">—</span>
          ) : uptimePct !== null ? (
            <span className="mono">{uptimePct}%</span>
          ) : (
            'ไม่มีข้อมูล'
          )}
        </span>
      </div>

      <div className="mosaic-blocks">
        <div className="mosaic-block">
          <span className="mosaic-block-label">00:00 – 11:59</span>
          <MosaicHalf minutes={minutes} startHour={0} loading={loading} />
        </div>

        <div className="mosaic-block">
          <span className="mosaic-block-label">12:00 – 23:59</span>
          <MosaicHalf minutes={minutes} startHour={12} loading={loading} />
        </div>
      </div>
    </div>
  );
}
