import axios from 'axios';

export const REFRESH_INTERVALS = {
    MARKET_STATUS: 30000, // 30 seconds
    STOCK_PRICE: 3000,    // 3 seconds
    PORTFOLIO: 3000,      // 3 seconds
    WATCHLIST: 3000,      // 3 seconds
};

export const YAHOO_ENDPOINT = 'quote';
export const MULTI_QUOTE_ENDPOINT = 'multi-quote';

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 1000; // 1 second - ultra fast updates

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

// API base URL - prioritize local /api for development
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create Axios instance for Yahoo Finance API calls
export const yahooFinanceApi = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
});

// Create Axios instance for multi-source API calls
export const multiSourceApi = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
});

