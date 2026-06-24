import React, { useState, useCallback, useRef, useEffect } from 'react';
import { RefreshTimer } from '../RefreshTimer/RefreshTimer';
import { ServiceResult, ServiceStatus, ServiceDefinition } from '../../types';
import { Icons, StatusLabels } from '../Icons';
import { serviceHasHistory } from '@/lib/brand-status';
import {
  formatTimezoneLabel,
  getLast30DateLabels,
  getLast30IsoDates,
  getTimezoneOffsetMinutes,
} from '@/lib/date-range';
import './ServiceList.style.css';

interface ServiceListProps {
  checkedAt: string;
  visibleServices: ServiceDefinition[];
  services?: ServiceResult[];
  history?: Record<string, (ServiceStatus | 'nodata')[]>;
  dailyUptime?: Record<string, (number | null)[]>;
  /** (operational + degraded) / total — service was responding, even if slow */
  dailyFuncUptime?: Record<string, (number | null)[]>;
  historyLoading?: boolean;
  onRefresh?: () => void;
}

interface ExpandedState {
  serviceId: string;
  dayIndex: number;
  dateStr: string;
  label: string;
  minutes: (ServiceStatus | 'nodata')[];
  loading: boolean;
  locked: boolean;
}

export const ServiceList: React.FC<ServiceListProps> = ({
  checkedAt,
  visibleServices,
  services,
  history,
  dailyUptime,
  dailyFuncUptime,
  historyLoading = false,
  onRefresh,
}) => {
  const [expanded, setExpanded] = useState<ExpandedState | null>(null);
  const [openTooltip, setOpenTooltip] = useState<string | null>(null);
  const minuteCache = useRef<Record<string, (ServiceStatus | 'nodata')[]>>({});

  // Clear minute cache when history data changes (on refresh)
  // But preserve expanded state if user has a day selected (locked)
  useEffect(() => {
    minuteCache.current = {};
    // Only close expanded if it's not locked (user actively viewing)
    setExpanded(prev => {
      if (!prev) return null;
      if (prev.locked) {
        // Keep it open but mark as stale - will re-fetch if user interacts again
        return { ...prev, loading: false };
      }
      return null;
    });
  }, [history]);

  useEffect(() => {
    if (!openTooltip) return;
    const close = () => setOpenTooltip(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openTooltip]);

  const tzOffsetMinutes = React.useMemo(() => getTimezoneOffsetMinutes(), []);
  const tzLabel = React.useMemo(() => formatTimezoneLabel(tzOffsetMinutes), [tzOffsetMinutes]);
  const DATE_ISO = React.useMemo(() => getLast30IsoDates(tzOffsetMinutes), [tzOffsetMinutes]);
  const DATE_STRS = React.useMemo(() => getLast30DateLabels(tzOffsetMinutes, 'th-TH'), [tzOffsetMinutes]);

  // Shared fetch + show logic — stable ref, no expanded dependency
  const fetchAndShow = useCallback(async (
    svcId: string, dayIndex: number, dateStr: string, label: string, locked: boolean
  ) => {
    const cacheKey = `${svcId}:${dateStr}`;
    const cached = minuteCache.current[cacheKey];

    if (cached) {
      setExpanded({ serviceId: svcId, dayIndex, dateStr, label, minutes: cached, loading: false, locked });
      return;
    }

    setExpanded({ serviceId: svcId, dayIndex, dateStr, label, minutes: new Array(1440).fill('nodata'), loading: true, locked });

    try {
      const tz = getTimezoneOffsetMinutes();
      const res = await fetch(`/api/minutes/${svcId}/${dateStr}?tzOffset=${tz}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const raw = await res.json();
      const data: (ServiceStatus | 'nodata')[] = Array.isArray(raw) ? raw : new Array(1440).fill('nodata');
      minuteCache.current[cacheKey] = data;
      setExpanded(prev =>
        prev?.serviceId === svcId && prev?.dayIndex === dayIndex
          ? { ...prev, minutes: data, loading: false }
          : prev
      );
    } catch (err) {
      console.error(err);
      setExpanded(prev =>
        prev?.serviceId === svcId && prev?.dayIndex === dayIndex
          ? { ...prev, loading: false }
          : prev
      );
    }
  }, []);

  // Hover: only updates if not locked
  const handleBarHover = useCallback((svcId: string, dayIndex: number, dateStr: string, label: string) => {
    if (expanded?.locked) return;
    if (expanded?.serviceId === svcId && expanded?.dayIndex === dayIndex) return;
    fetchAndShow(svcId, dayIndex, dateStr, label, false);
  }, [expanded, fetchAndShow]);

  // Click: lock to bar, or unlock if clicking the already-locked bar
  const handleBarClick = useCallback((svcId: string, dayIndex: number, dateStr: string, label: string) => {
    if (expanded?.locked && expanded?.serviceId === svcId && expanded?.dayIndex === dayIndex) {
      setExpanded(null);
      return;
    }
    fetchAndShow(svcId, dayIndex, dateStr, label, true);
  }, [expanded, fetchAndShow]);

  // Mouse-leave on uptime-row: only hides when not locked
  const handleRowLeave = useCallback((svcId: string) => {
    if (expanded?.locked) return;
    if (expanded?.serviceId === svcId) setExpanded(null);
  }, [expanded]);

  const makeBadge = (status: ServiceStatus) => (
    <span className={`badge status-loaded ${status}`}>
      <span className="dot"></span>
      {StatusLabels[status] || status}
    </span>
  );

  const makeLoadingBadge = () => (
    <span className="badge loading">
      <span className="dot"></span>
      กำลังโหลด
    </span>
  );

  const calculateUptimePct = (minutes: (ServiceStatus | 'nodata')[]) => {
    const known = minutes.filter(m => m !== 'nodata');
    if (known.length === 0) return null;
    const op = known.filter(m => m === 'operational').length;
    return ((op / known.length) * 100).toFixed(2);
  };

  const renderMosaicHalf = (localMinutes: (ServiceStatus | 'nodata')[], startHour: number, loading: boolean) => {
    // Axis labels: minute marks at positions 0, 15, 30, 45 within each hour.
    // Each hour is rotated so :01 is first and :00 is last.
    const axisMinutes = ['15m', '30m', '45m', '60m'];
    return (
      <>
        <div className={`mosaic-half-grid${loading ? ' mosaic-loading' : ''}`}>
          {Array.from({ length: 12 * 60 }, (_, i) => {
            const hourOffset = Math.floor(i / 60);
            const posInHour = i % 60;
            // Each hour row: :01 first, next hour's :00 last
            const srcIdx = (startHour + hourOffset) * 60 + posInHour + 1;
            const m = (srcIdx < 1440 ? localMinutes[srcIdx] : undefined) ?? 'nodata';
            const hh = String(Math.floor(srcIdx / 60) % 24).padStart(2, '0');
            const mm = String(srcIdx % 60).padStart(2, '0');
            return <div key={i} className={`mosaic-cell ${m}`} title={`${hh}:${mm}`} />;
          })}
        </div>
        <div className="mosaic-axis" aria-hidden="true">
          <span className="ma-s">{axisMinutes[0]}</span>
          <span className="ma-q1">{axisMinutes[1]}</span>
          <span className="ma-h">{axisMinutes[2]}</span>
          <span className="ma-q3">{axisMinutes[3]}</span>
        </div>
      </>
    );
  };


  return (
    <div className="section">
      <div className="section-header">
        <div className="section-title-row">
          <h2 className="section-title">บริการ</h2>
          {historyLoading && (
            <p className="history-loading-hint" aria-live="polite">
              <span className="dot" aria-hidden="true" />
              กำลังโหลดประวัติ 30 วัน…
            </p>
          )}
        </div>
        <RefreshTimer lastUpdated={checkedAt} refreshInterval={60} onRefresh={onRefresh} />
      </div>
      <div className="components-card" id="components">
        {visibleServices.map((def) => {
          const loaded = services?.find(s => s.id === def.id);
          const isLoaded = loaded !== undefined;
          const isExpanded = isLoaded && expanded?.serviceId === def.id;
          const svcHistory = isLoaded ? history?.[def.id] : undefined;
          const historyReady = serviceHasHistory(history, def.id);
          const barsHistoryLoading = isLoaded && historyLoading && !historyReady;
          const pct = isExpanded && expanded ? calculateUptimePct(expanded.minutes) : null;
          const pctNum = pct !== null ? parseFloat(pct) : null;
          const pctColor = pctNum === null ? 'var(--text-muted)'
            : pctNum >= 99.5 ? 'var(--ok-text)'
            : pctNum >= 95   ? 'var(--warn-text)'
            : 'var(--err-text)';

          return (
            <div key={def.id} className={`component-row${isLoaded ? ` loaded status-${loaded.status}` : ' loading'}`}>
              <div className="component-top">
                <span className="component-icon" dangerouslySetInnerHTML={{ __html: Icons[def.icon as keyof typeof Icons] || '' }}></span>
                <span className="component-name">{def.name}</span>
                {def.url && (
                  <div className="info-btn-wrap">
                    <button
                      className={`info-btn${openTooltip === def.id ? ' open' : ''}`}
                      aria-label={`ดู endpoint ของ ${def.name}`}
                      onClick={(e) => { e.stopPropagation(); setOpenTooltip(openTooltip === def.id ? null : def.id); }}
                    >i</button>
                    {openTooltip === def.id && (
                      <div className="info-tooltip" role="tooltip">
                        <span className="info-tooltip-label">endpoint</span>
                        <a href={def.url} target="_blank" rel="noopener noreferrer" className="info-tooltip-url">
                          {def.url}
                        </a>
                      </div>
                    )}
                  </div>
                )}
                <div className="component-meta">
                  {isLoaded && loaded.responseTime !== null && (
                    <span key={`rt-${loaded.responseTime}`} className="response-time data-loaded">
                      {loaded.responseTime} ms
                    </span>
                  )}
                  {!isLoaded && <span className="response-time loading" aria-hidden="true">&nbsp;</span>}
                  {isLoaded ? (
                    <span key={`badge-${loaded.status}-${loaded.responseTime}`}>{makeBadge(loaded.status)}</span>
                  ) : makeLoadingBadge()}
                </div>
              </div>

              <div className="uptime-row" onMouseLeave={() => isLoaded && handleRowLeave(def.id)}>
                <div
                  className={`uptime-bars${!isLoaded ? ' loading' : ''}${barsHistoryLoading ? ' history-loading' : ''}${isLoaded && !barsHistoryLoading ? ' bars-loaded' : ''}${isExpanded ? ' has-selection' : ''}`}
                  aria-busy={barsHistoryLoading || !isLoaded}
                >
                  {barsHistoryLoading && (
                    <span className="sr-only">กำลังโหลดประวัติ 30 วัน</span>
                  )}
                  {Array.from({ length: 30 }).map((_, i) => {
                    if (!isLoaded || barsHistoryLoading) {
                      const showTodayStatus = barsHistoryLoading && i === 29;
                      return (
                        <div
                          key={i}
                          className={showTodayStatus ? `uptime-bar status-loaded ${loaded!.status}` : 'uptime-bar loading'}
                          style={showTodayStatus ? { '--bar-delay': '0ms' } as React.CSSProperties : undefined}
                          title={DATE_STRS[i]}
                        />
                      );
                    }
                    const st = (svcHistory && svcHistory[i] && svcHistory[i] !== 'nodata')
                      ? svcHistory[i]
                      : (i === 29) ? loaded.status
                      : 'nodata';
                    const uptimePct = dailyUptime?.[def.id]?.[i] ?? null;
                    const funcPct = dailyFuncUptime?.[def.id]?.[i] ?? null;
                    const effectiveSt: ServiceStatus | 'nodata' = uptimePct === null ? st
                      : uptimePct >= 99.5 ? 'operational'
                      : uptimePct < 95 && (funcPct === null || funcPct < 95) ? 'down'
                      : uptimePct < 95 ? 'degraded'
                      : st;
                    const isSelected = isExpanded && expanded?.dayIndex === i;
                    return (
                      <div
                        key={i}
                        className={`uptime-bar ${effectiveSt}${isSelected ? ' selected' : ''}`}
                        style={{ '--bar-delay': `${i * 14}ms` } as React.CSSProperties}
                        onMouseEnter={() => handleBarHover(def.id, i, DATE_ISO[i], DATE_STRS[i])}
                        onClick={() => handleBarClick(def.id, i, DATE_ISO[i], DATE_STRS[i])}
                        title={DATE_STRS[i]}
                      />
                    );
                  })}
                </div>

                <div className="uptime-footer">
                  <span>30 วันก่อน</span>
                  {!isExpanded && <span className="uptime-hint">กดที่แถบเพื่อดูรายนาที</span>}
                  <span>วันนี้</span>
                </div>

                {isExpanded && expanded && (
                  <div className="mosaic-inline-panel">
                    <div className="mosaic-inline-header">
                      <span className="mosaic-inline-date">
                        {expanded.label}
                        <span className="mosaic-tz-label">{tzLabel}</span>
                      </span>
                      <span className="mosaic-inline-pct" style={{ color: pctColor }}>
                        {expanded.loading ? <span className="mono">—</span> : pct !== null ? <span className="mono">{pct}%</span> : 'ไม่มีข้อมูล'}
                      </span>
                    </div>

                    {(() => {
                      // Minutes are already in local time (API handles timezone stitching)
                      const localMins = expanded.minutes;
                      return (
                        <div className="mosaic-blocks">
                          <div className="mosaic-block">
                            <span className="mosaic-block-label">00:00 – 11:59</span>
                            {renderMosaicHalf(localMins, 0, expanded.loading)}
                          </div>

                          <div className="mosaic-block">
                            <span className="mosaic-block-label">12:00 – 23:59</span>
                            {renderMosaicHalf(localMins, 12, expanded.loading)}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div className="uptime-legend">
          <span><span className="uptime-legend-dot operational"></span> ทำงานปกติ</span>
          <span><span className="uptime-legend-dot degraded"></span> ล่าช้า</span>
          <span><span className="uptime-legend-dot down"></span> ล่ม</span>
          <span><span className="uptime-legend-dot nodata"></span> ไม่มีข้อมูล</span>
        </div>
      </div>
    </div>
  );
};