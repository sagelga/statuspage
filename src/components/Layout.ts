
import { SITE_CONFIG } from '../config';

export const Navbar = (logoDataUri: string, HeroIcons: any) => `
  <nav class="navbar">
    <div class="nav-top">
      <div class="nav-top-inner">
        <a href="https://beta.byteside.one" class="nav-logo">
          <img src="${logoDataUri}" alt="${SITE_CONFIG.name}" class="nav-logo-img">
        </a>
        <div class="nav-top-right">
          <form class="nav-search-pill" action="https://beta.byteside.one/search" method="GET">
            <button type="button" class="nav-search-btn">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
    <div class="nav-bottom">
      <div class="nav-bottom-inner">
        <ul class="nav-list" id="nav-tabs">
          <li><a href="https://beta.byteside.one/blog/tags/gaming" class="nav-link">\u0e40\u0e01\u0e21\u0e21\u0e34\u0e48\u0e07</a></li>
          <li><a href="https://beta.byteside.one/blog/tags/tech-news" class="nav-link">\u0e40\u0e17\u0e04\u0e42\u0e19\u0e42\u0e25\u0e22\u0e35</a></li>
          <li><a href="https://beta.byteside.one/blog/tags/reviews" class="nav-link">\u0e23\u0e35\u0e17\u0e34\u0e27</a></li>
          <li><a href="https://beta.byteside.one/blog/tags/crypto" class="nav-link">\u0e04\u0e23\u0e34\u0e1b\u0e42\u0e15</a></li>
          <li><a href="https://beta.byteside.one/blog" class="nav-link">\u0e1a\u0e25\u0e47\u0e2d\u0e01</a></li>
        </ul>
      </div>
    </div>
  </nav>
`;

export const Footer = (logoDataUri: string) => `
  <footer class="footer">
    <div class="footer-container">
      <div class="footer-top">
        <div class="footer-brand">
          <img src="${logoDataUri}" alt="${SITE_CONFIG.name}" class="footer-logo">
          <p class="footer-tagline">\u0e40\u0e27\u0e47\u0e1a\u0e44\u0e0b\u0e15\u0e4c\u0e02\u0e48\u0e32\u0e27\u0e40\u0e17\u0e04\u0e42\u0e19\u0e42\u0e25\u0e22\u0e35\u0e41\u0e25\u0e30\u0e40\u0e01\u0e21\u0e21\u0e34\u0e48\u0e07 \u0e2a\u0e33\u0e2b\u0e23\u0e31\u0e1a\u0e04\u0e19\u0e44\u0e17\u0e22\u0e17\u0e35\u0e48\u0e23\u0e31\u0e01\u0e40\u0e17\u0e04\u0e42\u0e19\u0e42\u0e25\u0e22\u0e35 \u0e23\u0e35\u0e17\u0e34\u0e27 \u0e17\u0e34\u0e1b\u0e2a\u0e4c \u0e41\u0e25\u0e30\u0e1a\u0e17\u0e04\u0e27\u0e32\u0e21\u0e40\u0e02\u0e34\u0e07\u0e25\u0e36\u0e01\u0e17\u0e35\u0e48\u0e04\u0e38\u0e13\u0e44\u0e27\u0e49\u0e27\u0e32\u0e07\u0e43\u0e08\u0e44\u0e14\u0e49</p>
        </div>
        <div class="footer-columns">
          <div class="footer-col">
            <p class="footer-col-title">\u0e40\u0e01\u0e35\u0e48\u0e22\u0e27\u0e01\u0e31\u0e1a</p>
            <ul>
              <li><a href="https://beta.byteside.one/about">\u0e40\u0e01\u0e35\u0e48\u0e22\u0e27\u0e01\u0e31\u0e1a\u0e40\u0e23\u0e32</a></li>
              <li><a href="https://beta.byteside.one/contact">\u0e15\u0e34\u0e14\u0e15\u0e48\u0e2d\u0e40\u0e23\u0e32</a></li>
              <li><a href="https://beta.byteside.one/advertise">\u0e25\u0e07\u0e42\u0e06\u0e29\u0e13\u0e32\u0e01\u0e31\u0e1a\u0e40\u0e23\u0e32</a></li>
              <li><a href="https://beta.byteside.one/support">\u0e2a\u0e19\u0e31\u0e1a\u0e2a\u0e19\u0e38\u0e19\u0e40\u0e23\u0e32</a></li>
              <li><a href="https://beta.byteside.one/privacy">\u0e19\u0e42\u0e22\u0e1a\u0e32\u0e22\u0e04\u0e27\u0e32\u0e22\u0e40\u0e1b\u0e47\u0e19\u0e2a\u0e48\u0e27\u0e1d\u0e15\u0e31\u0e27</a></li>
              <li><a href="https://status.sagelga.com">\u0e2a\u0e16\u0e32\u0e19\u0e30\u0e23\u0e30\u0e1a\u0e1a</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <p class="footer-col-title">\u0e2b\u0e21\u0e27\u0e14\u0e2b\u0e21\u0e39\u0e48</p>
            <ul>
              <li><a href="https://beta.byteside.one/blog/tags/gaming">\u0e40\u0e01\u0e21\u0e21\u0e34\u0e48\u0e07</a></li>
              <li><a href="https://beta.byteside.one/blog/tags/tech-news">\u0e40\u0e17\u0e04\u0e42\u0e19\u0e42\u0e25\u0e22\u0e35</a></li>
              <li><a href="https://beta.byteside.one/blog/tags/reviews">\u0e23\u0e35\u0e17\u0e34\u0e27</a></li>
              <li><a href="https://beta.byteside.one/blog/tags/crypto">Crypto</a></li>
              <li><a href="https://beta.byteside.one/blog/tags/business">\u0e18\u0e38\u0e23\u0e01\u0e34\u0e08</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <p class="footer-col-title">\u0e15\u0e34\u0e14\u0e15\u0e32\u0e21</p>
            <ul>
              <li><a href="https://facebook.com/byteside" target="_blank" rel="noopener noreferrer">Facebook</a></li>
              <li><a href="https://twitter.com/byteside" target="_blank" rel="noopener noreferrer">Twitter / X</a></li>
              <li><a href="https://youtube.com/byteside" target="_blank" rel="noopener noreferrer">YouTube</a></li>
              <li><a href="https://medium.com/@byteside" target="_blank" rel="noopener noreferrer">Medium</a></li>
              <li><a href="https://beta.byteside.one/blog/rss.xml">RSS Feed</a></li>
              <li><a href="https://beta.byteside.one/blog/atom.xml">Atom Feed</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <p class="footer-col-title">\u0e42\u0e1b\u0e23\u0e40\u0e08\u0e01\u0e15\u0e4c\u0e2d\u0e37\u0e48\u0e19</p>
            <ul>
              <li><a href="https://sagelga.com" target="_blank" rel="noopener noreferrer">sagelga.com</a></li>
            </ul>
          </div>
        </div>
      </div>
      <hr class="footer-divider">
      <div class="footer-bottom">
        <span>\u00a9 2021\u2013${new Date().getFullYear()} ByteSide.one \u2022 beta.byteside.one</span>
        <span class="footer-bottom-center">\u0e02\u0e48\u0e32\u0e27\u0e40\u0e17\u0e04\u0e42\u0e19\u0e42\u0e25\u0e22\u0e35\u0e41\u0e25\u0e30\u0e40\u0e01\u0e21\u0e21\u0e34\u0e48\u0e07 \u0e40\u0e1e\u0e37\u0e48\u0e2d\u0e04\u0e19\u0e44\u0e17\u0e22</span>
        <div class="footer-theme-toggle">
          <button id="theme-toggle-btn" class="footer-toggle-btn">\u2600\ufe0f Light</button>
          <span>|</span>
          <span>Made with <span class="footer-heart">\u2665</span> by <a href="https://facebook.com/byteside" class="footer-author">@byteside</a></span>
        </div>
      </div>
    </div>
  </footer>
`;
