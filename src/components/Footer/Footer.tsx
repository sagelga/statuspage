import React from 'react';
import { SITE_CONFIG, BrandId } from '@/config';
import './Footer.style.css';

interface FooterProps {
  isDark: boolean;
  onToggleTheme: () => void;
  brand: BrandId;
}

const ThemeToggle: React.FC<{ isDark: boolean; onToggleTheme: () => void }> = ({ isDark, onToggleTheme }) => (
  <div className="footer-theme-toggle">
    <button onClick={onToggleTheme} className="footer-toggle-btn">
      {isDark ? (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
          Light
        </>
      ) : (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
          Dark
        </>
      )}
    </button>
    <span>|</span>
    <span>Made with <svg className="footer-heart" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg> by <a href="https://sagelga.com" className="footer-author">@sagelga</a></span>
  </div>
);

export const Footer: React.FC<FooterProps> = ({ isDark, onToggleTheme, brand }) => {
  if (brand === 'sagelga') {
    return (
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-top">
            <div className="footer-brand">
              <a href="https://sagelga.com" className="footer-logo-text">sagelga</a>
              <p className="footer-tagline">sagelga.com — personal projects and tools</p>
            </div>
            <div className="footer-columns">
              <div className="footer-col">
                <p className="footer-col-title">โปรเจกต์</p>
                <ul>
                  <li><a href="https://sagelga.com">sagelga.com</a></li>
                  <li><a href="https://mahjong-hands.sagelga.com" target="_blank" rel="noopener noreferrer">Mahjong Hands</a></li>
                  <li><a href="https://telegram-thai.sagelga.com" target="_blank" rel="noopener noreferrer">Telegram Thai</a></li>
                  <li><a href="https://learn.sagelga.com" target="_blank" rel="noopener noreferrer">Learn</a></li>
                  <li><a href="https://docs.sagelga.com" target="_blank" rel="noopener noreferrer">Documentation</a></li>
                </ul>
              </div>
              <div className="footer-col">
                <p className="footer-col-title">ติดตาม</p>
                <ul>
                  <li><a href="https://github.com/sagelga" target="_blank" rel="noopener noreferrer">GitHub</a></li>
                  <li><a href="https://facebook.com/sagelga" target="_blank" rel="noopener noreferrer">Facebook</a></li>
                </ul>
              </div>
              <div className="footer-col">
                <p className="footer-col-title">อื่นๆ</p>
                <ul>
                  <li><a href="https://status.sagelga.com">สถานะระบบ</a></li>
                  <li><a href="https://redirect.sagelga.com" target="_blank" rel="noopener noreferrer">Redirect</a></li>
                </ul>
              </div>
            </div>
          </div>
          <hr className="footer-divider" />
          <div className="footer-bottom">
            <span>© 2021–{new Date().getFullYear()} sagelga</span>
            <span className="footer-bottom-center">sagelga.com</span>
            <ThemeToggle isDark={isDark} onToggleTheme={onToggleTheme} />
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <img src="/img/logo-text-white.png" alt={SITE_CONFIG.name} className="footer-logo" />
            <p className="footer-tagline">ByteSide.one เว็บไซต์ข่าวล่าสุดที่เข้าใจคุณ และสร้างสื่ออนาคตที่เปลี่ยนคุณ</p>
          </div>
          <div className="footer-columns">
            <div className="footer-col">
              <p className="footer-col-title">เกี่ยวกับ</p>
              <ul>
                <li><a href="https://beta.byteside.one/about">เกี่ยวกับเรา</a></li>
                <li><a href="https://beta.byteside.one/contact">ติดต่อเรา</a></li>
                <li><a href="https://beta.byteside.one/advertise">ลงโฆษณากับเรา</a></li>
                <li><a href="https://beta.byteside.one/support">สนับสนุนเรา</a></li>
                <li><a href="https://beta.byteside.one/privacy">นโยบายความเป็นส่วนตัว</a></li>
                <li><a href="https://status.sagelga.com">สถานะระบบ</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <p className="footer-col-title">หมวดหมู่</p>
              <ul>
                <li><a href="https://beta.byteside.one/blog/tags/gaming">เกมมิ่ง</a></li>
                <li><a href="https://beta.byteside.one/blog/tags/tech-news">เทคโนโลยี</a></li>
                <li><a href="https://beta.byteside.one/blog/tags/reviews">รีวิว</a></li>
                <li><a href="https://beta.byteside.one/blog/tags/crypto">Crypto</a></li>
                <li><a href="https://beta.byteside.one/blog/tags/business">ธุรกิจ</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <p className="footer-col-title">ติดตาม</p>
              <ul>
                <li><a href="https://facebook.com/byteside" target="_blank" rel="noopener noreferrer">Facebook</a></li>
                <li><a href="https://twitter.com/byteside" target="_blank" rel="noopener noreferrer">Twitter / X</a></li>
                <li><a href="https://youtube.com/byteside" target="_blank" rel="noopener noreferrer">YouTube</a></li>
                <li><a href="https://medium.com/@byteside" target="_blank" rel="noopener noreferrer">Medium</a></li>
                <li><a href="https://beta.byteside.one/blog/rss.xml">RSS Feed</a></li>
                <li><a href="https://beta.byteside.one/blog/atom.xml">Atom Feed</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <p className="footer-col-title">โปรเจกต์อื่น</p>
              <ul>
                <li><a href="https://sagelga.com" target="_blank" rel="noopener noreferrer">sagelga.com</a></li>
              </ul>
            </div>
          </div>
        </div>
        <hr className="footer-divider" />
        <div className="footer-bottom">
          <span>© 2021–{new Date().getFullYear()} ByteSide.one (Beta)</span>
          <span className="footer-bottom-center">Byteside.one สื่ออนาคตที่เปลี่ยนคุณ</span>
          <ThemeToggle isDark={isDark} onToggleTheme={onToggleTheme} />
        </div>
      </div>
    </footer>
  );
};
