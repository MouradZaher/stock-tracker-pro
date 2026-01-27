// Format currency in USD
export const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
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
