
import { HeroIcons, HeroTitles } from './Icons';

export const Hero = () => `
  <div class="hero">
    <div id="hero-banner" class="hero-banner loading">
      <div class="hero-icon" id="hero-icon">${HeroIcons.loading}</div>
      <div class="hero-text">
        <h1 class="hero-title" id="hero-title">กำลังตรวจสอบระบบ...</h1>
        <p class="hero-sub" id="hero-sub">กรุณารอสักครู่</p>
      </div>
      <div class="hero-actions">
      </div>
    </div>
  </div>
`;
