'use client';

import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';
import { BrandToggle } from '@/components/BrandToggle/BrandToggle';
import { BRAND_NAVBAR } from '@/lib/brand-navbar';
import { SITE_CONFIG, type BrandId } from '@/config';

interface StatusNavbarProps {
  activeBrand: BrandId;
  onBrandChange: (brand: BrandId) => void;
}

export default function StatusNavbar({ activeBrand, onBrandChange }: StatusNavbarProps) {
  const config = BRAND_NAVBAR[activeBrand];

  const logo = config.useImageLogo ? (
    <a href={config.brandHref} className="nav-logo">
      <Image
        src="/img/logo-text-white.png"
        alt={SITE_CONFIG.name}
        className="nav-logo-img"
        width={120}
        height={28}
        priority
      />
    </a>
  ) : undefined;

  return (
    <Navbar
      brandName={config.brandName}
      brandHref={config.brandHref}
      navbarBg="#52006A"
      links={config.links}
      logo={logo}
      controls={
        <BrandToggle
          active={activeBrand}
          onChange={onBrandChange}
          className="nav-brand-pill"
        />
      }
    />
  );
}