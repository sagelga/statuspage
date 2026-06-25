/**
 * Client-side three-phase status load: fast badges → brand history → cross-brand cache.
 */
import type { BrandId } from '@/config';
import type { CurrentStatusResponse, StatusResponse } from '@/types';
import { getTimezoneOffsetMinutes } from './date-range';
import { buildStatusApiUrl } from './status-api-url';
import { mergeStatusData } from './status-data';

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

/**
 * Run the three-phase load sequence against /api/status.
 * 1. currentOnly — badges appear quickly (history omitted).
 * 2. brand-full — 30-day history for the active brand.
 * 3. all-full — deferred cross-brand cache for instant tab switches.
 * Each phase merges into prior state via mergeStatusData.
 * @returns Flags indicating which phases returned OK responses
 */
export async function loadStatusSequence({
  brand,
  fetch: fetchFn,
  withPriority = true,
  getCurrent,
  onUpdate,
}: LoadStatusSequenceOptions): Promise<{ hadPriority: boolean; hadBrandFull: boolean; hadFull: boolean }> {
  const tz = getTimezoneOffsetMinutes();
  let hadPriority = false;
  let hadBrandFull = false;
  let hadFull = false;

  if (withPriority) {
    const currentUrl = buildStatusApiUrl({ tzOffset: tz, brand, currentOnly: true });
    const priorityRes = await fetchFn(currentUrl);
    if (priorityRes.ok) {
      const priorityJson: CurrentStatusResponse = await priorityRes.json();
      onUpdate(mergeStatusData(getCurrent(), priorityJson));
      hadPriority = true;
    }
  }

  const brandFullUrl = buildStatusApiUrl({ tzOffset: tz, brand });
  const brandFullRes = await fetchFn(brandFullUrl);
  if (brandFullRes.ok) {
    const brandFullJson: StatusResponse = await brandFullRes.json();
    onUpdate(mergeStatusData(getCurrent(), brandFullJson));
    hadBrandFull = true;
  }

  const allFullUrl = buildStatusApiUrl({ tzOffset: tz });
  await new Promise<void>((resolve) => {
    scheduleIdle(() => {
      void (async () => {
        try {
          const fullRes = await fetchFn(allFullUrl);
          if (fullRes.ok) {
            const fullJson: StatusResponse = await fullRes.json();
            onUpdate(mergeStatusData(getCurrent(), fullJson));
            hadFull = true;
          }
        } finally {
          resolve();
        }
      })();
    });
  });

  return { hadPriority, hadBrandFull, hadFull };
}