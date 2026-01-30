import type { NewsArticle } from '../types';

// Enhanced mock news generator with more variety
const generateMockNews = (symbol: string): NewsArticle[] => {
    // Use symbol and date as seed for consistent but varied results
    const now = Date.now();
    const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    const newsTemplates = [
        { headline: `${symbol} Reports Strong Quarterly Earnings Beat`, sentiment: 'positive' as const },
        { headline: `Analysts Raise ${symbol} Price Target on Growth Prospects`, sentiment: 'positive' as const },
        { headline: `${symbol} Announces Strategic Partnership and Product Launch`, sentiment: 'positive' as const },
        { headline: `Market Outlook: ${symbol} Shows Promising Long-term Growth`, sentiment: 'positive' as const },
        { headline: `${symbol} Expands Into Emerging Markets with New Initiative`, sentiment: 'positive' as const },
        { headline: `${symbol} CEO Discusses Future Strategy in Investor Call`, sentiment: 'neutral' as const },
        { headline: `Financial Review: ${symbol} Maintains Steady Performance`, sentiment: 'neutral' as const },
        { headline: `${symbol} Announces Dividend and Share Buyback Program`, sentiment: 'positive' as const },
        { headline: `Industry Trends: How ${symbol} is Positioning for Success`, sentiment: 'neutral' as const },
        { headline: `${symbol} Invests in Technology and Innovation`, sentiment: 'positive' as const },
    ];

    const sources = ['Reuters', 'Bloomberg', 'CNBC', 'MarketWatch', 'Financial Times', 'WSJ'];

    // Rotate through templates based on seed
    return newsTemplates.slice(0, 8).map((template, index) => {
        const daysAgo = index;
        const sourceIndex = (seed + index) % sources.length;

        return {
            id: `mock-${symbol}-${index}`,
            headline: template.headline,
            summary: `${template.headline}. Industry analysts and market observers are monitoring ${symbol}'s performance and strategic initiatives as the company continues to navigate market conditions.`,
            source: sources[sourceIndex],
            url: '#',
            datetime: Math.floor((now - daysAgo * 86400000) / 1000),
            image: null,
            sentiment: template.sentiment,
        };
    });
};

// Get stock news (using enhanced mock data)
export const getStockNews = async (symbol: string, limit: number = 5): Promise<NewsArticle[]> => {
    console.log(`📰 Generating news for ${symbol}...`);

    // Return enhanced mock news
    return generateMockNews(symbol).slice(0, limit);
};

