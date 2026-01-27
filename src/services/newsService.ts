import { finnhubApi, hasAPIKeys } from './api';
import type { NewsArticle } from '../types';

// Mock news generator
const generateMockNews = (symbol: string): NewsArticle[] => {
    const headlines = [
        `${symbol} Reports Strong Quarterly Earnings`,
        `Analysts Upgrade ${symbol} Price Target`,
        `${symbol} Announces New Product Launch`,
        `Market Outlook: ${symbol} Shows Promising Growth`,
        `${symbol} Expands Into New Markets`,
    ];

    const sentiments: Array<'positive' | 'neutral' | 'negative'> = ['positive', 'neutral', 'negative'];

    return headlines.map((headline, index) => ({
        id: `mock-${symbol}-${index}`,
        headline,
        summary: `Recent developments show ${symbol} continues to perform in the market with various strategic initiatives.`,
        source: 'Market News',
        url: '#',
        datetime: Math.floor(Date.now() / 1000) - index * 86400,
        image: null,
        sentiment: sentiments[index % 3],
    }));
};

// Get news from Finnhub
export const getStockNews = async (symbol: string, limit: number = 5): Promise<NewsArticle[]> => {
    const apiKeys = hasAPIKeys();

    if (apiKeys.finnhub) {
        try {
            const toDate = new Date();
            const fromDate = new Date();
            fromDate.setDate(fromDate.getDate() - 7);

            const response = await finnhubApi.get('/company-news', {
                params: {
                    symbol,
                    from: fromDate.toISOString().split('T')[0],
                    to: toDate.toISOString().split('T')[0],
                },
            });

            if (response.data && response.data.length > 0) {
                return response.data.slice(0, limit).map((article: any) => ({
                    id: `${article.id}`,
                    headline: article.headline,
                    summary: article.summary || article.headline,
                    source: article.source,
                    url: article.url,
                    datetime: article.datetime,
                    image: article.image,
                    sentiment: analyzeSentiment(article.headline + ' ' + article.summary),
                }));
            }
        } catch (error) {
            console.warn('Finnhub news failed:', error);
        }
    }

    // Fallback to mock news
    return generateMockNews(symbol).slice(0, limit);
};

// Simple sentiment analysis based on keywords
const analyzeSentiment = (text: string): 'positive' | 'neutral' | 'negative' => {
    const lowerText = text.toLowerCase();

    const positiveKeywords = ['growth', 'profit', 'record', 'beat', 'upgrade', 'strong', 'success', 'gain', 'rise', 'high'];
    const negativeKeywords = ['loss', 'decline', 'fall', 'downgrade', 'weak', 'miss', 'concern', 'risk', 'drop', 'low'];

    let score = 0;
    positiveKeywords.forEach(keyword => {
        if (lowerText.includes(keyword)) score += 1;
    });
    negativeKeywords.forEach(keyword => {
        if (lowerText.includes(keyword)) score -= 1;
    });

    if (score > 0) return 'positive';
    if (score < 0) return 'negative';
    return 'neutral';
};
