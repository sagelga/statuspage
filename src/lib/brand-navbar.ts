import type { NavItem } from '@/types';
import type { BrandId } from '@/config';

export interface BrandNavbarConfig {
  brandHref: string;
  brandName: string;
  links: NavItem[];
  useImageLogo: boolean;
}

const BYTESIDE_LINKS: NavItem[] = [
  { label: 'เกมมิ่ง', href: 'https://beta.byteside.one/blog/tags/gaming', external: true },
  { label: 'เทคโนโลยี', href: 'https://beta.byteside.one/blog/tags/tech-news', external: true },
  { label: 'รีวิว', href: 'https://beta.byteside.one/blog/tags/reviews', external: true },
  { label: 'คริปโต', href: 'https://beta.byteside.one/blog/tags/crypto', external: true },
  { label: 'บล็อก', href: 'https://beta.byteside.one/blog', external: true },
];

const SAGELGA_LINKS: NavItem[] = [
  { label: 'หน้าหลัก', href: 'https://sagelga.com', external: true },
  { label: 'Mahjong Hands', href: 'https://mahjong-hands.sagelga.com', external: true },
  { label: 'Telegram Thai', href: 'https://telegram-thai.sagelga.com', external: true },
  { label: 'Docs', href: 'https://docs.sagelga.com', external: true },
  { label: 'Learn', href: 'https://learn.sagelga.com', external: true },
];

export const BRAND_NAVBAR: Record<BrandId, BrandNavbarConfig> = {
  byteside: {
    brandHref: 'https://beta.byteside.one',
    brandName: 'ByteSide.one',
    links: BYTESIDE_LINKS,
    useImageLogo: true,
  },
  sagelga: {
    brandHref: 'https://sagelga.com',
    brandName: 'sagelga',
    links: SAGELGA_LINKS,
    useImageLogo: false,
  },
};