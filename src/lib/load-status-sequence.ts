import type { BrandId } from '@/config';
import type { StatusResponse } from '@/types';
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
 * Fetch active-brand data first (?brand=), then the full unfiltered payload.
 * Priority response is merged; full response replaces as last-writer-wins.
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
    const priorityRes = await fetchFn(`/api/status?brand=${brand}&tzOffset=${tz}`);
    if (priorityRes.ok) {
      const priorityJson: StatusResponse = await priorityRes.json();
      onUpdate(mergeStatusData(getCurrent(), priorityJson));
      hadPriority = true;
    }
  }

  const fullRes = await fetchFn(`/api/status?tzOffset=${tz}`);
  if (fullRes.ok) {
    const fullJson: StatusResponse = await fullRes.json();
    onUpdate(fullJson);
    hadFull = true;
  }

  return { hadPriority, hadFull };
}