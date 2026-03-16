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

export const SERVICES: ServiceDefinition[] = [
  { id: 'cloudflare',  name: 'เครือข่าย Cloudflare',    icon: 'shield',     url: 'https://www.cloudflarestatus.com/api/v2/status.json',
  jsonStatus: { path: 'status.indicator', map: { none: 'operational', minor: 'degraded', major: 'down', critical: 'down' } } },
  { id: 'website',     name: 'เว็บไซต์', icon: 'globe',    url: 'https://beta.byteside.one' },
  { id: 'r2-content',  name: 'โฮสต์สำหรับรูปภาพและวิดีโอ',            icon: 'image',      url: 'https://s.byteside.one/image/genshin/elemental-reaction/Element_Electro.webp' },
  { id: 'notion-sync', name: 'ระบบดึงข้อมูลจาก Notion', icon: 'refresh-cw', url: 'https://fetcher.byteside.one/api/health' },
  { id: 'notion',      name: 'ฐานข้อมูล Notion',        icon: 'database',   url: 'https://www.notion.so/' },
];
