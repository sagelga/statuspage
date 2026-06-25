'use client';

/**
 * Main status page (client component).
 * - Initial load: active brand currentOnly → brand-full, then idle per-other-brand preload.
 * - Immutable history (days before today) cached in localStorage.
 * - Brand switch uses in-memory + cache state; fetches only missing data.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import StatusNavbar from '@/components/layout/StatusNavbar';
import Footer from '@/components/layout/Footer';
import { Hero } from '@/components/Hero/Hero';
import { ServiceList } from '@/components/ServiceList/ServiceList';
import { IncidentHistory } from '@/components/IncidentHistory/IncidentHistory';
import { ApiSection } from '@/components/ApiSection/ApiSection';
import type { CurrentStatusResponse, StatusResponse, ServiceStatus, FooterColumn } from '@/types';
import { BRANDS, SERVICES_BY_BRAND, BrandId } from '@/config';
import { brandHasTodayData, countLoadedForBrand } from '@/lib/brand-status';
import { applyStatusUpdate } from '@/lib/status-data';
import { buildInitialStateFromCache } from '@/lib/history-cache';
import { loadStatusSequence } from '@/lib/load-status-sequence';
import { getTimezoneOffsetMinutes } from '@/lib/date-range';
import { buildStatusApiUrl } from '@/lib/status-api-url';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'สถานะระบบ ByteSide.one',
  description: 'ตรวจสอบสถานะการทำงานของบริการทั้งหมดในเครือ ByteSide.one แบบเรียลไทม์',
  url: 'https://status.sagelga.com',
  inLanguage: 'th',
  publisher: {
    '@type': 'Organization',
    name: 'ByteSide.one',
    url: 'https://beta.byteside.one',
    logo: {
      '@type': 'ImageObject',
      url: 'https://status.sagelga.com/img/logo-large.png',
    },
  },
};

const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: 'ByteSide.one',
    links: [
      { label: 'Blog', href: 'https://beta.byteside.one/blog', external: true },
      { label: 'About', href: 'https://beta.byteside.one/about', external: true },
      { label: 'Contact', href: 'https://beta.byteside.one/contact', external: true },
    ],
  },
  {
    title: 'Community',
    links: [
      { label: 'Facebook', href: 'https://facebook.com/byteside', external: true },
      { label: 'Twitter', href: 'https://twitter.com/byteside', external: true },
      { label: 'YouTube', href: 'https://youtube.com/byteside', external: true },
    ],
  },
];

function getInitialBrand(): BrandId {
  if (typeof window === 'undefined') return 'byteside';
  const params = new URLSearchParams(window.location.search);
  const brandParam = params.get('brand');
  if (brandParam === 'sagelga' || brandParam === 'byteside') return brandParam;
  return 'byteside';
}

export default function Home() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [error, setError] = useState(false);
  const [activeBrand, setActiveBrand] = useState<BrandId>(getInitialBrand);
  const [brandFading, setBrandFading] = useState(false);
  const dataRef = useRef<StatusResponse | null>(null);
  const initialLoadDone = useRef(false);
  const activeBrandRef = useRef(activeBrand);
  const lastFullRefreshRef = useRef(0);
  const FULL_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

  useEffect(() => {
    activeBrandRef.current = activeBrand;
  }, [activeBrand]);

  useEffect(() => {
    if (activeBrand === 'sagelga') {
      document.documentElement.classList.add('sagelga-brand');
    } else {
      document.documentElement.classList.remove('sagelga-brand');
    }
  }, [activeBrand]);

  const applyData = useCallback((next: StatusResponse) => {
    dataRef.current = next;
    setData(next);
    setError(false);
  }, []);

  const applyIncoming = useCallback((
    incoming: StatusResponse | CurrentStatusResponse,
  ) => {
    const tz = getTimezoneOffsetMinutes();
    applyData(applyStatusUpdate(dataRef.current, incoming, tz));
  }, [applyData]);

  const fetchBrandCurrent = useCallback(async (brand: BrandId) => {
    const tz = getTimezoneOffsetMinutes();
    try {
      const url = buildStatusApiUrl({ tzOffset: tz, brand, currentOnly: true });
      const currentRes = await fetch(url);
      if (currentRes.ok) {
        const currentJson: CurrentStatusResponse = await currentRes.json();
        applyIncoming(currentJson);
      }
    } catch (err) {
      console.error('Current status fetch failed:', err);
    }
  }, [applyIncoming]);

  const fetchBrandFull = useCallback(async (brand: BrandId) => {
    const tz = getTimezoneOffsetMinutes();
    try {
      const url = buildStatusApiUrl({ tzOffset: tz, brand });
      const fullRes = await fetch(url);
      if (fullRes.ok) {
        const fullJson: StatusResponse = await fullRes.json();
        applyIncoming(fullJson);
        lastFullRefreshRef.current = Date.now();
      }
    } catch (err) {
      console.error('Brand full status fetch failed:', err);
    }
  }, [applyIncoming]);

  const ensureBrandLoaded = useCallback(async (brand: BrandId) => {
    const expected = SERVICES_BY_BRAND[brand].length;
    if (countLoadedForBrand(dataRef.current, brand) < expected) {
      await fetchBrandCurrent(brand);
    }
    if (!brandHasTodayData(dataRef.current, brand)) {
      await fetchBrandFull(brand);
    }
  }, [fetchBrandCurrent, fetchBrandFull]);

  const loadFullStatus = useCallback(async () => {
    const tz = getTimezoneOffsetMinutes();
    const brand = activeBrandRef.current;
    const now = Date.now();
    try {
      const currentUrl = buildStatusApiUrl({ tzOffset: tz, brand, currentOnly: true });
      const currentRes = await fetch(currentUrl);
      if (!currentRes.ok) throw new Error('Failed to fetch current status');
      const currentJson: CurrentStatusResponse = await currentRes.json();
      applyIncoming(currentJson);

      if (now - lastFullRefreshRef.current >= FULL_REFRESH_INTERVAL_MS) {
        await fetchBrandFull(brand);
      }
    } catch (err) {
      console.error(err);
      if (!dataRef.current) setError(true);
    }
  }, [applyIncoming, fetchBrandFull]);

  // Hydrate immutable history from localStorage before the first network fetch
  useEffect(() => {
    const tz = getTimezoneOffsetMinutes();
    const cached = buildInitialStateFromCache(tz);
    if (cached) applyData(cached);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mount: active brand first, then idle preload for other brands
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const brand = activeBrandRef.current;
        const { hadBrandFull } = await loadStatusSequence({
          brand,
          fetch: (url) => fetch(url),
          withPriority: true,
          getCurrent: () => dataRef.current,
          onUpdate: (next) => {
            if (!cancelled) applyData(next);
          },
        });
        if (!cancelled && !hadBrandFull && !dataRef.current?.services?.length) setError(true);
      } catch (err) {
        console.error(err);
        if (!cancelled && !dataRef.current?.services?.length) setError(true);
      } finally {
        if (!cancelled) initialLoadDone.current = true;
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // activeBrand changes (incl. URL ?brand=): top up missing services/history for that brand
  useEffect(() => {
    if (!initialLoadDone.current) return;
    void ensureBrandLoaded(activeBrand);
  }, [activeBrand, ensureBrandLoaded]);

  const handleBrandChange = (brand: BrandId) => {
    if (brand === activeBrand) return;
    const url = brand === 'byteside' ? window.location.pathname : `${window.location.pathname}?brand=${brand}`;
    window.history.replaceState(null, '', url);
    setActiveBrand(brand);
    setBrandFading(true);
    void ensureBrandLoaded(brand);
    setTimeout(() => setBrandFading(false), 160);
  };

  const visibleServices = SERVICES_BY_BRAND[activeBrand];
  const brandServiceIds = new Set(visibleServices.map(s => s.id));
  const brandServices = data?.services?.filter(s => brandServiceIds.has(s.id));
  const expectedCount = visibleServices.length;
  const loadedCount = brandServices?.length ?? 0;
  const allBrandLoaded = loadedCount === expectedCount && brandServices !== undefined;

  const brandStatus: ServiceStatus | 'loading' = !allBrandLoaded
    ? 'loading'
    : brandServices.some(s => s.status === 'down') ? 'down'
    : brandServices.some(s => s.status === 'degraded') ? 'degraded'
    : 'operational';
  const activeBrandMeta = BRANDS.find(b => b.id === activeBrand)!;
  const historyLoading = data !== null && !brandHasTodayData(data, activeBrand);

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <StatusNavbar activeBrand={activeBrand} onBrandChange={handleBrandChange} />
      <div className={`page-wrap${brandFading ? ' brand-fade' : ''}`}>
        <Hero
          status={error ? ('down' as ServiceStatus) : brandStatus}
          checkedAt={data?.checkedAt}
          error={error}
        />

        <div className="about-blurb">
          {activeBrandMeta.description}
        </div>

        <ServiceList
          checkedAt={data?.checkedAt || new Date().toISOString()}
          visibleServices={visibleServices}
          services={brandServices}
          history={data?.history}
          dailyUptime={data?.dailyUptime}
          dailyFuncUptime={data?.dailyFuncUptime}
          historyLoading={historyLoading}
          onRefresh={loadFullStatus}
        />

        <IncidentHistory />
        <ApiSection />
      </div>
      <Footer
        brandName="ByteSide.one"
        brandHref="https://beta.byteside.one"
        tagline="Status Page by sagelga"
        columns={FOOTER_COLUMNS}
        author="sagelga"
        authorHref="https://sagelga.com"
      />
    </main>
  );
}