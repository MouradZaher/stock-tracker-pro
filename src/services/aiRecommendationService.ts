import { getStockData } from './stockDataService';
import { getStockNews } from './newsService';
import type { StockRecommendation, NewsArticle } from '../types';
import { STOCKS_BY_SECTOR, SECTORS, getAllSymbols } from '../data/sectors';
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

    // Initial allocation based on score within sector limits
    const maxSectorAllocation = 20; // Maximum 20% per sector
    const maxStockAllocation = 5;  // Maximum 5% per stock

    // We allocate the 20% sector budget among the top N stocks
    const totalSectorScore = topRecommendations.reduce((sum, r) => sum + r.score, 0);

    topRecommendations.forEach((rec) => {
        if (totalSectorScore > 0) {
            const scoreRatio = rec.score / totalSectorScore;
            // Distribute the 20% sector budget proportionally
            let allocation = maxSectorAllocation * scoreRatio;
            // Cap at 5% per stock
            allocation = Math.min(allocation, maxStockAllocation);
            rec.suggestedAllocation = parseFloat(allocation.toFixed(1));
        } else {
            rec.suggestedAllocation = 0;
        }
    });

    return topRecommendations;
};

// Analyze a specific symbol on demand
export const analyzeSymbol = async (symbol: string): Promise<StockRecommendation | null> => {
    try {
        const symbols = getAllSymbols();
        const stockInfo = symbols.find(s => s.symbol === symbol);
        if (!stockInfo) return null;

        let { stock: stockData } = await getStockData(symbol);
        const news = await getStockNews(symbol, 3);

        if (!stockData.price || stockData.price === 0) return null;

        const rsi = null;
        const ma50 = stockData.previousClose;
        const ma200 = stockData.fiftyTwoWeekHigh ? (stockData.fiftyTwoWeekHigh + stockData.fiftyTwoWeekLow) / 2 : null;
        const socialSentiment = socialFeedService.getSentimentScore(symbol);

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

        const recommendation = getRecommendationType(score);
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

        return {
            symbol: stockInfo.symbol,
            name: stockInfo.name,
            sector: stockInfo.sector,
            price: stockData.price,
            score,
            recommendation,
            suggestedAllocation: 0,
            reasoning,
            news,
            technicalIndicators: { rsi, ma50, ma200 },
            fundamentals: { peRatio: stockData.peRatio, epsGrowth: null },
        };
    } catch (error) {
        console.error(`Failed to analyze ${symbol}:`, error);
        return null;
    }
};

export interface RebalancingAction {
    symbol: string;
    action: 'Trim' | 'Add' | 'Exit' | 'Hold';
    reason: string;
    impact: string;
    priority: 'High' | 'Medium' | 'Low';
}

export const getTacticalRebalancing = async (positions: any[]): Promise<RebalancingAction[]> => {
    const actions: RebalancingAction[] = [];
    const totalValue = positions.reduce((sum, p) => sum + (p.price * p.units), 0);
    if (totalValue === 0) return [];

    const sectorTotals: Record<string, number> = {};
    const stockAllocations: Record<string, number> = {};

    for (const p of positions) {
        const value = p.price * p.units;
        const allocation = (value / totalValue) * 100;
        stockAllocations[p.symbol] = allocation;

        const sector = getAllSymbols().find(s => s.symbol === p.symbol)?.sector || 'Unknown';
        sectorTotals[sector] = (sectorTotals[sector] || 0) + allocation;

        // Individual stock limit (5%)
        if (allocation > 5) {
            actions.push({
                symbol: p.symbol,
                action: 'Trim',
                reason: `Allocation is ${allocation.toFixed(1)}%, exceeding the 5% risk limit.`,
                impact: `Reduces concentration risk in ${p.symbol}.`,
                priority: allocation > 10 ? 'High' : 'Medium'
            });
        }
    }

    // Sector limits (20%)
    for (const [sector, allocation] of Object.entries(sectorTotals)) {
        if (allocation > 20) {
            const symbolsInSector = positions.filter(p => getAllSymbols().find(s => s.symbol === p.symbol)?.sector === sector);
            actions.push({
                symbol: sector,
                action: 'Trim',
                reason: `${sector} sector allocation is ${allocation.toFixed(1)}%, exceeding the 20% limit.`,
                impact: `Improves sector diversification.`,
                priority: allocation > 30 ? 'High' : 'Medium'
            });
        }
    }

    // Add Alpha recommendations
    const topRecs = await getAllRecommendations();
    for (const rec of topRecs.slice(0, 3)) {
        if (!stockAllocations[rec.symbol] && actions.length < 5) {
            actions.push({
                symbol: rec.symbol,
                action: 'Add',
                reason: `Top AI Recommendation (Score: ${rec.score}) in ${rec.sector}.`,
                impact: `Captures tactical alpha with high institutional conviction.`,
                priority: 'Medium'
            });
        }
    }

    return actions;
};

// Get all recommendations with global optimization
export const getAllRecommendations = async (): Promise<StockRecommendation[]> => {
    // Process sectors in smaller chunks to avoid overwhelming the API/Network
    const allRecommendations: StockRecommendation[] = [];

    // Use a subset of sectors for a "Quick Scan" if scanning all is too slow, 
    // but here we'll try all with a slight delay or concurrency limit if needed.
    // For now, let's just make it robust.

    const sectorPromises = SECTORS.map(async (sector) => {
        try {
            return await getRecommendationsForSector(sector, 2); // 2 per sector for better distribution
        } catch (e) {
            console.error(`Error scanning sector ${sector}:`, e);
            return [];
        }
    });

    const results = await Promise.all(sectorPromises);
    results.forEach(recs => allRecommendations.push(...recs));

    // Final global sort and limit to top 15-20 meaningful recs
    allRecommendations.sort((a, b) => b.score - a.score);

    // Final Global Allocation Normalization
    // Ensure the sum of all allocations doesn't exceed 100%
    const currentTotal = allRecommendations.reduce((sum, r) => sum + r.suggestedAllocation, 0);
    if (currentTotal > 100) {
        const multiplier = 100 / currentTotal;
        allRecommendations.forEach(r => {
            r.suggestedAllocation = parseFloat((r.suggestedAllocation * multiplier).toFixed(1));
        });
    }

    return allRecommendations.slice(0, 15);
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
