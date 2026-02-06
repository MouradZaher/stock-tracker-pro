import { yahooFinanceApi, YAHOO_ENDPOINT, getCachedData, setCachedData } from './api';
import type { Stock, CompanyProfile, Dividend } from '../types';
import { getAllSymbols } from '../data/sectors';

// Get real-time quote from Yahoo Finance - NO MOCK DATA
const getQuoteFromYahoo = async (symbol: string): Promise<Partial<Stock> | null> => {
    try {
        // Check cache first (1 second cache for instant feel)
        const cacheKey = `quote_${symbol}`;
        const cached = getCachedData(cacheKey);
        if (cached) return cached;

        console.log(`📊 Fetching live data for ${symbol}...`);
        const response = await yahooFinanceApi.get(YAHOO_ENDPOINT, {
            params: { symbols: symbol },
        });

        const quotes = response.data?.quoteResponse?.result;
        if (!quotes || quotes.length === 0) {
            console.error(`❌ No data returned for ${symbol}`);
            return null;
        }

        const quote = quotes[0];

        // Get the best available price (post-market > pre-market > regular)
        const price = quote.postMarketPrice || quote.preMarketPrice || quote.regularMarketPrice || quote.ask || 0;
        const change = quote.postMarketChange ?? quote.preMarketChange ?? quote.regularMarketChange ?? 0;
        const changePercent = quote.postMarketChangePercent ?? quote.preMarketChangePercent ?? quote.regularMarketChangePercent ?? 0;

        const stockData: Partial<Stock> = {
            name: quote.longName || quote.shortName || symbol,
            price: price,
            change: change,
            changePercent: changePercent,
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
            totalValue: (price) * (quote.regularMarketVolume || 0),
            totalBuy: null,
            totalSell: null,
            lastUpdated: new Date(),
        };

        // Only cache if valid price
        if (price > 0) {
            setCachedData(cacheKey, stockData);
            console.log(`✅ REAL: ${symbol} = $${price.toFixed(2)} (${change >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`);
        }

        return stockData;
    } catch (error: any) {
        console.error(`❌ Yahoo Finance failed for ${symbol}:`, error.message);
        return null;
    }
};

// Get stock quote - REAL DATA ONLY
export const getStockQuote = async (symbol: string): Promise<Stock> => {
    const quote = await getQuoteFromYahoo(symbol);

    if (quote && quote.price && quote.price > 0) {
        return {
            symbol,
            name: quote.name || symbol,
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
            totalValue: quote.totalValue || 0,
            totalBuy: quote.totalBuy || 0,
            totalSell: quote.totalSell || 0,
            lastUpdated: new Date(),
        };
    }

    // Return error placeholder instead of mock data
    console.error(`❌ Unable to fetch real data for ${symbol}`);
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

// Get company profile from Yahoo Finance
const getProfileFromYahoo = async (symbol: string): Promise<CompanyProfile | null> => {
    try {
        const cacheKey = `profile_${symbol}`;
        const cached = getCachedData(cacheKey);
        if (cached) return cached;

        const response = await yahooFinanceApi.get(YAHOO_ENDPOINT, {
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

        setCachedData(cacheKey, profile, 300000); // 5 min cache for profiles
        return profile;
    } catch (error) {
        console.warn(`Profile fetch failed for ${symbol}:`, error);
        return null;
    }
};

// Get stock data with profile
export const getStockData = async (symbol: string): Promise<{ stock: Stock; profile: CompanyProfile | null }> => {
    const [stock, profile] = await Promise.all([
        getStockQuote(symbol),
        getProfileFromYahoo(symbol)
    ]);

    // Apply name from profile if available
    if (profile?.name && stock.name === symbol) {
        stock.name = profile.name;
    }

    return { stock, profile };
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

// Get multiple quotes efficiently - REAL DATA ONLY
export const getMultipleQuotes = async (symbols: string[]): Promise<Map<string, Stock>> => {
    const stockMap = new Map<string, Stock>();

    if (symbols.length === 0) return stockMap;

    try {
        const symbolsString = symbols.join(',');
        console.log(`📊 Batch fetching: ${symbols.length} symbols...`);

        const response = await yahooFinanceApi.get(YAHOO_ENDPOINT, {
            params: { symbols: symbolsString },
        });

        const quotes = response.data?.quoteResponse?.result || [];

        for (const quote of quotes) {
            const sym = quote.symbol;
            const price = quote.postMarketPrice || quote.preMarketPrice || quote.regularMarketPrice || 0;

            const stock: Stock = {
                symbol: sym,
                name: quote.longName || quote.shortName || sym,
                price: price,
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
                totalValue: price * (quote.regularMarketVolume || 0),
                totalBuy: null,
                totalSell: null,
                lastUpdated: new Date(),
            };
            stockMap.set(sym, stock);
        }

        console.log(`✅ REAL DATA: Loaded ${stockMap.size}/${symbols.length} symbols`);
    } catch (error: any) {
        console.error(`❌ Batch quote failed:`, error.message);
    }

    // Mark missing symbols as unavailable (no mock data)
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
