'use client';

/**
 * Main status page (client component).
 * - Initial load: three-phase sequence via loadStatusSequence (currentOnly → brand-full → all-full).
 * - Brand switch: awaits currentOnly before brand-full so badges appear before history bars.
 * - Merges partial API payloads with mergeStatusData to preserve cached cross-brand history.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Hero } from '@/components/Hero/Hero';
import { ServiceList } from '@/components/ServiceList/ServiceList';
import { IncidentHistory } from '@/components/IncidentHistory/IncidentHistory';
import { ApiSection } from '@/components/ApiSection/ApiSection';
import { BrandToggle } from '@/components/BrandToggle/BrandToggle';
import type { CurrentStatusResponse, StatusResponse, ServiceStatus, NavItem, FooterColumn } from '@/types';
import { BRANDS, SERVICES_BY_BRAND, BrandId } from '@/config';
import { brandHasHistory, countLoadedForBrand } from '@/lib/brand-status';
import { mergeStatusData } from '@/lib/status-data';
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

const NAV_LINKS: NavItem[] = [
  { label: 'Home', href: '/' },
];

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

  const fetchBrandCurrent = useCallback(async (brand: BrandId) => {
    const tz = getTimezoneOffsetMinutes();
    try {
      const url = buildStatusApiUrl({ tzOffset: tz, brand, currentOnly: true });
      const currentRes = await fetch(url);
      if (currentRes.ok) {
        const currentJson: CurrentStatusResponse = await currentRes.json();
        applyData(mergeStatusData(dataRef.current, currentJson));
      }
    } catch (err) {
      console.error('Current status fetch failed:', err);
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
      }
    } catch (err) {
      console.error('Brand full status fetch failed:', err);
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
        }
      }
    } catch (err) {
      console.error(err);
      if (!dataRef.current) setError(true);
    }
  }, [applyData]);

  // Mount: three-phase load — fast badges, then brand history, then all-brand cache
  useEffect(() => {
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
        if (!cancelled && !dataRef.current) setError(true);
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
  const activeBrandMeta = BRANDS.find(b => b.id === activeBrand)!;
  const historyLoading = data !== null && !brandHasHistory(data, activeBrand);

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar
        brandName="ByteSide.one"
        brandHref="/"
        navbarBg="#52006A"
        links={NAV_LINKS}
        controls={<BrandToggle active={activeBrand} onChange={handleBrandChange} className="nav-brand-pill" />}
      />
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