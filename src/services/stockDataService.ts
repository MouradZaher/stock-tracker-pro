import { finnhubApi, alphaVantageApi, hasAPIKeys } from './api';
import type { Stock, CompanyProfile } from '../types';
import { getAllSymbols } from '../data/sectors';

// Mock data generator for when APIs are unavailable
const generateMockStock = (symbol: string): Stock => {
    const basePrice = 100 + Math.random() * 400;
    const change = (Math.random() - 0.5) * 10;
    const changePercent = (change / basePrice) * 100;

    return {
        symbol,
        name: symbol,
        price: basePrice,
        change,
        changePercent,
        previousClose: basePrice - change,
        open: basePrice + (Math.random() - 0.5) * 5,
        high: basePrice + Math.random() * 5,
        low: basePrice - Math.random() * 5,
        volume: Math.floor(Math.random() * 100000000),
        avgVolume: Math.floor(Math.random() * 80000000),
        marketCap: Math.floor(basePrice * Math.random() * 10000000000),
        peRatio: 15 + Math.random() * 30,
        eps: basePrice / (15 + Math.random() * 30),
        dividendYield: Math.random() * 3,
        fiftyTwoWeekHigh: basePrice * (1 + Math.random() * 0.2),
        fiftyTwoWeekLow: basePrice * (1 - Math.random() * 0.3),
        lastUpdated: new Date(),
    };
};

// Get real-time quote from Finnhub
const getQuoteFromFinnhub = async (symbol: string): Promise<Partial<Stock> | null> => {
    try {
        const response = await finnhubApi.get('/quote', { params: { symbol } });
        const data = response.data;

        if (data.c === 0) return null;

        return {
            price: data.c,
            change: data.d,
            changePercent: data.dp,
            previousClose: data.pc,
            open: data.o,
            high: data.h,
            low: data.l,
            lastUpdated: new Date(),
        };
    } catch (error) {
        console.warn('Finnhub quote failed:', error);
        return null;
    }
};

// Get quote from Alpha Vantage
const getQuoteFromAlphaVantage = async (symbol: string): Promise<Partial<Stock> | null> => {
    try {
        const response = await alphaVantageApi.get('/query', {
            params: {
                function: 'GLOBAL_QUOTE',
                symbol,
            },
        });

        const quote = response.data['Global Quote'];
        if (!quote || !quote['05. price']) return null;

        return {
            price: parseFloat(quote['05. price']),
            change: parseFloat(quote['09. change']),
            changePercent: parseFloat(quote['10. change percent']?.replace('%', '') || '0'),
            previousClose: parseFloat(quote['08. previous close']),
            open: parseFloat(quote['02. open']),
            high: parseFloat(quote['03. high']),
            low: parseFloat(quote['04. low']),
            volume: parseInt(quote['06. volume']),
            lastUpdated: new Date(),
        };
    } catch (error) {
        console.warn('Alpha Vantage quote failed:', error);
        return null;
    }
};

// Get stock quote with fallbacks
export const getStockQuote = async (symbol: string): Promise<Stock> => {
    const apiKeys = hasAPIKeys();

    // Try Finnhub first
    if (apiKeys.finnhub) {
        const quote = await getQuoteFromFinnhub(symbol);
        if (quote) {
            const profile = await getCompanyProfile(symbol);
            return {
                ...generateMockStock(symbol),
                ...quote,
                name: profile?.name || symbol,
                symbol,
            };
        }
    }

    // Try Alpha Vantage
    if (apiKeys.alphaVantage) {
        const quote = await getQuoteFromAlphaVantage(symbol);
        if (quote) {
            const profile = await getCompanyProfile(symbol);
            return {
                ...generateMockStock(symbol),
                ...quote,
                name: profile?.name || symbol,
                symbol,
            };
        }
    }

    // Fallback to mock data
    console.warn('Using mock data for', symbol);
    const profile = await getCompanyProfile(symbol);
    return {
        ...generateMockStock(symbol),
        name: profile?.name || symbol,
        symbol,
    };
};

// Get company profile from Finnhub
const getProfileFromFinnhub = async (symbol: string): Promise<CompanyProfile | null> => {
    try {
        const response = await finnhubApi.get('/stock/profile2', { params: { symbol } });
        const data = response.data;

        if (!data || !data.name) return null;

        return {
            symbol,
            name: data.name,
            description: data.finnhubIndustry || '',
            ceo: null,
            founded: data.ipo || null,
            sector: data.finnhubIndustry || 'Unknown',
            industry: data.finnhubIndustry || 'Unknown',
            logo: data.logo || null,
            website: data.weburl || null,
        };
    } catch (error) {
        console.warn('Finnhub profile failed:', error);
        return null;
    }
};

// Get company profile with fallbacks
export const getCompanyProfile = async (symbol: string): Promise<CompanyProfile | null> => {
    const apiKeys = hasAPIKeys();

    // Try Finnhub
    if (apiKeys.finnhub) {
        const profile = await getProfileFromFinnhub(symbol);
        if (profile) return profile;
    }

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

    // Add additional stats from Alpha Vantage if available
    try {
        const apiKeys = hasAPIKeys();
        if (apiKeys.alphaVantage) {
            const overviewResponse = await alphaVantageApi.get('/query', {
                params: {
                    function: 'OVERVIEW',
                    symbol,
                },
            });

            const overview = overviewResponse.data;
            if (overview && overview.Symbol) {
                stock.marketCap = parseFloat(overview.MarketCapitalization) || stock.marketCap;
                stock.peRatio = parseFloat(overview.PERatio) || stock.peRatio;
                stock.eps = parseFloat(overview.EPS) || stock.eps;
                stock.dividendYield = parseFloat(overview.DividendYield) * 100 || stock.dividendYield;
                stock.fiftyTwoWeekHigh = parseFloat(overview['52WeekHigh']) || stock.fiftyTwoWeekHigh;
                stock.fiftyTwoWeekLow = parseFloat(overview['52WeekLow']) || stock.fiftyTwoWeekLow;

                if (profile) {
                    profile.description = overview.Description || profile.description;
                    profile.sector = overview.Sector || profile.sector;
                    profile.industry = overview.Industry || profile.industry;
                }
            }
        }
    } catch (error) {
        console.warn('Could not fetch overview data:', error);
    }

    return { stock, profile };
};

// Search for symbols
export const searchSymbols = async (query: string): Promise<any[]> => {
    if (!query || query.length < 1) return [];

    // First, search in static data
    const allSymbols = getAllSymbols();
    const staticResults = allSymbols
        .filter(s =>
            s.symbol.toLowerCase().includes(query.toLowerCase()) ||
            s.name.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 10);

    // If we have API access, also search via API
    try {
        const apiKeys = hasAPIKeys();
        if (apiKeys.finnhub) {
            const response = await finnhubApi.get('/search', { params: { q: query } });
            if (response.data && response.data.result) {
                const apiResults = response.data.result
                    .filter((r: any) => r.type === 'Common Stock' || r.type === 'ETP')
                    .slice(0, 10);

                // Merge with static results, prioritizing exact matches
                const combined = [...staticResults];
                apiResults.forEach((apiResult: any) => {
                    if (!combined.find(s => s.symbol === apiResult.symbol)) {
                        combined.push({
                            symbol: apiResult.symbol,
                            name: apiResult.description,
                            type: apiResult.type === 'ETP' ? 'ETF' : 'Stock',
                        });
                    }
                });

                return combined.slice(0, 10);
            }
        }
    } catch (error) {
        console.warn('API search failed, using static data only:', error);
    }

    return staticResults;
};
