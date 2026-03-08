import axios from 'axios';

// ============================================================
// AUTO-FETCH SINGLE QUOTE HANDLER
// Fetches real-time price for a single symbol from multiple sources.
// No hardcoded prices. Pure auto-fetch with smart market detection.
// ============================================================

const EGYPT_SYMBOLS = new Set([
    'COMI', 'TMGH', 'HRHO', 'EAST', 'EFID', 'EMFD', 'ADIB',
    'ETEL', 'ABUK', 'FWRY', 'SWDY', 'ORAS', 'RAYA', 'PHDC', 'CLHO',
]);
const ADX_SYMBOLS = new Set([
    'IHC', 'FAB', 'ETISALAT', 'ADNOCDIST', 'ALDAR', 'ADCB',
    'MULTIPLY', 'ADNOCDRILL', 'PRESIGHT', 'FERTIGLBE', 'DANA',
    'AGTHIA', 'YAHSAT', 'ALPHADHABI', 'RAKPROP',
]);
const CRYPTO_SYMBOLS = new Set([
    'BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE',
    'BTC-USD', 'ETH-USD', 'BNB-USD', 'SOL-USD',
]);
const COINGECKO_IDS = {
    'BTC': 'bitcoin', 'BTC-USD': 'bitcoin',
    'ETH': 'ethereum', 'ETH-USD': 'ethereum',
    'BNB': 'binancecoin', 'BNB-USD': 'binancecoin',
    'SOL': 'solana', 'SOL-USD': 'solana',
};

function getMarket(symbol) {
    const s = symbol.toUpperCase().split('.')[0].trim();
    if (symbol.includes('.CA')) return 'egypt';
    if (symbol.includes('.AD') || symbol.includes('.AE')) return 'abudhabi';
    if (EGYPT_SYMBOLS.has(s)) return 'egypt';
    if (ADX_SYMBOLS.has(s)) return 'abudhabi';
    if (CRYPTO_SYMBOLS.has(s)) return 'crypto';
    return 'us';
}

function toYahooSymbol(symbol) {
    const s = symbol.toUpperCase().trim();
    if (s.includes('.')) return s;
    const market = getMarket(s);
    if (market === 'egypt') return `${s}.CA`;
    if (market === 'abudhabi') return `${s}.AD`;
    return s;
}

const YAHOO_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Origin': 'https://finance.yahoo.com',
    'Referer': 'https://finance.yahoo.com/',
};

// Rate limiting
const ipCache = new Map();
function checkRateLimit(ip) {
    const now = Date.now();
    const records = (ipCache.get(ip) || []).filter(t => now - t < 60000);
    if (records.length >= 300) return false;
    records.push(now);
    ipCache.set(ip, records);
    return true;
}

function isValidSymbol(s) {
    return s && typeof s === 'string' && /^[A-Z0-9.,^:\-]{1,200}$/i.test(s);
}

export default async function handler(req, res) {
    const { symbols, modules } = req.query;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (!checkRateLimit(clientIp)) {
        return res.status(429).json({ error: 'Too many requests. Please slow down.' });
    }
    if (!symbols) return res.status(400).json({ error: 'Missing symbols parameter' });
    if (!isValidSymbol(symbols)) return res.status(400).json({ error: 'Invalid symbol format' });

    const origin = req.headers.origin;
    const isAllowedOrigin = !origin || origin.includes('vercel.app') || origin.includes('localhost');
    if (!isAllowedOrigin) return res.status(403).json({ error: 'Origin not allowed' });

    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Cache-Control', 's-maxage=3, stale-while-revalidate');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const isSummary = !!modules;
    const isChart = req.query.chart === 'true';
    const rawSymbol = symbols.split(',')[0].trim();
    const market = getMarket(rawSymbol);

    // ── CRYPTO: use CoinGecko ─────────────────────────────────
    if (market === 'crypto' && !isSummary && !isChart) {
        const sym = rawSymbol.toUpperCase().split('.')[0].trim();
        const cgId = COINGECKO_IDS[sym];
        if (cgId) {
            try {
                const r = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
                    params: { ids: cgId, vs_currencies: 'usd', include_24hr_change: true },
                    timeout: 5000,
                });
                const data = r.data[cgId];
                if (data?.usd) {
                    const price = data.usd;
                    const cp = data.usd_24h_change || 0;
                    const change = (price * cp) / 100;
                    return res.status(200).json({
                        quoteResponse: {
                            result: [{
                                symbol: rawSymbol,
                                regularMarketPrice: price,
                                regularMarketChange: change,
                                regularMarketChangePercent: cp,
                                regularMarketPreviousClose: price - change,
                                longName: sym
                            }]
                        },
                        _provider: 'coingecko'
                    });
                }
            } catch (e) {
                console.warn('CoinGecko failed:', e.message);
            }
        }
    }

    // ── Non-crypto: use Yahoo Finance ─────────────────────────
    const yahooSym = toYahooSymbol(rawSymbol);
    const isSummaryModules = modules || 'price';

    let path;
    if (isChart) {
        path = `v8/finance/chart/${yahooSym}`;
    } else {
        path = isSummary ? 'v10/finance/quoteSummary' : 'v7/finance/quote';
    }

    const endpoints = [
        `https://query1.finance.yahoo.com/${path}`,
        `https://query2.finance.yahoo.com/${path}`,
    ];

    for (const endpoint of endpoints) {
        try {
            const params = isSummary
                ? { symbol: yahooSym, modules }
                : isChart
                    ? { range: req.query.range || '1mo', interval: req.query.interval || '1d' }
                    : { symbols: yahooSym };

            const response = await axios.get(endpoint, {
                params,
                headers: YAHOO_HEADERS,
                timeout: 8000,
            });

            // For quote responses, remap back to original symbol
            if (!isSummary && !isChart) {
                const result = response.data?.quoteResponse?.result?.[0];
                if (result?.regularMarketPrice > 0) {
                    result.symbol = rawSymbol; // restore original symbol
                    return res.status(200).json(response.data);
                }
            } else {
                return res.status(200).json(response.data);
            }
        } catch (error) {
            console.warn(`Yahoo ${endpoint} failed for ${yahooSym}:`, error.message);
        }
    }

    // ── Stooq fallback (US stocks only) ──────────────────────
    if (market === 'us' && !isSummary && !isChart) {
        try {
            const r = await axios.get(
                `https://stooq.com/q/l/?s=${rawSymbol.toLowerCase()}&f=sd2t2ohlcvn&h&e=csv`,
                { timeout: 4000, responseType: 'text' }
            );
            const lines = r.data.split('\n');
            if (lines.length >= 2) {
                const headers = lines[0].split(',');
                const values = lines[1].split(',');
                const row = {};
                headers.forEach((h, i) => (row[h.trim().toLowerCase()] = values[i]?.trim()));
                const close = parseFloat(row['close']) || 0;
                const open = parseFloat(row['open']) || 0;
                if (close > 0) {
                    return res.status(200).json({
                        quoteResponse: {
                            result: [{
                                symbol: rawSymbol,
                                regularMarketPrice: close,
                                regularMarketChange: close - open,
                                regularMarketChangePercent: open ? ((close - open) / open) * 100 : 0,
                                regularMarketPreviousClose: open,
                                longName: row['name'] || rawSymbol,
                            }]
                        },
                        _provider: 'stooq'
                    });
                }
            }
        } catch (e) {
            console.warn('Stooq fallback failed:', e.message);
        }
    }

    // ── All sources failed: return empty ──────────────────────
    console.error(`❌ All sources failed for ${rawSymbol}`);
    return res.status(200).json({
        quoteResponse: { result: [], error: `No data available for ${rawSymbol}` },
        _provider: 'none'
    });
}
