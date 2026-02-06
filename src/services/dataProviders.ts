// Data Providers Configuration
// 10 Alternative Stock Data Sources with Parsers

export interface StockQuote {
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
    peRatio: number;
    eps: number;
    dividendYield: number;
    fiftyTwoWeekHigh: number;
    fiftyTwoWeekLow: number;
}

export interface DataProvider {
    name: string;
    priority: number;
    isHealthy: boolean;
    lastError: Date | null;
    consecutiveFailures: number;
    rateLimit: {
        requests: number;
        period: number; // ms
        current: number;
        resetTime: Date;
    };
    requiresKey: boolean;
    hasWebSocket: boolean;
}

// Provider configurations
export const PROVIDERS: Record<string, DataProvider> = {
    yahoo: {
        name: 'Yahoo Finance',
        priority: 1,
        isHealthy: true,
        lastError: null,
        consecutiveFailures: 0,
        rateLimit: { requests: 2000, period: 3600000, current: 0, resetTime: new Date() },
        requiresKey: false,
        hasWebSocket: false,
    },
    finnhub: {
        name: 'Finnhub',
        priority: 2,
        isHealthy: true,
        lastError: null,
        consecutiveFailures: 0,
        rateLimit: { requests: 60, period: 60000, current: 0, resetTime: new Date() },
        requiresKey: true,
        hasWebSocket: true,
    },
    alphaVantage: {
        name: 'Alpha Vantage',
        priority: 3,
        isHealthy: true,
        lastError: null,
        consecutiveFailures: 0,
        rateLimit: { requests: 5, period: 60000, current: 0, resetTime: new Date() },
        requiresKey: true,
        hasWebSocket: false,
    },
    twelveData: {
        name: 'Twelve Data',
        priority: 4,
        isHealthy: true,
        lastError: null,
        consecutiveFailures: 0,
        rateLimit: { requests: 8, period: 60000, current: 0, resetTime: new Date() },
        requiresKey: true,
        hasWebSocket: true,
    },
    polygon: {
        name: 'Polygon.io',
        priority: 5,
        isHealthy: true,
        lastError: null,
        consecutiveFailures: 0,
        rateLimit: { requests: 5, period: 60000, current: 0, resetTime: new Date() },
        requiresKey: true,
        hasWebSocket: true,
    },
    fmp: {
        name: 'Financial Modeling Prep',
        priority: 6,
        isHealthy: true,
        lastError: null,
        consecutiveFailures: 0,
        rateLimit: { requests: 250, period: 86400000, current: 0, resetTime: new Date() },
        requiresKey: true,
        hasWebSocket: false,
    },
    iex: {
        name: 'IEX Cloud',
        priority: 7,
        isHealthy: true,
        lastError: null,
        consecutiveFailures: 0,
        rateLimit: { requests: 100, period: 1000, current: 0, resetTime: new Date() },
        requiresKey: true,
        hasWebSocket: false,
    },
    tiingo: {
        name: 'Tiingo',
        priority: 8,
        isHealthy: true,
        lastError: null,
        consecutiveFailures: 0,
        rateLimit: { requests: 1000, period: 86400000, current: 0, resetTime: new Date() },
        requiresKey: true,
        hasWebSocket: false,
    },
    marketstack: {
        name: 'Marketstack',
        priority: 9,
        isHealthy: true,
        lastError: null,
        consecutiveFailures: 0,
        rateLimit: { requests: 100, period: 2592000000, current: 0, resetTime: new Date() },
        requiresKey: true,
        hasWebSocket: false,
    },
    stooq: {
        name: 'Stooq',
        priority: 10,
        isHealthy: true,
        lastError: null,
        consecutiveFailures: 0,
        rateLimit: { requests: 1000, period: 3600000, current: 0, resetTime: new Date() },
        requiresKey: false,
        hasWebSocket: false,
    },
};

// API Keys from environment
export const API_KEYS = {
    finnhub: import.meta.env.VITE_FINNHUB_API_KEY || '',
    alphaVantage: import.meta.env.VITE_ALPHA_VANTAGE_KEY || '',
    twelveData: import.meta.env.VITE_TWELVE_DATA_KEY || '',
    polygon: import.meta.env.VITE_POLYGON_KEY || '',
    fmp: import.meta.env.VITE_FMP_KEY || '',
    iex: import.meta.env.VITE_IEX_KEY || '',
    tiingo: import.meta.env.VITE_TIINGO_KEY || '',
    marketstack: import.meta.env.VITE_MARKETSTACK_KEY || '',
};

// Response parsers for each provider
export const parsers = {
    yahoo: (data: any, symbol: string): StockQuote | null => {
        const quote = data?.quoteResponse?.result?.[0];
        if (!quote) return null;
        return {
            symbol: quote.symbol || symbol,
            name: quote.longName || quote.shortName || symbol,
            price: quote.postMarketPrice || quote.regularMarketPrice || 0,
            change: quote.postMarketChange ?? quote.regularMarketChange ?? 0,
            changePercent: quote.postMarketChangePercent ?? quote.regularMarketChangePercent ?? 0,
            previousClose: quote.regularMarketPreviousClose || 0,
            open: quote.regularMarketOpen || 0,
            high: quote.regularMarketDayHigh || 0,
            low: quote.regularMarketDayLow || 0,
            volume: quote.regularMarketVolume || 0,
            avgVolume: quote.averageDailyVolume3Month || 0,
            marketCap: quote.marketCap || 0,
            peRatio: quote.trailingPE || 0,
            eps: quote.epsTrailingTwelveMonths || 0,
            dividendYield: quote.dividendYield ? quote.dividendYield * 100 : 0,
            fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || 0,
            fiftyTwoWeekLow: quote.fiftyTwoWeekLow || 0,
        };
    },

    finnhub: (data: any, symbol: string): StockQuote | null => {
        if (!data || data.c === undefined) return null;
        return {
            symbol,
            name: symbol,
            price: data.c || 0,
            change: data.d || 0,
            changePercent: data.dp || 0,
            previousClose: data.pc || 0,
            open: data.o || 0,
            high: data.h || 0,
            low: data.l || 0,
            volume: 0,
            avgVolume: 0,
            marketCap: 0,
            peRatio: 0,
            eps: 0,
            dividendYield: 0,
            fiftyTwoWeekHigh: 0,
            fiftyTwoWeekLow: 0,
        };
    },

    alphaVantage: (data: any, symbol: string): StockQuote | null => {
        const quote = data?.['Global Quote'];
        if (!quote) return null;
        return {
            symbol: quote['01. symbol'] || symbol,
            name: symbol,
            price: parseFloat(quote['05. price']) || 0,
            change: parseFloat(quote['09. change']) || 0,
            changePercent: parseFloat(quote['10. change percent']?.replace('%', '')) || 0,
            previousClose: parseFloat(quote['08. previous close']) || 0,
            open: parseFloat(quote['02. open']) || 0,
            high: parseFloat(quote['03. high']) || 0,
            low: parseFloat(quote['04. low']) || 0,
            volume: parseInt(quote['06. volume']) || 0,
            avgVolume: 0,
            marketCap: 0,
            peRatio: 0,
            eps: 0,
            dividendYield: 0,
            fiftyTwoWeekHigh: 0,
            fiftyTwoWeekLow: 0,
        };
    },

    twelveData: (data: any, symbol: string): StockQuote | null => {
        if (!data || data.price === undefined) return null;
        return {
            symbol: data.symbol || symbol,
            name: data.name || symbol,
            price: parseFloat(data.price) || 0,
            change: parseFloat(data.change) || 0,
            changePercent: parseFloat(data.percent_change) || 0,
            previousClose: parseFloat(data.previous_close) || 0,
            open: parseFloat(data.open) || 0,
            high: parseFloat(data.high) || 0,
            low: parseFloat(data.low) || 0,
            volume: parseInt(data.volume) || 0,
            avgVolume: parseInt(data.average_volume) || 0,
            marketCap: 0,
            peRatio: 0,
            eps: 0,
            dividendYield: 0,
            fiftyTwoWeekHigh: parseFloat(data.fifty_two_week?.high) || 0,
            fiftyTwoWeekLow: parseFloat(data.fifty_two_week?.low) || 0,
        };
    },

    polygon: (data: any, symbol: string): StockQuote | null => {
        const ticker = data?.ticker;
        if (!ticker) return null;
        const day = ticker.day || {};
        const prevDay = ticker.prevDay || {};
        return {
            symbol: ticker.ticker || symbol,
            name: symbol,
            price: day.c || ticker.lastTrade?.p || 0,
            change: (day.c || 0) - (prevDay.c || 0),
            changePercent: prevDay.c ? (((day.c || 0) - prevDay.c) / prevDay.c) * 100 : 0,
            previousClose: prevDay.c || 0,
            open: day.o || 0,
            high: day.h || 0,
            low: day.l || 0,
            volume: day.v || 0,
            avgVolume: 0,
            marketCap: 0,
            peRatio: 0,
            eps: 0,
            dividendYield: 0,
            fiftyTwoWeekHigh: 0,
            fiftyTwoWeekLow: 0,
        };
    },

    fmp: (data: any, symbol: string): StockQuote | null => {
        const quote = Array.isArray(data) ? data[0] : data;
        if (!quote) return null;
        return {
            symbol: quote.symbol || symbol,
            name: quote.name || symbol,
            price: quote.price || 0,
            change: quote.change || 0,
            changePercent: quote.changesPercentage || 0,
            previousClose: quote.previousClose || 0,
            open: quote.open || 0,
            high: quote.dayHigh || 0,
            low: quote.dayLow || 0,
            volume: quote.volume || 0,
            avgVolume: quote.avgVolume || 0,
            marketCap: quote.marketCap || 0,
            peRatio: quote.pe || 0,
            eps: quote.eps || 0,
            dividendYield: 0,
            fiftyTwoWeekHigh: quote.yearHigh || 0,
            fiftyTwoWeekLow: quote.yearLow || 0,
        };
    },

    iex: (data: any, symbol: string): StockQuote | null => {
        const quote = data?.quote || data;
        if (!quote) return null;
        return {
            symbol: quote.symbol || symbol,
            name: quote.companyName || symbol,
            price: quote.latestPrice || 0,
            change: quote.change || 0,
            changePercent: (quote.changePercent || 0) * 100,
            previousClose: quote.previousClose || 0,
            open: quote.open || 0,
            high: quote.high || 0,
            low: quote.low || 0,
            volume: quote.volume || 0,
            avgVolume: quote.avgTotalVolume || 0,
            marketCap: quote.marketCap || 0,
            peRatio: quote.peRatio || 0,
            eps: 0,
            dividendYield: 0,
            fiftyTwoWeekHigh: quote.week52High || 0,
            fiftyTwoWeekLow: quote.week52Low || 0,
        };
    },

    tiingo: (data: any, symbol: string): StockQuote | null => {
        const quote = Array.isArray(data) ? data[0] : data;
        if (!quote) return null;
        return {
            symbol: quote.ticker || symbol,
            name: symbol,
            price: quote.last || quote.close || 0,
            change: (quote.last || 0) - (quote.prevClose || 0),
            changePercent: quote.prevClose ? (((quote.last || 0) - quote.prevClose) / quote.prevClose) * 100 : 0,
            previousClose: quote.prevClose || 0,
            open: quote.open || 0,
            high: quote.high || 0,
            low: quote.low || 0,
            volume: quote.volume || 0,
            avgVolume: 0,
            marketCap: 0,
            peRatio: 0,
            eps: 0,
            dividendYield: 0,
            fiftyTwoWeekHigh: 0,
            fiftyTwoWeekLow: 0,
        };
    },

    marketstack: (data: any, symbol: string): StockQuote | null => {
        const quote = data?.data?.[0];
        if (!quote) return null;
        return {
            symbol: quote.symbol || symbol,
            name: symbol,
            price: quote.last || quote.close || 0,
            change: (quote.close || 0) - (quote.open || 0),
            changePercent: quote.open ? (((quote.close || 0) - quote.open) / quote.open) * 100 : 0,
            previousClose: 0,
            open: quote.open || 0,
            high: quote.high || 0,
            low: quote.low || 0,
            volume: quote.volume || 0,
            avgVolume: 0,
            marketCap: 0,
            peRatio: 0,
            eps: 0,
            dividendYield: 0,
            fiftyTwoWeekHigh: 0,
            fiftyTwoWeekLow: 0,
        };
    },

    stooq: (data: string, symbol: string): StockQuote | null => {
        // Stooq returns CSV
        const lines = data.split('\n');
        if (lines.length < 2) return null;
        const headers = lines[0].split(',');
        const values = lines[1].split(',');
        const row: Record<string, string> = {};
        headers.forEach((h, i) => row[h.trim().toLowerCase()] = values[i]?.trim());

        const close = parseFloat(row['close']) || 0;
        const open = parseFloat(row['open']) || 0;
        return {
            symbol,
            name: symbol,
            price: close,
            change: close - open,
            changePercent: open ? ((close - open) / open) * 100 : 0,
            previousClose: 0,
            open,
            high: parseFloat(row['high']) || 0,
            low: parseFloat(row['low']) || 0,
            volume: parseInt(row['volume']) || 0,
            avgVolume: 0,
            marketCap: 0,
            peRatio: 0,
            eps: 0,
            dividendYield: 0,
            fiftyTwoWeekHigh: 0,
            fiftyTwoWeekLow: 0,
        };
    },
};

// Check if provider is available (has key if required, and is healthy)
export const isProviderAvailable = (providerId: string): boolean => {
    const provider = PROVIDERS[providerId];
    if (!provider) return false;
    if (!provider.isHealthy) return false;
    if (provider.requiresKey && !API_KEYS[providerId as keyof typeof API_KEYS]) {
        return false;
    }
    return true;
};

// Get sorted list of available providers
export const getAvailableProviders = (): string[] => {
    return Object.entries(PROVIDERS)
        .filter(([id]) => isProviderAvailable(id))
        .sort(([, a], [, b]) => a.priority - b.priority)
        .map(([id]) => id);
};

// Mark provider as failed
export const markProviderFailed = (providerId: string): void => {
    const provider = PROVIDERS[providerId];
    if (!provider) return;

    provider.consecutiveFailures++;
    provider.lastError = new Date();

    // Circuit breaker: if 3+ consecutive failures, mark unhealthy
    if (provider.consecutiveFailures >= 3) {
        provider.isHealthy = false;
        console.warn(`⚠️ Provider ${provider.name} marked unhealthy after ${provider.consecutiveFailures} failures`);

        // Auto-recover after 5 minutes
        setTimeout(() => {
            provider.isHealthy = true;
            provider.consecutiveFailures = 0;
            console.log(`🔄 Provider ${provider.name} recovered`);
        }, 300000);
    }
};

// Mark provider as successful
export const markProviderSuccess = (providerId: string): void => {
    const provider = PROVIDERS[providerId];
    if (!provider) return;
    provider.consecutiveFailures = 0;
    provider.isHealthy = true;
};
