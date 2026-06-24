import type { BrandId } from '@/config';
import type { CurrentStatusResponse, StatusResponse } from '@/types';
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
 * Three-phase load: fast current badges → full history for active brand → full all brands.
 * Current and brand-full responses merge in; all-brands full merges last for cross-brand cache.
 */
export async function loadStatusSequence({
  brand,
  fetch: fetchFn,
  withPriority = true,
  getCurrent,
  onUpdate,
}: LoadStatusSequenceOptions): Promise<{ hadPriority: boolean; hadBrandFull: boolean; hadFull: boolean }> {
  const tz = -new Date().getTimezoneOffset();
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
  const fullRes = await fetchFn(allFullUrl);
  if (fullRes.ok) {
    const fullJson: StatusResponse = await fullRes.json();
    onUpdate(mergeStatusData(getCurrent(), fullJson));
    hadFull = true;
  }

  return { hadPriority, hadBrandFull, hadFull };
}