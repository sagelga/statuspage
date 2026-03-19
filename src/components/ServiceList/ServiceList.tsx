import React, { useState, useCallback, useRef, useEffect } from 'react';
import { RefreshTimer } from '../RefreshTimer/RefreshTimer';
import { ServiceResult, ServiceStatus } from '../../types';
import { Icons, StatusLabels } from '../Icons';
import { SERVICES } from '../../config';
import './ServiceList.style.css';

interface ServiceListProps {
  checkedAt: string;
  services?: ServiceResult[];
  history?: Record<string, (ServiceStatus | 'nodata')[]>;
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


const SERVICE_URL_MAP = Object.fromEntries(SERVICES.map(s => [s.id, s.url]));

export const ServiceList: React.FC<ServiceListProps> = ({ checkedAt, services, history, onRefresh }) => {
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

  // User's local timezone offset in minutes (positive = UTC+, e.g. UTC+7 → 420)
  const tzOffsetMinutes = React.useMemo(() => -new Date().getTimezoneOffset(), []);
  const tzLabel = React.useMemo(() => {
    const sign = tzOffsetMinutes >= 0 ? '+' : '-';
    const h = String(Math.floor(Math.abs(tzOffsetMinutes) / 60)).padStart(2, '0');
    const m = String(Math.abs(tzOffsetMinutes) % 60).padStart(2, '0');
    return `UTC${sign}${h}:${m}`;
  }, [tzOffsetMinutes]);

  // Rotate a UTC-indexed 1440-minute array to local-time order
  const toLocalMinutes = (utcArr: (ServiceStatus | 'nodata')[]) => {
    if (tzOffsetMinutes === 0) return utcArr;
    return Array.from({ length: 1440 }, (_, i) => {
      const utcIdx = (i - tzOffsetMinutes + 1440) % 1440;
      return utcArr[utcIdx];
    });
  };

  const DATE_ISO = React.useMemo(() => {
    const arr = [];
    const today = Date.now();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      arr.push(d.toISOString().slice(0, 10));
    }
    return arr;
  }, []);

  const DATE_STRS = React.useMemo(() => {
    const arr = [];
    const today = Date.now();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      arr.push(d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }));
    }
    return arr;
  }, []);

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
      const res = await fetch(`/api/minutes/${svcId}/${dateStr}`);
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
    <span className={`badge ${status}`}>
      <span className="dot"></span>
      {StatusLabels[status] || status}
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

  const overallStatus = services
    ? (services.every(s => s.status === 'operational') ? 'operational'
      : services.some(s => s.status === 'down') ? 'down'
      : 'degraded')
    : null;

  return (
    <div className="section">
      <div className="section-header">
        <div className="section-title-row">
          <h2 className="section-title">บริการ</h2>
          {overallStatus === 'operational' && (
            <span className="badge operational">ระบบทำงานปกติ</span>
          )}
        </div>
        <RefreshTimer lastUpdated={checkedAt} refreshInterval={60} onRefresh={onRefresh} />
      </div>
      <div className="components-card" id="components">
        {!services ? (
          SERVICES.map((s) => (
            <div key={s.id} className="skeleton-row">
              <div className="sk-top">
                <div className="sk sk-icon"></div>
                <div className="sk sk-name"></div>
                <div className="sk sk-badge"></div>
              </div>
              <div className="uptime-row">
                <div className="sk sk-bars"></div>
                <div className="uptime-footer">
                  <div className="sk" style={{ height: '10px', width: '40px' }}></div>
                  <div className="sk" style={{ height: '10px', width: '30px' }}></div>
                </div>
              </div>
            </div>
          ))
        ) : (
          services.map((s) => {
            const isExpanded = expanded?.serviceId === s.id;
            const svcHistory = history?.[s.id];
            const pct = isExpanded && expanded ? calculateUptimePct(expanded.minutes) : null;
            const pctNum = pct !== null ? parseFloat(pct) : null;
            const pctColor = pctNum === null ? 'var(--text-muted)'
              : pctNum >= 99.5 ? 'var(--ok-text)'
              : pctNum >= 95   ? 'var(--warn-text)'
              : 'var(--err-text)';

            return (
              <div key={s.id} className={`component-row status-${s.status}`}>
                <div className="component-top">
                  <span className="component-icon" dangerouslySetInnerHTML={{ __html: Icons[s.icon as keyof typeof Icons] || '' }}></span>
                  <span className="component-name">{s.name}</span>
                  {SERVICE_URL_MAP[s.id] && (
                    <div className="info-btn-wrap">
                      <button
                        className={`info-btn${openTooltip === s.id ? ' open' : ''}`}
                        aria-label={`ดู endpoint ของ ${s.name}`}
                        onClick={(e) => { e.stopPropagation(); setOpenTooltip(openTooltip === s.id ? null : s.id); }}
                      >i</button>
                      {openTooltip === s.id && (
                        <div className="info-tooltip" role="tooltip">
                          <span className="info-tooltip-label">endpoint</span>
                          <a href={SERVICE_URL_MAP[s.id]} target="_blank" rel="noopener noreferrer" className="info-tooltip-url">
                            {SERVICE_URL_MAP[s.id]}
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="component-meta">
                    {s.responseTime !== null && <span className="response-time">{s.responseTime} ms</span>}
                    {makeBadge(s.status)}
                  </div>
                </div>

                <div className="uptime-row" onMouseLeave={() => handleRowLeave(s.id)}>
                  <div className={`uptime-bars${isExpanded ? ' has-selection' : ''}`}>
                    {Array.from({ length: 30 }).map((_, i) => {
                      const st = (svcHistory && svcHistory[i] && svcHistory[i] !== 'nodata')
                        ? svcHistory[i]
                        : (i === 29) ? s.status
                        : 'nodata';
                      const isSelected = isExpanded && expanded?.dayIndex === i;
                      return (
                        <div
                          key={i}
                          className={`uptime-bar ${st}${isSelected ? ' selected' : ''}`}
                          onMouseEnter={() => handleBarHover(s.id, i, DATE_ISO[i], DATE_STRS[i])}
                          onClick={() => handleBarClick(s.id, i, DATE_ISO[i], DATE_STRS[i])}
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
                        const localMins = toLocalMinutes(expanded.minutes);
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
          })
        )}
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
