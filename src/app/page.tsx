'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Hero } from '@/components/Hero/Hero';
import { ServiceList } from '@/components/ServiceList/ServiceList';
import { IncidentHistory } from '@/components/IncidentHistory/IncidentHistory';
import { ApiSection } from '@/components/ApiSection/ApiSection';
import { BrandToggle } from '@/components/BrandToggle/BrandToggle';
import { StatusResponse, ServiceStatus, NavItem, FooterColumn } from '@/types';
import { BRANDS, SERVICES_BY_BRAND, BrandId } from '@/config';
import { mergeStatusData } from '@/lib/status-data';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'สถานะระบบ ByteSide.one',
  description: 'ตรวจสอบสถานะการทำงานของบริการทั้งหมดในเครือ ByteSide.one แบบเรียลไทม์',
  url: 'https://status.byteside.one',
  inLanguage: 'th',
  publisher: {
    '@type': 'Organization',
    name: 'ByteSide.one',
    url: 'https://beta.byteside.one',
    logo: {
      '@type': 'ImageObject',
      url: 'https://status.byteside.one/img/logo-large.png',
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

function countLoadedForBrand(data: StatusResponse | null, brand: BrandId): number {
  if (!data?.services) return 0;
  const brandIds = new Set(SERVICES_BY_BRAND[brand].map((s) => s.id));
  return data.services.filter((s) => brandIds.has(s.id)).length;
}

export default function Home() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [error, setError] = useState(false);
  const [activeBrand, setActiveBrand] = useState<BrandId>(getInitialBrand);
  const [brandFading, setBrandFading] = useState(false);
  const dataRef = useRef<StatusResponse | null>(null);

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

  const fetchBrandPriority = useCallback(async (brand: BrandId) => {
    const tz = -new Date().getTimezoneOffset();
    try {
      const priorityRes = await fetch(`/api/status?brand=${brand}&tzOffset=${tz}`);
      if (priorityRes.ok) {
        const priorityJson: StatusResponse = await priorityRes.json();
        const merged = mergeStatusData(dataRef.current, priorityJson);
        applyData(merged);
      }
    } catch (err) {
      console.error('Priority fetch failed:', err);
    }
  }, [applyData]);

  const loadFullStatus = useCallback(async () => {
    const tz = -new Date().getTimezoneOffset();
    try {
      const response = await fetch(`/api/status?tzOffset=${tz}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const json: StatusResponse = await response.json();
      applyData(json);
    } catch (err) {
      console.error(err);
      if (!dataRef.current) setError(true);
    }
  }, [applyData]);

  useEffect(() => {
    loadFullStatus();
  }, [loadFullStatus]);

  useEffect(() => {
    const expected = SERVICES_BY_BRAND[activeBrand].length;
    if (countLoadedForBrand(dataRef.current, activeBrand) < expected) {
      fetchBrandPriority(activeBrand);
    }
  }, [activeBrand, fetchBrandPriority]);

  const handleBrandChange = (brand: BrandId) => {
    if (brand === activeBrand) return;
    const url = brand === 'byteside' ? window.location.pathname : `${window.location.pathname}?brand=${brand}`;
    window.history.replaceState(null, '', url);
    setBrandFading(true);
    setTimeout(() => {
      setActiveBrand(brand);
      setBrandFading(false);
    }, 160);
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