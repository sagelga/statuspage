import type { NavItem } from '@/types';
import type { BrandId } from '@/config';

export interface BrandNavbarConfig {
  brandHref: string;
  brandName: string;
  navbarBg: string;
  links: NavItem[];
  useImageLogo: boolean;
}

const BYTESIDE_LINKS: NavItem[] = [
  { label: 'เกมมิ่ง', href: 'https://beta.byteside.one/tags/gaming', external: true },
  { label: 'เทคโนโลยี', href: 'https://beta.byteside.one/tags/tech', external: true },
  { label: 'รีวิว', href: 'https://beta.byteside.one/tags/review', external: true },
  { label: 'คริปโต', href: 'https://beta.byteside.one/tags/cryptocurrency', external: true },
  { label: 'บล็อก', href: 'https://beta.byteside.one/', external: true },
];

const SAGELGA_LINKS: NavItem[] = [
  { label: 'หน้าหลัก', href: 'https://sagelga.com', external: true },
  { label: 'Mahjong Hands', href: 'https://mahjong-hands.sagelga.com', external: true },
  { label: 'Telegram Thai', href: 'https://telegram-thai.sagelga.com', external: true },
  { label: 'Docs', href: 'https://docs.sagelga.com', external: true },
  { label: 'Learn', href: 'https://learn.sagelga.com', external: true },
];

const THAIPATMETAL_LINKS: NavItem[] = [
  { label: 'เกี่ยวกับ', href: 'https://thaipatmetal.com/about', external: true },
  { label: 'สินค้า', href: 'https://thaipatmetal.com/products', external: true },
  { label: 'โซลูชัน', href: 'https://thaipatmetal.com/solutions', external: true },
  { label: 'ลูกค้า', href: 'https://thaipatmetal.com/customers', external: true },
  { label: 'บริการช่วยเหลือ', href: 'https://thaipatmetal.com/support', external: true },
];

export const BRAND_NAVBAR: Record<BrandId, BrandNavbarConfig> = {
  byteside: {
    brandHref: 'https://beta.byteside.one',
    brandName: 'ByteSide.one',
    navbarBg: '#52006A',
    links: BYTESIDE_LINKS,
    useImageLogo: true,
  },
  sagelga: {
    brandHref: 'https://sagelga.com',
    brandName: 'sagelga',
    navbarBg: '#3B4A8C',
    links: SAGELGA_LINKS,
    useImageLogo: false,
  },
  thaipatmetal: {
    brandHref: 'https://thaipatmetal.com',
    brandName: 'ไทยพัฒน์เมทัล',
    navbarBg: '#050505',
    links: THAIPATMETAL_LINKS,
    useImageLogo: false,
  },
};
