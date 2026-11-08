'use client';

/**
 * Main status page (client component).
 * - Initial load: three-phase sequence via loadStatusSequence (currentOnly → brand-full → all-full).
 * - Brand switch: awaits currentOnly before brand-full so badges appear before history bars.
 * - Merges partial API payloads with mergeStatusData to preserve cached cross-brand history.
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
import { brandHasHistory, countLoadedForBrand } from '@/lib/brand-status';
import { mergeStatusData } from '@/lib/status-data';
import { loadStatusSequence } from '@/lib/load-status-sequence';
import { getTimezoneOffsetMinutes } from '@/lib/date-range';
import { buildStatusApiUrl } from '@/lib/status-api-url';
import { isValidBrandParam } from '@/lib/brand-filter';

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

export default function Home() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [error, setError] = useState(false);
  // Always start from byteside so SSR and the first client render match.
  // The URL brand is applied after mount (deep-link support without hydration errors).
  const [activeBrand, setActiveBrand] = useState<BrandId>('byteside');
  const [brandResolved, setBrandResolved] = useState(false);
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
    const root = document.documentElement;
    root.classList.toggle('sagelga-brand', activeBrand === 'sagelga');
    root.classList.toggle('thaipatmetal-brand', activeBrand === 'thaipatmetal');
  }, [activeBrand]);

  // Resolve ?brand= after hydration so the server-rendered byteside markup
  // remains valid, then let the load effect below use the resolved brand.
  useEffect(() => {
    const brandParam = new URLSearchParams(window.location.search).get('brand');
    if (isValidBrandParam(brandParam) && brandParam !== 'byteside') {
      setActiveBrand(brandParam);
    }
    setBrandResolved(true);
  }, []);

  const applyData = useCallback((next: StatusResponse) => {
    dataRef.current = next;
    setData(next);
    setError(false);
  }, []);

  const fetchBrandCurrent = useCallback(async (brand: BrandId) => {
    const tz = getTimezoneOffsetMinutes();
    try {
      const url = buildStatusApiUrl({ tzOffset: tz, brand, currentOnly: true });
      const currentRes = await fetch(url);
      if (currentRes.ok) {
        const currentJson: CurrentStatusResponse = await currentRes.json();
        applyData(mergeStatusData(dataRef.current, currentJson));
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Current status fetch failed:', err);
      setError(true);
    }
  }, [applyData]);

  const fetchBrandFull = useCallback(async (brand: BrandId) => {
    const tz = getTimezoneOffsetMinutes();
    try {
      const url = buildStatusApiUrl({ tzOffset: tz, brand });
      const fullRes = await fetch(url);
      if (fullRes.ok) {
        const fullJson: StatusResponse = await fullRes.json();
        applyData(mergeStatusData(dataRef.current, fullJson));
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Brand full status fetch failed:', err);
      setError(true);
    }
  }, [applyData]);

  const loadFullStatus = useCallback(async () => {
    const tz = getTimezoneOffsetMinutes();
    const brand = activeBrandRef.current;
    const now = Date.now();
    try {
      const currentUrl = buildStatusApiUrl({ tzOffset: tz, brand, currentOnly: true });
      const currentRes = await fetch(currentUrl);
      if (!currentRes.ok) throw new Error('Failed to fetch current status');
      const currentJson: CurrentStatusResponse = await currentRes.json();
      applyData(mergeStatusData(dataRef.current, currentJson));

      if (now - lastFullRefreshRef.current >= FULL_REFRESH_INTERVAL_MS) {
        const fullUrl = buildStatusApiUrl({ tzOffset: tz, brand });
        const fullRes = await fetch(fullUrl);
        if (fullRes.ok) {
          const fullJson: StatusResponse = await fullRes.json();
          applyData(mergeStatusData(dataRef.current, fullJson));
          lastFullRefreshRef.current = now;
        } else {
          setError(true);
        }
      }
    } catch (err) {
      console.error(err);
      // Keep cached data visible, but tell the user it may be stale.
      setError(true);
    }
  }, [applyData]);

  // Mount: three-phase load — fast badges, then brand history, then all-brand cache
  // Wait until the post-hydration URL brand resolution has run.
  useEffect(() => {
    if (!brandResolved) return;
    let cancelled = false;
    (async () => {
      try {
        const brand = activeBrandRef.current;
        const { hadFull } = await loadStatusSequence({
          brand,
          fetch: (url) => fetch(url),
          withPriority: true,
          getCurrent: () => dataRef.current,
          onUpdate: (next) => {
            if (!cancelled) applyData(next);
          },
        });
        if (!cancelled && !hadFull && !dataRef.current) setError(true);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) initialLoadDone.current = true;
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandResolved]);

  // activeBrand changes (incl. URL ?brand=): top up missing services/history for that brand
  useEffect(() => {
    if (!initialLoadDone.current) return;
    const brand = activeBrand;
    const expected = SERVICES_BY_BRAND[brand].length;
    void (async () => {
      if (countLoadedForBrand(dataRef.current, brand) < expected) {
        await fetchBrandCurrent(brand);
      }
      if (!brandHasHistory(dataRef.current, brand)) {
        await fetchBrandFull(brand);
      }
    })();
  }, [activeBrand, fetchBrandCurrent, fetchBrandFull]);

  const handleBrandChange = (brand: BrandId) => {
    if (brand === activeBrand) return;
    const url = brand === 'byteside' ? window.location.pathname : `${window.location.pathname}?brand=${brand}`;
    window.history.replaceState(null, '', url);
    setActiveBrand(brand);
    setBrandFading(true);
    // Sequential: currentOnly badges before brand-full history (matches e2e request ordering)
    void (async () => {
      await fetchBrandCurrent(brand);
      await fetchBrandFull(brand);
    })();
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
  const affectedService = brandServices?.find(s => s.status === 'down')
    ?? brandServices?.find(s => s.status === 'degraded')
    ?? null;
  const downCount = brandServices?.filter(s => s.status === 'down').length ?? 0;
  const affectedCount = brandServices?.filter(s => s.status !== 'operational').length ?? 0;

  const uptime30d = (() => {
    if (!data?.dailyUptime) return null;
    // Average each service first so a service with more recorded days cannot
    // dominate the brand-wide figure. Require data for every visible service.
    const perService = visibleServices.map(svc => {
      const values = (data.dailyUptime?.[svc.id] ?? [])
        .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
      if (values.length === 0) return null;
      return values.reduce((sum, value) => sum + value, 0) / values.length;
    });
    if (perService.some(value => value === null)) return null;
    const average = (perService as number[]).reduce((sum, value) => sum + value, 0) / perService.length;
    return Math.round(average * 100) / 100;
  })();

  const activeBrandMeta = BRANDS.find(b => b.id === activeBrand)!;
  const historyLoading = data !== null && !brandHasHistory(data, activeBrand);

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <StatusNavbar activeBrand={activeBrand} onBrandChange={handleBrandChange} />
      <div className={`page-wrap${brandFading ? ' brand-fade' : ''}`}>
        <Hero
          status={brandStatus}
          checkedAt={data?.checkedAt}
          error={error}
          serviceCount={expectedCount}
          affectedService={affectedService ? {
            name: affectedService.name,
            responseTime: affectedService.responseTime,
            status: affectedService.status,
          } : null}
          affectedCount={affectedCount}
          downCount={downCount}
          uptime30d={uptime30d}
          onRefresh={loadFullStatus}
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
          loadError={error}
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