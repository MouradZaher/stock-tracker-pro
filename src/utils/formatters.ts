// Format currency — supports multi-currency (USD, EGP, AED)
export const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

/**
 * Format a number as currency for the given market currency code.
 * - USD  → $1,234.56
 * - EGP  → EGP 1,234.56
 * - AED  → AED 1,234.56
 */
export const formatCurrencyForMarket = (value: number, currency: string): string => {
    if (!currency || currency === 'USD') return formatCurrency(value);
    try {
        // EGP and AED use Latin numerals with 2 decimal places
        const formatted = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            // currencyDisplay: 'symbol' gives '£', 'د.إ' — we override with plain code below
            currencyDisplay: 'code',
        }).format(value);
        // "EGP 1,234.56" is already correct — just trim extra spaces
        return formatted.trim();
    } catch {
        // Fallback: manual prefix
        const abs = Math.abs(value);
        const sign = value < 0 ? '-' : '';
        const num = abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return `${sign}${currency} ${num}`;
    }
};

// Format percentage
export const formatPercent = (value: number, decimals: number = 2): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
};

// Format large numbers with abbreviations
export const formatNumber = (value: number): string => {
    if (value >= 1e12) {
        return `$${(value / 1e12).toFixed(2)}T`;
    }
    if (value >= 1e9) {
        return `$${(value / 1e9).toFixed(2)}B`;
    }
    if (value >= 1e6) {
        return `$${(value / 1e6).toFixed(2)}M`;
    }
    if (value >= 1e3) {
        return `$${(value / 1e3).toFixed(2)}K`;
    }
    return formatCurrency(value);
};

// Format regular numbers (non-currency)
export const formatNumberPlain = (value: number): string => {
    if (value >= 1e9) {
        return `${(value / 1e9).toFixed(2)}B`;
    }
    if (value >= 1e6) {
        return `${(value / 1e6).toFixed(2)}M`;
    }
    if (value >= 1e3) {
        return `${(value / 1e3).toFixed(2)}K`;
    }
    return value.toLocaleString('en-US');
};

// Format date
export const formatDate = (date: Date | number): string => {
    const d = typeof date === 'number' ? new Date(date * 1000) : date;
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(d);
};

// Format time ago
export const formatTimeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
};

// Get change indicator class
export const getChangeClass = (value: number): string => {
    if (value > 0) return 'positive';
    if (value < 0) return 'negative';
    return 'neutral';
};
