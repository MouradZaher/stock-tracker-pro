# StockTracker Pro - US Stock Portfolio Tracker

A professional, real-time US stock portfolio tracker with AI-powered recommendations, built with React, TypeScript, and Vite.

## Features

### 🔍 Stock Search & Analysis
- Real-time stock search with autocomplete
- Support for all US stocks and popular ETFs (VOO, QQQ, SPY, etc.)
- Comprehensive stock data display:
  - Live price updates (every 10 seconds)
  - TradingView interactive charts
  - Market statistics (Open, High, Low, Volume, Market Cap, P/E, EPS, etc.)
  - 52-week high/low
  - Company information (CEO, founded year, description)

### 📊 Portfolio Management
- Add and track multiple positions
- Real-time profit/loss calculations ($ and %)
- Dividend tracking (past and upcoming payments)
- Allocation monitoring (5% per stock, 20% per sector limits)
- Auto-updating prices every 15 seconds
- Purchase value and market value tracking

### 🤖 AI-Powered Recommendations
- Sector-based stock recommendations
- Buy/Hold/Sell suggestions with detailed reasoning
- Technical analysis (RSI, Moving Averages)
- Fundamental analysis (P/E ratios, EPS)
- News sentiment analysis
- Suggested allocations following 5%/20% rules
- Top 3 stocks per sector

### 🎨 Premium UX/UI
- Dark mode only design
- Smooth animations and transitions
- Glassmorphism effects
- 100vh no-scroll layout (desktop optimized)
- Responsive flex-based CSS
- Premium color gradients
- Modern Inter font family

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite (optimized for fast development)
- **State Management**: Zustand (portfolio state with localStorage persistence)
- **Data Fetching**: TanStack React Query (with caching and auto-refetch)
- **Styling**: Vanilla CSS with custom design system
- **Charts**: TradingView widgets
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Animations**: Framer Motion

## Data Sources

The app integrates multiple data sources for reliability:

1. **Finnhub** - Real-time quotes, company profiles, news
2. **Alpha Vantage** - Fundamental data, historical prices, dividends
3. **Yahoo Finance** - Backup data source
4. **TradingView** - Interactive charts

All services have fallback to mock data when APIs are unavailable.

## Installation

### Prerequisites

- Node.js 18+ and npm

### Setup

1. **Clone or navigate to the project directory**:
   ```bash
   cd /Users/home/anti-proj
   ```

2. **Install dependencies** (if you encounter permission issues, see Troubleshooting section):
   ```bash
   npm install
   ```

3. **Configure API Keys** (optional but recommended):
   
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` and add your API keys:
   ```
   VITE_FINNHUB_API_KEY=your_finnhub_key
   VITE_ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
   ```
   
   Get free API keys:
   - Finnhub: https://finnhub.io/register
   - Alpha Vantage: https://www.alphavantage.co/support/#api-key

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:5173`

5. **Build for production**:
   ```bash
   npm run build
   ```

## Troubleshooting

### Node Modules Permission Issues (macOS)

If you encounter "EPERM: operation not permitted" errors with node_modules:

1. **Option 1 - Reset permissions**:
   ```bash
   sudo chown -R $(whoami) node_modules
   sudo chmod -R 755 node_modules
   ```

2. **Option 2 - Fresh install in a new directory**:
   ```bash
   mkdir ~/stock-tracker-fresh
   cp -r /Users/home/anti-proj/src ~/stock-tracker-fresh/
   cp -r /Users/home/anti-proj/public ~/stock-tracker-fresh/
   cp /Users/home/anti-proj/package.json ~/stock-tracker-fresh/
   cp /Users/home/anti-proj/index.html ~/stock-tracker-fresh/
   cp /Users/home/anti-proj/*.config.* ~/stock-tracker-fresh/
   cp /Users/home/anti-proj/tsconfig*.json ~/stock-tracker-fresh/
   cp /Users/home/anti-proj/.env ~/stock-tracker-fresh/
   cd ~/stock-tracker-fresh
   npm install
   npm run dev
   ```

3. **Option 3 - Disable macOS security (not recommended)**:
   System Preferences > Security & Privacy > Full Disk Access > Add Terminal

## API Rate Limits

Free tier limits:
- Finnhub: 60 requests/minute
- Alpha Vantage: 5 requests/minute, 500 requests/day

The app handles rate limits gracefully with:
- Smart caching
- Request debouncing
- Fallback to mock data
- Clear error messages

## Usage Guide

### Searching for Stocks

1. Navigate to the "Search Stocks" tab
2. Type a stock symbol (e.g., "AAPL") or company name
3. Select from the autocomplete dropdown
4. View comprehensive real-time data and charts

### Managing Your Portfolio

1. Go to the "My Portfolio" tab
2. Click "Add Position"
3. Enter:
   - Stock symbol
   - Number of units
   - Average purchase cost
4. View real-time P/L and allocations
5. Monitor allocation warnings (exceeding 5% per stock or 20% per sector)

### Viewing AI Recommendations

1. Navigate to "AI Recommendations" tab
2. Filter by sector or view all
3. See Buy/Hold/Sell recommendations with:
   - Score (0-100)
   - Suggested allocation percentage
   - Detailed reasoning
   - Recent news headlines
4. Click any stock for detailed analysis

## Architecture

```
src/
├── components/          # React components
│   ├── Header.tsx      # Navigation with animated tabs
│   ├── SearchEngine.tsx # Autocomplete search
│   ├── StockDetail.tsx # Stock information view
│   ├── TradingViewChart.tsx # Chart widget
│   ├── Portfolio.tsx   # Portfolio management
│   └── AIRecommendations.tsx # AI analysis
│
├── services/           # API integrations
│   ├── api.ts         # API clients configuration
│   ├── stockDataService.ts # Multi-source stock data
│   ├── newsService.ts  # News with sentiment
│   ├── dividendService.ts # Dividend tracking
│   └── aiRecommendationService.ts # Recommendation engine
│
├── hooks/             # Custom React hooks
│   └── usePortfolio.ts # Portfolio state (Zustand)
│
├── utils/             # Helper functions
│   ├── formatters.ts  # Currency, numbers, dates
│   └── calculations.ts # P/L, RSI, moving averages
│
├── data/              # Static data
│   └── sectors.ts     # Sector classifications, popular stocks
│
├── types/             # TypeScript types
│   └── index.ts       # All type definitions
│
├── App.tsx            # Main app component
├── main.tsx           # React entry point
└── index.css          # Global styles & design system
```

## Design System

The app uses a custom dark-mode design system with:

- **Color Palette**: Deep dark backgrounds with vibrant accent colors
- **Typography**: Inter font family for premium feel
- **Layout**: 100vh flex-based (no vertical scroll)
- **Animations**: Smooth transitions (250ms cubic-bezier)
- **Components**: Glassmorphism cards with subtle shadows
- **Responsive**: Optimized for desktop, scales to tablets

## Performance

- **Code splitting**: Automatic with Vite
- **Lazy loading**: TradingView widgets load on demand
- **Caching**: React Query manages data caching
- **Debouncing**: Search queries debounced to 300ms
- **Optimized re-renders**: Zustand for performant state updates

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- No Internet Explorer support

## License

This project is for educational and personal use.

## Support

For issues or questions:
1. Check API keys are configured correctly in `.env`
2. Verify network connection for API calls
3. Check browser console for detailed error messages

## Future Enhancements

- WebSocket connections for true real-time updates
- Export portfolio to CSV/PDF
- Price alerts and notifications
- Historical performance charts
- Tax loss harvesting suggestions
- Multi-currency support
