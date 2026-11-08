'use client';

/**
 * Owns all client-side status state:
 * - three-phase initial load (badges → brand history → cross-brand cache)
 * - brand switching with a short fade
 * - periodic refresh (badges every minute, full history every five)
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { BrandId } from '@/config';
import { getTimezoneOffsetMinutes } from '@/lib/date-range';
import { loadStatusSequence } from '@/lib/load-status-sequence';
import { mergeStatusData } from '@/lib/status-data';
import { buildStatusApiUrl } from '@/lib/status-api-url';
import type { CurrentStatusResponse, StatusResponse } from '@/types';

const FULL_REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const BRAND_FADE_MS = 160;

export interface UseStatusDataResult {
  data: StatusResponse | null;
  error: boolean;
  activeBrand: BrandId;
  brandFading: boolean;
  changeBrand: (brand: BrandId) => void;
  refresh: () => Promise<void>;
}

export function useStatusData(initialBrand: BrandId): UseStatusDataResult {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [error, setError] = useState(false);
  const [activeBrand, setActiveBrand] = useState<BrandId>(initialBrand);
  const [brandFading, setBrandFading] = useState(false);

  const dataRef = useRef<StatusResponse | null>(null);
  const activeBrandRef = useRef(activeBrand);
  const lastFullRefreshRef = useRef(0);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the ref in sync for async callbacks that outlive a render.
  useEffect(() => {
    activeBrandRef.current = activeBrand;
  }, [activeBrand]);

  // Brand-specific palette lives on <html> so CSS can theme the whole document.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('sagelga-brand', activeBrand === 'sagelga');
    root.classList.toggle('thaipatmetal-brand', activeBrand === 'thaipatmetal');
  }, [activeBrand]);

  useEffect(
    () => () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    },
    [],
  );

  const applyData = useCallback((next: StatusResponse) => {
    dataRef.current = next;
    setData(next);
    setError(false);
  }, []);

  const fetchBrandCurrent = useCallback(
    async (brand: BrandId) => {
      try {
        const url = buildStatusApiUrl({
          tzOffset: getTimezoneOffsetMinutes(),
          brand,
          currentOnly: true,
        });
        const response = await fetch(url);
        if (!response.ok) return;
        const payload: CurrentStatusResponse = await response.json();
        if (activeBrandRef.current !== brand) return;
        applyData(mergeStatusData(dataRef.current, payload));
      } catch (err) {
        console.error('Current status fetch failed:', err);
      }
    },
    [applyData],
  );

  const fetchBrandFull = useCallback(
    async (brand: BrandId) => {
      try {
        const url = buildStatusApiUrl({ tzOffset: getTimezoneOffsetMinutes(), brand });
        const response = await fetch(url);
        if (!response.ok) return;
        const payload: StatusResponse = await response.json();
        if (activeBrandRef.current !== brand) return;
        applyData(mergeStatusData(dataRef.current, payload));
      } catch (err) {
        console.error('Brand full status fetch failed:', err);
      }
    },
    [applyData],
  );

  /** Manual/periodic refresh: badges always, history at most every five minutes. */
  const refresh = useCallback(async () => {
    const brand = activeBrandRef.current;
    const now = Date.now();

    try {
      const currentUrl = buildStatusApiUrl({
        tzOffset: getTimezoneOffsetMinutes(),
        brand,
        currentOnly: true,
      });
      const currentResponse = await fetch(currentUrl);
      if (!currentResponse.ok) throw new Error('Failed to fetch current status');
      const currentPayload: CurrentStatusResponse = await currentResponse.json();
      if (activeBrandRef.current !== brand) return;
      applyData(mergeStatusData(dataRef.current, currentPayload));

      if (now - lastFullRefreshRef.current < FULL_REFRESH_INTERVAL_MS) return;

      const fullUrl = buildStatusApiUrl({
        tzOffset: getTimezoneOffsetMinutes(),
        brand,
      });
      const fullResponse = await fetch(fullUrl);
      if (!fullResponse.ok) return;
      const fullPayload: StatusResponse = await fullResponse.json();
      if (activeBrandRef.current !== brand) return;
      applyData(mergeStatusData(dataRef.current, fullPayload));
      lastFullRefreshRef.current = now;
    } catch (err) {
      console.error(err);
      if (!dataRef.current) setError(true);
    }
  }, [applyData]);

  // Mount: three-phase load — fast badges, then brand history, then all-brand cache.
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const brand = activeBrandRef.current;

      try {
        const { hadFull, hadBrandFull } = await loadStatusSequence({
          brand,
          fetch: (url) => fetch(url),
          withPriority: true,
          getCurrent: () => dataRef.current,
          onUpdate: (next) => {
            if (!cancelled && activeBrandRef.current === brand) applyData(next);
          },
        });

        if (cancelled || activeBrandRef.current !== brand) return;

        // Phase 2 can fail independently; retry it once before giving up.
        if (!hadBrandFull && !hadFull) {
          await fetchBrandFull(brand);
        }

        if (!hadFull && !dataRef.current) setError(true);
      } catch (err) {
        console.error(err);
        if (!cancelled && !dataRef.current) setError(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applyData, fetchBrandFull]);

  const changeBrand = useCallback(
    (brand: BrandId) => {
      if (brand === activeBrand) return;

      const query = brand === 'byteside' ? '' : `?brand=${brand}`;
      window.history.replaceState(null, '', `${window.location.pathname}${query}`);

      activeBrandRef.current = brand;
      setActiveBrand(brand);
      setBrandFading(true);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = setTimeout(() => setBrandFading(false), BRAND_FADE_MS);

      // Sequential: badges first, then that brand's history.
      void (async () => {
        await fetchBrandCurrent(brand);
        if (activeBrandRef.current !== brand) return;
        await fetchBrandFull(brand);
      })();
    },
    [activeBrand, fetchBrandCurrent, fetchBrandFull],
  );

  return { data, error, activeBrand, brandFading, changeBrand, refresh };
}
