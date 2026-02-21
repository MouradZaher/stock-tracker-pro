import type { SocialPost } from '../types';
import { getStockNews } from './newsService';

class SocialFeedService {
    private posts: SocialPost[] = [];

    async getGlobalFeed(): Promise<SocialPost[]> {
        try {
            // Fetch real breaking news from major indices/sectors
            const symbols = ['SPY', 'QQQ', 'NVDA', 'AAPL', 'TSLA', 'BTC-USD'];
            const newsPromises = symbols.map(s => getStockNews(s, 2));
            const newsArrays = await Promise.all(newsPromises);
            const allNews = newsArrays.flat();

            // Transform news into SocialPosts
            this.posts = allNews.map((n, i) => ({
                id: n.id || `news-${i}`,
                author: n.source,
                handle: `@${n.source.toLowerCase().replace(/\s+/g, '_')}`,
                content: n.headline,
                timestamp: new Date(n.datetime * 1000).toISOString(),
                sentiment: n.sentiment,
                weight: Math.floor(Math.random() * 3) + 7, // High weight for real news
                symbol: this.extractSymbol(n.headline, symbols),
                url: n.url,
                isVerified: true
            }));

            return this.posts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        } catch (error) {
            console.warn('Failed to fetch real social feed, returning empty:', error);
            return [];
        }
    }

    private extractSymbol(text: string, symbols: string[]): string | undefined {
        for (const symbol of symbols) {
            if (text.includes(symbol)) return symbol;
        }
        return undefined;
    }

    async getSymbolFeed(symbol: string): Promise<SocialPost[]> {
        const news = await getStockNews(symbol, 5);
        return news.map(n => ({
            id: n.id,
            author: n.source,
            handle: `@${n.source.toLowerCase().replace(/\s+/g, '_')}`,
            content: n.headline,
            timestamp: new Date(n.datetime * 1000).toISOString(),
            sentiment: n.sentiment,
            weight: 8,
            symbol: symbol,
            url: n.url,
            isVerified: true
        }));
    }

    getSentimentScore(symbol: string): number {
        const symbolPosts = this.posts.filter(p => p.symbol === symbol);
        if (symbolPosts.length === 0) return 0;

        const totalWeight = symbolPosts.reduce((acc, p) => acc + p.weight, 0);
        const sentimentSum = symbolPosts.reduce((acc, p) => {
            const multiplier = p.sentiment === 'positive' ? 1 : p.sentiment === 'negative' ? -1 : 0;
            return acc + (p.weight * multiplier);
        }, 0);

        return (sentimentSum / totalWeight) * 100; // -100 to 100
    }

    getGlobalSentiment(): { score: number; label: string; count: number } {
        if (this.posts.length === 0) return { score: 0, label: 'Neutral', count: 0 };

        const totalWeight = this.posts.reduce((acc, p) => acc + p.weight, 0);
        const sentimentSum = this.posts.reduce((acc, p) => {
            const multiplier = p.sentiment === 'positive' ? 1 : p.sentiment === 'negative' ? -1 : 0;
            return acc + (p.weight * multiplier);
        }, 0);

        const score = (sentimentSum / totalWeight) * 100;
        let label = 'Neutral';
        if (score > 20) label = 'Bullish';
        if (score > 50) label = 'Strong Bullish';
        if (score < -20) label = 'Bearish';
        if (score < -50) label = 'Strong Bearish';

        return { score, label, count: this.posts.length };
    }

    // Transform a real piece of news into a "live" post pulse
    async generateLivePost(symbol?: string): Promise<SocialPost | null> {
        const targetSymbol = symbol || ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'META'][Math.floor(Math.random() * 5)];
        const news = await getStockNews(targetSymbol, 1);

        if (news.length === 0) return null;
        const n = news[0];

        const newPost: SocialPost = {
            id: n.id,
            author: n.source,
            handle: `@${n.source.toLowerCase().replace(/\s+/g, '_')}`,
            content: n.headline,
            timestamp: new Date().toISOString(),
            sentiment: n.sentiment,
            weight: 9,
            symbol: targetSymbol,
            url: n.url,
            isVerified: true
        };

        this.posts.unshift(newPost);
        if (this.posts.length > 50) this.posts.pop();
        return newPost;
    }
}

export const socialFeedService = new SocialFeedService();
