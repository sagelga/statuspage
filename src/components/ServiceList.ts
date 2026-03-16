
import { RefreshTimer } from './RefreshTimer';

export const ServiceList = (checkedAt: string) => `
  <div class="section">
    <div class="section-header">
      <h2 class="section-title">บริการ</h2>
      ${RefreshTimer({
        lastUpdated: checkedAt,
        refreshInterval: 60
      })}
    </div>
    <div class="components-card" id="components">
      <div class="skeleton-row">
        <div class="sk-top"><div class="sk sk-icon"></div><div class="sk sk-name"></div><div class="sk sk-badge"></div></div>
        <div class="sk sk-bars"></div>
      </div>
      <div class="skeleton-row">
        <div class="sk-top"><div class="sk sk-icon"></div><div class="sk sk-name"></div><div class="sk sk-badge"></div></div>
        <div class="sk sk-bars"></div>
      </div>
      <div class="skeleton-row">
        <div class="sk-top"><div class="sk sk-icon"></div><div class="sk sk-name"></div><div class="sk sk-badge"></div></div>
        <div class="sk sk-bars"></div>
      </div>
      <div class="skeleton-row">
        <div class="sk-top"><div class="sk sk-icon"></div><div class="sk sk-name"></div><div class="sk sk-badge"></div></div>
        <div class="sk sk-bars"></div>
      </div>
    </div>
  </div>
`;
