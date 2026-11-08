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
  visibleDays: number;
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

/** Endpoint host shown under the service name. Never throws on malformed URLs. */
function getEndpointHost(url?: string): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

/** Average of all known daily uptime values, rounded to two decimals. */
function compute30DayUptime(days?: (number | null)[]): string | null {
  if (!days || days.length === 0) return null;
  const known = days.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  if (known.length === 0) return null;
  const average = known.reduce((sum, value) => sum + value, 0) / known.length;
  return (Math.round(average * 100) / 100).toFixed(2);
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
  visibleDays,
  onToggleTooltip,
  onBarHover,
  onBarClick,
  onRowLeave,
}: ServiceRowProps) {
  const isLoaded = loaded !== undefined;
  const historyReady = serviceHasHistory(history, definition.id);
  const barsHistoryLoading = isLoaded && historyLoading && !historyReady;
  const Icon = Icons[definition.icon];
  const endpointHost = getEndpointHost(definition.url);
  const uptime30 = compute30DayUptime(dailyUptime?.[definition.id]);
  const uptime30Num = uptime30 !== null ? parseFloat(uptime30) : null;
  const uptime30Class = uptime30Num === null ? 'is-none'
    : uptime30Num >= UPTIME_OPERATIONAL_THRESHOLD ? 'is-ok'
    : uptime30Num >= UPTIME_DEGRADED_THRESHOLD ? 'is-warn'
    : 'is-err';
  const uptime30Label = uptime30 !== null
    ? `ความพร้อมใช้งาน 30 วัน ${uptime30} เปอร์เซ็นต์`
    : 'ยังไม่มีข้อมูลความพร้อมใช้งาน 30 วัน';

  const pct = isExpanded && expanded ? calculateOperationalPct(expanded.minutes) : null;

  return (
    <div
      className={`component-row${isLoaded ? ` loaded status-${loaded.status}` : ' loading'}`}
    >
      <div className="component-top">
        <span className="component-icon">{Icon ? <Icon /> : null}</span>
        <div className="component-name-wrap">
          <span className="component-name">{definition.name}</span>
          {endpointHost && (
            <span className="component-url" title={definition.url}>{endpointHost}</span>
          )}
        </div>

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
        <div className="uptime-head">
          <span className="uptime-label">ความพร้อมใช้งาน 30 วัน</span>
          <span className={`uptime-pct ${uptime30Class}`} aria-label={uptime30Label} title={uptime30Label}>
            <b>{uptime30 !== null ? `${uptime30}%` : '—'}</b>
          </span>
        </div>
        <UptimeBars
          serviceName={definition.name}
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
          visibleDays={visibleDays}
          onHover={onBarHover}
          onClick={onBarClick}
        />

        <div className="uptime-footer">
          <span>{visibleDays} วันก่อน</span>
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
