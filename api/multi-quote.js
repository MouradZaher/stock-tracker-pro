import axios from 'axios';

// Simple in-memory rate limiting (per-instance)
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS = 40; // Slightly higher for multi-quote as it's used for dashboard
const ipCache = new Map();

function checkRateLimit(ip) {
    const now = Date.now();
    const records = ipCache.get(ip) || [];
    const recentRecords = records.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
    if (recentRecords.length >= MAX_REQUESTS) return false;
    recentRecords.push(now);
    ipCache.set(ip, recentRecords);
    return true;
}

function isValidSymbols(symbols) {
    if (!symbols || typeof symbols !== 'string') return false;
    // Allow letters, numbers, dots, hyphens, ^, :, and commas
    return /^[A-Z0-9.,^:-]{1,400}$/i.test(symbols);
}

const PROVIDERS = [
    {
        name: 'yahoo_query2',
        url: 'https://query2.finance.yahoo.com/v10/finance/quoteSummary',
        parse: (data, symbol) => {
            const result = data?.quoteSummary?.result?.[0];
            const quote = result?.price;
            if (!quote || !quote.regularMarketPrice?.raw) return null;
            return {
                symbol: quote.symbol,
                name: quote.longName || quote.shortName || symbol,
                price: quote.postMarketPrice?.raw || quote.regularMarketPrice.raw,
                change: quote.postMarketChange?.raw ?? quote.regularMarketChange?.raw ?? 0,
                changePercent: quote.postMarketChangePercent?.raw ?? (quote.regularMarketChangePercent?.raw * 100) ?? 0,
                previousClose: quote.regularMarketPreviousClose?.raw || 0,
                open: quote.regularMarketOpen?.raw || 0,
                high: quote.regularMarketDayHigh?.raw || 0,
                low: quote.regularMarketDayLow?.raw || 0,
                volume: quote.regularMarketVolume?.raw || 0,
                avgVolume: quote.averageDailyVolume3Month?.raw || 0,
                marketCap: quote.marketCap?.raw || 0,
                peRatio: 0,
                eps: 0,
                dividendYield: 0,
                fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh?.raw || 0,
                fiftyTwoWeekLow: quote.fiftyTwoWeekLow?.raw || 0,
                provider: 'yahoo'
            };
        },
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Origin': 'https://finance.yahoo.com',
            'Referer': 'https://finance.yahoo.com/',
        },
        buildParams: (symbols) => ({ symbol: symbols.split(',')[0], modules: 'price' }),
    },
    {
        name: 'yahoo_query1',
        url: 'https://query1.finance.yahoo.com/v10/finance/quoteSummary',
        parse: null, // Same as yahoo_query2
        headers: null, // Same as above
        buildParams: (symbols) => ({ symbol: symbols.split(',')[0], modules: 'price' }),
    },
    {
        name: 'finnhub',
        url: 'https://finnhub.io/api/v1/quote',
        requiresKey: 'FINNHUB_API_KEY',
        parse: (data, symbol) => {
            if (!data || data.c === undefined || data.c === 0) return null;
            return {
                symbol,
                name: symbol,
                price: data.c,
                change: data.d || 0,
                changePercent: data.dp || 0,
                previousClose: data.pc || 0,
                open: data.o || 0,
                high: data.h || 0,
                low: data.l || 0,
                volume: 0,
                provider: 'finnhub'
            };
        },
        buildParams: (symbols, apiKey) => ({ symbol: symbols.split(',')[0], token: apiKey }),
    },
    {
        name: 'alphavantage',
        url: 'https://www.alphavantage.co/query',
        requiresKey: 'ALPHA_VANTAGE_KEY',
        parse: (data, symbol) => {
            const quote = data?.['Global Quote'];
            if (!quote || !quote['05. price']) return null;
            return {
                symbol: quote['01. symbol'] || symbol,
                name: symbol,
                price: parseFloat(quote['05. price']),
                change: parseFloat(quote['09. change']) || 0,
                changePercent: parseFloat(quote['10. change percent']?.replace('%', '')) || 0,
                previousClose: parseFloat(quote['08. previous close']) || 0,
                open: parseFloat(quote['02. open']) || 0,
                high: parseFloat(quote['03. high']) || 0,
                low: parseFloat(quote['04. low']) || 0,
                volume: parseInt(quote['06. volume']) || 0,
                provider: 'alphavantage'
            };
        },
        buildParams: (symbols, apiKey) => ({
            function: 'GLOBAL_QUOTE',
            symbol: symbols.split(',')[0],
            apikey: apiKey
        }),
    },
    {
        name: 'twelvedata',
        url: 'https://api.twelvedata.com/quote',
        requiresKey: 'TWELVE_DATA_KEY',
        parse: (data, symbol) => {
            if (!data || !data.close) return null;
            return {
                symbol: data.symbol || symbol,
                name: data.name || symbol,
                price: parseFloat(data.close),
                change: parseFloat(data.change) || 0,
                changePercent: parseFloat(data.percent_change) || 0,
                previousClose: parseFloat(data.previous_close) || 0,
                open: parseFloat(data.open) || 0,
                high: parseFloat(data.high) || 0,
                low: parseFloat(data.low) || 0,
                volume: parseInt(data.volume) || 0,
                provider: 'twelvedata'
            };
        },
        buildParams: (symbols, apiKey) => ({ symbol: symbols.split(',')[0], apikey: apiKey }),
    },
    {
        name: 'fmp',
        url: 'https://financialmodelingprep.com/api/v3/quote',
        requiresKey: 'FMP_KEY',
        parse: (data, symbol) => {
            const quote = Array.isArray(data) ? data[0] : null;
            if (!quote || !quote.price) return null;
            return {
                symbol: quote.symbol || symbol,
                name: quote.name || symbol,
                price: quote.price,
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
                fiftyTwoWeekHigh: quote.yearHigh || 0,
                fiftyTwoWeekLow: quote.yearLow || 0,
                provider: 'fmp'
            };
        },
        buildUrl: (symbols) => `https://financialmodelingprep.com/api/v3/quote/${symbols.split(',')[0]}`,
        buildParams: (symbols, apiKey) => ({ apikey: apiKey }),
    },
    {
        name: 'stooq',
        url: 'https://stooq.com/q/l/',
        parse: (data, symbol) => {
            if (typeof data !== 'string') return null;
            const lines = data.split('\n');
            if (lines.length < 2) return null;
            const values = lines[1].split(',');
            if (values.length < 7 || values[1] === 'N/D') return null;

            const close = parseFloat(values[4]) || 0;
            const open = parseFloat(values[2]) || 0;
            return {
                symbol,
                name: values[0] || symbol,
                price: close,
                change: close - open,
                changePercent: open ? ((close - open) / open) * 100 : 0,
                open,
                high: parseFloat(values[3]) || 0,
                low: parseFloat(values[5]) || 0,
                volume: parseInt(values[6]) || 0,
                provider: 'stooq'
            };
        },
        buildParams: (symbols) => {
            let symbol = symbols.split(',')[0].toLowerCase();
            if (symbol === '^gspc') symbol = '^spx';
            else if (symbol === '^dji') symbol = '^dji';
            else if (symbol === '^ixic') symbol = '^icic';
            else if (symbol === '^rut') symbol = '^rut';
            else if (symbol === '^vix') symbol = '^vix';
            else if (!symbol.includes('.')) symbol += '.us';

            return {
                s: symbol,
                f: 'sd2t2ohlcv',
                h: '',
                e: 'csv'
            };
        },
    }
];

export default async function handler(req, res) {
    const { symbols, modules } = req.query;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // 1. Rate Limiting
    if (!checkRateLimit(clientIp)) {
        return res.status(429).json({ error: 'Too many requests' });
    }

    // 2. Input Validation
    if (!symbols) {
        return res.status(400).json({ error: 'Missing symbols parameter' });
    }

    if (!isValidSymbols(symbols)) {
        return res.status(400).json({ error: 'Invalid symbol format' });
    }

    if (modules && !/^[a-z,]{1,100}$/i.test(modules)) {
        // Silently ignore or return 400
    }

    // 3. CORS Lockdown
    const origin = req.headers.origin;
    const isAllowedOrigin = !origin ||
        origin.includes('vercel.app') ||
        origin.includes('localhost');

    if (!isAllowedOrigin) {
        return res.status(403).json({ error: 'Origin not allowed' });
    }

    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Cache-Control', 's-maxage=2, stale-while-revalidate=10');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // If modules are requested, use dedicated Yahoo quoteSummary endpoint
    if (modules) {
        try {
            const response = await axios.get('https://query2.finance.yahoo.com/v10/finance/quoteSummary', {
                params: { symbols, modules },
                headers: PROVIDERS[0].headers,
                timeout: 8000
            });
            return res.status(200).json(response.data);
        } catch (error) {
            return res.status(500).json({ error: 'Failed to fetch quote summary' });
        }
    }

    let lastError = null;

    for (const provider of PROVIDERS) {
        if (provider.requiresKey && !process.env[provider.requiresKey]) {
            continue;
        }

        try {
            const apiKey = provider.requiresKey ? process.env[provider.requiresKey] : null;
            const url = provider.buildUrl ? provider.buildUrl(symbols) : provider.url;
            const params = provider.buildParams(symbols, apiKey);
            const headers = provider.headers || PROVIDERS[0].headers;

            const response = await axios.get(url, {
                params,
                headers,
                timeout: 6000
            });

            const parser = provider.parse || PROVIDERS[0].parse;
            const parsed = parser(response.data, symbols.split(',')[0]);

            if (parsed && parsed.price > 0) {
                return res.status(200).json({
                    quoteResponse: {
                        result: [parsed],
                        error: null
                    },
                    _provider: provider.name
                });
            }
        } catch (error) {
            lastError = error;
        }
    }

    return res.status(200).json({
        error: 'All data providers failed',
        details: lastError?.message || 'Unknown error',
        quoteResponse: {
            result: [{
                symbol: symbols.split(',')[0],
                regularMarketPrice: 0,
                longName: `${symbols} (Unavailable)`,
                shortName: `${symbols} (Unavailable)`,
                _error: true
            }],
            error: { description: 'All providers failed' }
        }
    });
}
