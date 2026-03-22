import React from 'react';

interface ThemeToggleProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

const SunIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDark, onToggleTheme }) => (
  <div className="footer-theme-toggle">
    <button
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'เปลี่ยนเป็นธีมสว่าง' : 'เปลี่ยนเป็นธีมมืด'}
      onClick={onToggleTheme}
      className={`theme-switch${isDark ? ' theme-switch--on' : ''}`}
    >
      <span className="theme-switch-track">
        <span className="theme-switch-thumb">
          {isDark ? <MoonIcon /> : <SunIcon />}
        </span>
      </span>
    </button>
    <span>|</span>
    <span>Made with <svg className="footer-heart" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg> by <a href="https://sagelga.com" className="footer-author">@sagelga</a></span>
  </div>
);
