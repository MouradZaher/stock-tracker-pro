// Calculate profit/loss
export const calculateProfitLoss = (
    currentPrice: number,
    avgCost: number,
    units: number
): { amount: number; percent: number } => {
    const purchaseValue = avgCost * units;
    const marketValue = currentPrice * units;
    const amount = marketValue - purchaseValue;
    const percent = purchaseValue > 0 ? (amount / purchaseValue) * 100 : 0;

    return { amount, percent };
};

// Calculate Simple Moving Average
export const calculateSMA = (prices: number[], period: number): number | null => {
    if (prices.length < period) return null;
    const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
};

// Calculate RSI (Relative Strength Index)
export const calculateRSI = (prices: number[], period: number = 14): number | null => {
    if (prices.length < period + 1) return null;

    const changes = [];
    for (let i = 1; i < prices.length; i++) {
        changes.push(prices[i] - prices[i - 1]);
    }

    const gains = changes.slice(-period).map(c => c > 0 ? c : 0);
    const losses = changes.slice(-period).map(c => c < 0 ? Math.abs(c) : 0);

    const avgGain = gains.reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.reduce((a, b) => a + b, 0) / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    return rsi;
};

// Calculate allocation percentage
export const calculateAllocation = (value: number, totalValue: number): number => {
    if (totalValue === 0) return 0;
    return (value / totalValue) * 100;
};

// Check if allocation exceeds limits
export const checkAllocationLimits = (
    allocation: number,
    type: 'stock' | 'sector'
): { valid: boolean; limit: number } => {
    const limit = type === 'stock' ? 5 : 20;
    return {
        valid: allocation <= limit,
        limit,
    };
};

// Calculate portfolio returns
export const calculateReturns = (
    currentValue: number,
    initialValue: number,
    // period: 'day' | 'month' | 'year' // future use
): number => {
    if (initialValue === 0) return 0;
    return ((currentValue - initialValue) / initialValue) * 100;
};
