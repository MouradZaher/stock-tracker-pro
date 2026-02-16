import axios from 'axios';
import { PROVIDERS, parsers, markProviderFailed, markProviderSuccess, getAvailableProviders, API_KEYS, type StockQuote } from './dataProviders';
import type { Stock, CompanyProfile, Dividend } from '../types';
import { getAllSymbols } from '../data/sectors';

// ============================================
// MULTI-SOURCE STOCK DATA SERVICE
// Supports 10+ data providers with fallback
// ============================================

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
});

// ============================================
// CACHING LAYER
// ============================================
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 2000; // 2 seconds for near real-time
const GOOD_PRICE_CACHE_DURATION = 300000; // 5 minutes for fallback prices

export const getCachedData = (key: string, maxAge = CACHE_DURATION) => {
    const cached = cache.get(key);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > maxAge) {
        return null;
    }
    return cached.data;
};

export const setCachedData = (key: string, data: any) => {
    cache.set(key, { data, timestamp: Date.now() });
};

// ============================================
// PROVIDER-SPECIFIC FETCH FUNCTIONS
// ============================================

// Primary: Use serverless proxy (multi-quote.js)
const fetchFromProxy = async (symbol: string): Promise<StockQuote | null> => {
    try {
        const response = await api.get('/multi-quote', { params: { symbols: symbol } });
        const result = response.data?.quoteResponse?.result?.[0];
        if (result && result.price > 0) {

            return result as StockQuote;
        }
        return null;
    } catch (error: any) {
        console.warn(`⚠️ Proxy failed for ${symbol}:`, error.message);
        return null;
    }
};

// Direct Finnhub (if API key available)
const fetchFromFinnhub = async (symbol: string): Promise<StockQuote | null> => {
    if (!API_KEYS.finnhub) return null;
    try {
        const response = await axios.get(`https://finnhub.io/api/v1/quote`, {
            params: { symbol, token: API_KEYS.finnhub },
            timeout: 5000
        });
        const quote = parsers.finnhub(response.data, symbol);
        if (quote && quote.price > 0) {

            markProviderSuccess('finnhub');
            return quote;
        }
        return null;
    } catch (error) {
        markProviderFailed('finnhub');
        return null;
    }
};

// Direct Alpha Vantage (if API key available)
const fetchFromAlphaVantage = async (symbol: string): Promise<StockQuote | null> => {
    if (!API_KEYS.alphaVantage) return null;
    try {
        const response = await axios.get(`https://www.alphavantage.co/query`, {
            params: {
                function: 'GLOBAL_QUOTE',
                symbol,
                apikey: API_KEYS.alphaVantage
            },
            timeout: 5000
        });
        const quote = parsers.alphaVantage(response.data, symbol);
        if (quote && quote.price > 0) {

            markProviderSuccess('alphaVantage');
            return quote;
        }
        return null;
    } catch (error) {
        markProviderFailed('alphaVantage');
        return null;
    }
};

// Direct Twelve Data (if API key available)
const fetchFromTwelveData = async (symbol: string): Promise<StockQuote | null> => {
    if (!API_KEYS.twelveData) return null;
    try {
        const response = await axios.get(`https://api.twelvedata.com/quote`, {
            params: { symbol, apikey: API_KEYS.twelveData },
            timeout: 5000
        });
        const quote = parsers.twelveData(response.data, symbol);
        if (quote && quote.price > 0) {

            markProviderSuccess('twelveData');
            return quote;
        }
        return null;
    } catch (error) {
        markProviderFailed('twelveData');
        return null;
    }
};

// Direct FMP (if API key available)
const fetchFromFMP = async (symbol: string): Promise<StockQuote | null> => {
    if (!API_KEYS.fmp) return null;
    try {
        const response = await axios.get(`https://financialmodelingprep.com/api/v3/quote/${symbol}`, {
            params: { apikey: API_KEYS.fmp },
            timeout: 5000
        });
        const quote = parsers.fmp(response.data, symbol);
        if (quote && quote.price > 0) {

            markProviderSuccess('fmp');
            return quote;
        }
        return null;
    } catch (error) {
        markProviderFailed('fmp');
        return null;
    }
};

// ============================================
// MAIN MULTI-SOURCE FETCH
// ============================================

const fetchWithFallbacks = async (symbol: string): Promise<StockQuote | null> => {
    const cacheKey = `quote_${symbol}`;

    // Check cache first
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    // 1. Try serverless proxy first (handles multiple providers)
    let result = await fetchFromProxy(symbol);
    if (result && result.price > 0) {
        setCachedData(cacheKey, result);
        setCachedData(`last_good_${symbol}`, result);
        return result;
    }

    // 2. Try direct API calls if proxy fails


    const directFetchers = [
        fetchFromFinnhub,
        fetchFromAlphaVantage,
        fetchFromTwelveData,
        fetchFromFMP,
    ];

    for (const fetcher of directFetchers) {
        result = await fetcher(symbol);
        if (result && result.price > 0) {
            setCachedData(cacheKey, result);
            setCachedData(`last_good_${symbol}`, result);
            return result;
        }
    }

    // 3. Use last known good price (no jitter)
    const lastGood = getCachedData(`last_good_${symbol}`, GOOD_PRICE_CACHE_DURATION);
    if (lastGood) {
        return {
            ...lastGood,
            name: lastGood.name + ' (Cached)',
        };
    }

    return null;
};

// ============================================
// PUBLIC API
// ============================================

// Get stock quote with multi-source fallback
export const getStockQuote = async (symbol: string): Promise<Stock> => {
    const quote = await fetchWithFallbacks(symbol);

    if (quote && quote.price > 0) {
        const price = quote.price;
        let previousClose = quote.previousClose || 0;
        let change = quote.change || 0;
        let changePercent = quote.changePercent || 0;

        // SANITY CHECK: Calculate derived previous close based on change
        // Many APIs return inconsistent previousClose vs. Change
        if (price && change) {
            const derivedPrevClose = price - change;
            if (previousClose === 0 || Math.abs(derivedPrevClose - previousClose) > price * 0.1) {
                // If stated previousClose is widely off or missing, use derived
                previousClose = derivedPrevClose;
            }
        }

        // Recalculate percent if needed
        if (previousClose > 0) {
            const calculatedChange = price - previousClose;
            const calculatedPercent = (calculatedChange / previousClose) * 100;

            // If API percent is an outlier (>200% diff) or missing, use calculated
            if (Math.abs(changePercent) > 200 && Math.abs(calculatedPercent) < 50) {
                // Likely a bad API tick 
                changePercent = calculatedPercent;
                change = calculatedChange;
            }

            // If completely missing
            if (changePercent === 0 && calculatedPercent !== 0) {
                changePercent = calculatedPercent;
                change = calculatedChange;
            }
        }

        return {
            symbol,
            name: quote.name || symbol,
            price,
            change,
            changePercent,
            previousClose,
            open: quote.open || 0,
            high: quote.high || 0,
            low: quote.low || 0,
            volume: quote.volume || 0,
            avgVolume: quote.avgVolume || 0,
            marketCap: quote.marketCap || 0,
            peRatio: quote.peRatio || 0,
            eps: quote.eps || 0,
            dividendYield: quote.dividendYield || 0,
            fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || 0,
            fiftyTwoWeekLow: quote.fiftyTwoWeekLow || 0,
            totalValue: 0,
            totalBuy: 0,
            totalSell: 0,
            lastUpdated: new Date(),
        };
    }

    // Return unavailable placeholder
    console.error(`❌ All sources failed for ${symbol}`);
    return {
        symbol,
        name: `${symbol} (Unavailable)`,
        price: 0,
        change: 0,
        changePercent: 0,
        previousClose: 0,
        open: 0,
        high: 0,
        low: 0,
        volume: 0,
        avgVolume: 0,
        marketCap: 0,
        peRatio: 0,
        eps: 0,
        dividendYield: 0,
        fiftyTwoWeekHigh: 0,
        fiftyTwoWeekLow: 0,
        totalValue: 0,
        totalBuy: 0,
        totalSell: 0,
        lastUpdated: new Date(),
    };
};

// Get company profile
export const getStockData = async (symbol: string): Promise<{ stock: Stock; profile: CompanyProfile | null }> => {
    const [stock, profile] = await Promise.all([
        getStockQuote(symbol),
        getProfileFromYahoo(symbol)
    ]);

    if (profile?.name && stock.name === symbol) {
        stock.name = profile.name;
    }

    return { stock, profile };
};

// Get company profile from Yahoo
const getProfileFromYahoo = async (symbol: string): Promise<CompanyProfile | null> => {
    try {
        const cacheKey = `profile_${symbol}`;
        const cached = getCachedData(cacheKey, 3600000); // 1 hour cache
        if (cached) return cached;

        const response = await api.get('/quote', {
            params: {
                symbols: symbol,
                modules: 'summaryProfile,assetProfile,financialData,defaultKeyStatistics,calendarEvents'
            },
        });

        const result = response.data?.quoteSummary?.result?.[0];
        if (!result) return null;

        const summary = result.summaryProfile || result.assetProfile || {};
        const stats = result.defaultKeyStatistics || {};
        const calendar = result.calendarEvents || {};

        const dividends: Dividend[] = [];
        if (stats.lastDividendValue) {
            dividends.push({
                exDate: stats.lastDividendDate?.fmt || 'N/A',
                paymentDate: 'N/A',
                amount: stats.lastDividendValue.raw || 0,
                type: 'past'
            });
        }
        if (calendar.dividendDate?.fmt) {
            dividends.push({
                exDate: calendar.exDividendDate?.fmt || 'N/A',
                paymentDate: calendar.dividendDate.fmt,
                amount: stats.dividendRate?.raw || 0,
                type: 'upcoming'
            });
        }

        const profile: CompanyProfile = {
            symbol,
            name: summary.longName || symbol,
            description: summary.longBusinessSummary || `${symbol} is a publicly traded company.`,
            ceo: summary.companyOfficers?.[0]?.name || null,
            founded: null,
            sector: summary.sector || 'Unknown',
            industry: summary.industry || 'Unknown',
            logo: null,
            website: summary.website || null,
            dividends: dividends,
        };

        setCachedData(cacheKey, profile);
        return profile;
    } catch (error) {
        console.warn(`Profile fetch failed for ${symbol}:`, error);
        return null;
    }
};

// Search symbols from local data
export const searchSymbols = async (query: string): Promise<any[]> => {
    if (!query || query.length < 1) return [];
    const allSymbols = getAllSymbols();

    const matches = allSymbols.filter(s =>
        s.symbol.toLowerCase().includes(query.toLowerCase()) ||
        s.name.toLowerCase().includes(query.toLowerCase())
    );

    // Deduplicate
    const uniqueMap = new Map();
    matches.forEach(item => {
        if (!uniqueMap.has(item.symbol)) {
            uniqueMap.set(item.symbol, item);
        }
    });

    return Array.from(uniqueMap.values()).slice(0, 20);
};

// Get multiple quotes efficiently with multi-source
export const getMultipleQuotes = async (symbols: string[]): Promise<Map<string, Stock>> => {
    const stockMap = new Map<string, Stock>();
    if (symbols.length === 0) return stockMap;

    // Try batch request first via proxy
    try {
        const symbolsString = symbols.join(',');
        const response = await api.get('/multi-quote', {
            params: { symbols: symbolsString },
            timeout: 15000
        });

        const quotes = response.data?.quoteResponse?.result || [];
        for (const quote of quotes) {
            const sym = quote.symbol;
            if (quote.price > 0) {
                const stock: Stock = {
                    symbol: sym,
                    name: quote.name || sym,
                    price: quote.price,
                    change: quote.change || 0,
                    changePercent: quote.changePercent || 0,
                    previousClose: quote.previousClose || 0,
                    open: quote.open || 0,
                    high: quote.high || 0,
                    low: quote.low || 0,
                    volume: quote.volume || 0,
                    avgVolume: quote.avgVolume || 0,
                    marketCap: quote.marketCap || 0,
                    peRatio: quote.peRatio || 0,
                    eps: quote.eps || 0,
                    dividendYield: quote.dividendYield || 0,
                    fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || 0,
                    fiftyTwoWeekLow: quote.fiftyTwoWeekLow || 0,
                    totalValue: quote.price * (quote.volume || 0),
                    totalBuy: null,
                    totalSell: null,
                    lastUpdated: new Date(),
                };
                stockMap.set(sym, stock);
                setCachedData(`last_good_${sym}`, quote);
            }
        }

    } catch (error: any) {
        console.error(`❌ Batch fetch failed:`, error.message);
    }

    // Fill in missing symbols individually
    const missing = symbols.filter(s => !stockMap.has(s));
    if (missing.length > 0 && missing.length <= 10) {
        const individualFetches = missing.map(async sym => {
            const stock = await getStockQuote(sym);
            stockMap.set(sym, stock);
        });
        await Promise.all(individualFetches);
    }

    // Mark remaining as unavailable
    for (const sym of symbols) {
        if (!stockMap.has(sym)) {
            stockMap.set(sym, {
                symbol: sym,
                name: `${sym} (Unavailable)`,
                price: 0,
                change: 0,
                changePercent: 0,
                previousClose: 0,
                open: 0,
                high: 0,
                low: 0,
                volume: 0,
                avgVolume: 0,
                marketCap: 0,
                peRatio: 0,
                eps: 0,
                dividendYield: 0,
                fiftyTwoWeekHigh: 0,
                fiftyTwoWeekLow: 0,
                totalValue: 0,
                totalBuy: 0,
                totalSell: 0,
                lastUpdated: new Date(),
            });
        }
    }

    return stockMap;
};

// ============================================
// REAL-TIME SECTOR & VOLUME DATA
// ============================================

// Representative Sector ETFs
const SECTOR_ETFS: Record<string, string> = {
    'Technology': 'XLK',
    'Financials': 'XLF',
    'Healthcare': 'XLV',
    'Energy': 'XLE',
    'Cons. Discret.': 'XLY',
    'Cons. Staples': 'XLP',
    'Industrials': 'XLI',
    'Utilities': 'XLU',
    'Real Estate': 'XLRE',
    'Materials': 'XLB'
};

const SECTOR_ICONS: Record<string, string> = {
    'Technology': '💻',
    'Financials': '🏦',
    'Healthcare': '💊',
    'Energy': '⚡',
    'Cons. Discret.': '🛍️',
    'Cons. Staples': '🛒',
    'Industrials': '🏗️',
    'Utilities': '🚰',
    'Real Estate': '🏘️',
    'Materials': '🧪'
};

export const getSectorPerformance = async () => {
    const symbols = Object.values(SECTOR_ETFS);
    const quotes = await getMultipleQuotes(symbols);

    return Object.entries(SECTOR_ETFS).map(([name, symbol]) => {
        const quote = quotes.get(symbol);
        return {
            name,
            change: quote?.changePercent || 0,
            icon: SECTOR_ICONS[name] || '📊'
        };
    }).sort((a, b) => b.change - a.change);
};

export const getVolumeAnomalies = async () => {
    // In a real app, this would use a dedicated scanner API
    // Here we'll fetch major tickers and filter for unusual volume (>1.5x avg)
    const topTickers = ['AAPL', 'TSLA', 'NVDA', 'AMD', 'PLTR', 'SOFI', 'MARA', 'NIO', 'META', 'MSFT', 'GOOGL', 'AMZN'];
    const quotes = await getMultipleQuotes(topTickers);

    const anomalies: any[] = [];
    quotes.forEach((stock, symbol) => {
        if (stock.volume > stock.avgVolume * 1.5 && stock.avgVolume > 0) {
            const ratio = (stock.volume / stock.avgVolume).toFixed(1);
            anomalies.push({
                symbol,
                vol: `${ratio}x`,
                reason: stock.changePercent > 0 ? 'Heavy Accumulation' : 'Panic Selling',
                change: stock.changePercent
            });
        }
    });

    // If no real anomalies found (e.g. market closed), return top movers
    if (anomalies.length === 0) {
        return Array.from(quotes.values())
            .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
            .slice(0, 4)
            .map(s => ({
                symbol: s.symbol,
                vol: '1.2x',
                reason: s.changePercent > 0 ? 'Bullish Momentum' : 'Bearish Pressure',
                change: s.changePercent
            }));
    }

    return anomalies.sort((a, b) => parseFloat(b.vol) - parseFloat(a.vol)).slice(0, 4);
};

// Get available providers status for debugging
export const getProviderStatus = () => {
    return {
        available: getAvailableProviders(),
        all: Object.entries(PROVIDERS).map(([id, p]) => ({
            id,
            name: p.name,
            healthy: p.isHealthy,
            failures: p.consecutiveFailures,
            hasKey: !p.requiresKey || !!API_KEYS[id as keyof typeof API_KEYS]
        }))
    };
};
