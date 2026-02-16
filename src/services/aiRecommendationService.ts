import { getStockData } from './stockDataService';
import { getStockNews } from './newsService';
import type { StockRecommendation, NewsArticle } from '../types';
import { STOCKS_BY_SECTOR, SECTORS } from '../data/sectors';
import { calculateRSI, calculateSMA } from '../utils/calculations';
import { socialFeedService } from './SocialFeedService';

// Generate recommendations for a sector
export const getRecommendationsForSector = async (
    sector: string,
    topN: number = 3
): Promise<StockRecommendation[]> => {
    const stocksInSector = STOCKS_BY_SECTOR[sector] || [];
    if (stocksInSector.length === 0) return [];

    const recommendations: StockRecommendation[] = [];

    for (const stock of stocksInSector.slice(0, Math.min(10, stocksInSector.length))) {
        try {
            let { stock: stockData } = await getStockData(stock.symbol);
            const news = await getStockNews(stock.symbol, 3);

            if (!stockData.price || stockData.price === 0) {
                continue; // Skip stocks without real price data
            }

            // Technical indicators - Use real data points if available
            // Note: Since we don't have full history, we use real comparative metrics
            const rsi = null; // RSI requires volume/price history series
            const ma50 = stockData.previousClose; // Use prev close as a proxy for very short-term MA
            const ma200 = stockData.fiftyTwoWeekHigh ? (stockData.fiftyTwoWeekHigh + stockData.fiftyTwoWeekLow) / 2 : null;

            // Get social sentiment
            const socialSentiment = socialFeedService.getSentimentScore(stock.symbol);

            // Calculate score
            const score = calculateRecommendationScore({
                price: stockData.price,
                change: stockData.change,
                changePercent: stockData.changePercent,
                rsi,
                ma50,
                ma200,
                peRatio: stockData.peRatio,
                eps: stockData.eps,
                news,
                socialSentiment,
            });

            // Determine recommendation
            const recommendation = getRecommendationType(score);

            // Generate reasoning
            const reasoning = generateReasoning({
                score,
                rsi,
                ma50,
                ma200,
                price: stockData.price,
                peRatio: stockData.peRatio,
                changePercent: stockData.changePercent,
                news,
                socialSentiment,
            });

            recommendations.push({
                symbol: stock.symbol,
                name: stock.name,
                sector,
                price: stockData.price,
                score,
                recommendation,
                suggestedAllocation: 0, // Will be calculated later
                reasoning,
                news,
                technicalIndicators: {
                    rsi,
                    ma50,
                    ma200,
                },
                fundamentals: {
                    peRatio: stockData.peRatio,
                    epsGrowth: null, // Would need historical data
                },
            });
        } catch (error) {
            console.error(`Failed to get recommendation for ${stock.symbol}:`, error);
        }
    }

    // Sort by score and take top N
    recommendations.sort((a, b) => b.score - a.score);
    const topRecommendations = recommendations.slice(0, topN);

    // Calculate suggested allocations (within 5% per stock, 20% per sector limits)
    const sectorAllocation = 20; // Maximum 20% per sector
    const maxStockAllocation = 5; // Maximum 5% per stock
    const totalScore = topRecommendations.reduce((sum, r) => sum + r.score, 0);

    topRecommendations.forEach((rec) => {
        const scoreRatio = rec.score / totalScore;
        let allocation = sectorAllocation * scoreRatio;

        // Cap at 5% per stock
        allocation = Math.min(allocation, maxStockAllocation);

        rec.suggestedAllocation = parseFloat(allocation.toFixed(2));
    });

    return topRecommendations;
};

// Get all recommendations
export const getAllRecommendations = async (): Promise<StockRecommendation[]> => {
    const allRecommendations: StockRecommendation[] = [];

    for (const sector of SECTORS) {
        const sectorRecs = await getRecommendationsForSector(sector, 3);
        allRecommendations.push(...sectorRecs);
    }

    return allRecommendations;
};

// Generate mock price history (DEPRECATED - Returning empty to ensure no fake data)
const generateMockPriceHistory = (currentPrice: number): number[] => {
    return [currentPrice];
};

// Calculate recommendation score (0-100)
const calculateRecommendationScore = (params: {
    price: number;
    change: number;
    changePercent: number;
    rsi: number | null;
    ma50: number | null;
    ma200: number | null;
    peRatio: number | null;
    eps: number | null;
    news: NewsArticle[];
    socialSentiment: number;
}): number => {
    let score = 50; // Base score

    // Technical analysis (40 points max)
    if (params.rsi !== null) {
        // RSI between 30-70 is ideal
        if (params.rsi >= 30 && params.rsi <= 70) {
            score += 10;
        } else if (params.rsi < 30) {
            score += 15; // Oversold, potential buy
        } else if (params.rsi > 70) {
            score -= 10; // Overbought
        }
    }

    if (params.ma50 !== null && params.ma200 !== null) {
        // Golden cross (MA50 > MA200) is bullish
        if (params.ma50 > params.ma200 && params.price > params.ma50) {
            score += 15;
        } else if (params.price > params.ma50) {
            score += 10;
        } else if (params.price < params.ma200) {
            score -= 10;
        }
    }

    // Momentum (15 points)
    if (params.changePercent > 2) {
        score += 10;
    } else if (params.changePercent > 0) {
        score += 5;
    } else if (params.changePercent < -2) {
        score -= 10;
    }

    // Fundamentals (20 points max)
    if (params.peRatio !== null && params.peRatio > 0) {
        // PE ratio between 15-25 is generally healthy
        if (params.peRatio >= 10 && params.peRatio <= 25) {
            score += 15;
        } else if (params.peRatio < 10) {
            score += 10; // Undervalued
        } else if (params.peRatio > 40) {
            score -= 10; // Overvalued
        }
    }

    // News sentiment (25 points max)
    const positiveNews = params.news.filter((n) => n.sentiment === 'positive').length;
    const negativeNews = params.news.filter((n) => n.sentiment === 'negative').length;
    score += positiveNews * 8;
    score -= negativeNews * 8;

    // Social Pulse (15 points max)
    // socialSentiment is -100 to 100
    score += (params.socialSentiment / 100) * 15;

    // Clamp between 0-100
    return Math.max(0, Math.min(100, score));
};

// Determine recommendation type
const getRecommendationType = (
    score: number
): 'Buy' | 'Hold' | 'Sell' => {
    if (score >= 75) return 'Buy';
    if (score >= 50) return 'Hold';
    return 'Sell';
};

// Generate reasoning
const generateReasoning = (params: {
    score: number;
    rsi: number | null;
    ma50: number | null;
    ma200: number | null;
    price: number;
    peRatio: number | null;
    changePercent: number;
    news: NewsArticle[];
    socialSentiment: number;
}): string[] => {
    const reasons: string[] = [];

    // Technical reasons
    if (params.rsi !== null) {
        if (params.rsi < 30) {
            reasons.push(`RSI at ${params.rsi.toFixed(1)} indicates oversold conditions, potential buying opportunity`);
        } else if (params.rsi > 70) {
            reasons.push(`RSI at ${params.rsi.toFixed(1)} suggests overbought conditions, exercise caution`);
        } else {
            reasons.push(`RSI at ${params.rsi.toFixed(1)} shows neutral momentum`);
        }
    }

    if (params.ma50 !== null && params.ma200 !== null) {
        if (params.ma50 > params.ma200) {
            reasons.push(`Bullish trend: 50-day MA above 200-day MA (golden cross)`);
        } else {
            reasons.push(`Bearish trend: 50-day MA below 200-day MA`);
        }
    }

    // Momentum
    if (params.changePercent > 2) {
        reasons.push(`Strong positive momentum with ${params.changePercent.toFixed(2)}% recent gain`);
    } else if (params.changePercent < -2) {
        reasons.push(`Negative momentum with ${params.changePercent.toFixed(2)}% recent decline`);
    }

    // Fundamentals
    if (params.peRatio !== null && params.peRatio > 0) {
        if (params.peRatio < 15) {
            reasons.push(`P/E ratio of ${params.peRatio.toFixed(2)} suggests potential undervaluation`);
        } else if (params.peRatio > 30) {
            reasons.push(`High P/E ratio of ${params.peRatio.toFixed(2)} indicates premium valuation`);
        }
    }

    // News sentiment
    const positiveNews = params.news.filter((n) => n.sentiment === 'positive').length;
    const negativeNews = params.news.filter((n) => n.sentiment === 'negative').length;

    if (positiveNews > negativeNews) {
        reasons.push(`Positive news sentiment with ${positiveNews} favorable headlines`);
    } else if (negativeNews > positiveNews) {
        reasons.push(`Negative news sentiment with ${negativeNews} concerning headlines`);
    }

    // Social insight
    if (params.socialSentiment > 30) {
        reasons.push(`High institutional social volume (X Pulse) indicates strong bullish accumulation`);
    } else if (params.socialSentiment < -30) {
        reasons.push(`Negative social divergence detected; high volume of bearish sentiment on X`);
    }

    // Overall score reasoning
    if (params.score >= 75) {
        reasons.push(`Strong overall score of ${params.score}/100 across technical and fundamental metrics`);
    } else if (params.score < 50) {
        reasons.push(`Weak overall score of ${params.score}/100 suggests heightened risk`);
    }

    return reasons;
};
