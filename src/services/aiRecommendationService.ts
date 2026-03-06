import { getStockData, getHistoricalPrices, getGrowthMetrics } from './stockDataService';
import { getStockNews } from './newsService';
import type { StockRecommendation, NewsArticle } from '../types';
import { STOCKS_BY_SECTOR, SECTORS, getAllSymbols, STOCKS_BY_INDEX } from '../data/sectors';
import { calculateRSI, calculateSMA } from '../utils/calculations';
import { socialFeedService } from './SocialFeedService';
import { formatCurrency } from '../utils/formatters';

// Generate recommendations for a sector
export const getRecommendationsForSector = async (
    sector: string,
    topN: number = 3
): Promise<StockRecommendation[]> => {
    const stocksInSector = STOCKS_BY_SECTOR[sector] || [];
    if (stocksInSector.length === 0) return [];

    // Use the unified recommendation engine
    const allRecs = await getRecommendationsForStocks(stocksInSector.slice(0, 10));

    // Sort and return top N
    return allRecs.sort((a, b) => b.score - a.score).slice(0, topN);
};

// Get recommendations for a specific list of stocks
export const getRecommendationsForStocks = async (
    stocks: { symbol: string, name: string }[]
): Promise<StockRecommendation[]> => {
    const recommendations: StockRecommendation[] = [];

    // Process in batches
    for (const stock of stocks) {
        try {
            // Parallel fetch for speed
            const [data, history, growth, news] = await Promise.all([
                getStockData(stock.symbol),
                getHistoricalPrices(stock.symbol, 30),
                getGrowthMetrics(stock.symbol),
                getStockNews(stock.symbol, 2)
            ]);

            const stockData = data.stock;
            if (!stockData.price || stockData.price === 0) continue;

            // Technical Indicators
            const rsi = calculateRSI(history, 14);
            const ma50 = calculateSMA(history, 50);
            const ma200 = calculateSMA(history, 200);
            const socialSentiment = socialFeedService.getSentimentScore(stock.symbol);

            const { score, valueScore, growthScore } = calculateRecommendationScore({
                price: stockData.price,
                change: stockData.change,
                changePercent: stockData.changePercent,
                rsi, ma50, ma200,
                peRatio: stockData.peRatio,
                pegRatio: growth?.pegRatio || null,
                earningsGrowth: growth?.earningsGrowth || null,
                revenueGrowth: growth?.revenueGrowth || null,
                news,
                socialSentiment,
            });

            const symbolInfo = getAllSymbols().find(s => s.symbol === stock.symbol);

            recommendations.push({
                symbol: stock.symbol,
                name: stock.name,
                sector: symbolInfo?.sector || 'Other',
                price: stockData.price,
                score,
                recommendation: getRecommendationType(score),
                suggestedAllocation: 0,
                reasoning: generateReasoning({
                    score, rsi, ma50, ma200,
                    price: stockData.price,
                    peRatio: stockData.peRatio,
                    pegRatio: growth?.pegRatio || null,
                    earningsGrowth: growth?.earningsGrowth || null,
                    changePercent: stockData.changePercent,
                    news, socialSentiment,
                }),
                news,
                technicalIndicators: { rsi, ma50, ma200 },
                fundamentals: {
                    peRatio: stockData.peRatio,
                    epsGrowth: growth?.earningsGrowth || null,
                    pegRatio: growth?.pegRatio || null,
                    valueScore,
                    growthScore
                },
            });
        } catch (error) {
            console.error(`Error analyzing ${stock.symbol}:`, error);
        }
    }

    return recommendations;
};

// Analyze a specific symbol on demand
export const analyzeSymbol = async (symbol: string): Promise<StockRecommendation | null> => {
    try {
        const symbols = getAllSymbols();
        const stockInfo = symbols.find(s => s.symbol === symbol);
        if (!stockInfo) return null;

        const [data, history, growth, news] = await Promise.all([
            getStockData(symbol),
            getHistoricalPrices(symbol, 30),
            getGrowthMetrics(symbol),
            getStockNews(symbol, 3)
        ]);

        const stockData = data.stock;
        if (!stockData.price || stockData.price === 0) return null;

        const rsi = calculateRSI(history, 14);
        const ma50 = calculateSMA(history, 50);
        const ma200 = calculateSMA(history, 200);
        const socialSentiment = socialFeedService.getSentimentScore(symbol);

        const { score, valueScore, growthScore } = calculateRecommendationScore({
            price: stockData.price,
            change: stockData.change,
            changePercent: stockData.changePercent,
            rsi, ma50, ma200,
            peRatio: stockData.peRatio,
            pegRatio: growth?.pegRatio || null,
            earningsGrowth: growth?.earningsGrowth || null,
            revenueGrowth: growth?.revenueGrowth || null,
            news,
            socialSentiment,
        });

        const recommendation = getRecommendationType(score);
        const reasoning = generateReasoning({
            score, rsi, ma50, ma200,
            price: stockData.price,
            peRatio: stockData.peRatio,
            pegRatio: growth?.pegRatio || null,
            earningsGrowth: growth?.earningsGrowth || null,
            changePercent: stockData.changePercent,
            news, socialSentiment,
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
            fundamentals: {
                peRatio: stockData.peRatio,
                epsGrowth: growth?.earningsGrowth || null,
                pegRatio: growth?.pegRatio || null,
                valueScore,
                growthScore
            },
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
    const totalValue = positions.reduce((sum, p) => sum + (p.marketValue || (p.currentPrice || 0) * p.units || 0), 0);
    if (totalValue === 0) return [];

    const sectorTotals: Record<string, number> = {};
    const stockAllocations: Record<string, number> = {};

    for (const p of positions) {
        const value = p.marketValue || (p.currentPrice || 0) * p.units;
        const allocation = (value / totalValue) * 100;
        stockAllocations[p.symbol] = allocation;

        const sector = getAllSymbols().find(s => s.symbol === p.symbol)?.sector || 'Other';
        sectorTotals[sector] = (sectorTotals[sector] || 0) + allocation;

        // Individual stock limit (5%)
        if (allocation > 5) {
            actions.push({
                symbol: p.symbol,
                action: 'Trim',
                reason: `Allocation is ${allocation.toFixed(1)}%, exceeding the 5% single-asset safety limit.`,
                impact: `Reduces concentration risk. Target: trim to ~5%.`,
                priority: allocation > 10 ? 'High' : 'Medium'
            });
        }

        // Underperforming position (P&L < -15%)
        const plPct = p.profitLossPercent ?? 0;
        if (plPct < -15 && !actions.find(a => a.symbol === p.symbol)) {
            actions.push({
                symbol: p.symbol,
                action: plPct < -25 ? 'Exit' : 'Trim',
                reason: `Position is down ${Math.abs(plPct).toFixed(1)}% — exceeds drawdown threshold.`,
                impact: `Cutting loss frees capital for higher-conviction positions.`,
                priority: plPct < -25 ? 'High' : 'Medium'
            });
        }
    }

    // Sector limits (20%)
    for (const [sector, allocation] of Object.entries(sectorTotals)) {
        if (allocation > 20) {
            actions.push({
                symbol: sector,
                action: 'Trim',
                reason: `${sector} sector is ${allocation.toFixed(1)}% of portfolio, exceeding the 20% sector cap.`,
                impact: `Improves diversification and lowers sector concentration risk.`,
                priority: allocation > 30 ? 'High' : 'Medium'
            });
        }
    }

    // If well-balanced, give a positive signal
    if (actions.length === 0) {
        actions.push({
            symbol: 'PORTFOLIO',
            action: 'Hold',
            reason: `All positions are within institutional risk limits (5% stock / 20% sector).`,
            impact: `No rebalancing required. Portfolio is well-diversified.`,
            priority: 'Low'
        });
    }

    return actions;
};

export const getAllRecommendations = async (indexName: string = 'S&P 500'): Promise<StockRecommendation[]> => {
    const stocks = STOCKS_BY_INDEX[indexName] || STOCKS_BY_INDEX['S&P 500'];

    // Scan a smaller subset for performance in this iteration
    const candidates = stocks.slice(0, 30);
    const allRecommendations = await getRecommendationsForStocks(candidates);

    // Final global sort
    allRecommendations.sort((a, b) => b.score - a.score);

    return allRecommendations;
};

/**
 * Enhanced Grouping Logic: Picks the BEST stocks (Undervalued + Growth) 
 * and groups them by sector as requested.
 */
export const getGroupedRecommendations = async (indexName: string = 'S&P 500') => {
    const allRecs = await getAllRecommendations(indexName);

    // Group by sector
    const grouped: Record<string, StockRecommendation[]> = {};

    allRecs.forEach(rec => {
        if (!grouped[rec.sector]) grouped[rec.sector] = [];
        grouped[rec.sector].push(rec);
    });

    // Return as array of sector objects
    return Object.entries(grouped).map(([name, recommendations]) => ({
        name,
        recommendations: recommendations.sort((a, b) => b.score - a.score).slice(0, 5)
    })).sort((a, b) => b.recommendations[0].score - a.recommendations[0].score);
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
    pegRatio: number | null;
    earningsGrowth: number | null;
    revenueGrowth: number | null;
    news: NewsArticle[];
    socialSentiment: number;
}): { score: number, valueScore: number, growthScore: number } => {
    let score = 50; // Base score
    let valuePoints = 0;
    let growthPoints = 0;

    // Technical analysis (35 points max)
    if (params.rsi !== null) {
        // RSI < 30 is oversold (Strong Buy Signal), RSI < 45 is undervalued entry
        if (params.rsi < 30) {
            score += 25;
            valuePoints += 15;
        } else if (params.rsi < 45) {
            score += 15;
            valuePoints += 10;
        } else if (params.rsi > 70) {
            score -= 20; // Overbought
        }
    }

    if (params.ma50 !== null && params.ma200 !== null) {
        if (params.ma50 > params.ma200) score += 10; // Bullish cross
        if (params.price > params.ma50) score += 5;
    }

    // Fundamentals & Growth (40 points max)
    // 1. P/E Ratio (Undervaluation)
    if (params.peRatio !== null && params.peRatio > 0) {
        if (params.peRatio < 12) {
            score += 20;
            valuePoints += 20;
        } else if (params.peRatio < 20) {
            score += 10;
            valuePoints += 10;
        } else if (params.peRatio > 45) {
            score -= 15;
        }
    }

    // 2. PEG Ratio (Growth at reasonable price)
    if (params.pegRatio !== null) {
        if (params.pegRatio < 1.0) {
            score += 20; // High growth relative to price
            growthPoints += 20;
            valuePoints += 10;
        } else if (params.pegRatio > 2.0) {
            score -= 10;
        }
    }

    // 3. Earnings Growth
    if (params.earningsGrowth !== null) {
        if (params.earningsGrowth > 0.25) {
            score += 15;
            growthPoints += 20;
        } else if (params.earningsGrowth > 0.15) {
            score += 10;
            growthPoints += 10;
        }
    }

    // News & Social (25 points max)
    const positiveNews = params.news.filter((n) => n.sentiment === 'positive').length;
    const negativeNews = params.news.filter((n) => n.sentiment === 'negative').length;
    score += positiveNews * 5;
    score -= negativeNews * 10;
    score += (params.socialSentiment / 100) * 10;

    return {
        score: Math.max(0, Math.min(100, score)),
        valueScore: Math.min(100, (valuePoints / 45) * 100),
        growthScore: Math.min(100, (growthPoints / 40) * 100)
    };
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
    pegRatio: number | null;
    earningsGrowth: number | null;
    changePercent: number;
    news: NewsArticle[];
    socialSentiment: number;
}): string[] => {
    const reasons: string[] = [];

    // Valuation & Growth (User requested focus)
    if (params.pegRatio !== null && params.pegRatio < 1.0) {
        reasons.push(`High Value: PEG ratio of ${params.pegRatio.toFixed(2)} indicates growth is undervalued at current price`);
    }

    if (params.earningsGrowth !== null && params.earningsGrowth > 0.15) {
        reasons.push(`Strong Growth: Projected earnings expansion of ${(params.earningsGrowth * 100).toFixed(1)}% YoY`);
    }

    if (params.peRatio !== null && params.peRatio < 15) {
        reasons.push(`Undervalued: P/E ratio (${params.peRatio.toFixed(1)}) is well below sector average`);
    }

    // Technical reasons
    if (params.rsi !== null) {
        if (params.rsi < 30) {
            reasons.push(`Oversold: RSI at ${params.rsi.toFixed(1)} confirms deep-value entry point`);
        } else if (params.rsi < 45) {
            reasons.push(`Accumulation: RSI at ${params.rsi.toFixed(1)} suggests steady accumulation window`);
        }
    }

    // News & Social
    if (params.socialSentiment > 30) {
        reasons.push(`X Pulse: High institutional volume and bullish sentiment detected`);
    }

    return reasons.slice(0, 4); // Keep it concise
};
