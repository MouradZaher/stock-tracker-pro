import axios from 'axios';
import type { AxiosInstance } from 'axios';

// Real-time polling intervals (milliseconds)
export const REFRESH_INTERVALS = {
    STOCK_PRICE: 10000,    // 10 seconds - stock detail page
    PORTFOLIO: 30000,       // 30 seconds - portfolio data
    WATCHLIST: 30000,       // 30 seconds - watchlist
    MARKET_STATUS: 60000,   // 1 minute - market hours
    TICKER: 15000,          // 15 seconds - live ticker
};

// Use local proxy in production to avoid CORS, direct in dev (or also proxy if running locall)
const API_BASE_URL = import.meta.env.PROD
    ? '/api'
    : 'https://query1.finance.yahoo.com';

// Endpoint handles the difference between proxy (/quote) and direct API (/v8/finance/quote)
export const YAHOO_ENDPOINT = import.meta.env.PROD
    ? '/quote'
    : '/v8/finance/quote';

// Yahoo Finance API - Free, no API key required!
export const yahooFinanceApi: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Accept': 'application/json',
    },
});

// Exponential backoff retry logic
export const fetchWithRetry = async (
    fn: () => Promise<any>,
    retries = 3,
    backoff = 300
): Promise<any> => {
    try {
        return await fn();
    } catch (error) {
        if (retries > 0) {
            console.warn(`Retry attempt remaining: ${retries}. Waiting ${backoff}ms...`);
            await new Promise(res => setTimeout(res, backoff));
            return fetchWithRetry(fn, retries - 1, backoff * 2);
        }
        throw error;
    }
};

// Add response interceptor for error handling
const handleApiError = (error: any) => {
    console.error('Yahoo Finance API Error:', error.response?.data || error.message);
    return Promise.reject(error);
};

yahooFinanceApi.interceptors.response.use(
    response => response,
    handleApiError
);

// Enhanced in-memory cache with timestamps
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 10000; // 10 seconds cache (shorter for real-time)

export const getCachedData = (key: string) => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    return null;
};

export const setCachedData = (key: string, data: any) => {
    cache.set(key, { data, timestamp: Date.now() });
};

// Clear cache for a specific key
export const clearCache = (key: string) => {
    cache.delete(key);
};

// Clear all cache
export const clearAllCache = () => {
    cache.clear();
};
