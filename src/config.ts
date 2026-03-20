import type { ServiceDefinition } from './types';

export const TIMEOUT_MS = 5000;
export const DEGRADED_THRESHOLD_MS = 1500;

export const SITE_CONFIG = {
  name:         'ByteSide.one',
  url:          'https://status.sagelga.com',
  brandColor:   '#52006A',
  brandDark:    '#3d004f',
  tagline:      'เว็บไซต์ข่าวเทคโนโลยีและเกมมิ่ง สำหรับคนไทยที่รักเทคโนโลยี รีวิว ทิปส์ และบทความเชิงลึกที่คุณไว้วางใจได้',
  email:        'support@byteside.one',
  facebook:     'https://facebook.com/byteside',
};

export type BrandId = 'byteside' | 'sagelga';

export interface BrandMeta {
  id: BrandId;
  label: string;
  description: string;
}

export const BRANDS: BrandMeta[] = [
  {
    id: 'byteside',
    label: 'ByteSide.one',
    description: 'ครอบคลุมเว็บไซต์ เครือข่าย CDN ระบบโฮสต์มีเดีย และฐานข้อมูล — อัปเดตทุก 60 วินาที',
  },
  {
    id: 'sagelga',
    label: 'sagelga.com',
    description: 'ครอบคลุมเว็บไซต์และบริการของ sagelga — อัปเดตทุก 60 วินาที',
  },
];

// Services are defined in statuspage-pulse worker and written to KV.
// This local config is only used for UI display (brand filtering), not for status checking.
// To change services: update statuspage-pulse/src/config.ts and deploy the worker.
export const SERVICES_BY_BRAND: Record<BrandId, ServiceDefinition[]> = {
  byteside: [
    // Services loaded from KV config:services (pulse worker)
    // These entries match the pulse config for display purposes only
    { id: 'cloudflare',  name: 'เครือข่าย Cloudflare',    icon: 'shield',     url: 'https://www.cloudflarestatus.com/api/v2/status.json' },
    { id: 'website',     name: 'เว็บไซต์',                icon: 'globe',      url: 'https://beta.byteside.one' },
    { id: 'r2-content',  name: 'โฮสต์รูปภาพและวิดีโอ',    icon: 'image',      url: 'https://s.byteside.one/image/genshin/elemental-reaction/Element_Electro.webp' },
    { id: 'notion-sync', name: 'ระบบดึงข้อมูลจาก Notion', icon: 'refresh-cw', url: 'https://fetcher.byteside.one/api/health' },
    { id: 'notion',      name: 'ฐานข้อมูล Notion',        icon: 'database',   url: 'https://www.notion.so/' },
  ],
  sagelga: [
    // Services loaded from KV config:services (pulse worker)
    // These entries match the pulse config for display purposes only
    { id: 'sagelga-super',      name: 'sagelga.com',          icon: 'globe',      url: 'https://sagelga.com' },
    { id: 'sagelga-mahjong',    name: 'Mahjong Hands',        icon: 'grid',       url: 'https://mahjong.sagelga.com' },
    { id: 'sagelga-telegram',   name: 'Telegram Thai',        icon: 'message',    url: 'https://telegram.sagelga.com' },
    { id: 'sagelga-docs',       name: 'Documentation',        icon: 'book',       url: 'https://docs.sagelga.com' },
    { id: 'sagelga-redirect',   name: 'Redirect',             icon: 'arrow-right', url: 'https://l.sagelga.com' },
    { id: 'sagelga-static',     name: 'Static',               icon: 'image',      url: 'https://static.sagelga.com/statuspulse.webp' },
    { id: 'sagelga-learn',      name: 'Learn',                icon: 'book-open',  url: 'https://learn.sagelga.com' },
  ],
};

// Flat list used by the API to read/write all service statuses
export const SERVICES: ServiceDefinition[] = [
  ...SERVICES_BY_BRAND.byteside,
  ...SERVICES_BY_BRAND.sagelga,
];
