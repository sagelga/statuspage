/**
 * Client-side load sequence: fast badges → brand history → deferred other-brand preload.
 */
import { BRANDS, SERVICES_BY_BRAND, type BrandId } from '@/config';
import { brandHasTodayData, countLoadedForBrand } from '@/lib/brand-status';
import type { CurrentStatusResponse, StatusResponse } from '@/types';
import { getTimezoneOffsetMinutes } from './date-range';
import { buildStatusApiUrl } from './status-api-url';
import { applyStatusUpdate } from './status-data';

/** Injectable fetch for tests and page.tsx. */
export type StatusFetch = (url: string) => Promise<Response>;

/** Options for the initial or refresh load sequence. */
export interface LoadStatusSequenceOptions {
  brand: BrandId;
  fetch: StatusFetch;
  /** When false, skip the fast currentOnly request (manual refresh path). */
  withPriority?: boolean;
  /** Read latest merged state before each merge (typically a ref getter). */
  getCurrent: () => StatusResponse | null;
  /** Called after each successful phase with merged data. */
  onUpdate: (data: StatusResponse) => void;
}

function scheduleIdle(task: () => void): void {
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(task, { timeout: 5000 });
    return;
  }
  setTimeout(task, 0);
}

async function fetchBrandCurrent(
  brand: BrandId,
  tz: number,
  fetchFn: StatusFetch,
  getCurrent: () => StatusResponse | null,
  onUpdate: (data: StatusResponse) => void,
): Promise<boolean> {
  const currentUrl = buildStatusApiUrl({ tzOffset: tz, brand, currentOnly: true });
  const res = await fetchFn(currentUrl);
  if (!res.ok) return false;
  const json: CurrentStatusResponse = await res.json();
  onUpdate(applyStatusUpdate(getCurrent(), json, tz));
  return true;
}

async function fetchBrandFull(
  brand: BrandId,
  tz: number,
  fetchFn: StatusFetch,
  getCurrent: () => StatusResponse | null,
  onUpdate: (data: StatusResponse) => void,
): Promise<boolean> {
  const brandFullUrl = buildStatusApiUrl({ tzOffset: tz, brand });
  const res = await fetchFn(brandFullUrl);
  if (!res.ok) return false;
  const json: StatusResponse = await res.json();
  onUpdate(applyStatusUpdate(getCurrent(), json, tz));
  return true;
}

/**
 * Run the load sequence against /api/status.
 * 1. currentOnly — badges appear quickly (history omitted).
 * 2. brand-full — 30-day history for the active brand (today + persist immutable days).
 * 3. idle preload — each inactive brand: currentOnly then brand-full.
 */
export async function loadStatusSequence({
  brand,
  fetch: fetchFn,
  withPriority = true,
  getCurrent,
  onUpdate,
}: LoadStatusSequenceOptions): Promise<{
  hadPriority: boolean;
  hadBrandFull: boolean;
  hadOtherBrandPreload: boolean;
}> {
  const tz = getTimezoneOffsetMinutes();
  let hadPriority = false;
  let hadBrandFull = false;
  let hadOtherBrandPreload = false;

  if (withPriority) {
    hadPriority = await fetchBrandCurrent(brand, tz, fetchFn, getCurrent, onUpdate);
  }

  if (!brandHasTodayData(getCurrent(), brand)) {
    hadBrandFull = await fetchBrandFull(brand, tz, fetchFn, getCurrent, onUpdate);
  } else {
    hadBrandFull = true;
  }

  const otherBrands = BRANDS.map((b) => b.id).filter((id) => id !== brand);

  await new Promise<void>((resolve) => {
    scheduleIdle(() => {
      void (async () => {
        try {
          for (const other of otherBrands) {
            const current = getCurrent();
            if (countLoadedForBrand(current, other) < SERVICES_BY_BRAND[other].length) {
              await fetchBrandCurrent(other, tz, fetchFn, getCurrent, onUpdate);
            }
            if (!brandHasTodayData(getCurrent(), other)) {
              const ok = await fetchBrandFull(other, tz, fetchFn, getCurrent, onUpdate);
              if (ok) hadOtherBrandPreload = true;
            } else {
              hadOtherBrandPreload = true;
            }
          }
        } finally {
          resolve();
        }
      })();
    });
  });

  return { hadPriority, hadBrandFull, hadOtherBrandPreload };
}