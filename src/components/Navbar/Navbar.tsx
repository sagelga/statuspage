import React from 'react';
import Image from 'next/image';
import { SITE_CONFIG, BrandId } from '@/config';
import { BrandToggle } from '@/components/BrandToggle/BrandToggle';
import './Navbar.style.css';

interface NavbarProps {
  brand: BrandId;
  onBrandChange: (brand: BrandId) => void;
}

interface NavLink { label: string; url: string }

const NAV_CONFIG: Record<BrandId, {
  logo: React.ReactNode;
  links: NavLink[];
}> = {
  sagelga: {
    logo: <a href="https://sagelga.com" className="nav-logo nav-logo-text">sagelga</a>,
    links: [
      { label: 'sagelga', url: 'https://sagelga.com' },
      { label: 'Mahjong Hands', url: 'https://mahjong-hands.sagelga.com' },
      { label: 'Telegram Thai', url: 'https://telegram-thai.sagelga.com' },
      { label: 'Documentation', url: 'https://docs.sagelga.com' },
      { label: 'Learn', url: 'https://learn.sagelga.com' },
    ],
  },
  byteside: {
    logo: (
      <a href="https://beta.byteside.one" className="nav-logo">
        <Image src="/img/logo-text-white.png" alt={SITE_CONFIG.name} className="nav-logo-img" width={120} height={28} />
      </a>
    ),
    links: [
      { label: 'เกมมิ่ง', url: 'https://beta.byteside.one/blog/tags/gaming' },
      { label: 'เทคโนโลยี', url: 'https://beta.byteside.one/blog/tags/tech-news' },
      { label: 'รีวิว', url: 'https://beta.byteside.one/blog/tags/reviews' },
      { label: 'คริปโต', url: 'https://beta.byteside.one/blog/tags/crypto' },
      { label: 'บล็อก', url: 'https://beta.byteside.one/blog' },
    ],
  },
};

export const Navbar: React.FC<NavbarProps> = ({ brand, onBrandChange }) => {
  const config = NAV_CONFIG[brand];

  return (
    <nav className="navbar">
      <div className="nav-top">
        <div className="nav-top-inner">
          {config.logo}
          <div className="nav-top-right">
            <BrandToggle active={brand} onChange={onBrandChange} className="nav-brand-pill" />
          </div>
        </div>
      </div>
      <div className="nav-bottom">
        <div className="nav-bottom-inner">
          <ul className="nav-list" id="nav-tabs">
            {config.links.map((link) => (
              <li key={link.url}>
                <a href={link.url} className="nav-link">{link.label}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
};
