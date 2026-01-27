import { alphaVantageApi, hasAPIKeys } from './api';
import type { Dividend } from '../types';

// Mock dividend generator
const generateMockDividends = (_symbol: string): Dividend[] => {
    const baseAmount = 0.5 + Math.random() * 2;
    const dividends: Dividend[] = [];

    // Past dividends (quarterly)
    for (let i = 1; i <= 4; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - (i * 3));
        dividends.push({
            exDate: date.toISOString().split('T')[0],
            paymentDate: new Date(date.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            amount: baseAmount * (1 + (Math.random() - 0.5) * 0.1),
            type: 'past',
        });
    }

    // Upcoming dividend
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + 1);
    dividends.unshift({
        exDate: nextDate.toISOString().split('T')[0],
        paymentDate: new Date(nextDate.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: baseAmount,
        type: 'upcoming',
    });

    return dividends;
};

// Get dividends from Alpha Vantage
export const getDividends = async (symbol: string): Promise<Dividend[]> => {
    const apiKeys = hasAPIKeys();

    if (apiKeys.alphaVantage) {
        try {
            const response = await alphaVantageApi.get('/query', {
                params: {
                    function: 'TIME_SERIES_MONTHLY_ADJUSTED',
                    symbol,
                },
            });

            if (response.data && response.data['Monthly Adjusted Time Series']) {
                const timeSeries = response.data['Monthly Adjusted Time Series'];
                const dividends: Dividend[] = [];
                const now = new Date();

                Object.entries(timeSeries).forEach(([date, data]: [string, any]) => {
                    const divAmount = parseFloat(data['7. dividend amount']);
                    if (divAmount > 0) {
                        const divDate = new Date(date);
                        const isPast = divDate < now;

                        dividends.push({
                            exDate: date,
                            paymentDate: new Date(divDate.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                            amount: divAmount,
                            type: isPast ? 'past' : 'upcoming',
                        });
                    }
                });

                if (dividends.length > 0) {
                    return dividends.slice(0, 10);
                }
            }
        } catch (error) {
            console.warn('Alpha Vantage dividends failed:', error);
        }
    }

    // Fallback to mock dividends
    return generateMockDividends(symbol);
};
