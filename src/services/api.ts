import axios from 'axios';
import type { AxiosInstance } from 'axios';

// API Keys
const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY || '';
const ALPHA_VANTAGE_API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || '';

// Finnhub API Client
export const finnhubApi: AxiosInstance = axios.create({
    baseURL: 'https://finnhub.io/api/v1',
    params: {
        token: FINNHUB_API_KEY,
    },
});

// Alpha Vantage API Client
export const alphaVantageApi: AxiosInstance = axios.create({
    baseURL: 'https://www.alphavantage.co',
    params: {
        apikey: ALPHA_VANTAGE_API_KEY,
    },
});

// Yahoo Finance API (via RapidAPI or direct)
export const yahooFinanceApi: AxiosInstance = axios.create({
    baseURL: 'https://query1.finance.yahoo.com',
});

// Add response interceptors for error handling
const handleApiError = (error: any) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
};

finnhubApi.interceptors.response.use(
    response => response,
    handleApiError
);

alphaVantageApi.interceptors.response.use(
    response => response,
    handleApiError
);

yahooFinanceApi.interceptors.response.use(
    response => response,
    handleApiError
);

// Check if API keys are configured
export const hasAPIKeys = () => {
    return {
        finnhub: !!FINNHUB_API_KEY,
        alphaVantage: !!ALPHA_VANTAGE_API_KEY,
    };
};
