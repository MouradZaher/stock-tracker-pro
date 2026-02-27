import axios from 'axios';

// Simple in-memory rate limiting (per-instance)
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS = 30;
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

function isValidSymbol(symbol) {
    if (!symbol || typeof symbol !== 'string') return false;
    return /^[A-Z0-9.^:-]{1,20}$/i.test(symbol);
}

export default async function handler(req, res) {
    const { symbol } = req.query;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (!checkRateLimit(clientIp)) {
        return res.status(429).json({ error: 'Too many requests' });
    }

    if (!symbol) {
        return res.status(400).json({ error: 'Missing symbol parameter' });
    }

    if (!isValidSymbol(symbol)) {
        return res.status(400).json({ error: 'Invalid symbol format' });
    }

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
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const endpoint = 'https://query2.finance.yahoo.com/v2/finance/news';

    try {
        const response = await axios.get(endpoint, {
            params: { symbols: symbol },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/json',
            },
            timeout: 5000
        });

        return res.status(200).json(response.data);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch news' });
    }
}
