import React from 'react';
import { BRANDS, BrandId } from '@/config';
import './BrandToggle.style.css';

interface BrandToggleProps {
  active: BrandId;
  onChange: (brand: BrandId) => void;
}

export const BrandToggle: React.FC<BrandToggleProps> = ({ active, onChange }) => {
  return (
    <div className="brand-toggle" role="tablist" aria-label="เลือกแบรนด์">
      {BRANDS.map((brand) => (
        <button
          key={brand.id}
          role="tab"
          aria-selected={active === brand.id}
          className={`brand-toggle-btn${active === brand.id ? ' active' : ''}`}
          onClick={() => onChange(brand.id)}
        >
          {brand.label}
        </button>
      ))}
    </div>
  );
};
