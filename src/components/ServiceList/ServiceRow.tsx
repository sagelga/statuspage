import React from 'react';
import { Icons } from '@/components/Icons';
import { serviceHasHistory } from '@/lib/brand-status';
import {
  calculateOperationalPct,
  UPTIME_DEGRADED_THRESHOLD,
  UPTIME_OPERATIONAL_THRESHOLD,
} from '@/lib/status-policy';
import type { ServiceDefinition, ServiceResult, ServiceStatus } from '@/types';
import { LoadingBadge, StatusBadge } from './ServiceBadge';
import { MinuteMosaic } from './MinuteMosaic';
import { UptimeBars } from './UptimeBars';
import type { ExpandedDay } from './types';

interface ServiceRowProps {
  definition: ServiceDefinition;
  loaded?: ServiceResult;
  history?: Record<string, (ServiceStatus | 'nodata')[]>;
  dailyUptime?: Record<string, (number | null)[]>;
  dailyFuncUptime?: Record<string, (number | null)[]>;
  dateIso: string[];
  dateLabels: string[];
  historyLoading: boolean;
  expanded: ExpandedDay | null;
  isExpanded: boolean;
  openTooltip: boolean;
  timezoneLabel: string;
  onToggleTooltip: () => void;
  onBarHover: (dayIndex: number, dateIso: string, label: string) => void;
  onBarClick: (dayIndex: number, dateIso: string, label: string) => void;
  onRowLeave: () => void;
}

function uptimeColor(pct: string | null): string {
  if (pct === null) return 'var(--text-muted)';
  const value = parseFloat(pct);
  if (value >= UPTIME_OPERATIONAL_THRESHOLD) return 'var(--ok-text)';
  if (value >= UPTIME_DEGRADED_THRESHOLD) return 'var(--warn-text)';
  return 'var(--err-text)';
}

/** One service card: header, 30-day bars, and optional minute mosaic. */
export function ServiceRow({
  definition,
  loaded,
  history,
  dailyUptime,
  dailyFuncUptime,
  dateIso,
  dateLabels,
  historyLoading,
  expanded,
  isExpanded,
  openTooltip,
  timezoneLabel,
  onToggleTooltip,
  onBarHover,
  onBarClick,
  onRowLeave,
}: ServiceRowProps) {
  const isLoaded = loaded !== undefined;
  const historyReady = serviceHasHistory(history, definition.id);
  const barsHistoryLoading = isLoaded && historyLoading && !historyReady;
  const Icon = Icons[definition.icon];

  const pct = isExpanded && expanded ? calculateOperationalPct(expanded.minutes) : null;

  return (
    <div
      className={`component-row${isLoaded ? ` loaded status-${loaded.status}` : ' loading'}`}
    >
      <div className="component-top">
        <span className="component-icon">{Icon ? <Icon /> : null}</span>
        <span className="component-name">{definition.name}</span>

        {definition.url && (
          <div className="info-btn-wrap">
            <button
              className={`info-btn${openTooltip ? ' open' : ''}`}
              aria-label={`ดู endpoint ของ ${definition.name}`}
              onClick={(event) => {
                event.stopPropagation();
                onToggleTooltip();
              }}
            >
              i
            </button>
            {openTooltip && (
              <div className="info-tooltip" role="tooltip">
                <span className="info-tooltip-label">endpoint</span>
                <a
                  href={definition.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="info-tooltip-url"
                >
                  {definition.url}
                </a>
              </div>
            )}
          </div>
        )}

        <div className="component-meta">
          {isLoaded && loaded.responseTime !== null && (
            <span
              key={`rt-${loaded.responseTime}`}
              className="response-time data-loaded"
            >
              {loaded.responseTime} ms
            </span>
          )}
          {!isLoaded && (
            <span className="response-time loading" aria-hidden="true">
              &nbsp;
            </span>
          )}
          {isLoaded ? (
            <span key={`badge-${loaded.status}-${loaded.responseTime}`}>
              <StatusBadge status={loaded.status} />
            </span>
          ) : (
            <LoadingBadge />
          )}
        </div>
      </div>

      <div className="uptime-row" onMouseLeave={() => isLoaded && onRowLeave()}>
        <UptimeBars
          loaded={loaded}
          history={history?.[definition.id]}
          dailyUptime={dailyUptime?.[definition.id]}
          dailyFuncUptime={dailyFuncUptime?.[definition.id]}
          dateLabels={dateLabels}
          dateIso={dateIso}
          barsHistoryLoading={barsHistoryLoading}
          isLoaded={isLoaded}
          isExpanded={isExpanded}
          selectedDayIndex={expanded?.dayIndex}
          onHover={onBarHover}
          onClick={onBarClick}
        />

        <div className="uptime-footer">
          <span>30 วันก่อน</span>
          {!isExpanded && <span className="uptime-hint">กดที่แถบเพื่อดูรายนาที</span>}
          <span>วันนี้</span>
        </div>

        {isExpanded && expanded && (
          <MinuteMosaic
            dateLabel={expanded.label}
            timezoneLabel={timezoneLabel}
            minutes={expanded.minutes}
            loading={expanded.loading}
            uptimePct={pct}
            uptimeColor={uptimeColor(pct)}
          />
        )}
      </div>
    </div>
  );
}
