/**
 * Client shell for the status page. Data loading lives in useStatusData; this
 * component owns the page markup and derives the visible brand slice.
 */
'use client';

import React from 'react';
import StatusNavbar from '@/components/layout/StatusNavbar';
import Footer from '@/components/layout/Footer';
import { Hero } from '@/components/Hero/Hero';
import { ServiceList } from '@/components/ServiceList/ServiceList';
import { IncidentHistory } from '@/components/IncidentHistory/IncidentHistory';
import { ApiSection } from '@/components/ApiSection/ApiSection';
import type { BrandId } from '@/config';
import {
  BRANDS,
  SERVICES_BY_BRAND,
} from '@/config';
import type { FooterColumn, ServiceStatus, StatusResponse } from '@/types';
import { brandHasHistory } from '@/lib/brand-status';
import { aggregateStatus } from '@/lib/status-policy';
import { useStatusData } from '@/hooks/useStatusData';

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

/** Restrict merged status data to the active brand's services. */
function selectBrandServices(data: StatusResponse | null, brand: BrandId) {
  if (!data?.services) return undefined;
  const brandIds = new Set(SERVICES_BY_BRAND[brand].map((service) => service.id));
  return data.services.filter((service) => brandIds.has(service.id));
}

export default function StatusPageClient({ initialBrand }: { initialBrand: BrandId }) {
  const { data, error, activeBrand, brandFading, changeBrand, refresh } =
    useStatusData(initialBrand);

  const visibleServices = SERVICES_BY_BRAND[activeBrand];
  const brandServices = selectBrandServices(data, activeBrand);
  const allBrandLoaded = brandServices?.length === visibleServices.length;

  const brandStatus: ServiceStatus | 'loading' =
    allBrandLoaded && brandServices
      ? aggregateStatus(brandServices.map((service) => service.status))
      : 'loading';

  const activeBrandMeta = BRANDS.find((brand) => brand.id === activeBrand) ?? BRANDS[0];
  const historyLoading = data !== null && !brandHasHistory(data, activeBrand);

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <StatusNavbar activeBrand={activeBrand} onBrandChange={changeBrand} />
      <div className={`page-wrap${brandFading ? ' brand-fade' : ''}`}>
        <Hero
          status={error ? 'down' : brandStatus}
          checkedAt={data?.checkedAt}
          error={error}
        />

        <div className="about-blurb">{activeBrandMeta.description}</div>

        <ServiceList
          checkedAt={data?.checkedAt || new Date().toISOString()}
          visibleServices={visibleServices}
          services={brandServices}
          history={data?.history}
          dailyUptime={data?.dailyUptime}
          dailyFuncUptime={data?.dailyFuncUptime}
          historyLoading={historyLoading}
          onRefresh={refresh}
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
