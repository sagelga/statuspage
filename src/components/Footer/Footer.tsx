import React from 'react';
import Image from 'next/image';
import { SITE_CONFIG, BrandId } from '@/config';
import { ThemeToggle } from '@/components/ThemeToggle/ThemeToggle';
import './Footer.style.css';

interface FooterProps {
  isDark: boolean;
  onToggleTheme: () => void;
  brand: BrandId;
}

interface FooterLink { label: string; url: string; external?: boolean }
interface FooterColumn { title: string; links: FooterLink[] }

const FOOTER_CONFIG: Record<BrandId, {
  logo: React.ReactNode;
  tagline: string;
  copyright: string;
  bottomCenter: string;
  columns: FooterColumn[];
}> = {
  sagelga: {
    logo: <a href="https://sagelga.com" className="footer-logo-text">sagelga</a>,
    tagline: 'sagelga.com — personal projects and tools',
    copyright: `© 2021–${new Date().getFullYear()} sagelga`,
    bottomCenter: 'sagelga.com',
    columns: [
      {
        title: 'โปรเจกต์',
        links: [
          { label: 'sagelga.com', url: 'https://sagelga.com' },
          { label: 'ไพ่นกกระจอก', url: 'https://mahjong-hands.sagelga.com', external: true },
          { label: 'Telegram ไทย', url: 'https://telegram-thai.sagelga.com', external: true },
          { label: 'บทเรียน', url: 'https://learn.sagelga.com', external: true },
          { label: 'เอกสาร', url: 'https://docs.sagelga.com', external: true },
        ],
      },
      {
        title: 'ติดตาม',
        links: [
          { label: 'GitHub', url: 'https://github.com/sagelga', external: true },
          { label: 'Facebook', url: 'https://facebook.com/sagelga', external: true },
        ],
      },
      {
        title: 'อื่นๆ',
        links: [
          { label: 'สถานะระบบ', url: 'https://status.sagelga.com' },
          { label: 'ลิงก์ย่อ', url: 'https://redirect.sagelga.com', external: true },
        ],
      },
    ],
  },
  byteside: {
    logo: <Image src="/img/logo-text-white.png" alt={SITE_CONFIG.name} className="footer-logo" width={160} height={32} />,
    tagline: 'ByteSide.one เว็บไซต์ข่าวล่าสุดที่เข้าใจคุณ และสร้างสื่ออนาคตที่เปลี่ยนคุณ',
    copyright: `© 2021–${new Date().getFullYear()} ByteSide.one (Beta)`,
    bottomCenter: 'Byteside.one สื่ออนาคตที่เปลี่ยนคุณ',
    columns: [
      {
        title: 'เกี่ยวกับ',
        links: [
          { label: 'เกี่ยวกับเรา', url: 'https://beta.byteside.one/about' },
          { label: 'ติดต่อเรา', url: 'https://beta.byteside.one/contact' },
          { label: 'ลงโฆษณากับเรา', url: 'https://beta.byteside.one/advertise' },
          { label: 'สนับสนุนเรา', url: 'https://beta.byteside.one/support' },
          { label: 'นโยบายความเป็นส่วนตัว', url: 'https://beta.byteside.one/privacy' },
          { label: 'สถานะระบบ', url: 'https://status.sagelga.com' },
        ],
      },
      {
        title: 'หมวดหมู่',
        links: [
          { label: 'เกมมิ่ง', url: 'https://beta.byteside.one/blog/tags/gaming' },
          { label: 'เทคโนโลยี', url: 'https://beta.byteside.one/blog/tags/tech-news' },
          { label: 'รีวิว', url: 'https://beta.byteside.one/blog/tags/reviews' },
          { label: 'Crypto', url: 'https://beta.byteside.one/blog/tags/crypto' },
          { label: 'ธุรกิจ', url: 'https://beta.byteside.one/blog/tags/business' },
        ],
      },
      {
        title: 'ติดตาม',
        links: [
          { label: 'Facebook', url: 'https://facebook.com/byteside', external: true },
          { label: 'Twitter / X', url: 'https://twitter.com/byteside', external: true },
          { label: 'YouTube', url: 'https://youtube.com/byteside', external: true },
          { label: 'Medium', url: 'https://medium.com/@byteside', external: true },
          { label: 'RSS Feed', url: 'https://beta.byteside.one/blog/rss.xml' },
          { label: 'Atom Feed', url: 'https://beta.byteside.one/blog/atom.xml' },
        ],
      },
      {
        title: 'โปรเจกต์อื่น',
        links: [
          { label: 'sagelga.com', url: 'https://sagelga.com', external: true },
        ],
      },
    ],
  },
};

export const Footer: React.FC<FooterProps> = ({ isDark, onToggleTheme, brand }) => {
  const config = FOOTER_CONFIG[brand];

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            {config.logo}
            <p className="footer-tagline">{config.tagline}</p>
          </div>
          <div className="footer-columns">
            {config.columns.map((col) => (
              <div key={col.title} className="footer-col">
                <p className="footer-col-title">{col.title}</p>
                <ul>
                  {col.links.map((link) => (
                    <li key={link.url}>
                      <a href={link.url} {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <hr className="footer-divider" />
        <div className="footer-bottom">
          <span>{config.copyright}</span>
          <span className="footer-bottom-center">{config.bottomCenter}</span>
          <ThemeToggle isDark={isDark} onToggleTheme={onToggleTheme} />
        </div>
      </div>
    </footer>
  );
};
