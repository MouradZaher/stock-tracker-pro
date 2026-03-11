import axios from 'axios';
import { API_KEYS } from './dataProviders';

// ============================================
// CURRENCY & FOREX SERVICE
// Normalizes and converts between EGP, AED and USD
// ============================================

export interface ExchangeRates {
    USD_EGP: number;
    USD_AED: number;
    lastUpdated: number;
}

const EXCHANGE_CACHE_KEY = 'exchange_rates_v1';
const CACHE_DURATION = 3600000; // 1 hour

// Hardcoded fallbacks (Emergency safety net)
const FALLBACK_RATES: ExchangeRates = {
    USD_EGP: 48.50,
    USD_AED: 3.67,
    lastUpdated: Date.now()
};

/**
 * Fetch latest exchange rates from Twelve Data
 */
export const fetchExchangeRates = async (): Promise<ExchangeRates> => {
    // 1. Check local storage cache
    const cached = localStorage.getItem(EXCHANGE_CACHE_KEY);
    if (cached) {
        const parsed = JSON.parse(cached) as ExchangeRates;
        if (Date.now() - parsed.lastUpdated < CACHE_DURATION) {
            return parsed;
        }
    }

    // 2. Fetch from API (Twelve Data)
    if (API_KEYS.twelveData) {
        try {
            const response = await axios.get(`https://api.twelvedata.com/exchange_rate`, {
                params: {
                    symbol: 'USD/EGP,USD/AED',
                    apikey: API_KEYS.twelveData
                },
                timeout: 5000
            });

            if (response.data) {
                const results = response.data;
                const rates: ExchangeRates = {
                    USD_EGP: parseFloat(results['USD/EGP']?.rate) || FALLBACK_RATES.USD_EGP,
                    USD_AED: parseFloat(results['USD/AED']?.rate) || FALLBACK_RATES.USD_AED,
                    lastUpdated: Date.now()
                };

                localStorage.setItem(EXCHANGE_CACHE_KEY, JSON.stringify(rates));
                return rates;
            }
        } catch (error) {
            console.warn('⚠️ Currency API failed, using fallbacks:', (error as Error).message);
        }
    }

    return FALLBACK_RATES;
};

/**
 * Convert local currency to USD
 */
export const convertToUSD = (amount: number, currency: string, rates: ExchangeRates): number => {
    if (!currency || currency === 'USD') return amount;
    
    if (currency === 'EGP') return amount / rates.USD_EGP;
    if (currency === 'AED') return amount / rates.USD_AED;
    
    return amount; // Unsupported currency
};

/**
 * Convert USD to local currency
 */
export const convertFromUSD = (amountUSD: number, targetCurrency: string, rates: ExchangeRates): number => {
    if (!targetCurrency || targetCurrency === 'USD') return amountUSD;
    
    if (targetCurrency === 'EGP') return amountUSD * rates.USD_EGP;
    if (targetCurrency === 'AED') return amountUSD * rates.USD_AED;
    
    return amountUSD;
};
