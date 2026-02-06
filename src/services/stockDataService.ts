import { yahooFinanceApi, YAHOO_ENDPOINT, getCachedData, setCachedData } from './api';
import type { Stock, CompanyProfile, Dividend } from '../types';
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
        totalValue: 0,
        totalBuy: 0,
        totalSell: 0,
        lastUpdated: new Date(),
    };
};

// Get real-time quote from Yahoo Finance
const getQuoteFromYahoo = async (symbol: string): Promise<Partial<Stock> | null> => {
    try {
        // Check cache first
        const cacheKey = `quote_${symbol}`;
        const cached = getCachedData(cacheKey);
        if (cached) return cached;

        console.log(`📊 Fetching live data for ${symbol}...`);
        const response = await yahooFinanceApi.get(YAHOO_ENDPOINT, {
            params: { symbols: symbol },
        });

        const quotes = response.data?.quoteResponse?.result;
        if (!quotes || quotes.length === 0) return null;

        const quote = quotes[0];

        const stockData: Partial<Stock> = {
            price: quote.postMarketPrice || quote.preMarketPrice || quote.regularMarketPrice || quote.ask || 0,
            change: quote.postMarketChange || quote.preMarketChange || quote.regularMarketChange || 0,
            changePercent: quote.postMarketChangePercent || quote.preMarketChangePercent || quote.regularMarketChangePercent || 0,
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
            totalValue: (quote.regularMarketPrice || 0) * (quote.regularMarketVolume || 0),
            totalBuy: null, // Usually not available in standard quote
            totalSell: null,
            lastUpdated: new Date(),
        };

        setCachedData(cacheKey, stockData);
        return stockData;
    } catch (error: any) {
        console.warn(`⚠️ Yahoo Finance quote failed for ${symbol}:`, error.message);
        return null;
    }
};

// Get stock quote - PRIORITIZE REAL DATA
export const getStockQuote = async (symbol: string): Promise<Stock> => {
    const quote = await getQuoteFromYahoo(symbol);

    if (quote && quote.price && quote.price > 0) {
        console.log(`✅ REAL DATA loaded for ${symbol}: $${quote.price}`);
        const stock: Stock = {
            ...generateMockStock(symbol), // Keep as base for fields not in quote
            ...quote,
            symbol,
        } as Stock;

        // Ensure price is valid
        if (stock.price <= 0) {
            console.error(`❌ ${symbol}: Invalid price from API (${stock.price}) - CHECK API CONNECTION`);
            throw new Error(`Failed to get real price for ${symbol}. API returned invalid data.`);
        }
        return stock;
    }

    // Instead of silently falling back, throw an error or log prominently
    console.error(`❌ ${symbol}: Yahoo Finance API FAILED - No valid quote received`);
    console.warn(`⚠️ Using MOCK DATA for ${symbol} as fallback`);

    return {
        ...generateMockStock(symbol),
        symbol,
    };
};

// Get company profile and summary from Yahoo Finance
const getProfileAndSummaryFromYahoo = async (symbol: string): Promise<CompanyProfile | null> => {
    try {
        const cacheKey = `profile_v10_${symbol}`;
        const cached = getCachedData(cacheKey);
        if (cached) return cached;

        // Fetch detailed summary
        const response = await yahooFinanceApi.get(YAHOO_ENDPOINT, {
            params: {
                symbols: symbol,
                modules: 'summaryProfile,assetProfile,financialData,defaultKeyStatistics,calendarEvents'
            },
        });

        const result = response.data?.quoteSummary?.result?.[0];
        if (!result) return null;

        const summary = result.summaryProfile || result.assetProfile || {};
        const financialData = result.financialData || {};
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
            founded: null, // Founding year is often missing in direct response, but we can try to extract from description or use placeholder
            sector: summary.sector || 'Unknown',
            industry: summary.industry || 'Unknown',
            logo: null,
            website: summary.website || null,
            dividends: dividends,
        };

        setCachedData(cacheKey, profile);
        return profile;
    } catch (error) {
        console.warn(`Yahoo Finance profile failed for ${symbol}:`, error);
        return null;
    }
};

// Get comprehensive stock data
export const getStockData = async (symbol: string): Promise<{ stock: Stock; profile: CompanyProfile | null }> => {
    // Fetch both quote and profile/summary
    const [stockQuote, profileData] = await Promise.all([
        getQuoteFromYahoo(symbol),
        getProfileAndSummaryFromYahoo(symbol)
    ]);

    const stock: Stock = {
        ...generateMockStock(symbol),
        ...(stockQuote || {}),
        name: profileData?.name || symbol,
        symbol,
    } as Stock;

    return { stock, profile: profileData };
};

// Search for symbols in static data
export const searchSymbols = async (query: string): Promise<any[]> => {
    if (!query || query.length < 1) return [];
    const allSymbols = getAllSymbols();

    // Filter matching symbols
    const matches = allSymbols.filter(s =>
        s.symbol.toLowerCase().includes(query.toLowerCase()) ||
        s.name.toLowerCase().includes(query.toLowerCase())
    );

    // Deduplicate by symbol using Map
    const uniqueMap = new Map();
    matches.forEach(item => {
        if (!uniqueMap.has(item.symbol)) {
            uniqueMap.set(item.symbol, item);
        }
    });

    // Convert back to array and limit to 20 results
    return Array.from(uniqueMap.values()).slice(0, 20);
};

// Get multiple quotes efficiently
export const getMultipleQuotes = async (symbols: string[]): Promise<Map<string, Stock>> => {
    const stockMap = new Map<string, Stock>();
    try {
        const symbolsString = symbols.join(',');
        const response = await yahooFinanceApi.get(YAHOO_ENDPOINT, {
            params: { symbols: symbolsString },
        });

        const quotes = response.data?.quoteResponse?.result || [];

        for (const quote of quotes) {
            const sym = quote.symbol;
            const stock: Stock = {
                ...generateMockStock(sym),
                symbol: sym,
                name: quote.longName || quote.shortName || sym,
                price: quote.postMarketPrice || quote.preMarketPrice || quote.regularMarketPrice || quote.ask || 0,
                change: quote.postMarketChange || quote.preMarketChange || quote.regularMarketChange || 0,
                changePercent: quote.postMarketChangePercent || quote.preMarketChangePercent || quote.regularMarketChangePercent || 0,
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
                totalValue: (quote.regularMarketPrice || 0) * (quote.regularMarketVolume || 0),
                totalBuy: null,
                totalSell: null,
                lastUpdated: new Date(),
            };
            stockMap.set(sym, stock);
        }
    } catch (error: any) {
        console.warn(`⚠️ Yahoo Finance multi-quote failed:`, error.message);
    }

    // Fill in missing
    for (const sym of symbols) {
        if (!stockMap.has(sym)) {
            stockMap.set(sym, generateMockStock(sym));
        }
    }

    return stockMap;
};
