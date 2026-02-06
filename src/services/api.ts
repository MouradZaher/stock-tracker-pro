import axios from 'axios';

export const REFRESH_INTERVALS = {
    MARKET_STATUS: 60000,
    STOCK_PRICE: 1000, // 1 second for live feel
    PORTFOLIO: 10000,
    WATCHLIST: 15000,
};

export const YAHOO_ENDPOINT = 'quote';

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5000; // 5 seconds to ensure data freshness for "live" mode

export const getCachedData = (key: string) => {
    const cached = cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > CACHE_DURATION) {
        cache.delete(key);
        return null;
    }

    return cached.data;
};

export const setCachedData = (key: string, data: any) => {
    cache.set(key, { data, timestamp: Date.now() });
};

// Create Axios instance pointing to local proxy or direct if CORS allowed (it won't be for Yahoo, so this expects a proxy or is the proxy wrapper)
// Wait, the user had a CORS issue before. 
// For now, I will point to '/api' which Vercel rewrites to yahoo, or use the previous configuration if I can recall it.
// Assuming relative path for Vercel proxy.
export const yahooFinanceApi = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api', // Default to Vercel function path
    timeout: 10000,
});
