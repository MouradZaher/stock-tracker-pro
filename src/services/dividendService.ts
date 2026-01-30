import type { Dividend } from '../types';

// Enhanced mock dividend generator
const generateMockDividends = (symbol: string): Dividend[] => {
    // Use symbol as seed for consistent data
    const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const random = (s: number) => {
        const x = Math.sin(s++) * 10000;
        return x - Math.floor(x);
    };

    const baseAmount = 0.5 + random(seed) * 2;
    const dividends: Dividend[] = [];

    // Past dividends (quarterly)
    for (let i = 1; i <= 4; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - (i * 3));
        dividends.push({
            exDate: date.toISOString().split('T')[0],
            paymentDate: new Date(date.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            amount: parseFloat((baseAmount * (1 + (random(seed + i) - 0.5) * 0.1)).toFixed(2)),
            type: 'past',
        });
    }

    // Upcoming dividend
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + 1);
    dividends.unshift({
        exDate: nextDate.toISOString().split('T')[0],
        paymentDate: new Date(nextDate.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: parseFloat(baseAmount.toFixed(2)),
        type: 'upcoming',
    });

    return dividends;
};

// Get dividends (using enhanced mock data)
export const getDividends = async (symbol: string): Promise<Dividend[]> => {
    console.log(`💰 Generating dividend data for ${symbol}...`);

    // Return mock dividends
    return generateMockDividends(symbol);
};

