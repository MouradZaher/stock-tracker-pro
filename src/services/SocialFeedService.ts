import type { SocialPost } from '../types';

const MOCK_SOCIAL_POSTS: SocialPost[] = [
    {
        id: '1',
        author: 'Whale Alerts',
        handle: '@unusual_whales',
        content: 'Massive $AAPL call volume detected. 10k contracts for $230 strike expiring Friday.',
        timestamp: new Date().toISOString(),
        sentiment: 'positive',
        weight: 9,
        symbol: 'AAPL',
        isVerified: true
    },
    {
        id: '2',
        author: 'Macro Jack',
        handle: '@macrojack88',
        content: 'Fed minutes looking more hawkish than expected. Inflation sticky. Expecting $SPY to test 490 support.',
        timestamp: new Date().toISOString(),
        sentiment: 'negative',
        weight: 7,
        symbol: 'SPY',
        isVerified: true
    },
    {
        id: '3',
        author: 'Tech Sentinel',
        handle: '@tech_alpha',
        content: '$NVDA Blackwell supply chain reports look incredible. Capex spending from hyperscalers accelerating.',
        timestamp: new Date().toISOString(),
        sentiment: 'positive',
        weight: 8,
        symbol: 'NVDA',
        isVerified: false
    },
    {
        id: '4',
        author: 'Market Pulse',
        handle: '@mkt_intelligence',
        content: 'Institutional bids sitting heavy at 5100 on S&P. Buy the dip crowd is active.',
        timestamp: new Date().toISOString(),
        sentiment: 'positive',
        weight: 6,
        isVerified: true
    }
];

class SocialFeedService {
    private posts: SocialPost[] = [...MOCK_SOCIAL_POSTS];

    async getGlobalFeed(): Promise<SocialPost[]> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return this.posts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    async getSymbolFeed(symbol: string): Promise<SocialPost[]> {
        await new Promise(resolve => setTimeout(resolve, 300));
        return this.posts.filter(p => p.symbol === symbol);
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

    // Real-time simulation: Add a new post every few minutes
    generateLivePost(symbol?: string): SocialPost {
        const symbols = ['TSLA', 'MSFT', 'META', 'GOOGL', 'AMZN'];
        const activeSymbol = symbol || symbols[Math.floor(Math.random() * symbols.length)];
        const sentiments: ('positive' | 'negative' | 'neutral')[] = ['positive', 'negative', 'neutral'];
        const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];

        const newPost: SocialPost = {
            id: Math.random().toString(36).substr(2, 9),
            author: 'AI Sentiment Bot',
            handle: '@ai_quant_pulse',
            content: `Detected unusual social volume for $${activeSymbol}. Sentiment is trending ${sentiment}.`,
            timestamp: new Date().toISOString(),
            sentiment,
            weight: Math.floor(Math.random() * 5) + 3,
            symbol: activeSymbol,
            isVerified: false
        };

        this.posts.unshift(newPost);
        if (this.posts.length > 50) this.posts.pop();
        return newPost;
    }
}

export const socialFeedService = new SocialFeedService();
