import axios from 'axios';
import type { AxiosInstance } from 'axios';

// Yahoo Finance API - Free, no API key required!
export const yahooFinanceApi: AxiosInstance = axios.create({
    baseURL: 'https://query1.finance.yahoo.com',
    timeout: 10000,
    headers: {
        'Accept': 'application/json',
    },
});

// Add response interceptor for error handling
const handleApiError = (error: any) => {
    console.error('Yahoo Finance API Error:', error.response?.data || error.message);
    return Promise.reject(error);
};

yahooFinanceApi.interceptors.response.use(
    response => response,
    handleApiError
);

// Simple in-memory cache to reduce API calls
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds cache

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
