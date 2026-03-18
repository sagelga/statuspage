'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar/Navbar';
import { Footer } from '@/components/Footer/Footer';
import { Hero } from '@/components/Hero/Hero';
import { ServiceList } from '@/components/ServiceList/ServiceList';
import { IncidentHistory } from '@/components/IncidentHistory/IncidentHistory';
import { ApiSection } from '@/components/ApiSection/ApiSection';
import { StatusResponse, ServiceStatus } from '@/types';
import { BRANDS, SERVICES_BY_BRAND, BrandId } from '@/config';

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

export default function Home() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [error, setError] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [activeBrand, setActiveBrand] = useState<BrandId>('byteside');
  const [brandFading, setBrandFading] = useState(false);

  useEffect(() => {
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(systemPrefersDark);
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark-theme');
      document.documentElement.classList.remove('light-theme');
    } else {
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark-theme');
    }
  }, [isDark]);

  useEffect(() => {
    if (activeBrand === 'sagelga') {
      document.documentElement.classList.add('sagelga-brand');
    } else {
      document.documentElement.classList.remove('sagelga-brand');
    }
  }, [activeBrand]);

  // Read brand from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const brandParam = params.get('brand') as BrandId | null;
    if (brandParam === 'sagelga' || brandParam === 'byteside') {
      setActiveBrand(brandParam);
    }
  }, []);

  const loadStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/status');
      if (!response.ok) throw new Error('Failed to fetch');
      const json: StatusResponse = await response.json();
      setData(json);
      setError(false);
    } catch (err) {
      console.error(err);
      setError(true);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const toggleTheme = () => setIsDark(!isDark);

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

  const brandServiceIds = new Set(SERVICES_BY_BRAND[activeBrand].map(s => s.id));
  const brandServices = data?.services?.filter(s => brandServiceIds.has(s.id));
  const brandStatus: ServiceStatus | 'loading' = brandServices
    ? brandServices.some(s => s.status === 'down') ? 'down'
      : brandServices.some(s => s.status === 'degraded') ? 'degraded'
      : 'operational'
    : 'loading';
  const activeBrandMeta = BRANDS.find(b => b.id === activeBrand)!;

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar brand={activeBrand} onBrandChange={handleBrandChange} />
      <div className={`page-wrap${brandFading ? ' brand-fade' : ''}`}>
        <Hero
          status={error ? ('down' as ServiceStatus) : data ? brandStatus : 'loading'}
          checkedAt={data?.checkedAt}
          error={error}
        />

        <div className="about-blurb">
          {activeBrandMeta.description}
        </div>

        <ServiceList
          checkedAt={data?.checkedAt || new Date().toISOString()}
          services={brandServices}
          history={data?.history}
          onRefresh={loadStatus}
        />

        <IncidentHistory />
        <ApiSection />
      </div>
      <Footer isDark={isDark} onToggleTheme={toggleTheme} brand={activeBrand} />
    </main>
  );
}
