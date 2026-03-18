import React from 'react';
import { SITE_CONFIG, BrandId, BRANDS } from '@/config';
import './Navbar.style.css';

interface NavbarProps {
  brand: BrandId;
  onBrandChange: (brand: BrandId) => void;
}

const BrandPill: React.FC<{ brand: BrandId; onBrandChange: (b: BrandId) => void }> = ({ brand, onBrandChange }) => (
  <div className="nav-brand-pill" role="tablist" aria-label="เลือกแบรนด์">
    {BRANDS.map(b => (
      <button
        key={b.id}
        role="tab"
        aria-selected={brand === b.id}
        className={`nav-brand-btn${brand === b.id ? ' active' : ''}`}
        onClick={() => onBrandChange(b.id)}
      >
        {b.label}
      </button>
    ))}
  </div>
);

export const Navbar: React.FC<NavbarProps> = ({ brand, onBrandChange }) => {
  if (brand === 'sagelga') {
    return (
      <nav className="navbar">
        <div className="nav-top">
          <div className="nav-top-inner">
            <a href="https://sagelga.com" className="nav-logo nav-logo-text">sagelga</a>
            <div className="nav-top-right">
              <BrandPill brand={brand} onBrandChange={onBrandChange} />
            </div>
          </div>
        </div>
        <div className="nav-bottom">
          <div className="nav-bottom-inner">
            <ul className="nav-list" id="nav-tabs">
              <li><a href="https://sagelga.com" className="nav-link">หน้าหลัก</a></li>
              <li><a href="https://mahjong-hands.sagelga.com" className="nav-link">Mahjong Hands</a></li>
              <li><a href="https://telegram-thai.sagelga.com" className="nav-link">Telegram Thai</a></li>
              <li><a href="https://docs.sagelga.com" className="nav-link">Docs</a></li>
              <li><a href="https://learn.sagelga.com" className="nav-link">Learn</a></li>
            </ul>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar">
      <div className="nav-top">
        <div className="nav-top-inner">
          <a href="https://beta.byteside.one" className="nav-logo">
            <img src="/img/logo-text-white.png" alt={SITE_CONFIG.name} className="nav-logo-img" />
          </a>
          <div className="nav-top-right">
            <BrandPill brand={brand} onBrandChange={onBrandChange} />
          </div>
        </div>
      </div>
      <div className="nav-bottom">
        <div className="nav-bottom-inner">
          <ul className="nav-list" id="nav-tabs">
            <li><a href="https://beta.byteside.one/blog/tags/gaming" className="nav-link">เกมมิ่ง</a></li>
            <li><a href="https://beta.byteside.one/blog/tags/tech-news" className="nav-link">เทคโนโลยี</a></li>
            <li><a href="https://beta.byteside.one/blog/tags/reviews" className="nav-link">รีวิว</a></li>
            <li><a href="https://beta.byteside.one/blog/tags/crypto" className="nav-link">คริปโต</a></li>
            <li><a href="https://beta.byteside.one/blog" className="nav-link">บล็อก</a></li>
          </ul>
        </div>
      </div>
    </nav>
  );
};
