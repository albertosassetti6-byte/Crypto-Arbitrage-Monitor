# ◈ Crypto Arbitrage Monitor

A modern, responsive web dashboard for monitoring cryptocurrency arbitrage opportunities across DEX (Uniswap V3, PancakeSwap V3) and CEX markets. Real-time prices, live spread detection, interactive charts, and a clean UI with dark mode support.

---

## 📸 Overview

**Crypto Arbitrage Monitor** is a lightweight, single-page application built with vanilla HTML, CSS, and JavaScript. It pulls live market data from the public **CoinGecko API** and simulates cross-exchange spread detection to surface the most profitable arbitrage opportunities in real time.

The dashboard auto-refreshes **every 60 seconds**, includes an interactive price chart powered by **Chart.js**, and offers a full set of tools: search, sorting, CSV export, price alerts, and a dark/light theme toggle.

---

## ✨ Features

### Core
- 🪙 **Live key prices** for BTC, ETH, BNB, SOL, XRP, ADA
- 📊 **Interactive market trend chart** (BTC / ETH / BNB) with 15 / 30 / 60-point ranges
- ⚡ **Best spreads table** — buy/sell prices across DEX & CEX
- 🎯 **Top 3 opportunities** cards with estimated profit %
- 🔄 **Auto-refresh every 60 seconds** with a live countdown
- 🕒 **Live UTC clock** in the header

### Tools & UX
- 🌗 **Dark / Light theme** (persisted in `localStorage`)
- 🔍 **Live search** for key prices
- ↕️ **Sorting** for spreads (by spread, by pair name)
- ⬇️ **CSV export** of current opportunities
- 🚨 **Price alerts** with a customizable threshold (%)
- 🔔 **Toast notifications** for user feedback
- ⌨️ **Keyboard shortcut**: `Ctrl/Cmd + R` → manual refresh
- 📱 **Fully responsive** — 3 columns → 2 → 1; table transforms into cards on mobile

### Extra
- 📢 **Promo popup** shown **once per session**, 60 seconds after page load
- 🛡️ **Fallback data** if the CoinGecko API is unavailable
- 🎨 **Modern design** — no terminal aesthetics, clean cards, soft shadows

---

## 🛠 Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Markup     | HTML5                               |
| Styling    | Vanilla CSS3 (custom properties)    |
| Logic      | Vanilla JavaScript (ES6+)           |
| Charts     | [Chart.js 4.4](https://www.chartjs.org/) |
| Data       | [CoinGecko API v3](https://www.coingecko.com/en/api) |
| Storage    | `localStorage` + `sessionStorage`   |

**Zero build tools. Zero dependencies. Just three files.**

crypto-arbitrage-monitor/
├── index.html # Markup + structural layout
├── style.css # All styling, themes, responsiveness
├── script.js # Logic: fetch, render, chart, popup
└── README.md # You are here

🧠 How It Works
On page load, the app fetches spot prices from CoinGecko (/simple/price).

Prices are rendered as cards, and the chart appends a new data point.

Simulated spread data is generated per exchange pair (in production, replace with real DEX subgraph data).

Opportunities are sorted by spread and rendered in the table + top-3 cards.

A countdown shows time remaining until the next auto-refresh (every 60 seconds).

A promo popup appears once per session, 60 seconds after first load.

Data sources
Source	Used for
CoinGecko API	Live spot prices & 24h change
Simulated DEX data	Spread calculation (demo)
🔧 Production note: For real arbitrage detection, plug into Uniswap V3 Subgraph and PancakeSwap V3 Subgraph endpoints, or any DEX aggregator API (1inch, 0x, Paraswap).

📱 Responsive Behavior
Breakpoint	Layout
> 900px	3-column dashboard, full table
700–900px	2-column KPI grid, condensed sections
< 640px	Single column, table becomes cards, full-width inputs
Tested on Chrome, Firefox, Safari, and Edge (desktop + mobile).

🎨 Theming
Themes are driven by CSS custom properties in :root and body.dark.

css
:root {
  --bg:        #f7f8fa;
  --surface:   #ffffff;
  --accent:    #2563eb;
  --success:   #059669;
  /* ... */
}

body.dark {
  --bg:        #0f1115;
  --surface:   #181b21;
  --accent:    #3b82f6;
  /* ... */
}
To create a custom theme, simply override these variables.

⌨️ Keyboard Shortcuts
Shortcut	Action
Ctrl + R / ⌘ + R	Manual refresh
ESC	Close promo popup
Enter	—
Note: Ctrl/Cmd + R is intercepted and remapped to a data refresh instead of a page reload.

🔒 Privacy & Security
❌ No tracking scripts

❌ No cookies

❌ No backend

✅ All data is fetched directly from public APIs (CoinGecko)

✅ User preferences (theme) stored locally in localStorage

✅ Promo popup shown only once per session (sessionStorage)

✅ External links use rel="noopener noreferrer"

⚠️ Disclaimer
This project is provided for educational and informational purposes only.

Nothing here constitutes financial advice.

Arbitrage opportunities may be inaccurate due to network latency, fees, slippage, or API delays.

Always do your own research before executing any trade.

The author is not responsible for any financial losses.

🗺 Roadmap
□ Real DEX subgraph integration (Uniswap V3, PancakeSwap V3)
□ Multi-chain support (Ethereum, BSC, Polygon, Arbitrum, Base)
□ Historical spread charts per pair
□ Wallet connect (MetaMask, WalletConnect)
□ Telegram / Discord alert webhooks
□ PWA offline support
□ i18n (Italian, English, Spanish)
🤝 Contributing
Contributions, issues, and feature requests are welcome!

Fork the project

Create your feature branch (git checkout -b feature/AmazingFeature)

Commit your changes (git commit -m 'Add some AmazingFeature')

Push to the branch (git push origin feature/AmazingFeature)

Open a Pull Request

📄 License
This project is released under the MIT License.

text
MIT License

Copyright (c) 2025 Crypto Arbitrage Monitor

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


🙏 Credits
Chart.js — chartjs.org

CoinGecko — coingecko.com

Uniswap — uniswap.org

PancakeSwap — pancakeswap.finance



