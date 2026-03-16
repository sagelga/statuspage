
export const StatusPageScript = (Icons: any, HeroIcons: any, StatusLabels: any, HeroTitles: any) => `
    (function() {
      // ── Icons ──
      var SVCICONS = ${JSON.stringify(Icons)};
      var HICONS = ${JSON.stringify(HeroIcons)};
      var LABELS = ${JSON.stringify(StatusLabels)};
      var HERO_TITLE = ${JSON.stringify(HeroTitles)};

      // ── Date helpers ──
      var DATE_STRS = (function() {
        var arr = [];
        var today = Date.now();
        for (var i = 29; i >= 0; i--) {
          var d = new Date(today);
          d.setDate(d.getDate() - i);
          arr.push(d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }));
        }
        return arr;
      })();

      var DATE_ISO = (function() {
        var arr = [];
        var today = Date.now();
        for (var i = 29; i >= 0; i--) {
          var d = new Date(today);
          d.setDate(d.getDate() - i);
          arr.push(d.toISOString().slice(0, 10));
        }
        return arr;
      })();

      // ── Auto-refresh ──
      var svcHistory = {};
      var countdownTimer = null;
      var refreshTimer = null;
      var minutePopup = null;
      var minuteCache = {};
      var hoverBarEl = null;

      function getOrCreatePopup() {
        if (!minutePopup) {
          minutePopup = document.createElement('div');
          minutePopup.id = 'minute-popup';
          document.body.appendChild(minutePopup);
        }
        return minutePopup;
      }

      function positionPopup(barEl) {
        var popup = getOrCreatePopup();
        var rect = barEl.getBoundingClientRect();
        var pw = popup.offsetWidth || 340;
        var ph = popup.offsetHeight || 210;
        var vw = window.innerWidth;
        var left = rect.left + rect.width / 2 - pw / 2;
        var top = rect.top - ph - 12;
        if (left < 8) left = 8;
        if (left + pw > vw - 8) left = vw - pw - 8;
        if (top < 8) top = rect.bottom + 12;
        popup.style.left = left + 'px';
        popup.style.top = top + 'px';
      }

      function renderMosaic(data, dateLabel) {
        var popup = getOrCreatePopup();
        var tzOffset = -(new Date().getTimezoneOffset());
        var gridCells = '';
        for (var h = 0; h < 24; h++) {
          for (var m = 0; m < 60; m++) {
            var localMinute = h * 60 + m;
            var utcMinute = ((localMinute - tzOffset) % 1440 + 1440) % 1440;
            var st = data[utcMinute];
            gridCells += '<div class="mosaic-cell ' + (st || 'nodata') + '"></div>';
          }
        }
        var hourLabels = '';
        var hrs = [0, 6, 12, 18];
        for (var i = 0; i < hrs.length; i++) {
          hourLabels += '<span class="mosaic-hour-label" style="top:' + (hrs[i] * 5) + 'px">' + (hrs[i] < 10 ? '0' + hrs[i] : '' + hrs[i]) + '</span>';
        }

        var opCount = 0, totalCount = 0;
        for (var k = 0; k < 1440; k++) {
          if (data[k]) {
            totalCount++;
            if (data[k] === 'operational') opCount++;
          }
        }
        var dayPct = totalCount > 0 ? ((opCount / totalCount) * 100).toFixed(2) + '%' : 'N/A';
        var pctColor = parseFloat(dayPct) >= 99.9 ? '#10b981' : (parseFloat(dayPct) >= 95 ? '#f59e0b' : '#ef4444');

        popup.innerHTML =
          '<div class="mosaic-title">' + 
            '<span>' + dateLabel + '</span>' +
            '<span class="mosaic-day-pct" style="color:' + pctColor + '">' + dayPct + ' Uptime</span>' +
          '</div>' +
          '<div style="display:flex;align-items:flex-start;gap:6px;">' +
            '<div class="mosaic-hours" style="height:119px;">' + hourLabels + '</div>' +
            '<div class="mosaic-grid">' + gridCells + '</div>' +
          '</div>' +
          '<div class="mosaic-legend">' +
            '<span><span class="mosaic-legend-dot" style="background:#10b981;"></span>\u0e43\u0e0a\u0e49\u0e07\u0e32\u0e19\u0e44\u0e14\u0e49</span>' +
            '<span><span class="mosaic-legend-dot" style="background:#f59e0b;"></span>\u0e21\u0e35\u0e1b\u0e31\u0e0d\u0e2b\u0e32</span>' +
            '<span><span class="mosaic-legend-dot" style="background:#ef4444;"></span>\u0e43\u0e0a\u0e49\u0e07\u0e32\u0e19\u0e44\u0e21\u0e48\u0e44\u0e14\u0e49</span>' +
            '<span><span class="mosaic-legend-dot" style="background:rgba(255,255,255,0.1);"></span>\u0e44\u0e21\u0e48\u0e21\u0e35\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25</span>' +
          '</div>';
      }

      function showBarPopup(barEl) {
        hoverBarEl = barEl;
        var svcId = barEl.getAttribute('data-svc');
        var dateStr = barEl.getAttribute('data-date');
        var dateLabel = barEl.getAttribute('data-label');
        var popup = getOrCreatePopup();
        popup.innerHTML = '<div class="mosaic-title">' + dateLabel + '</div><div style="color:#94a3b8;font-size:11px;margin-top:4px;">\u0e01\u0e33\u0e25\u0e31\u0e07\u0e42\u0e2b\u0e25\u0e14...</div>';
        popup.style.display = 'block';
        setTimeout(function() { popup.classList.add('visible'); }, 10);
        positionPopup(barEl);
        var cacheKey = svcId + ':' + dateStr;
        if (minuteCache[cacheKey]) {
          renderMosaic(minuteCache[cacheKey], dateLabel);
          positionPopup(barEl);
          return;
        }
        fetch('/api/minutes/' + svcId + '/' + dateStr)
          .then(function(r) { return r.json(); })
          .then(function(d) {
            minuteCache[cacheKey] = d;
            if (hoverBarEl === barEl) {
              renderMosaic(d, dateLabel);
              positionPopup(barEl);
            }
          })
          .catch(function() {});
      }

      function hideBarPopup() {
        hoverBarEl = null;
        if (minutePopup) {
          minutePopup.classList.remove('visible');
          setTimeout(function() {
            if (!minutePopup.classList.contains('visible')) {
              minutePopup.style.display = 'none';
            }
          }, 200);
        }
      }

      function startCountdown() {
        if (countdownTimer) clearInterval(countdownTimer);
        if (refreshTimer) clearTimeout(refreshTimer);
        
        var interval = 60;
        function tick() {
          var msLeft = 60000 - (Date.now() % 60000);
          var sec = Math.ceil(msLeft / 1000);
          if (sec > 60) sec = 60;
          
          document.querySelectorAll('.refresh-timer-container').forEach(function(timerEl) {
            var valEl = timerEl.querySelector('.refresh-timer-value');
            if (valEl) valEl.textContent = sec + 's';
            
            var circle = timerEl.querySelector('.timer-progress');
            if (circle) {
              var progress = (sec - 1) / interval;
              var radius = 7;
              var circumference = 2 * Math.PI * radius;
              circle.style.strokeDashoffset = circumference * (1 - (msLeft / 60000));
            }
          });
        }
        tick();
        countdownTimer = setInterval(tick, 1000);
        refreshTimer = setTimeout(loadStatus, 60000 - (Date.now() % 60000));
      }

      function makeBadge(status) {
        return '<span class="badge ' + status + '"><span class="dot"></span>' + (LABELS[status] || status) + '</span>';
      }

      function makeUptimeBars(histArr, currentStatus, serviceId) {
        var html = '';
        for (var i = 0; i < 30; i++) {
          var st = (histArr && histArr[i] && histArr[i] !== 'nodata') ? histArr[i]
                   : (i === 29) ? currentStatus
                   : 'nodata';
          html += '<div class="uptime-bar ' + st + '" data-svc="' + serviceId + '" data-date="' + DATE_ISO[i] + '" data-label="' + DATE_STRS[i] + '"></div>';
        }
        return html;
      }

      function makeComponentRow(s) {
        var rt = (s.responseTime !== null) ? (s.responseTime + ' ms') : '—';
        var iconSvg = SVCICONS[s.icon] || '';
        return '<div class="component-row">' +
          '<div class="component-top">' +
            '<span class="component-icon">' + iconSvg + '</span>' +
            '<span class="component-name">' + s.name + '</span>' +
            '<div class="component-meta">' +
              '<span class="response-time">' + rt + '</span>' +
              makeBadge(s.status) +
            '</div>' +
          '</div>' +
          '<div class="uptime-row">' +
            '<span class="uptime-label">30 \u0e27\u0e31\u0e19</span>' +
            '<div class="uptime-bars">' + makeUptimeBars(svcHistory[s.id], s.status, s.id) + '</div>' +
          '</div>' +
        '</div>';
      }

      function loadStatus() {
        if (countdownTimer) clearInterval(countdownTimer);
        if (refreshTimer) clearTimeout(refreshTimer);
        
        document.querySelectorAll('.refresh-timer-value').forEach(function(valEl) {
          valEl.textContent = '...';
        });

        fetch('/api/status')
          .then(function(r) { return r.json(); })
          .then(function(data) {
            svcHistory = data.history || {};
            var banner = document.getElementById('hero-banner');
            if (banner) banner.className = 'hero-banner ' + data.status;
            var hi = document.getElementById('hero-icon');
            if (hi) hi.innerHTML = HICONS[data.status] || '';
            var ht = document.getElementById('hero-title');
            if (ht) ht.textContent = HERO_TITLE[data.status] || data.status;
            var hs = document.getElementById('hero-sub');
            if (hs) hs.textContent = '\u0e15\u0e23\u0e27\u0e08\u0e2a\u0e2d\u0e1a\u0e25\u0e48\u0e32\u0e2a\u0e38\u0e14: ' + new Date(data.checkedAt).toLocaleString('th-TH', {
              year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            var comp = document.getElementById('components');
            if (comp) comp.innerHTML = data.services.map(makeComponentRow).join('');
            startCountdown();
          })
          .catch(function() {
            var banner = document.getElementById('hero-banner');
            if (banner) banner.className = 'hero-banner down';
            var hi = document.getElementById('hero-icon');
            if (hi) hi.innerHTML = HICONS.down;
            var ht = document.getElementById('hero-title');
            if (ht) ht.textContent = '\u0e44\u0e21\u0e48\u0e2a\u0e32\u0e21\u0e32\u0e23\u0e16\u0e42\u0e2b\u0e25\u0e14\u0e2a\u0e16\u0e32\u0e19\u0e30\u0e44\u0e14\u0e49';
            var hs = document.getElementById('hero-sub');
            if (hs) hs.textContent = '\u0e01\u0e23\u0e38\u0e13\u0e32\u0e25\u0e2d\u0e07\u0e23\u0e35\u0e40\u0e16\u0e23\u0e0a\u0e2b\u0e19\u0e49\u0e32\u0e40\u0e27\u0e47\u0e1a';
          });
      }

      loadStatus();

      document.addEventListener('mouseover', function(e) {
        var t = e.target;
        if (t && t.classList && t.classList.contains('uptime-bar') && t.getAttribute('data-svc')) {
          showBarPopup(t);
        }
      });
      document.addEventListener('mouseout', function(e) {
        var t = e.target;
        if (t && t.classList && t.classList.contains('uptime-bar')) {
          hideBarPopup();
        }
      });

      var themeBtn = document.getElementById('theme-toggle-btn');
      var htmlEl = document.documentElement;

      function updateThemeUI(isDark) {
        if (themeBtn) {
          themeBtn.innerHTML = isDark ? '\u2600\ufe0f Light' : '\ud83c\udf19 Dark';
        }
      }

      function toggleTheme() {
        var currentIsDark = htmlEl.classList.contains('dark-theme') || 
                           (window.matchMedia('(prefers-color-scheme: dark)').matches && !htmlEl.classList.contains('light-theme'));
        
        if (currentIsDark) {
          htmlEl.classList.remove('dark-theme');
          htmlEl.classList.add('light-theme');
          localStorage.setItem('theme', 'light');
          updateThemeUI(false);
        } else {
          htmlEl.classList.remove('light-theme');
          htmlEl.classList.add('dark-theme');
          localStorage.setItem('theme', 'dark');
          updateThemeUI(true);
        }
      }

      var savedTheme = localStorage.getItem('theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      if (savedTheme === 'dark') {
        htmlEl.classList.add('dark-theme');
        updateThemeUI(true);
      } else if (savedTheme === 'light') {
        htmlEl.classList.add('light-theme');
        updateThemeUI(false);
      } else {
        updateThemeUI(prefersDark);
      }

      if (themeBtn) {
        themeBtn.addEventListener('click', toggleTheme);
      }
    })();
`;
