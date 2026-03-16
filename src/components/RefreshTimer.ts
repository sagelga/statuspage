interface RefreshTimerProps {
  lastUpdated: string;
  refreshInterval?: number;
}

export function RefreshTimer({ lastUpdated, refreshInterval = 60 }: RefreshTimerProps): string {
  const size = 16;
  const strokeWidth = 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return `
    <div class="refresh-timer-container" data-last-updated="${lastUpdated}" data-interval="${refreshInterval}">
      <div class="refresh-timer">
        <svg width="${size}" height="${size}" style="transform: rotate(-90deg);">
          <circle
            cx="${size / 2}"
            cy="${size / 2}"
            r="${radius}"
            fill="none"
            stroke="#e2e8f0"
            stroke-width="${strokeWidth}"
          />
          <circle
            class="timer-progress"
            cx="${size / 2}"
            cy="${size / 2}"
            r="${radius}"
            fill="none"
            stroke="currentColor"
            stroke-width="${strokeWidth}"
            stroke-linecap="round"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="0"
          />
        </svg>
        <svg class="timer-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </div>
      <span class="refresh-timer-text">
        <span class="refresh-timer-label">รีเฟรชใน</span>
        <span class="refresh-timer-value">${refreshInterval}s</span>
      </span>
    </div>
  `;
}

export const RefreshTimerScript = `
<script>
(function() {
  function updateTimers() {
    document.querySelectorAll('.refresh-timer-container').forEach(function(el) {
      var lastUpdated = new Date(el.dataset.lastUpdated).getTime();
      var interval = parseInt(el.dataset.interval) || 60;
      var now = Date.now();
      var elapsed = Math.floor((now - lastUpdated) / 1000);
      var remaining = Math.max(0, interval - elapsed);
      
      var progress = Math.max(0, Math.min(1, remaining / interval));
      var size = 16;
      var strokeWidth = 2;
      var radius = (size - strokeWidth) / 2;
      var circumference = 2 * Math.PI * radius;
      var offset = circumference * (1 - progress);
      
      var circle = el.querySelector('.timer-progress');
      if (circle) {
        circle.style.strokeDashoffset = offset;
      }
      
      var valueEl = el.querySelector('.refresh-timer-value');
      if (valueEl) {
        var mins = Math.floor(remaining / 60);
        var secs = remaining % 60;
        valueEl.textContent = remaining > 0 
          ? (mins > 0 ? mins + ':' + String(secs).padStart(2, '0') : secs + 's')
          : '...';
      }
      
      if (remaining <= 0) {
        location.reload();
      }
    });
  }
  
  updateTimers();
  setInterval(updateTimers, 1000);
})();
</script>
`;
