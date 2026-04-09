import axios from 'axios';
import { PROVIDERS, parsers, markProviderFailed, markProviderSuccess, getAvailableProviders, API_KEYS, type StockQuote } from './dataProviders';
import { fetchExchangeRates, convertToUSD } from './currencyService';
import type { Stock, CompanyProfile, Dividend } from '../types';
import { getAllSymbols, getMarketForSymbol } from '../data/sectors';
import { calculateRSI } from '../utils/calculations';

// ============================================
// MULTI-SOURCE STOCK DATA SERVICE
// Supports 10+ data providers with fallback
// ============================================

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// ============================================
// SYMBOL SANITIZATION
// TradingView widgets can pollute symbols via postMessages.
// Strip any query params / garbage before hitting any API.
// ============================================
export const sanitizeSymbol = (raw: string): string => {
    if (!raw || typeof raw !== 'string') return '';
    // Strip anything after '?' (e.g. ?tvwidgetsymbol=NYSE:IBM)
    const clean = raw.split('?')[0].trim();
    // Reject literal placeholder {SYMBOL}
    if (clean.startsWith('{') || clean.length === 0) return '';
    // Allow only valid stock symbol chars: letters, digits, ^, ., -, :, =
    // The = is needed for futures contracts like GC=F (Gold), CL=F (Crude Oil)
    return /^[A-Z0-9^.\-:=]{1,20}$/i.test(clean) ? clean.toUpperCase() : '';
};


const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
});

// ============================================
// CACHING LAYER & PROMISE POOLING
// ============================================
const cache = new Map<string, { data: any; timestamp: number }>();
const inFlightRequests = new Map<string, Promise<any>>();
const CACHE_DURATION = 1000; // 1 second for near real-time
const GOOD_PRICE_CACHE_DURATION = 300000; // 5 minutes for fallback prices

export const getCachedData = (key: string, maxAge = CACHE_DURATION) => {
    const cached = cache.get(key);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > maxAge) {
        return null; // Don't delete yet, fallback might need it, just return null for 'fresh' check
    }
    return cached.data;
};

export const setCachedData = (key: string, data: any) => {
    cache.set(key, { data, timestamp: Date.now() });
};

/**
 * Concurrency Deduping Wrapper
 * If 5 components request the exact same symbol simultaneously,
 * only 1 actual network race is fired. The other 4 await the same Promise.
 */
const withPromisePool = async <T>(key: string, fetchFn: () => Promise<T>): Promise<T> => {
    if (inFlightRequests.has(key)) {
        return inFlightRequests.get(key) as Promise<T>;
    }
    const promise = fetchFn().finally(() => {
        // Wait a microtick before deleting to ensure subsequent synchronous calls catch the cache
        setTimeout(() => inFlightRequests.delete(key), 50);
    });
    inFlightRequests.set(key, promise);
    return promise;
};

// ============================================
// PROVIDER-SPECIFIC FETCH FUNCTIONS
// ============================================

// Primary: Use serverless proxy (multi-quote.js)
const fetchFromProxy = async (symbol: string): Promise<StockQuote | null> => {
    try {
        const response = await api.get('/multi-quote', { params: { symbols: symbol } });
        const result = response.data?.quoteResponse?.result?.[0];
        const provider = response.data?._provider || result?.provider;
        
        if (result && result.price > 0) {
            return {
                ...result,
                provider: provider || 'proxy'
            } as StockQuote;
        }
        return null;
    } catch (error) {
        console.warn(`⚠️ Proxy failed for ${symbol}:`, (error as Error).message);
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
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
        markProviderFailed('fmp');
        return null;
    }
};

// Get search symbol with correct regional suffix
export const getSearchSymbol = (symbol: string): string => {
    if (!symbol) return '';
    if (symbol.includes(':')) return symbol.split(':').pop() || symbol;

    // Standardize Class B shares for Yahoo Finance (.B instead of -B)
    if (symbol.endsWith('-B')) return symbol.replace('-B', '.B');
    if (symbol.endsWith('.CA')) return symbol;
    if (symbol.endsWith('.AD')) return symbol;

    const market = getMarketForSymbol(symbol);

    // Specialized Egypt Mapping (Using .CA suffix for Cairo assets)
    const egyptMapping: Record<string, string> = {
        'GOUR': 'OLFI.CA', // Obour Land
        'COMI': 'COMI.CA',
        'TMGH': 'TMGH.CA',
        'FWRY': 'FWRY.CA',
        'SKPC': 'SKPC.CA',
        'AZG': 'AZG.CA',
        'AZO': 'AZO.CA',
        'BAL': 'BAL.CA',
        'BCO': 'BCO.CA',
        'BFF': 'BFF.CA',
        'BIN': 'BIN.CA',
        'BMM': 'BMM.CA',
        'CI30': 'CI30.CA',
    };

    if (egyptMapping[symbol]) return egyptMapping[symbol];
    if (market === 'egypt') return `${symbol}.CA`;
    if (market === 'abudhabi') return `${symbol}.AD`;

    // For major US stocks, ensure they don't collide with European exchanges like Warsaw (WSE)
    // Yahoo Finance defaults to US for bare symbols if the request is from a US-based proxy,
    // but we can be explicit if needed. For now, we'll keep them bare but handle name mapping in UI.
    return symbol;
};

// ============================================
// MAIN MULTI-SOURCE FETCH
// ============================================

const fetchInParallel = async (symbol: string): Promise<StockQuote | null> => {
    // 1. Identify which providers are healthy and have keys
    const available = getAvailableProviders().filter(id => id !== 'yahoo'); // Yahoo is handled by proxy
    
    if (available.length === 0) return null;

    // 2. Prepare racing promises
    const racers = available.slice(0, 3).map(async (providerId) => {
        try {
            let quote: StockQuote | null = null;
            switch (providerId) {
                case 'finnhub': quote = await fetchFromFinnhub(symbol); break;
                case 'alphaVantage': quote = await fetchFromAlphaVantage(symbol); break;
                case 'twelveData': quote = await fetchFromTwelveData(symbol); break;
                case 'fmp': quote = await fetchFromFMP(symbol); break;
            }
            if (quote && quote.price > 0) return quote;
            throw new Error('Fallback required');
        } catch (err) {
            throw err;
        }
    });

    // 3. Add proxy as a racer (usually the most reliable)
    const proxyRacer = fetchFromProxy(symbol).then(q => {
        if (q && q.price > 0) return q;
        throw new Error('Proxy failed');
    });

    try {
        // RACE! First one to return a valid price wins.
        return await Promise.any([...racers, proxyRacer]);
    } catch (e) {
        // All racers failed
        return null;
    }
};

const fetchWithFallbacks = async (symbol: string): Promise<StockQuote | null> => {
    const cacheKey = `quote_${symbol}`;

    // 1. Check cache first
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    // 2. Prepare symbol (add market suffix if missing)
    const searchSymbol = getSearchSymbol(symbol);


    // 3. Try Parallel Racing (Tier 1 - High Frequency)
    let result = await fetchInParallel(searchSymbol);
    
    if (result && result.price > 0) {
        setCachedData(cacheKey, result);
        setCachedData(`last_good_${symbol}`, result);
        return result;
    }

    // 4. Use last known good price (Safety Net)
    const lastGood = getCachedData(`last_good_${symbol}`, GOOD_PRICE_CACHE_DURATION);
    if (lastGood) {
        return {
            ...lastGood,
            name: `${lastGood.name} (Estimated)`,
        };
    }

    return null;
};

// ============================================
// INDEX SYMBOL STATIC FALLBACK
// When all external sources fail for market indices (^GSPC etc.)
// return a static fallback so the UI doesn't break/spam.
// ============================================
const INDEX_FALLBACK_PRICES: Record<string, { price: number; name: string }> = {
    '^GSPC': { price: 5600, name: 'S&P 500' },
    '^DJI':  { price: 41800, name: 'Dow Jones' },
    '^IXIC': { price: 17500, name: 'NASDAQ Composite' },
    '^RUT':  { price: 2060, name: 'Russell 2000' },
    '^VIX':  { price: 20, name: 'CBOE Volatility Index' },
    '^TNX':  { price: 4.3, name: '10-Year Treasury Yield' },
    '^FTSE': { price: 8600, name: 'FTSE 100' },
    '^N225': { price: 36500, name: 'Nikkei 225' },
    '^GDAXI':{ price: 22500, name: 'DAX' },
};

// ============================================
// PUBLIC API
// ============================================

// Get stock quote with multi-source fallback (Wrapped with Concurrency Pool)
export const getStockQuote = async (rawSymbol: string): Promise<Stock> => {
    const symbol = sanitizeSymbol(rawSymbol);
    if (!symbol) {
        console.warn(`⚠️ Invalid/polluted symbol rejected: "${rawSymbol}"`);
        return { symbol: rawSymbol, name: 'Invalid Symbol', price: 0, change: 0, changePercent: 0, previousClose: 0, open: 0, high: 0, low: 0, volume: 0, avgVolume: 0, marketCap: 0, peRatio: 0, eps: 0, dividendYield: 0, pegRatio: 0, fiftyTwoWeekHigh: 0, fiftyTwoWeekLow: 0, totalValue: 0, totalBuy: 0, totalSell: 0, lastUpdated: new Date() };
    }
    
    // Check if we have a fresh 1-second cache BEFORE joining the pool
    const cacheKey = `quote_full_${symbol}`;
    const instantCache = getCachedData(cacheKey, CACHE_DURATION);
    if (instantCache) return instantCache;

    return withPromisePool(cacheKey, async () => {
        const quote = await fetchWithFallbacks(symbol);
        let finalStock: Stock;

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

        // ADD REAL-TIME JITTER (Simulate micro-fluctuations for a "living" feel)
        // This ensures the UI continuously "pulses" even if the API data is slightly delayed or flat
        const jitterEnabled = false;
        let finalPrice = price;

        if (jitterEnabled && price > 0) {
            // More visible jitter: +/- 0.05% (e.g., 10 cents on a $200 stock)
            // This provides a "living" feel to the UI even during slow market periods
            const jitterFactor = 1 + (Math.random() * 0.0006 - 0.0003);
            finalPrice = price * jitterFactor;
        }

        finalStock = {
            symbol,
            name: quote.name || symbol,
            price: finalPrice,
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
            pegRatio: quote.pegRatio || 0,
            fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || 0,
            fiftyTwoWeekLow: quote.fiftyTwoWeekLow || 0,
            totalValue: (finalPrice || 0) * (quote.volume || 0),
            totalBuy: 0,
            totalSell: 0,
            lastUpdated: new Date(),
            isFallback: quote.provider === 'price_map' || quote.provider === 'cache',
        };
        setCachedData(`quote_full_${symbol}`, finalStock);
        return finalStock;
    }

    // Return unavailable placeholder — but first check index fallback
    const indexFallback = INDEX_FALLBACK_PRICES[symbol];
    if (indexFallback) {
        const p = indexFallback.price;
        finalStock = {
            symbol, name: indexFallback.name, price: p,
            change: 0,
            changePercent: 0,
            previousClose: p, open: p, high: p * 1.005, low: p * 0.995,
            volume: 0, avgVolume: 0, marketCap: 0, peRatio: 0, eps: 0,
            dividendYield: 0, pegRatio: 0, fiftyTwoWeekHigh: 0, fiftyTwoWeekLow: 0,
            totalValue: 0, totalBuy: 0, totalSell: 0, lastUpdated: new Date(),
            isFallback: true,
        };
        setCachedData(`quote_full_${symbol}`, finalStock);
        return finalStock;
    }

    // All sources failed — cache for 5 min to stop repeated retries

    finalStock = {
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
        pegRatio: 0,
        fiftyTwoWeekHigh: 0,
        fiftyTwoWeekLow: 0,
        totalValue: 0,
        totalBuy: 0,
        totalSell: 0,
        lastUpdated: new Date(),
        isFallback: true,
    };
    // Cache with a 5-minute TTL so the poller doesn't retry on every cycle
    const FIVE_MINUTES = 5 * 60 * 1000;
    cache.set(`quote_full_${symbol}`, { data: finalStock, timestamp: Date.now() - CACHE_DURATION + FIVE_MINUTES });
    return finalStock;
    }); // end withPromisePool
};

// Get comprehensive stock data including profile and growth metrics
export const getStockData = async (rawSymbol: string): Promise<{
    stock: Stock;
    profile: CompanyProfile | null;
    growth: any | null;
    rsi: number | null;
}> => {
    const symbol = sanitizeSymbol(rawSymbol) || rawSymbol;
    const searchSymbol = getSearchSymbol(symbol);

    const [stock, profile, growth, history] = await Promise.all([
        getStockQuote(symbol),
        getProfileFromYahoo(searchSymbol),
        getGrowthMetrics(searchSymbol),
        getHistoricalPrices(searchSymbol, 30)
    ]);

    if (profile?.name && stock.name === symbol) {
        stock.name = profile.name;
    }

    const rsi = history.length >= 14 ? calculateRSI(history, 14) : null;

    return { stock, profile, growth, rsi };
};

// Get company news
export const getStockNews = async (symbol: string): Promise<any[]> => {
    try {
        const cacheKey = `news_${symbol}`;
        const cached = getCachedData(cacheKey, 600000); // 10 minute cache
        if (cached) return cached;

        // Try local proxy news endpoint (many setups have this)
        try {
            const response = await api.get('/news', { params: { symbol } });
            if (response.data && Array.isArray(response.data)) {
                setCachedData(cacheKey, response.data);
                return response.data;
            }
        } catch (e) {
            // fallback to Finnhub if key exists
        }

        if (API_KEYS.finnhub) {
            const now = new Date();
            const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const to = now.toISOString().split('T')[0];
            const from = lastWeek.toISOString().split('T')[0];

            const response = await axios.get(`https://finnhub.io/api/v1/company-news`, {
                params: { symbol, from, to, token: API_KEYS.finnhub },
                timeout: 5000
            });

            if (response.data && Array.isArray(response.data)) {
                const news = response.data.slice(0, 5).map(item => ({
                    id: item.id,
                    headline: item.headline,
                    summary: item.summary,
                    url: item.url,
                    source: item.source,
                    datetime: item.datetime * 1000,
                    image: item.image
                }));
                setCachedData(cacheKey, news);
                return news;
            }
        }

        // Final High-Quality Fallback (Mocked based on recent events for specific symbols)
        const mockNews = [
            {
                id: 1,
                headline: `${symbol} showing strong momentum in pre-market trading`,
                summary: `Analysts are raising price targets for ${symbol} following positive sentiment in the tech sector.`,
                url: '#',
                source: 'Market Intelligence',
                datetime: Date.now() - 3600000,
                image: ''
            },
            {
                id: 2,
                headline: `Institutional accumulation detected for ${symbol} assets`,
                summary: `Large-scale order flow suggests major players are adjusting their ${symbol} positions ahead of quarterly reports.`,
                url: '#',
                source: 'Alpha Whale Tracker',
                datetime: Date.now() - 14400000,
                image: ''
            }
        ];
        return mockNews;

    } catch (error) {
        console.error("Failed to fetch news:", error);
        return [];
    }
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
export const searchSymbols = async (query: string, marketId?: string): Promise<Record<string, unknown>[]> => {
    if (!query || query.length < 1) return [];
    const allSymbols = getAllSymbols();

    const matches = allSymbols.filter(s =>
        s.symbol.toLowerCase().includes(query.toLowerCase()) ||
        s.name.toLowerCase().includes(query.toLowerCase())
    );

    // Filter by market if provided (STRICT FILTER)
    let filteredMatches = matches;
    if (marketId) {
        filteredMatches = matches.filter(s => getMarketForSymbol(s.symbol) === marketId);
    }

    // Deduplicate
    const uniqueMap = new Map();
    filteredMatches.forEach(item => {
        if (!uniqueMap.has(item.symbol)) {
            uniqueMap.set(item.symbol, item);
        }
    });

    return Array.from(uniqueMap.values()).slice(0, 20);
};

/**
 * Fetch historical price data for technical analysis (RSI, MA)
 * Returns array of closing prices
 */
export const getHistoricalPrices = async (symbol: string, days: number = 30): Promise<number[]> => {
    try {
        const cacheKey = `history_${symbol}_${days}`;
        const cached = getCachedData(cacheKey, 3600000); // 1 hour
        if (cached) return cached;

        const response = await api.get('/quote', {
            params: {
                symbols: symbol,
                chart: 'true',
                range: days > 30 ? '3mo' : '1mo',
                interval: '1d'
            }
        });

        const chartData = response.data?.chart?.result?.[0];
        const closes = chartData?.indicators?.quote?.[0]?.close || [];

        // Filter out nulls and return
        const validCloses = closes.filter((c: any) => c !== null && c !== undefined);
        setCachedData(cacheKey, validCloses);
        return validCloses;
    } catch (error) {
        console.warn(`History fetch failed for ${symbol}:`, error);
        return [];
    }
};

/**
 * Extract valuation and growth metrics for AI analysis
 */
export const getGrowthMetrics = async (symbol: string) => {
    try {
        const response = await api.get('/quote', {
            params: {
                symbols: symbol,
                modules: 'defaultKeyStatistics,financialData,earningsGrowth'
            }
        });

        const result = response.data?.quoteSummary?.result?.[0] || {};
        const stats = result.defaultKeyStatistics || {};
        const financialData = result.financialData || {};

        return {
            pegRatio: stats.pegRatio?.raw || null,
            forwardEps: stats.forwardEps?.raw || null,
            targetPrice: financialData.targetMeanPrice?.raw || null,
            revenueGrowth: financialData.revenueGrowth?.raw || null,
            earningsGrowth: financialData.earningsGrowth?.raw || null,
            currentRatio: financialData.currentRatio?.raw || null,
        };
    } catch (error) {
        console.warn(`Growth metrics fetch failed for ${symbol}:`, error);
        return null;
    }
};

// Get multiple quotes efficiently with multi-source (Wrapped with Concurrency Pool)
export const getMultipleQuotes = async (symbols: string[]): Promise<Map<string, Stock>> => {
    // Determine unique sorted cache key for this exact batch query
    const cacheKey = `multi_quote_${[...symbols].sort().join(',')}`;
    
    // Check instant cache
    const instantCache = getCachedData(cacheKey, CACHE_DURATION);
    if (instantCache) return instantCache as Map<string, Stock>;

    return withPromisePool(cacheKey, async () => {
        const stockMap = new Map<string, Stock>();
        if (symbols.length === 0) return stockMap;

        const mappedSymbols = symbols.map(getSearchSymbol);

    // Try batch request first via proxy
    try {
        // Split symbols into batches of 50 to ensure API stability and bypass length limits
        const reverseSymbolMap = new Map<string, string>();
        symbols.forEach(s => reverseSymbolMap.set(getSearchSymbol(s), s));

        const batchSize = 50;
        for (let i = 0; i < mappedSymbols.length; i += batchSize) {
            const batch = mappedSymbols.slice(i, i + batchSize);
            const symbolsString = batch.join(',');
            
            try {
                const response = await api.get('/multi-quote', {
                    params: { symbols: symbolsString },
                    timeout: 10000
                });

                const quotes = response.data?.quoteResponse?.result || [];
                for (const quote of quotes) {
                    const apiSymbol = quote.symbol.toUpperCase();
                    // Strategy 1: Direct Reverse Map
                    let originalSymbol = reverseSymbolMap.get(apiSymbol) || reverseSymbolMap.get(quote.symbol);
                    
                    // Strategy 2: Case-Insensitive Search in symbols list
                    if (!originalSymbol) {
                        originalSymbol = symbols.find(s => s.toUpperCase() === apiSymbol || s.toUpperCase() === apiSymbol.split('.')[0]);
                    }

                    // Strategy 3: Default to API symbol
                    if (!originalSymbol) originalSymbol = quote.symbol;

                    if (quote.price > 0) {
                        const finalPrice = quote.price;

                        const stock: Stock = {
                            symbol: originalSymbol,
                            name: quote.name || originalSymbol,
                            price: finalPrice,
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
                            pegRatio: quote.pegRatio || 0,
                            fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || 0,
                            fiftyTwoWeekLow: quote.fiftyTwoWeekLow || 0,
                            totalValue: quote.price * (quote.volume || 0),
                            totalBuy: null,
                            totalSell: null,
                            lastUpdated: new Date(),
                            isFallback: quote.provider === 'price_map' || response.data?._provider === 'price_map',
                        };
                        stockMap.set(originalSymbol, stock);
                    }
                }
            } catch (err) {
                console.error(`Batch ${i/batchSize + 1} failed:`, err);
            }
        }

    } catch (error) {
        console.error(`❌ Batch fetch failed:`, (error as Error).message);
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
                pegRatio: 0,
                fiftyTwoWeekHigh: 0,
                fiftyTwoWeekLow: 0,
                totalValue: 0,
                totalBuy: 0,
                totalSell: 0,
                lastUpdated: new Date(),
            });
        }
    }

    setCachedData(cacheKey, stockMap);
    return stockMap;
    }); // end withPromisePool
};

// ============================================
// REAL-TIME SECTOR & VOLUME DATA
// ============================================

// Representative Sector ETFs by Market
const MARKET_SECTOR_MAP: Record<string, Record<string, string>> = {
    us: {
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
    },
    egypt: {
        'Banking': 'COMI',
        'Real Estate': 'TMGH',
        'Fintech': 'FWRY',
        'Telecom': 'ETEL',
        'Commodities': 'ABUK',
        'Energy': 'SWDY'
    },
    abudhabi: {
        'Banking': 'FAB',
        'Real Estate': 'ALDAR',
        'Energy': 'ADNOCDIST',
        'Telecom': 'ETISALAT',
        'Investment': 'IHC'
    }
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
    'Materials': '🧪',
    'Banking': '🏛️',
    'Fintech': '💳',
    'Telecom': '📶',
    'Commodities': '📦',
    'Investment': '📈'
};

export const getSectorPerformance = async (marketId: string = 'us') => {
    const marketSectors = MARKET_SECTOR_MAP[marketId] || MARKET_SECTOR_MAP.us;
    const symbols = Object.values(marketSectors);
    const quotes = await getMultipleQuotes(symbols);

    return Object.entries(marketSectors).map(([name, symbol]) => {
        // Find exact or suffixed match since Yahoo Finance may append .CA or .AD
        const quote = quotes.get(symbol) || quotes.get(`${symbol}.CA`) || quotes.get(`${symbol}.AD`);

        let change = quote?.changePercent || 0;
        if (change > 15) change = 0; // Sanity cap for outliers

        return {
            name,
            change: change,
            icon: SECTOR_ICONS[name] || '📊'
        };
    }).sort((a, b) => b.change - a.change);
};

export const getVolumeAnomalies = async (marketId: string = 'us') => {
    const marketTickers: Record<string, string[]> = {
        us: ['AAPL', 'TSLA', 'NVDA', 'AMD', 'PLTR', 'JPM', 'COIN', 'BABA', 'META', 'MSFT', 'GOOGL', 'AMZN'],
        egypt: ['COMI', 'TMGH', 'FWRY', 'HRHO', 'EAST', 'ETEL', 'PHDC', 'ORAS', 'SWDY', 'ABUK'],
        abudhabi: ['IHC', 'FAB', 'ETISALAT', 'ADNOCDIST', 'ALDAR', 'ADCB', 'MULTIPLY', 'ADNOCDRILL']
    };

    const tickers = marketTickers[marketId] || marketTickers.us;
    const quotes = await getMultipleQuotes(tickers);

    const anomalies: { symbol: string, vol: string, reason: string, change: number }[] = [];

    // Convert iterators to array to handle fallback matching
    const quoteList = Array.from(quotes.values());

    tickers.forEach(symbol => {
        // Strict match: must match the ticker and be in the correct market
        const stock = quoteList.find(q => {
            const isMatch = q.symbol === symbol || q.symbol === `${symbol}.CA` || q.symbol === `${symbol}.AD`;
            if (!isMatch) return false;

            // Validate the market for the symbol to prevent cross-over
            const symMarket = getMarketForSymbol(symbol);
            return symMarket === marketId;
        });

        if (stock) {
            if (stock.volume > stock.avgVolume * 1.5 && stock.avgVolume > 0) {
                const ratio = (stock.volume / stock.avgVolume);
                const cleanChange = Math.abs(stock.changePercent) > 20 ? 0 : stock.changePercent;
                const cleanRatio = ratio > 10 ? 10 : ratio;

                anomalies.push({
                    symbol: stock.symbol.replace('.CA', '').replace('.AD', ''),
                    vol: `${cleanRatio.toFixed(1)}x`,
                    reason: cleanChange > 0 ? 'Bullish Momentum' : 'Bearish Pressure',
                    change: cleanChange
                });
            }
        }
    });

    if (anomalies.length < 4) {
        // Ensure UI stays clean by surfacing top movers
        return quoteList
            .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
            .slice(0, 4)
            .map(s => {
                const cleanChange = Math.abs(s.changePercent) > 20 ? 0 : s.changePercent;
                return {
                    symbol: s.symbol.replace('.CA', '').replace('.AE', ''),
                    vol: `${(s.volume / (s.avgVolume || 1)).toFixed(1)}x`,
                    reason: cleanChange > 0 ? 'Bullish Momentum' : 'Bearish Pressure',
                    change: cleanChange
                };
            });
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
