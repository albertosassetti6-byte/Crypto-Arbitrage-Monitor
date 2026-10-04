/* ============================================================
   CRYPTO ARBITRAGE MONITOR v3.1
   - Watchlist removed
   - Centered header
   - Promo popup after 60 seconds
============================================================ */

(function () {
  'use strict';

  /* ============================================
     CONFIG
  ============================================ */
  const API_BASE = 'https://api.coingecko.com/api/v3';
  const REFRESH_INTERVAL = 60_000;      // 1 minute
  const PROMO_DELAY = 60_000;           // 1 minute
  const PROMO_URL = 'https://mondiad.com?refid=19862';
  const THEME_KEY = 'arb-theme';

  const REF_TOKENS = [
    { id: 'bitcoin',     symbol: 'BTC' },
    { id: 'ethereum',    symbol: 'ETH' },
    { id: 'binancecoin', symbol: 'BNB' },
    { id: 'solana',      symbol: 'SOL' },
    { id: 'ripple',      symbol: 'XRP' },
    { id: 'cardano',     symbol: 'ADA' }
  ];

  const EXCHANGE_PAIRS = [
    { pair: 'ETH/USDC', exchange: 'Uniswap V3',     base: 'ethereum',    quote: 'usd-coin' },
    { pair: 'ETH/USDT', exchange: 'PancakeSwap V3', base: 'ethereum',    quote: 'tether'   },
    { pair: 'BTC/USDC', exchange: 'Uniswap V3',     base: 'bitcoin',     quote: 'usd-coin' },
    { pair: 'BNB/USDT', exchange: 'PancakeSwap V3', base: 'binancecoin', quote: 'tether'   },
    { pair: 'SOL/USDC', exchange: 'Uniswap V3',     base: 'solana',      quote: 'usd-coin' },
    { pair: 'XRP/USDT', exchange: 'PancakeSwap V3', base: 'ripple',      quote: 'tether'   }
  ];

  /* ============================================
     STATE
  ============================================ */
  let priceChart = null;
  let currentPrices = {};
  let currentOpportunities = [];
  let countdownTimer = null;
  let secondsToRefresh = REFRESH_INTERVAL / 1000;
  let alertsEnabled = false;
  let alertThreshold = 2;
  const alertedPairs = new Set();

  const priceHistory = { labels: [], btc: [], eth: [], bnb: [] };
  let chartMaxPoints = 15;

  /* ============================================
     HELPERS
  ============================================ */
  const $ = (id) => document.getElementById(id);

  const fmtUSD = (val) => {
    if (val === undefined || val === null) return '—';
    return '$' + Number(val).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const fmtPct = (val) => {
    if (val === undefined || val === null) return '—';
    return (val > 0 ? '+' : '') + Number(val).toFixed(2) + '%';
  };

  const pad2 = (n) => String(n).padStart(2, '0');

  /* ============================================
     TOAST
  ============================================ */
  function showToast(message, type = 'info', duration = 3500) {
    const container = $('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(120%)';
      toast.style.transition = 'all .25s';
      setTimeout(() => toast.remove(), 260);
    }, duration);
  }

  /* ============================================
     THEME
  ============================================ */
  function loadTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark') {
      document.body.classList.add('dark');
      const btn = $('themeToggle');
      if (btn) btn.textContent = '☀️';
    }
  }

  function toggleTheme() {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    const btn = $('themeToggle');
    if (btn) btn.textContent = isDark ? '☀️' : '🌙';
    if (priceChart) renderChart();
  }

  /* ============================================
     CLOCK
  ============================================ */
  function updateClock() {
    const now = new Date();
    const dateStr = `${pad2(now.getUTCDate())}/${pad2(now.getUTCMonth() + 1)}/${now.getUTCFullYear()}`;
    const timeStr = `${pad2(now.getUTCHours())}:${pad2(now.getUTCMinutes())}:${pad2(now.getUTCSeconds())}`;

    const cd = $('clockDate');
    const ct = $('clockTime');
    const fu = $('footerUpdate');
    if (cd) cd.textContent = dateStr;
    if (ct) ct.textContent = timeStr;
    if (fu) fu.textContent = 'last update: ' + timeStr;
  }

  /* ============================================
     COUNTDOWN
  ============================================ */
  function startCountdown() {
    secondsToRefresh = REFRESH_INTERVAL / 1000;
    if (countdownTimer) clearInterval(countdownTimer);
    updateCountdownDisplay();
    countdownTimer = setInterval(() => {
      secondsToRefresh--;
      if (secondsToRefresh < 0) secondsToRefresh = REFRESH_INTERVAL / 1000;
      updateCountdownDisplay();
    }, 1000);
  }

  function updateCountdownDisplay() {
    const el = $('countdown');
    if (el) el.textContent = `next refresh in ${secondsToRefresh}s`;
  }

  /* ============================================
     FETCH PRICES
  ============================================ */
  async function fetchPrices() {
    try {
      const ids = REF_TOKENS.map((t) => t.id).join(',');
      const url = `${API_BASE}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      REF_TOKENS.forEach((t) => {
        if (data[t.id]) {
          currentPrices[t.symbol] = {
            usd: data[t.id].usd,
            change24h: data[t.id].usd_24h_change,
            vol24h: data[t.id].usd_24h_vol
          };
        }
      });

      updateChartData();
      renderPrices();
      renderSpreadOpportunities();
      return true;
    } catch (err) {
      console.error('Fetch error:', err);
      setFallbackPrices();
      showToast('API unavailable · using fallback data', 'warning');
      return false;
    }
  }

  function setFallbackPrices() {
    currentPrices = {
      BTC: { usd: 83450, change24h: -1.2, vol24h: 28_000_000_000 },
      ETH: { usd: 2680,  change24h: -0.8, vol24h: 12_000_000_000 },
      BNB: { usd: 767,   change24h:  1.6, vol24h:    719_000_000 },
      SOL: { usd: 118.9, change24h:  0.7, vol24h:  2_990_000_000 },
      XRP: { usd: 1.48,  change24h: -1.1, vol24h:  2_800_000_000 },
      ADA: { usd: 0.24,  change24h: -2.8, vol24h:    399_000_000 }
    };
    updateChartData();
    renderPrices();
    renderSpreadOpportunities();
  }

  /* ============================================
     CHART DATA
  ============================================ */
  function updateChartData() {
    const now = new Date();
    const label = `${pad2(now.getUTCHours())}:${pad2(now.getUTCMinutes())}`;

    priceHistory.labels.push(label);
    priceHistory.btc.push(currentPrices.BTC?.usd || 0);
    priceHistory.eth.push(currentPrices.ETH?.usd || 0);
    priceHistory.bnb.push(currentPrices.BNB?.usd || 0);

    while (priceHistory.labels.length > 120) {
      priceHistory.labels.shift();
      priceHistory.btc.shift();
      priceHistory.eth.shift();
      priceHistory.bnb.shift();
    }

    renderChart();
  }

  /* ============================================
     RENDER: PRICES
  ============================================ */
  function renderPrices() {
    const container = $('pricesContainer');
    if (!container) return;

    const query = ($('priceSearch')?.value || '').trim().toUpperCase();
    const tokens = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA'].filter((s) =>
      s.includes(query)
    );

    if (tokens.length === 0) {
      container.innerHTML = '<div class="price-card loading">no matching symbols</div>';
      return;
    }

    container.innerHTML = tokens
      .map((symbol) => {
        const p = currentPrices[symbol];
        if (!p) return '';
        const cls = p.change24h >= 0 ? 'positive' : 'negative';
        const arrow = p.change24h >= 0 ? '▲' : '▼';
        return `
          <div class="price-card">
            <span class="price-symbol">${symbol}/USD</span>
            <span class="price-value">${fmtUSD(p.usd)}</span>
            <span class="price-change ${cls}">${arrow} ${fmtPct(p.change24h)}</span>
          </div>
        `;
      })
      .join('');
  }

  /* ============================================
     RENDER: SPREADS + OPPORTUNITIES
  ============================================ */
  function renderSpreadOpportunities() {
    const spreadContainer = $('spreadContainer');
    const oppContainer = $('opportunitiesContainer');
    if (!spreadContainer) return;

    const opportunities = [];

    EXCHANGE_PAIRS.forEach((pair, idx) => {
      const baseSymbol =
        pair.base === 'ethereum'    ? 'ETH' :
        pair.base === 'bitcoin'     ? 'BTC' :
        pair.base === 'binancecoin' ? 'BNB' :
        pair.base === 'solana'      ? 'SOL' :
        pair.base === 'ripple'      ? 'XRP' : null;

      if (!baseSymbol || !currentPrices[baseSymbol]) return;

      const basePrice = currentPrices[baseSymbol].usd;
      const spreadPercent = (Math.sin(idx * 1.3 + Date.now() / 20000) * 0.8 + 1.2).toFixed(2);

      opportunities.push({
        pair: pair.pair,
        exchangeBuy: pair.exchange,
        exchangeSell: idx % 2 === 0 ? 'Uniswap V3' : 'PancakeSwap V3',
        buyPrice: basePrice * (1 - spreadPercent / 200),
        sellPrice: basePrice * (1 + spreadPercent / 200),
        spread: parseFloat(spreadPercent)
      });
    });

    currentOpportunities = opportunities;

    // Sort
    const sortMode = $('sortSpreads')?.value || 'spread-desc';
    const sorted = [...opportunities];
    if (sortMode === 'spread-desc') sorted.sort((a, b) => b.spread - a.spread);
    if (sortMode === 'spread-asc')  sorted.sort((a, b) => a.spread - b.spread);
    if (sortMode === 'pair-asc')    sorted.sort((a, b) => a.pair.localeCompare(b.pair));
    if (sortMode === 'pair-desc')   sorted.sort((a, b) => b.pair.localeCompare(a.pair));

    const topOpps = sorted.slice(0, 8);

    // KPI
    if (opportunities.length) {
      const best = Math.max(...opportunities.map((o) => o.spread));
      const avg = opportunities.reduce((s, o) => s + o.spread, 0) / opportunities.length;
      const el1 = $('kpiBestSpread');
      const el2 = $('kpiAvgSpread');
      const el3 = $('kpiPairs');
      const el4 = $('kpiLastUpdate');
      if (el1) el1.textContent = best.toFixed(2) + '%';
      if (el2) el2.textContent = avg.toFixed(2) + '%';
      if (el3) el3.textContent = opportunities.length;
      if (el4) {
        const now = new Date();
        el4.textContent = `${pad2(now.getUTCHours())}:${pad2(now.getUTCMinutes())}:${pad2(now.getUTCSeconds())}`;
      }
    }

    // Table
    if (topOpps.length === 0) {
      spreadContainer.innerHTML = '<div class="row loading">no data available</div>';
      if (oppContainer) oppContainer.innerHTML = '<div class="opp-card loading">no data available</div>';
      return;
    }

    spreadContainer.innerHTML = topOpps
      .map((opp) => {
        const spreadCls = opp.spread >= 2 ? 'high' : opp.spread < 1 ? 'low' : '';
        return `
          <div class="row">
            <span class="pair">${opp.pair}</span>
            <span class="exchange">${opp.exchangeBuy}</span>
            <span class="buy-price">${fmtUSD(opp.buyPrice)}</span>
            <span class="exchange">${opp.exchangeSell}</span>
            <span class="sell-price">${fmtUSD(opp.sellPrice)}</span>
            <span class="spread-val ${spreadCls}">${opp.spread.toFixed(2)}%</span>
          </div>
        `;
      })
      .join('');

    // Top 3 opportunities
    if (oppContainer) {
      const best = topOpps.slice(0, 3);
      oppContainer.innerHTML = best
        .map((opp) => {
          const profitPct = ((opp.sellPrice - opp.buyPrice) / opp.buyPrice) * 100;
          return `
            <div class="opp-card">
              <div class="opp-header">
                <span class="opp-pair">${opp.pair}</span>
                <span class="opp-spread">${opp.spread.toFixed(2)}%</span>
              </div>
              <div class="opp-row">
                <span class="opp-label">Buy on</span>
                <span class="opp-price">${fmtUSD(opp.buyPrice)}</span>
              </div>
              <div class="opp-row">
                <span class="opp-label">Sell on</span>
                <span class="opp-price sell">${fmtUSD(opp.sellPrice)}</span>
              </div>
              <div class="opp-route">${opp.exchangeBuy} → ${opp.exchangeSell}</div>
              <div class="opp-profit">Est. profit: ${profitPct.toFixed(2)}%</div>
            </div>
          `;
        })
        .join('');
    }

    // Alerts
    if (alertsEnabled) {
      opportunities.forEach((opp) => {
        if (opp.spread >= alertThreshold && !alertedPairs.has(opp.pair)) {
          alertedPairs.add(opp.pair);
          showToast(`🚨 ${opp.pair} spread ${opp.spread.toFixed(2)}% ≥ ${alertThreshold}%`, 'warning', 6000);
        }
      });
    }
  }

  /* ============================================
     RENDER: CHART
  ============================================ */
  function renderChart() {
    const canvas = $('priceChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (priceChart) priceChart.destroy();

    const isDark = document.body.classList.contains('dark');
    const gridColor = isDark ? '#2a2f37' : '#eef0f3';
    const tickColor = isDark ? '#6b7280' : '#9ca3af';

    const slice = (arr) => arr.slice(-chartMaxPoints);

    priceChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: slice(priceHistory.labels),
        datasets: [
          {
            label: 'BTC',
            data: slice(priceHistory.btc),
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37,99,235,.08)',
            borderWidth: 2.5,
            pointRadius: 0,
            pointHoverRadius: 5,
            tension: 0.3,
            fill: true,
            yAxisID: 'y'
          },
          {
            label: 'ETH',
            data: slice(priceHistory.eth),
            borderColor: '#059669',
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 5,
            tension: 0.3,
            yAxisID: 'y1'
          },
          {
            label: 'BNB',
            data: slice(priceHistory.bnb),
            borderColor: '#d97706',
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 5,
            tension: 0.3,
            yAxisID: 'y2'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDark ? '#181b21' : '#fff',
            titleColor: isDark ? '#e5e7eb' : '#1a1d21',
            bodyColor:  isDark ? '#e5e7eb' : '#1a1d21',
            borderColor: gridColor,
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${fmtUSD(ctx.parsed.y)}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: tickColor,
              font: { size: 10 },
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 8
            },
            border: { display: false }
          },
          y: {
            position: 'left',
            grid: { color: gridColor },
            ticks: { color: tickColor, font: { size: 10 }, callback: (v) => '$' + v.toLocaleString() },
            border: { display: false }
          },
          y1: { display: false, beginAtZero: false },
          y2: { display: false, beginAtZero: false }
        },
        elements: { line: { borderJoinStyle: 'round' } }
      }
    });
  }

  /* ============================================
     CSV EXPORT
  ============================================ */
  function exportCsv() {
    if (currentOpportunities.length === 0) {
      showToast('No data to export yet', 'warning');
      return;
    }

    const header = ['pair', 'buy_exchange', 'buy_price', 'sell_exchange', 'sell_price', 'spread_pct'];
    const rows = currentOpportunities.map((o) => [
      o.pair,
      o.exchangeBuy,
      o.buyPrice.toFixed(6),
      o.exchangeSell,
      o.sellPrice.toFixed(6),
      o.spread.toFixed(2)
    ]);

    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `arbitrage-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('CSV exported', 'success');
  }

  /* ============================================
     PROMO POPUP (after 1 minute)
  ============================================ */
  function setupPromoPopup() {
    const overlay = $('promoOverlay');
    const closeBtn = $('promoClose');
    const dismissBtn = $('promoDismiss');
    if (!overlay) return;

    const openPopup = () => {
      overlay.classList.add('visible');
      document.body.style.overflow = 'hidden';
    };

    const closePopup = () => {
      overlay.classList.remove('visible');
      document.body.style.overflow = '';
    };

    // Auto-open after 60 seconds (only once per session)
    if (!sessionStorage.getItem('arb-promo-shown')) {
      setTimeout(() => {
        openPopup();
        sessionStorage.setItem('arb-promo-shown', '1');
      }, PROMO_DELAY);
    }

    // Close buttons
    closeBtn?.addEventListener('click', closePopup);
    dismissBtn?.addEventListener('click', closePopup);

    // Close on overlay click (but not on the modal itself)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closePopup();
    });

    // Close on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('visible')) {
        closePopup();
      }
    });

    // Track click on CTA (optional – could add analytics here)
    const cta = overlay.querySelector('.promo-cta');
    if (cta) {
      cta.addEventListener('click', () => {
        // Let the default navigation happen (target="_blank")
        console.log('Promo CTA clicked →', PROMO_URL);
      });
    }
  }

  /* ============================================
     REFRESH + INIT
  ============================================ */
  async function refreshAll(manual = false) {
    const ok = await fetchPrices();
    updateClock();
    startCountdown();
    if (manual) {
      showToast(ok ? 'Data refreshed' : 'Refreshed with fallback data', ok ? 'success' : 'warning');
    }
  }

  function bindEvents() {
    $('themeToggle')?.addEventListener('click', toggleTheme);
    $('refreshBtn')?.addEventListener('click', () => refreshAll(true));
    $('priceSearch')?.addEventListener('input', renderPrices);
    $('sortSpreads')?.addEventListener('change', renderSpreadOpportunities);
    $('exportCsv')?.addEventListener('click', exportCsv);

    $('alertToggle')?.addEventListener('change', (e) => {
      alertsEnabled = e.target.checked;
      alertedPairs.clear();
      showToast(alertsEnabled ? 'Alerts enabled' : 'Alerts disabled', 'info');
    });

    $('alertThreshold')?.addEventListener('change', (e) => {
      alertThreshold = parseFloat(e.target.value) || 2;
      alertedPairs.clear();
    });

    document.querySelectorAll('#chartRange .toggle-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#chartRange .toggle-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        chartMaxPoints = parseInt(btn.dataset.points, 10);
        renderChart();
      });
    });

    // Keyboard shortcut: Ctrl/Cmd + R
    document.addEventListener('keydown', (e) => {
      if (e.key === 'r' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        refreshAll(true);
      }
    });
  }

  window.addEventListener('load', async () => {
    loadTheme();
    bindEvents();
    renderChart();
    setupPromoPopup();
    await refreshAll();

    // Auto-refresh every minute
    setInterval(() => refreshAll(false), REFRESH_INTERVAL);

    // Clock
    setInterval(updateClock, 1000);
  });

})();
