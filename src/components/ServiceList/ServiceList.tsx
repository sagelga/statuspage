'use client';

/**
 * ServiceList — per-service status cards with 30-day uptime bars and an
 * expandable per-minute mosaic. Date labels and ISO keys come from
 * lib/date-range so they line up with the API's timezone stitching.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshTimer } from '../RefreshTimer/RefreshTimer';
import type { ServiceDefinition, ServiceResult, ServiceStatus } from '@/types';
import {
  formatTimezoneLabel,
  getLast30DateLabels,
  getLast30IsoDates,
  getTimezoneOffsetMinutes,
} from '@/lib/date-range';
import { MINUTES_PER_DAY } from '@/lib/minute-cells';
import { ServiceRow } from './ServiceRow';
import type { ExpandedDay } from './types';
import './ServiceList.style.css';

const EMPTY_HISTORY: Record<string, (ServiceStatus | 'nodata')[]> = {};

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
  const [expanded, setExpanded] = useState<ExpandedDay | null>(null);
  const [openTooltip, setOpenTooltip] = useState<string | null>(null);
  const minuteCache = useRef(
    new WeakMap<object, Record<string, (ServiceStatus | 'nodata')[]>>(),
  );

  // A selection is only valid for the history snapshot it was opened against.
  // Locked panels stay open; hover previews close after a refresh.
  const visibleExpanded = useMemo(() => {
    if (!expanded) return null;
    if (expanded.historyVersion === history) return expanded;
    return expanded.locked ? { ...expanded, loading: false } : null;
  }, [expanded, history]);

  const getMinuteCache = useCallback(() => {
    const key: object = history ?? EMPTY_HISTORY;
    const existing = minuteCache.current.get(key);
    if (existing) return existing;
    const created: Record<string, (ServiceStatus | 'nodata')[]> = {};
    minuteCache.current.set(key, created);
    return created;
  }, [history]);

  // Clicking anywhere outside an open tooltip closes it.
  useEffect(() => {
    if (!openTooltip) return;
    const close = () => setOpenTooltip(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openTooltip]);

  const tzOffsetMinutes = useMemo(() => getTimezoneOffsetMinutes(), []);
  const tzLabel = useMemo(
    () => formatTimezoneLabel(tzOffsetMinutes),
    [tzOffsetMinutes],
  );
  const dateIso = useMemo(
    () => getLast30IsoDates(tzOffsetMinutes),
    [tzOffsetMinutes],
  );
  const dateLabels = useMemo(
    () => getLast30DateLabels(tzOffsetMinutes, 'th-TH'),
    [tzOffsetMinutes],
  );

  const fetchAndShow = useCallback(
    async (
      serviceId: string,
      dayIndex: number,
      dateStr: string,
      label: string,
      locked: boolean,
    ) => {
      const cacheKey = `${serviceId}:${dateStr}`;
      const cache = getMinuteCache();
      const cached = cache[cacheKey];

      if (cached) {
        setExpanded({
          serviceId,
          dayIndex,
          dateStr,
          label,
          minutes: cached,
          loading: false,
          locked,
          historyVersion: history,
        });
        return;
      }

      setExpanded({
        serviceId,
        dayIndex,
        dateStr,
        label,
        minutes: new Array(MINUTES_PER_DAY).fill('nodata'),
        loading: true,
        locked,
        historyVersion: history,
      });

      try {
        const response = await fetch(
          `/api/minutes/${serviceId}/${dateStr}?tzOffset=${getTimezoneOffsetMinutes()}`,
        );
        if (!response.ok) throw new Error('Failed to fetch');
        const raw = await response.json();
        const minutes: (ServiceStatus | 'nodata')[] = Array.isArray(raw)
          ? raw
          : new Array(MINUTES_PER_DAY).fill('nodata');

        cache[cacheKey] = minutes;
        setExpanded((previous) =>
          previous?.serviceId === serviceId && previous?.dayIndex === dayIndex
            ? { ...previous, minutes, loading: false }
            : previous,
        );
      } catch (err) {
        console.error(err);
        setExpanded((previous) =>
          previous?.serviceId === serviceId && previous?.dayIndex === dayIndex
            ? { ...previous, loading: false }
            : previous,
        );
      }
    },
    [getMinuteCache, history],
  );

  // Hover previews a day; a locked panel is never replaced by hover.
  const handleBarHover = useCallback(
    (serviceId: string, dayIndex: number, dateStr: string, label: string) => {
      if (visibleExpanded?.locked) return;
      if (
        visibleExpanded?.serviceId === serviceId &&
        visibleExpanded?.dayIndex === dayIndex
      ) {
        return;
      }
      void fetchAndShow(serviceId, dayIndex, dateStr, label, false);
    },
    [visibleExpanded, fetchAndShow],
  );

  // Click locks the panel; clicking the same locked bar closes it.
  const handleBarClick = useCallback(
    (serviceId: string, dayIndex: number, dateStr: string, label: string) => {
      if (
        visibleExpanded?.locked &&
        visibleExpanded?.serviceId === serviceId &&
        visibleExpanded?.dayIndex === dayIndex
      ) {
        setExpanded(null);
        return;
      }
      void fetchAndShow(serviceId, dayIndex, dateStr, label, true);
    },
    [visibleExpanded, fetchAndShow],
  );

  const handleRowLeave = useCallback(
    (serviceId: string) => {
      if (visibleExpanded?.locked) return;
      if (visibleExpanded?.serviceId === serviceId) setExpanded(null);
    },
    [visibleExpanded],
  );

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
        <RefreshTimer
          lastUpdated={checkedAt}
          refreshInterval={60}
          onRefresh={onRefresh}
        />
      </div>

      <div className="components-card" id="components">
        {visibleServices.map((definition) => {
          const loaded = services?.find((service) => service.id === definition.id);
          const isExpanded =
            loaded !== undefined && visibleExpanded?.serviceId === definition.id;

          return (
            <ServiceRow
              key={definition.id}
              definition={definition}
              loaded={loaded}
              history={history}
              dailyUptime={dailyUptime}
              dailyFuncUptime={dailyFuncUptime}
              dateIso={dateIso}
              dateLabels={dateLabels}
              historyLoading={historyLoading}
              expanded={visibleExpanded}
              isExpanded={isExpanded}
              openTooltip={openTooltip === definition.id}
              timezoneLabel={tzLabel}
              onToggleTooltip={() =>
                setOpenTooltip((current) =>
                  current === definition.id ? null : definition.id,
                )
              }
              onBarHover={(dayIndex, iso, label) =>
                handleBarHover(definition.id, dayIndex, iso, label)
              }
              onBarClick={(dayIndex, iso, label) =>
                handleBarClick(definition.id, dayIndex, iso, label)
              }
              onRowLeave={() => handleRowLeave(definition.id)}
            />
          );
        })}

        <div className="uptime-legend">
          <span>
            <span className="uptime-legend-dot operational" /> ทำงานปกติ
          </span>
          <span>
            <span className="uptime-legend-dot degraded" /> ล่าช้า
          </span>
          <span>
            <span className="uptime-legend-dot down" /> ล่ม
          </span>
          <span>
            <span className="uptime-legend-dot nodata" /> ไม่มีข้อมูล
          </span>
        </div>
      </div>
    </div>
  );
};
