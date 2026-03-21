import axios from 'axios';

export const REFRESH_INTERVALS = {
    MARKET_STATUS: 30000, // 30 seconds
    STOCK_PRICE: 1000,    // 1 second (Strict Real-Time)
    PORTFOLIO: 1000,      // 1 second (Strict Real-Time)
    WATCHLIST: 1000,      // 1 second (Strict Real-Time)
};

export const YAHOO_ENDPOINT = 'quote';
export const MULTI_QUOTE_ENDPOINT = 'multi-quote';

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 1000; // 1 second - ultra fast updates

// Promise pooling for in-flight requests (Concurrency Deduplication)
const inFlightRequests = new Map<string, Promise<any>>();

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

/**
 * Advanced Fetch wrapper with deduping & caching.
 * Prevents 10 components from firing 10 identical network requests at the exact same millisecond.
 */
export const fetchWithCacheAndPool = async (key: string, fetchFn: () => Promise<any>) => {
    // 1. Check valid cache
    const cached = getCachedData(key);
    if (cached) return cached;

    // 2. Check if a request for this exact key is already in-flight
    if (inFlightRequests.has(key)) {
        return inFlightRequests.get(key);
    }

    // 3. Create the request, store the promise, await, cache, return
    const promise = fetchFn()
        .then((data) => {
            setCachedData(key, data);
            inFlightRequests.delete(key);
            return data;
        })
        .catch((error) => {
            inFlightRequests.delete(key);
            throw error;
        });

    inFlightRequests.set(key, promise);
    return promise;
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

