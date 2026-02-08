// Stock data types
export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  avgVolume: number;
  marketCap: number;
  peRatio: number | null;
  eps: number | null;
  dividendYield: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  totalValue: number | null;
  totalBuy: number | null;
  totalSell: number | null;
  lastUpdated: Date;
}

export interface CompanyProfile {
  symbol: string;
  name: string;
  description: string;
  ceo: string | null;
  founded: string | null;
  sector: string;
  industry: string;
  logo: string | null;
  website: string | null;
  dividends: Dividend[];
}

export interface NewsArticle {
  id: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  datetime: number;
  image: string | null;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface Dividend {
  exDate: string;
  paymentDate: string;
  amount: number;
  type: 'past' | 'upcoming';
}

// Portfolio types
export interface PortfolioPosition {
  id: string;
  symbol: string;
  name: string;
  units: number;
  avgCost: number;
  purchaseValue: number;
  currentPrice: number;
  marketValue: number;
  profitLoss: number;
  profitLossPercent: number;
  sector: string;
  dividends: Dividend[];
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  positions: PortfolioPosition[];
}

// AI Recommendation types
export interface StockRecommendation {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  score: number;
  recommendation: 'Buy' | 'Hold' | 'Sell';
  suggestedAllocation: number;
  reasoning: string[];
  news: NewsArticle[];
  technicalIndicators: {
    rsi: number | null;
    ma50: number | null;
    ma200: number | null;
  };
  fundamentals: {
    peRatio: number | null;
    epsGrowth: number | null;
  };
}

export interface SectorAllocation {
  sector: string;
  allocation: number;
  stocks: string[];
}

// Search types
export interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  exchange: string;
}

// Tab types
export type TabType = 'search' | 'portfolio' | 'recommendations' | 'watchlist' | 'pulse' | 'notifications';

// Social & Notifications
export interface SocialPost {
  id: string;
  author: string;
  handle: string;
  content: string;
  timestamp: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  weight: number; // Institutional weight 1-10
  symbol?: string;
  isVerified: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'alert' | 'news' | 'ai' | 'social';
  timestamp: number;
  read: boolean;
  link?: string;
  symbol?: string;
}
