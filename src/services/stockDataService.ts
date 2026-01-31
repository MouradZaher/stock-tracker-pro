import { yahooFinanceApi, YAHOO_ENDPOINT, getCachedData, setCachedData } from './api';
import type { Stock, CompanyProfile } from '../types';
import { getAllSymbols } from '../data/sectors';

// Enhanced mock data generator with more realistic patterns
const generateMockStock = (symbol: string): Stock => {
    // Use symbol as seed for consistent mock data
    const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const random = (seed: number) => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    };

    const basePrice = 50 + random(seed) * 450;
    const volatility = 0.02 + random(seed + 1) * 0.03;
    const change = (random(seed + 2) - 0.5) * basePrice * volatility;
    const changePercent = (change / basePrice) * 100;

    return {
        symbol,
        name: symbol,
        price: parseFloat(basePrice.toFixed(2)),
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        previousClose: parseFloat((basePrice - change).toFixed(2)),
        open: parseFloat((basePrice + (random(seed + 3) - 0.5) * basePrice * 0.01).toFixed(2)),
        high: parseFloat((basePrice + random(seed + 4) * basePrice * 0.02).toFixed(2)),
        low: parseFloat((basePrice - random(seed + 5) * basePrice * 0.02).toFixed(2)),
        volume: Math.floor(random(seed + 6) * 100000000),
        avgVolume: Math.floor(random(seed + 7) * 80000000),
        marketCap: Math.floor(basePrice * random(seed + 8) * 10000000000),
        peRatio: parseFloat((15 + random(seed + 9) * 30).toFixed(2)),
        eps: parseFloat((basePrice / (15 + random(seed + 10) * 30)).toFixed(2)),
        dividendYield: parseFloat((random(seed + 11) * 3).toFixed(2)),
        fiftyTwoWeekHigh: parseFloat((basePrice * (1 + random(seed + 12) * 0.2)).toFixed(2)),
        fiftyTwoWeekLow: parseFloat((basePrice * (1 - random(seed + 13) * 0.3)).toFixed(2)),
        lastUpdated: new Date(),
    };
};

// Get real-time quote from Yahoo Finance (FREE!)
const getQuoteFromYahoo = async (symbol: string): Promise<Partial<Stock> | null> => {
    try {
        // Check cache first
        const cacheKey = `quote_${symbol}`;
        const cached = getCachedData(cacheKey);
        if (cached) {
            console.log(`✅ Using cached data for ${symbol}`);
            return cached;
        }

        console.log(`📊 Fetching live data for ${symbol} from Yahoo Finance...`);
        const response = await yahooFinanceApi.get(YAHOO_ENDPOINT, {
            params: { symbols: symbol },
        });

        const quotes = response.data?.quoteResponse?.result;
        if (!quotes || quotes.length === 0) return null;

        const quote = quotes[0];

        const stockData: Partial<Stock> = {
            price: quote.regularMarketPrice || quote.ask || 0,
            change: quote.regularMarketChange || 0,
            changePercent: quote.regularMarketChangePercent || 0,
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
            lastUpdated: new Date(),
        };

        // Cache the result
        setCachedData(cacheKey, stockData);

        return stockData;
    } catch (error: any) {
        console.warn(`⚠️ Yahoo Finance quote failed for ${symbol}:`, error.message);
        return null;
    }
};

// Get stock quote with fallback to mock data
export const getStockQuote = async (symbol: string): Promise<Stock> => {
    // Try Yahoo Finance first
    const quote = await getQuoteFromYahoo(symbol);

    if (quote && quote.price && quote.price > 0) {
        const profile = await getCompanyProfile(symbol);
        console.log(`✅ Live data retrieved for ${symbol}`);
        return {
            ...generateMockStock(symbol),
            ...quote,
            name: profile?.name || symbol,
            symbol,
        };
    }

    // Fallback to mock data
    console.log(`📝 Using mock data for ${symbol}`);
    const profile = await getCompanyProfile(symbol);
    return {
        ...generateMockStock(symbol),
        name: profile?.name || symbol,
        symbol,
    };
};

// Get company profile from Yahoo Finance
const getProfileFromYahoo = async (symbol: string): Promise<CompanyProfile | null> => {
    try {
        // Check cache first
        const cacheKey = `profile_${symbol}`;
        const cached = getCachedData(cacheKey);
        if (cached) return cached;

        const response = await yahooFinanceApi.get(YAHOO_ENDPOINT, {
            params: { symbols: symbol },
        });

        const quotes = response.data?.quoteResponse?.result;
        if (!quotes || quotes.length === 0) return null;

        const quote = quotes[0];

        const profile: CompanyProfile = {
            symbol,
            name: quote.longName || quote.shortName || symbol,
            description: `${quote.longName || symbol} is a publicly traded company.`,
            ceo: null,
            founded: null,
            sector: quote.sector || 'Unknown',
            industry: quote.industry || 'Unknown',
            logo: null,
            website: null,
        };

        // Cache the result
        setCachedData(cacheKey, profile);

        return profile;
    } catch (error) {
        console.warn(`Yahoo Finance profile failed for ${symbol}:`, error);
        return null;
    }
};

// Get company profile with fallbacks
export const getCompanyProfile = async (symbol: string): Promise<CompanyProfile | null> => {
    // Try Yahoo Finance
    const profile = await getProfileFromYahoo(symbol);
    if (profile) return profile;

    // Try to find in static data
    const allSymbols = getAllSymbols();
    const found = allSymbols.find(s => s.symbol === symbol);

    if (found) {
        return {
            symbol,
            name: found.name,
            description: `${found.name} is a ${found.type === 'ETF' ? 'exchange-traded fund' : 'publicly traded company'}.`,
            ceo: null,
            founded: null,
            sector: (found as any).sector || 'Unknown',
            industry: 'Unknown',
            logo: null,
            website: null,
        };
    }

    return null;
};

// Get comprehensive stock data
export const getStockData = async (symbol: string): Promise<{ stock: Stock; profile: CompanyProfile | null }> => {
    const [stock, profile] = await Promise.all([
        getStockQuote(symbol),
        getCompanyProfile(symbol),
    ]);

    return { stock, profile };
};

// Search for symbols in static data (no API needed)
export const searchSymbols = async (query: string): Promise<any[]> => {
    if (!query || query.length < 1) return [];

    // Search in static data
    const allSymbols = getAllSymbols();
    const results = allSymbols
        .filter(s =>
            s.symbol.toLowerCase().includes(query.toLowerCase()) ||
            s.name.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 20);

    return results;
};

// Get multiple quotes efficiently (for heatmaps, watchlists, etc.)
export const getMultipleQuotes = async (symbols: string[]): Promise<Map<string, Stock>> => {
    const stockMap = new Map<string, Stock>();

    try {
        // Try to fetch all at once from Yahoo Finance
        const symbolsString = symbols.join(',');
        const cacheKey = `multi_${symbolsString}`;
        const cached = getCachedData(cacheKey);

        if (cached) {
            console.log(`✅ Using cached data for ${symbols.length} symbols`);
            return cached;
        }

        console.log(`📊 Fetching live data for ${symbols.length} symbols from Yahoo Finance...`);
        const response = await yahooFinanceApi.get(YAHOO_ENDPOINT, {
            params: { symbols: symbolsString },
        });

        const quotes = response.data?.quoteResponse?.result || [];

        for (const quote of quotes) {
            const symbol = quote.symbol;
            const stock: Stock = {
                symbol,
                name: quote.longName || quote.shortName || symbol,
                price: quote.regularMarketPrice || quote.ask || 0,
                change: quote.regularMarketChange || 0,
                changePercent: quote.regularMarketChangePercent || 0,
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
                lastUpdated: new Date(),
            };
            stockMap.set(symbol, stock);
        }

        // Cache the result
        setCachedData(cacheKey, stockMap);

        console.log(`✅ Retrieved live data for ${stockMap.size} symbols`);
    } catch (error: any) {
        console.warn(`⚠️ Yahoo Finance multi-quote failed:`, error.message);
    }

    // Fill in missing symbols with mock data
    for (const symbol of symbols) {
        if (!stockMap.has(symbol)) {
            stockMap.set(symbol, generateMockStock(symbol));
        }
    }

    return stockMap;
};
