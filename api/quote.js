import axios from 'axios';

// Simple in-memory rate limiting (per-instance)
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 300;
const ipCache = new Map();

/**
 * Basic rate limiter
 * @param {string} ip 
 * @returns {boolean} true if allowed, false if limited
 */
function checkRateLimit(ip) {
    const now = Date.now();
    const records = ipCache.get(ip) || [];
    const recentRecords = records.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);

    if (recentRecords.length >= MAX_REQUESTS) {
        return false;
    }

    recentRecords.push(now);
    ipCache.set(ip, recentRecords);

    // Cleanup cache occasionally
    if (ipCache.size > 1000) {
        const cleanupThreshold = now - RATE_LIMIT_WINDOW;
        for (const [key, value] of ipCache.entries()) {
            const filtered = value.filter(t => t > cleanupThreshold);
            if (filtered.length === 0) ipCache.delete(key);
            else ipCache.set(key, filtered);
        }
    }

    return true;
}

/**
 * Validate stock symbols to prevent injection
 * @param {string} symbols 
 * @returns {boolean}
 */
function isValidSymbol(symbols) {
    if (!symbols || typeof symbols !== 'string') return false;
    // Allow letters, numbers, dots, hyphens, and commas for multiple symbols
    // Max length 200 for bulk requests
    return /^[A-Z0-9.,^:-]{1,200}$/i.test(symbols);
}

export default async function handler(req, res) {
    const { symbols, modules } = req.query;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // 1. Rate Limiting
    if (!checkRateLimit(clientIp)) {
        return res.status(429).json({ error: 'Too many requests. Please slow down.' });
    }

    // 2. Input Validation
    if (!symbols) {
        return res.status(400).json({ error: 'Missing symbols parameter' });
    }

    if (!isValidSymbol(symbols)) {
        return res.status(400).json({ error: 'Invalid symbol format' });
    }

    if (modules && !/^[a-z,]{1,100}$/i.test(modules)) {
        return res.status(400).json({ error: 'Invalid modules format' });
    }

    // 3. CORS Lockdown
    const origin = req.headers.origin;
    const internalHost = req.headers.host;

    // Only allow requests from our own host or localhost (for dev)
    const isAllowedOrigin = !origin ||
        origin.includes('vercel.app') ||
        origin.includes('localhost') ||
        origin.includes(internalHost);

    if (!isAllowedOrigin) {
        return res.status(403).json({ error: 'Origin not allowed' });
    }

    // Set Security Headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 's-maxage=2, stale-while-revalidate');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const isSummary = !!modules;
    const path = isSummary ? 'v10/finance/quoteSummary' : 'v7/finance/quote';

    const endpoints = [
        `https://query2.finance.yahoo.com/${path}`,
        `https://query1.finance.yahoo.com/${path}`
    ];

    for (const endpoint of endpoints) {
        try {
            const params = isSummary
                ? { symbol: symbols.split(',')[0], modules }
                : { symbols };

            const response = await axios.get(endpoint, {
                params,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    'Origin': 'https://finance.yahoo.com',
                    'Referer': 'https://finance.yahoo.com/',
                },
                timeout: 8000
            });

            return res.status(200).json(response.data);
        } catch (error) {
            // Keep error logging for debugging but remove request data logs
            if (endpoint === endpoints[endpoints.length - 1]) {
                const status = error.response ? error.response.status : 500;
                const message = error.response?.data?.error?.description || error.message;
                return res.status(status).json({ error: 'Failed to fetch market data', details: message });
            }
        }
    }
}
