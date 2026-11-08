/**
 * Access to the STATUS_HISTORY KV namespace through the OpenNext context.
 * Kept separate from response building so the latter stays unit-testable.
 */
import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { StatusStore } from '@/lib/status-response';

declare global {
  interface CloudflareEnv {
    STATUS_HISTORY?: KVNamespace;
  }
}

/** Store used when the binding is unavailable (local dev, preview, misconfig). */
const EMPTY_STORE: StatusStore = {
  get: async () => null,
};

/**
 * Resolve the STATUS_HISTORY binding for the current request.
 * A missing binding degrades to "no data"; a failure to resolve the request
 * context is a real server error and is surfaced to the caller.
 */
export function getStatusStore(): StatusStore {
  const { env } = getCloudflareContext();
  const kv = env.STATUS_HISTORY;
  if (!kv) return EMPTY_STORE;

  return {
    get: (key: string) => kv.get(key),
  };
}
