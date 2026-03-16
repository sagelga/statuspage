import { SITE_CONFIG } from '../config';

export const StatusPageStyles = (logoDataUri: string) => `
    :root {
      --max-w: 960px;
      --brand: ${SITE_CONFIG.brandColor};
      --brand-dark: ${SITE_CONFIG.brandDark};
      --font-th: 'IBM Plex Sans Thai', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --font-mono: 'JetBrains Mono', 'IBM Plex Mono', monospace;
      --ok: #16a34a; --ok-bg: #dcfce7; --ok-text: #166534;
      --warn: #ca8a04; --warn-bg: #fef9c3; --warn-text: #854d0e;
      --err: #dc2626; --err-bg: #fee2e2; --err-text: #991b1b;
      --gray: #6b7280; --gray-bg: #f3f4f6; --gray-text: #4b5563;
      --card-bg: #fff; --card-border: #e5e7eb;
      --page-bg: #f9fafb; --text: #111827; --text-muted: #6b7280;
    }
    :root.dark-theme {
      --card-bg: #111827; --card-border: #1f2937; --page-bg: #030712; --text: #f9fafb; --text-muted: #9ca3af;
    }
    :root.dark-theme .hero-banner.loading { background: #111827; border-color: #1f2937; }
    :root.dark-theme .hero-banner.loading .hero-title { color: #f9fafb; }
    :root.dark-theme .hero-banner.loading .hero-sub { color: #9ca3af; }
    :root.dark-theme .sk { background: #1f2937; }
    @keyframes dark-shimmer { 0% { background-color: #1f2937; } 50% { background-color: #111827; } 100% { background-color: #1f2937; } }
    :root.dark-theme .sk { animation: dark-shimmer 1.5s infinite; }
    :root.dark-theme .uptime-bar.nodata { background: #1f2937; }
    :root.dark-theme .api-card, :root.dark-theme .incident-card { background: #0b0f1a; border-color: #1f2937; }
    :root.dark-theme .component-meta { border-top-color: rgba(255,255,255,0.05); }

    @media (prefers-color-scheme: dark) {
      :root:not(.light-theme) {
        --card-bg: #111827; --card-border: #1f2937; --page-bg: #030712; --text: #f9fafb; --text-muted: #9ca3af;
      }
      :root:not(.light-theme) .hero-banner.loading { background: #111827; border-color: #1f2937; }
      :root:not(.light-theme) .hero-banner.loading .hero-title { color: #f9fafb; }
      :root:not(.light-theme) .hero-banner.loading .hero-sub { color: #9ca3af; }
      :root:not(.light-theme) .sk { background: #1f2937; }
      @keyframes dark-shimmer-media { 0% { background-color: #1f2937; } 50% { background-color: #111827; } 100% { background-color: #1f2937; } }
      :root:not(.light-theme) .sk { animation: dark-shimmer-media 1.5s infinite; }
      :root:not(.light-theme) .uptime-bar.nodata { background: #1f2937; }
      :root:not(.light-theme) .api-card, :root:not(.light-theme) .incident-card { background: #0b0f1a; border-color: #1f2937; }
      :root:not(.light-theme) .hero-banner.operational { background: rgba(22, 163, 74, 0.15) !important; border-color: #16a34a !important; color: #4ade80 !important; }
      :root:not(.light-theme) .hero-banner.operational .hero-title { color: #4ade80 !important; }
      :root:not(.light-theme) .hero-banner.operational .hero-sub { color: rgba(74, 222, 128, 0.8) !important; }
      :root:not(.light-theme) .hero-banner.degraded { background: rgba(202, 138, 4, 0.15) !important; border-color: #ca8a04 !important; color: #facc15 !important; }
      :root:not(.light-theme) .hero-banner.degraded .hero-title { color: #facc15 !important; }
      :root:not(.light-theme) .hero-banner.degraded .hero-sub { color: rgba(250, 204, 21, 0.8) !important; }
      :root:not(.light-theme) .hero-banner.down { background: rgba(220, 38, 38, 0.15) !important; border-color: #dc2626 !important; color: #f87171 !important; }
      :root:not(.light-theme) .hero-banner.down .hero-title { color: #f87171 !important; }
      :root:not(.light-theme) .hero-banner.down .hero-sub { color: rgba(248, 113, 113, 0.8) !important; }
      :root:not(.light-theme) .badge.operational { background: rgba(22, 163, 74, 0.2); color: #4ade80; }
      :root:not(.light-theme) .badge.degraded { background: rgba(202, 138, 4, 0.2); color: #facc15; }
      :root:not(.light-theme) .badge.down { background: rgba(220, 38, 38, 0.2); color: #f87171; }
      :root:not(.light-theme) .dot.operational { background: #4ade80; }
      :root:not(.light-theme) .no-incidents { color: #4ade80; }
      :root:not(.light-theme) .no-incidents-icon { color: #4ade80; }
    }
    :root.dark-theme .hero-banner.operational { background: rgba(22, 163, 74, 0.15) !important; border-color: #16a34a !important; color: #4ade80 !important; }
    :root.dark-theme .hero-banner.operational .hero-title { color: #4ade80 !important; }
    :root.dark-theme .hero-banner.operational .hero-sub { color: rgba(74, 222, 128, 0.8) !important; }
    :root.dark-theme .hero-banner.degraded { background: rgba(202, 138, 4, 0.15) !important; border-color: #ca8a04 !important; color: #facc15 !important; }
    :root.dark-theme .hero-banner.degraded .hero-title { color: #facc15 !important; }
    :root.dark-theme .hero-banner.degraded .hero-sub { color: rgba(250, 204, 21, 0.8) !important; }
    :root.dark-theme .hero-banner.down { background: rgba(220, 38, 38, 0.15) !important; border-color: #dc2626 !important; color: #f87171 !important; }
    :root.dark-theme .hero-banner.down .hero-title { color: #f87171 !important; }
    :root.dark-theme .hero-banner.down .hero-sub { color: rgba(248, 113, 113, 0.8) !important; }
    :root.dark-theme .badge.operational { background: rgba(22, 163, 74, 0.2); color: #4ade80; }
    :root.dark-theme .badge.degraded { background: rgba(202, 138, 4, 0.2); color: #facc15; }
    :root.dark-theme .badge.down { background: rgba(220, 38, 38, 0.2); color: #f87171; }
    :root.dark-theme .dot.operational { background: #4ade80; }
    :root.dark-theme .no-incidents { color: #4ade80; }
    :root.dark-theme .no-incidents-icon { color: #4ade80; }

    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: var(--font-th); background: var(--page-bg); color: var(--text); line-height: 1.6; }
    a { color: var(--brand); text-decoration: none; }
    a:hover { color: var(--brand-dark); }
    
    /* Navbar */
    .navbar { background: #52006a; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25); position: sticky; top: 0; z-index: 1000; }
    .nav-top { border-bottom: 1px solid rgba(255, 255, 255, 0.12); }
    .nav-top-inner { display: flex; align-items: center; justify-content: space-between; max-width: 1280px; margin: 0 auto; padding: 0 1.5rem; height: 52px; }
    .nav-logo { display: flex; align-items: center; flex-shrink: 0; text-decoration: none !important; }
    .nav-logo-img { height: 32px; width: auto; max-width: 200px; object-fit: contain; display: block; }
    .nav-top-right { display: flex; align-items: center; gap: 0.5rem; }
    
    .nav-search-pill { display: flex; align-items: center; width: 36px; height: 36px; border-radius: 18px; background: rgba(255, 255, 255, 0.12); border: 1px solid rgba(255, 255, 255, 0.2); overflow: hidden; color: #fff; }
    .nav-search-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: none; border: none; color: #fff; cursor: pointer; padding: 0; }
    
    .nav-bottom { background: rgba(0, 0, 0, 0.15); }
    .nav-bottom-inner { max-width: 1280px; margin: 0 auto; padding: 0 1.5rem; display: flex; align-items: center; }
    .nav-list { list-style: none; display: flex; align-items: center; gap: 0; margin: 0; padding: 0; height: 100%; }
    .nav-link { display: flex; align-items: center; padding: 0.6rem 1.1rem; color: rgba(255, 255, 255, 0.78) !important; font-size: 0.85rem; font-weight: 500; text-decoration: none !important; border-bottom: 2px solid transparent; transition: all 0.15s ease; white-space: nowrap; letter-spacing: 0.2px; }
    .nav-link:hover { color: #ffffff !important; border-bottom-color: rgba(255, 255, 255, 0.45); }
    .nav-link.active { color: #ffffff !important; border-bottom-color: #ffffff !important; font-weight: 700; }
    
    /* Page wrap */
    .page-wrap { max-width: var(--max-w); margin: 0 auto; padding: 2rem 2rem 4rem; }
    
    /* Hero */
    .hero { margin-bottom: 2rem; }
    .hero-banner { border-radius: 14px; padding: 1.25rem 2rem; display: flex; align-items: center; gap: 1.5rem; border: 1px solid var(--card-border); background: var(--card-bg); }
    .hero-banner.loading { background: linear-gradient(135deg, var(--brand), var(--brand-dark)); color: white; border: none; }
    .hero-banner.operational { background: var(--ok-bg); border-color: var(--ok); }
    .hero-banner.degraded { background: var(--warn-bg); border-color: var(--warn); }
    .hero-banner.down { background: var(--err-bg); border-color: var(--err); }
    .hero-icon { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .hero-banner.loading .hero-icon { color: white; }
    .hero-banner.operational .hero-icon { color: var(--ok); }
    .hero-banner.degraded .hero-icon { color: var(--warn); }
    .hero-banner.down .hero-icon { color: var(--err); }
    .hero-icon svg { width: 32px; height: 32px; }
    .hero-text { flex: 1; }
    .hero-title { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.15rem; }
    .hero-banner.loading .hero-title { color: white; }
    .hero-sub { font-size: 0.85rem; opacity: 0.85; }
    .hero-banner.loading .hero-sub { color: rgba(255,255,255,0.9); }
    .hero-actions { display: flex; align-items: center; gap: 0.75rem; }
    
    /* Refresh timer */
    .refresh-timer-container { display: flex; align-items: center; gap: 0.5rem; color: var(--text-muted); font-size: 0.85rem; font-weight: 600; font-family: var(--font-mono); height: 1.25rem; }
    .refresh-timer { position: relative; width: 18px; height: 18px; flex-shrink: 0; }
    .refresh-timer circle { stroke: rgba(0,0,0,0.1); }
    :root.dark-theme .refresh-timer circle { stroke: rgba(255,255,255,0.1); }
    .timer-progress { stroke: var(--brand); transition: stroke-dashoffset 0.35s linear; }
    .timer-icon { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 10px; height: 10px; color: var(--text-muted); }
    .refresh-timer-text { white-space: nowrap; line-height: 1; display: flex; align-items: center; gap: 4px; }
    
    /* Section */
    .section { margin-bottom: 2.5rem; }
    .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
    .section-title { font-size: 1.25rem; font-weight: 700; color: var(--text); }
    .section-meta { font-size: 0.9rem; color: var(--text-muted); }
    
    /* Components card */
    .components-card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 14px; overflow: hidden; }
    .component-row { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--card-border); }
    .component-row:last-child { border-bottom: none; }
    .component-top { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.65rem; }
    .component-icon { width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--text-muted); }
    .component-icon svg { width: 16px; height: 16px; }
    .component-name { flex: 1; font-size: 0.95rem; font-weight: 600; color: var(--text); }
    .component-meta { display: flex; align-items: center; gap: 0.6rem; flex-shrink: 0; }
    .response-time { font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted); background: rgba(0,0,0,0.04); padding: 0.15rem 0.4rem; border-radius: 4px; font-variant-numeric: tabular-nums; }
    @media (prefers-color-scheme: dark) {
      .response-time { background: rgba(255,255,255,0.08); }
    }
    
    /* Badges */
    .badge { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.2rem 0.55rem; border-radius: 99px; font-size: 0.72rem; font-weight: 700; flex-shrink: 0; }
    .dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
    .badge.loading { background: var(--gray-bg); color: var(--gray); }
    .badge.loading .dot { background: var(--gray); animation: pulse 1.5s infinite; }
    .badge.operational { background: var(--ok-bg); color: var(--ok); }
    .badge.operational .dot { background: var(--ok); }
    .badge.degraded { background: var(--warn-bg); color: var(--warn); }
    .badge.degraded .dot { background: var(--warn); }
    .badge.down { background: var(--err-bg); color: var(--err); }
    .badge.down .dot { background: var(--err); }
    
    /* Uptime */
    .uptime-row { display: flex; align-items: center; gap: 0.5rem; }
    .uptime-bars { flex: 1; display: flex; gap: 2px; height: 28px; align-items: stretch; }
    .uptime-bar { flex: 1; border-radius: 2px; cursor: default; min-width: 2px; transition: opacity 0.1s; }
    .uptime-bar:hover { opacity: 0.7; }
    .uptime-bar.operational { background: var(--ok); }
    .uptime-bar.degraded { background: var(--warn); }
    .uptime-bar.down { background: var(--err); }
    .uptime-bar.nodata { background: #e5e7eb; }
    .uptime-label { font-size: 0.72rem; color: var(--text-muted); white-space: nowrap; flex-shrink: 1; width: 45px; }

    /* Minute mosaic popup */
    #minute-popup { 
      position: fixed; z-index: 9999; 
      background: rgba(26, 34, 53, 0.9); 
      backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1); 
      border-radius: 12px; padding: 16px; 
      box-shadow: 0 20px 50px rgba(0,0,0,0.4); 
      pointer-events: none; display: none; 
      transition: opacity 0.2s ease, transform 0.2s ease;
      transform: translateY(10px) scale(0.98);
      opacity: 0;
    }
    #minute-popup.visible { display: block; opacity: 1; transform: translateY(0) scale(1); }
    .mosaic-title { color: #f8fafc; font-size: 13px; font-weight: 700; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
    .mosaic-day-pct { font-size: 11px; color: #10b981; font-weight: 600; }
    .mosaic-grid { display: grid; grid-template-columns: repeat(60, 4px); grid-auto-rows: 4px; gap: 1px; }
    .mosaic-cell { border-radius: 1px; transition: background 0.2s; }
    .mosaic-cell.operational { background: #10b981; }
    .mosaic-cell.degraded { background: #f59e0b; }
    .mosaic-cell.down { background: #ef4444; }
    .mosaic-cell.nodata { background: rgba(255,255,255,0.1); }
    .mosaic-hours { width: 18px; flex-shrink: 0; position: relative; font-size: 8px; color: #94a3b8; line-height: 1; }
    .mosaic-hour-label { position: absolute; right: 4px; }
    .mosaic-legend { display: flex; gap: 12px; margin-top: 12px; font-size: 10px; color: #94a3b8; flex-wrap: wrap; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 8px; }
    .mosaic-legend span { display: flex; align-items: center; gap: 4px; }
    .mosaic-legend-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
    
    :root.light-theme #minute-popup {
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid rgba(0, 0, 0, 0.1);
      box-shadow: 0 10px 30px rgba(0,0,0,0.15);
    }
    :root.light-theme .mosaic-title { color: #1e293b; }
    :root.light-theme .mosaic-cell.nodata { background: #f1f5f9; }
    :root.light-theme .mosaic-legend { border-top-color: #f1f5f9; }
    :root.light-theme .mosaic-hours { color: #64748b; }

    /* Incident card */
    .incident-card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 14px; padding: 1.5rem; }
    .no-incidents { display: flex; align-items: center; gap: 0.75rem; color: var(--ok-text); font-size: 0.9rem; font-weight: 500; }
    .no-incidents-icon { display: flex; align-items: center; color: var(--ok); }
    .no-incidents-icon svg { width: 18px; height: 18px; }
    
    /* API card */
    .api-card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 14px; padding: 1.25rem 1.5rem; }
    .api-line { font-family: var(--font-mono); font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.5rem; }
    .api-desc { font-size: 0.82rem; color: var(--text-muted); }
    
    /* Skeleton */
    .skeleton-row { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--card-border); }
    .skeleton-row:last-child { border-bottom: none; }
    .sk { background: #e5e7eb; border-radius: 4px; animation: shimmer 1.5s infinite; }
    .sk-top { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
    .sk-icon { width: 20px; height: 20px; border-radius: 4px; }
    .sk-name { height: 14px; width: 140px; }
    .sk-badge { height: 22px; width: 70px; border-radius: 99px; margin-left: auto; }
    .sk-bars { height: 28px; border-radius: 3px; }
    @keyframes shimmer { 0% { background-color: #e5e7eb; } 50% { background-color: #f3f4f6; } 100% { background-color: #e5e7eb; } }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .spin { animation: spin 1s linear infinite; transform-origin: center; }

    /* Footer */
    .footer { background: #0a0a0a; color: #9ca3af; font-size: 0.875rem; line-height: 1.6; padding: 3rem 0 0; }
    .footer-container { max-width: 1200px; margin: 0 auto; padding: 0 2rem; }
    .footer-top { display: flex; gap: 4rem; padding-bottom: 2.5rem; }
    .footer-brand { flex: 0 0 280px; display: flex; flex-direction: column; gap: 0.75rem; }
    .footer-logo { height: 44px; width: auto; max-width: 200px; object-fit: contain; display: block; flex-shrink: 0; }
    .footer-tagline { margin: 0; color: #9ca3af; font-size: 0.875rem; line-height: 1.65; }
    .footer-columns { flex: 1; display: flex; gap: 3rem; justify-content: flex-end; }
    .footer-col { display: flex; flex-direction: column; gap: 0.75rem; min-width: 120px; }
    .footer-col-title { margin: 0 0 0.25rem; color: #ffffff; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }
    .footer-col ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; }
    .footer-col a { color: #9ca3af !important; text-decoration: none !important; transition: color 0.15s ease; }
    .footer-col a:hover { color: #ffffff !important; }
    .footer-divider { border: none; border-top: 1px solid #1f1f1f; margin: 0; }
    .footer-bottom { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 0; font-size: 0.8rem; color: #6b7280; gap: 1rem; }
    .footer-bottom-center { text-align: center; }
    .footer-heart { color: #e74c3c; }
    .footer-author { color: #c084fc !important; text-decoration: none !important; transition: color 0.15s ease; }
    .footer-author:hover { color: #4d96f0 !important; }
    .footer-theme-toggle { display: flex; align-items: center; gap: 0.5rem; color: #6b7280; }
    .footer-toggle-btn { background: #1f1f1f; border: 1px solid #333; border-radius: 20px; padding: 0.3rem 0.75rem; cursor: pointer; color: #9ca3af; font-size: 0.78rem; transition: all 0.15s ease; }
    .footer-toggle-btn:hover { border-color: #52006a; color: #ffffff; }

    /* Responsive */
    @media (max-width: 900px) {
      .footer-top { flex-direction: column; gap: 2rem; }
      .footer-brand { flex: unset; }
      .footer-columns { justify-content: flex-start; gap: 2rem; flex-wrap: wrap; }
    }
    @media (max-width: 768px) {
      .nav-bottom { display: block; overflow-x: auto; overflow-y: hidden; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
      .nav-bottom::-webkit-scrollbar { display: none; }
      .nav-bottom-inner { padding: 0 0.75rem; min-width: max-content; }
    }
    @media (max-width: 640px) {
      .hero-banner { flex-direction: column; text-align: center; gap: 1.25rem; padding: 1.5rem 1rem; border-radius: 12px; }
      .hero-icon { width: 56px; height: 56px; }
      .hero-icon svg { width: 40px; height: 40px; }
      .hero-title { font-size: 1.2rem; }
      .hero-actions { width: 100%; border-top: 1px solid rgba(0,0,0,0.05); padding-top: 1rem; justify-content: center; }
      
      .section-header { flex-direction: column; align-items: flex-start; gap: 0.25rem; }
      .component-row { padding: 1.25rem 1rem; }
      .component-top { align-items: flex-start; gap: 0.75rem; }
      .component-icon { margin-top: 0.1rem; }
      .component-name { font-size: 0.9rem; }
      .component-meta { margin-top: 0.25rem; display: flex; flex-direction: row; gap: 0.6rem; justify-content: flex-start; width: auto; border: none; padding: 0; }
      .response-time { font-size: 0.68rem; padding: 0.1rem 0.35rem; }
      .uptime-label { font-size: 0.65rem; }
      
      .footer-bottom { flex-direction: column; align-items: flex-start; gap: 0.5rem; text-align: left; }
      .footer-bottom-center { text-align: left; }
    }
    @media (max-width: 480px) {
       .footer-container { padding: 0 1rem; }
       .footer-columns { gap: 1.25rem; }
       .footer-col { min-width: 0; }
       .nav-top-inner { padding: 0 0.75rem; }
    }
`;
