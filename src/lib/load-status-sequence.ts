import type { BrandId } from '@/config';
import type { StatusResponse } from '@/types';
import { buildStatusApiUrl } from './status-api-url';
import { mergeStatusData } from './status-data';

export type StatusFetch = (url: string) => Promise<Response>;

export interface LoadStatusSequenceOptions {
  brand: BrandId;
  fetch: StatusFetch;
  withPriority?: boolean;
  getCurrent: () => StatusResponse | null;
  onUpdate: (data: StatusResponse) => void;
}

/**
 * Fetch fast current-status for the active brand first, then the full payload.
 * Current-only response is merged for badges; full response replaces as last-writer-wins.
 */
export async function loadStatusSequence({
  brand,
  fetch: fetchFn,
  withPriority = true,
  getCurrent,
  onUpdate,
}: LoadStatusSequenceOptions): Promise<{ hadPriority: boolean; hadFull: boolean }> {
  const tz = -new Date().getTimezoneOffset();
  let hadPriority = false;
  let hadFull = false;

  if (withPriority) {
    const currentUrl = buildStatusApiUrl({ tzOffset: tz, brand, currentOnly: true });
    const priorityRes = await fetchFn(currentUrl);
    if (priorityRes.ok) {
      const priorityJson: StatusResponse = await priorityRes.json();
      onUpdate(mergeStatusData(getCurrent(), priorityJson));
      hadPriority = true;
    }
  }

  const fullUrl = buildStatusApiUrl({ tzOffset: tz });
  const fullRes = await fetchFn(fullUrl);
  if (fullRes.ok) {
    const fullJson: StatusResponse = await fullRes.json();
    onUpdate(fullJson);
    hadFull = true;
  }

  return { hadPriority, hadFull };
}