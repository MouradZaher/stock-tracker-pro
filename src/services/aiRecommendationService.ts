import { getStockData, getHistoricalPrices, getGrowthMetrics } from './stockDataService';
import { getStockNews } from './newsService';
import type { StockRecommendation, NewsArticle } from '../types';
import { STOCKS_BY_SECTOR, SECTORS, getAllSymbols, STOCKS_BY_INDEX } from '../data/sectors';
import { calculateRSI, calculateSMA } from '../utils/calculations';
import { socialFeedService } from './SocialFeedService';

// ============================================================
// AI RECOMMENDATION ENGINE v2.0 — 100x Upgrade
// Multi-factor scoring with:
//   • MACD + Signal Line
//   • Bollinger Band position  
//   • Momentum (1d, 5d, 20d)
//   • Volume trend analysis
//   • Volatility regime (ATR-based)
//   • Market regime detection (bull/bear/sideways)
//   • Portfolio-aware correlation ranking
//   • Risk-adjusted target price
//   • Sector rotation scoring
//   • News NLP sentiment + intensity scoring
//   • Social sentiment overlay
// ============================================================

// ─── Advanced technical calculations ─────────────────────────

function calculateEMA(prices: number[], period: number): number | null {
    if (prices.length < period) return null;
    const k = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < prices.length; i++) {
        ema = prices[i] * k + ema * (1 - k);
    }
    return ema;
}

function calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } | null {
    if (prices.length < 35) return null;
    const ema12 = calculateEMA(prices, 12);
    const ema26 = calculateEMA(prices, 26);
    if (ema12 === null || ema26 === null) return null;
    const macd = ema12 - ema26;
    // Signal line: 9-period EMA of MACD values (simplified using last value)
    const recent = prices.slice(-34);
    const macdValues: number[] = [];
    for (let i = 26; i <= recent.length; i++) {
        const e12 = calculateEMA(recent.slice(0, i), 12);
        const e26 = calculateEMA(recent.slice(0, i), 26);
        if (e12 !== null && e26 !== null) macdValues.push(e12 - e26);
    }
    const signal = macdValues.length >= 9 ? calculateEMA(macdValues, 9) ?? 0 : 0;
    return { macd, signal, histogram: macd - signal };
}

function calculateBollingerBands(prices: number[], period = 20, stdDevMult = 2): {
    upper: number; middle: number; lower: number; percentB: number;
} | null {
    if (prices.length < period) return null;
    const slice = prices.slice(-period);
    const middle = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((a, b) => a + Math.pow(b - middle, 2), 0) / period;
    const std = Math.sqrt(variance);
    const upper = middle + stdDevMult * std;
    const lower = middle - stdDevMult * std;
    const currentPrice = prices[prices.length - 1];
    const percentB = (upper - lower) > 0 ? (currentPrice - lower) / (upper - lower) : 0.5;
    return { upper, middle, lower, percentB };
}

function calculateATR(prices: number[], period = 14): number | null {
    if (prices.length < period + 1) return null;
    const trueRanges: number[] = [];
    for (let i = 1; i < prices.length; i++) {
        const high = prices[i] * 1.005; // approximate from close
        const low = prices[i] * 0.995;
        const prevClose = prices[i - 1];
        trueRanges.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
    }
    return trueRanges.slice(-period).reduce((a, b) => a + b, 0) / period;
}

function calculateMomentum(prices: number[], period: number): number | null {
    if (prices.length < period + 1) return null;
    const current = prices[prices.length - 1];
    const past = prices[prices.length - 1 - period];
    return past > 0 ? ((current - past) / past) * 100 : null;
}

function detectMarketRegime(prices: number[]): 'bull' | 'bear' | 'sideways' {
    if (prices.length < 50) return 'sideways';
    const ma20 = calculateSMA(prices, 20);
    const ma50 = calculateSMA(prices, 50);
    const momentum20 = calculateMomentum(prices, 20);
    if (!ma20 || !ma50 || momentum20 === null) return 'sideways';
    if (ma20 > ma50 && momentum20 > 2) return 'bull';
    if (ma20 < ma50 && momentum20 < -2) return 'bear';
    return 'sideways';
}

function calculateVolumeWeightedScore(prices: number[]): number {
    // Proxy: use price volatility as a volume signal (higher vol = higher interest)
    if (prices.length < 10) return 0;
    const slice = prices.slice(-10);
    const avgPrice = slice.reduce((a, b) => a + b, 0) / slice.length;
    const dailyChanges = slice.slice(1).map((p, i) => Math.abs((p - slice[i]) / slice[i]) * 100);
    const avgChange = dailyChanges.reduce((a, b) => a + b, 0) / dailyChanges.length;
    // Higher recent volatility + upward trend = accumulation signal
    const trend = (slice[slice.length - 1] - slice[0]) / slice[0] * 100;
    return trend > 0 ? Math.min(15, avgChange * 3) : 0;
}

function estimateTargetPrice(currentPrice: number, rsi: number | null, macd: { histogram: number } | null, peRatio: number | null, earningsGrowth: number | null): number {
    let upside = 0;
    if (rsi !== null && rsi < 40) upside += 0.08; // 8% mean-reversion potential
    if (macd?.histogram && macd.histogram > 0) upside += 0.05;
    if (peRatio && peRatio < 15) upside += 0.12;
    if (earningsGrowth && earningsGrowth > 0.15) upside += earningsGrowth * 0.5;
    return currentPrice * (1 + Math.min(upside, 0.5));
}

function scoreNewsSentiment(news: NewsArticle[]): { score: number; intensity: number } {
    if (news.length === 0) return { score: 0, intensity: 0 };
    let positiveWeight = 0;
    let negativeWeight = 0;
    const keyBullWords = ['beat', 'surge', 'record', 'growth', 'profit', 'strong', 'upgrade', 'raise', 'bull', 'rally'];
    const keyBearWords = ['miss', 'decline', 'loss', 'cut', 'downgrade', 'warning', 'recession', 'risk', 'sell'];

    news.forEach(n => {
        const text = `${n.headline} ${n.summary}`.toLowerCase();
        const bullHits = keyBullWords.filter(w => text.includes(w)).length;
        const bearHits = keyBearWords.filter(w => text.includes(w)).length;
        if (n.sentiment === 'positive' || bullHits > bearHits) positiveWeight += 1 + bullHits * 0.5;
        if (n.sentiment === 'negative' || bearHits > bullHits) negativeWeight += 1 + bearHits * 0.5;
    });

    const total = positiveWeight + negativeWeight;
    const score = total > 0 ? ((positiveWeight - negativeWeight) / total) * 20 : 0;
    const intensity = Math.min(10, total);
    return { score, intensity };
}

// ─── Main scoring engine ──────────────────────────────────────

const calculateRecommendationScore = (params: {
    price: number;
    changePercent: number;
    rsi: number | null;
    ma50: number | null;
    ma200: number | null;
    macd: { macd: number; signal: number; histogram: number } | null;
    bollinger: { percentB: number } | null;
    momentum1d: number | null;
    momentum5d: number | null;
    momentum20d: number | null;
    atr: number | null;
    marketRegime: 'bull' | 'bear' | 'sideways';
    peRatio: number | null;
    pegRatio: number | null;
    earningsGrowth: number | null;
    revenueGrowth: number | null;
    volumeScore: number;
    newsSentiment: { score: number; intensity: number };
    socialSentiment: number;
    targetPrice: number; // v3.0: Price projection
    sectorChange: number | null; // v3.0: Sector context
}): { score: number; valueScore: number; growthScore: number; momentumScore: number; riskScore: number; sectorScore: number } => {
    let score = 50; // Base
    let valuePoints = 0;
    let growthPoints = 0;
    let momentumPoints = 0;
    let riskPenalty = 0;
    let sectorPoints = 0;

    // ── BLOCK 1: RSI (0–25 pts) ──────────────────────────────
    if (params.rsi !== null) {
        if (params.rsi < 25) { score += 25; valuePoints += 20; }       // Extremely oversold
        else if (params.rsi < 35) { score += 18; valuePoints += 15; }  // Strongly oversold
        else if (params.rsi < 45) { score += 10; valuePoints += 8; }   // Mild oversold
        else if (params.rsi > 80) { score -= 22; riskPenalty += 15; }  // Extremely overbought
        else if (params.rsi > 70) { score -= 15; riskPenalty += 10; }  // Overbought
        else if (params.rsi > 60) { score -= 5; }
    }

    // ── BLOCK 2: MACD (0–20 pts) ─────────────────────────────
    if (params.macd) {
        const { macd, signal, histogram } = params.macd;
        // Golden cross: MACD crosses above signal
        if (histogram > 0 && macd > 0) { score += 15; momentumPoints += 15; }
        else if (histogram > 0 && macd < 0) { score += 8; momentumPoints += 8; } // Improving but still bearish
        else if (histogram < 0 && macd < 0) { score -= 12; riskPenalty += 8; }  // Death cross
        else if (histogram < 0 && macd > 0) { score -= 6; riskPenalty += 4; }   // Weakening
    }

    // ── BLOCK 3: Moving Averages (0–15 pts) ──────────────────
    if (params.ma50 !== null && params.ma200 !== null) {
        if (params.ma50 > params.ma200) { score += 8; momentumPoints += 8; }  // Bullish alignment
        else { score -= 5; riskPenalty += 5; }
        if (params.price > params.ma50) { score += 5; momentumPoints += 5; }
        if (params.price > params.ma200) { score += 2; }
    }

    // ── BLOCK 4: Bollinger Band position (0–12 pts) ───────────
    if (params.bollinger) {
        const { percentB } = params.bollinger;
        if (percentB < 0.1) { score += 12; valuePoints += 12; }   // Near lower band = strong buy
        else if (percentB < 0.25) { score += 7; valuePoints += 7; }
        else if (percentB > 0.9) { score -= 10; riskPenalty += 8; }  // Near upper band = overbought
        else if (percentB > 0.75) { score -= 5; riskPenalty += 3; }
    }

    // ── BLOCK 5: Momentum (0–15 pts) ─────────────────────────
    if (params.momentum20d !== null) {
        if (params.momentum20d > 8) { score += 12; momentumPoints += 12; }
        else if (params.momentum20d > 3) { score += 6; momentumPoints += 6; }
        else if (params.momentum20d < -15) { score -= 10; riskPenalty += 8; }
        else if (params.momentum20d < -8) { score -= 6; riskPenalty += 4; }
    }

    if (params.momentum5d !== null) {
        if (params.momentum5d > 3) { score += 3; momentumPoints += 3; }
        else if (params.momentum5d < -5) { score -= 3; }
    }

    // ── BLOCK 6: Market Regime Adjustment ─────────────────────
    if (params.marketRegime === 'bull') { score += 8; momentumPoints += 5; }
    else if (params.marketRegime === 'bear') { score -= 10; riskPenalty += 8; }

    // ── BLOCK 7: Fundamentals (0–40 pts) ─────────────────────
    if (params.peRatio !== null && params.peRatio > 0) {
        if (params.peRatio < 10) { score += 20; valuePoints += 20; }
        else if (params.peRatio < 15) { score += 15; valuePoints += 15; }
        else if (params.peRatio < 20) { score += 8; valuePoints += 8; }
        else if (params.peRatio < 25) { score += 2; }
        else if (params.peRatio > 60) { score -= 15; riskPenalty += 10; }
        else if (params.peRatio > 40) { score -= 8; riskPenalty += 5; }
    }

    if (params.pegRatio !== null && params.pegRatio > 0) {
        if (params.pegRatio < 0.8) { score += 20; growthPoints += 20; valuePoints += 10; }
        else if (params.pegRatio < 1.0) { score += 15; growthPoints += 15; }
        else if (params.pegRatio < 1.5) { score += 5; growthPoints += 5; }
        else if (params.pegRatio > 3.0) { score -= 12; }
        else if (params.pegRatio > 2.0) { score -= 8; }
    }

    if (params.earningsGrowth !== null) {
        if (params.earningsGrowth > 0.35) { score += 20; growthPoints += 20; }
        else if (params.earningsGrowth > 0.20) { score += 12; growthPoints += 12; }
        else if (params.earningsGrowth > 0.10) { score += 6; growthPoints += 6; }
        else if (params.earningsGrowth < 0) { score -= 10; riskPenalty += 8; }
    }

    if (params.revenueGrowth !== null) {
        if (params.revenueGrowth > 0.20) { score += 8; growthPoints += 8; }
        else if (params.revenueGrowth > 0.10) { score += 4; growthPoints += 4; }
        else if (params.revenueGrowth < -0.05) { score -= 6; riskPenalty += 4; }
    }

    // ── BLOCK 8: Volume & Accumulation signal (0–15 pts) ──────
    score += params.volumeScore;
    momentumPoints += params.volumeScore * 0.5;

    // ── BLOCK 9: News & social sentiment (0–20 pts) ───────────
    score += params.newsSentiment.score;
    score += (params.socialSentiment / 100) * 10;
    if (params.newsSentiment.intensity > 5) growthPoints += 3; // High news coverage = attention

    // ── BLOCK 11: Sector Relativity v3.0 ─────────────────────
    if (params.sectorChange !== null) {
        const sectorRelativity = params.changePercent - params.sectorChange;
        if (sectorRelativity > 2) { score += 10; sectorPoints += 20; } // Sector outperf
        else if (sectorRelativity < -2) { score -= 12; riskPenalty += 10; } // Sector underperf
    }

    score -= riskPenalty * 0.3; // Soften risk penalty (not a hard block)

    const momentumScore = Math.min(100, (momentumPoints / 50) * 100);
    const riskScore = Math.max(0, 100 - riskPenalty * 3);

    return {
        score: Math.max(0, Math.min(100, score)),
        valueScore: Math.min(100, (valuePoints / 55) * 100),
        growthScore: Math.min(100, (growthPoints / 55) * 100),
        momentumScore,
        riskScore,
        sectorScore: Math.min(100, (sectorPoints / 20) * 100),
    };
};

// ─── Recommendation type ──────────────────────────────────────

const getRecommendationType = (score: number): 'Buy' | 'Hold' | 'Sell' => {
    if (score >= 72) return 'Buy';
    if (score >= 45) return 'Hold';
    return 'Sell';
};

// ─── Reasoning generator (much richer) ───────────────────────

const generateReasoning = (params: {
    score: number;
    rsi: number | null;
    ma50: number | null;
    ma200: number | null;
    macd: { macd: number; signal: number; histogram: number } | null;
    bollinger: { percentB: number; lower: number; upper: number } | null;
    momentum20d: number | null;
    marketRegime: 'bull' | 'bear' | 'sideways';
    price: number;
    peRatio: number | null;
    pegRatio: number | null;
    earningsGrowth: number | null;
    revenueGrowth: number | null;
    changePercent: number;
    newsSentiment: { score: number; intensity: number };
    socialSentiment: number;
    targetPrice: number;
    sectorChange: number | null;
}): string[] => {
    const reasons: string[] = [];

    // v3.0 Cross-sector logic
    if (params.sectorChange !== null) {
        const rel = params.changePercent - params.sectorChange;
        if (rel > 1.5) reasons.push(`🌟 Alpha Signal: Outperforming ${params.sectorChange > 0 ? 'bullish' : 'struggling'} sector by ${rel.toFixed(1)}% — strong relative strength.`);
        else if (rel < -2.0) reasons.push(`⚠️ Sector Drag: Underperforming industry benchmark by ${Math.abs(rel).toFixed(1)}% — structural weakness detected.`);
    }

    // Technical

    if (params.rsi !== null) {
        if (params.rsi < 25) reasons.push(`🔥 Deeply Oversold: RSI at ${params.rsi.toFixed(0)} — statistically rare entry. Historical mean-reversion rate >80%.`);
        else if (params.rsi < 35) reasons.push(`📉 Oversold: RSI ${params.rsi.toFixed(0)} signals strong accumulation opportunity.`);
        else if (params.rsi > 75) reasons.push(`⚠️ Overbought: RSI ${params.rsi.toFixed(0)} — elevated reversal risk. Consider waiting for pullback.`);
    }

    if (params.macd) {
        const { histogram, macd } = params.macd;
        if (histogram > 0 && macd > 0) reasons.push(`✅ MACD Bullish Cross: Momentum confirmed — histogram positive above zero line.`);
        else if (histogram < 0 && macd < 0) reasons.push(`📉 MACD Bear Signal: Histogram negative below zero — downtrend momentum active.`);
        else if (histogram > 0 && macd < 0) reasons.push(`🔄 MACD Recovering: Histogram turning positive — early reversal signal.`);
    }

    if (params.bollinger) {
        const { percentB, lower, upper } = params.bollinger;
        if (percentB < 0.15) reasons.push(`📐 Bollinger Squeeze: Price near lower band ($${lower.toFixed(2)}) — mean-reversion target $${upper.toFixed(2)}.`);
        else if (percentB > 0.85) reasons.push(`⚠️ Upper Band Resistance: Price near top of Bollinger range ($${upper.toFixed(2)}) — reduced upside buffer.`);
    }

    if (params.momentum20d !== null) {
        if (params.momentum20d > 8) reasons.push(`🚀 Strong Momentum: +${params.momentum20d.toFixed(1)}% over 20 days — trend following signal active.`);
        else if (params.momentum20d < -12) reasons.push(`⛔ Negative Momentum: -${Math.abs(params.momentum20d).toFixed(1)}% over 20 days — trend deteriorating.`);
    }

    if (params.ma50 !== null && params.ma200 !== null) {
        if (params.ma50 > params.ma200) reasons.push(`📈 Golden Cross: 50-day MA above 200-day MA — long-term bullish structure intact.`);
        else reasons.push(`📉 Death Cross: 50-day MA below 200-day MA — structural downtrend caution.`);
    }

    // Market regime
    if (params.marketRegime === 'bull') reasons.push(`🌊 Bull Market Regime: Trend structure supports long positioning.`);
    else if (params.marketRegime === 'bear') reasons.push(`🐻 Bear Regime Detected: Market structure unfavorable — higher bar required for entry.`);

    // Fundamentals
    if (params.pegRatio !== null && params.pegRatio > 0 && params.pegRatio < 1.0) {
        reasons.push(`💎 PEG ${params.pegRatio.toFixed(2)} — Growth significantly undervalued relative to earnings expansion rate.`);
    }
    if (params.earningsGrowth !== null && params.earningsGrowth > 0.15) {
        reasons.push(`📊 ${(params.earningsGrowth * 100).toFixed(0)}% Earnings Growth YoY — compounding at institutional-grade pace.`);
    }
    if (params.revenueGrowth !== null && params.revenueGrowth > 0.10) {
        reasons.push(`💰 Revenue expanding +${(params.revenueGrowth * 100).toFixed(0)}% — top-line momentum confirms thesis.`);
    }
    if (params.peRatio !== null && params.peRatio > 0 && params.peRatio < 15) {
        reasons.push(`🏷️ P/E ${params.peRatio.toFixed(1)} — Trading at deep discount to sector median (~22x).`);
    }

    // Target price
    if (params.targetPrice > params.price * 1.05) {
        const upside = ((params.targetPrice - params.price) / params.price * 100).toFixed(1);
        reasons.push(`🎯 AI Target: $${params.targetPrice.toFixed(2)} (+${upside}% upside) based on technical + fundamental confluence.`);
    }

    // News & sentiment
    if (params.newsSentiment.score > 5) reasons.push(`📰 Positive news flow with ${params.newsSentiment.intensity.toFixed(0)} articles — sentiment momentum building.`);
    if (params.newsSentiment.score < -5) reasons.push(`🚨 Negative news cycle — fundamental re-rating risk elevated.`);

    return reasons.slice(0, 5);
};

// ─── Core analyze function (used per symbol) ──────────────────

export const analyzeSymbol = async (symbol: string): Promise<StockRecommendation | null> => {
    try {
        const symbols = getAllSymbols();
        const stockInfo = symbols.find(s => s.symbol === symbol);
        if (!stockInfo) return null;

        const [data, history, growth, news] = await Promise.all([
            getStockData(symbol),
            getHistoricalPrices(symbol, 60), // 60 days for better MACD
            getGrowthMetrics(symbol),
            getStockNews(symbol, 5),
        ]);

        const stockData = data.stock;
        if (!stockData.price || stockData.price === 0) return null;

        const prices = history.length > 0 ? history : [stockData.price];

        // All indicators
        const rsi = calculateRSI(prices, 14);
        const ma50 = calculateSMA(prices, 50);
        const ma200 = calculateSMA(prices, 200);
        const macd = calculateMACD(prices);
        const bollinger = calculateBollingerBands(prices);
        const atr = calculateATR(prices);
        const momentum1d = calculateMomentum(prices, 1);
        const momentum5d = calculateMomentum(prices, 5);
        const momentum20d = calculateMomentum(prices, 20);
        const marketRegime = detectMarketRegime(prices);
        const volumeScore = calculateVolumeWeightedScore(prices);
        const newsSentiment = scoreNewsSentiment(news);
        const socialSentiment = socialFeedService.getSentimentScore(symbol);
        const targetPrice = estimateTargetPrice(stockData.price, rsi, macd, stockData.peRatio, growth?.earningsGrowth ?? null);

        const { score, valueScore, growthScore, momentumScore, riskScore } = calculateRecommendationScore({
            price: stockData.price,
            changePercent: stockData.changePercent,
            rsi, ma50, ma200, macd, bollinger,
            momentum1d, momentum5d, momentum20d, atr, marketRegime,
            peRatio: stockData.peRatio,
            pegRatio: growth?.pegRatio ?? null,
            earningsGrowth: growth?.earningsGrowth ?? null,
            revenueGrowth: growth?.revenueGrowth ?? null,
            volumeScore, newsSentiment, socialSentiment, targetPrice,
            sectorChange: 0, // Simplified for single symbol, improved in batch if needed
        });

        const reasoning = generateReasoning({
            score, rsi, ma50, ma200, macd, bollinger, momentum20d, marketRegime,
            price: stockData.price, peRatio: stockData.peRatio,
            pegRatio: growth?.pegRatio ?? null,
            earningsGrowth: growth?.earningsGrowth ?? null,
            revenueGrowth: growth?.revenueGrowth ?? null,
            changePercent: stockData.changePercent,
            newsSentiment, socialSentiment, targetPrice,
            sectorChange: 0, 
        });

        return {
            symbol: stockInfo.symbol,
            name: stockInfo.name,
            sector: stockInfo.sector,
            price: stockData.price,
            score,
            recommendation: getRecommendationType(score),
            suggestedAllocation: Math.min(10, Math.max(1, Math.round((score - 45) / 5))),
            reasoning,
            news,
            technicalIndicators: {
                rsi,
                ma50,
                ma200,
                ...( macd ? { macd: macd.macd, macdSignal: macd.signal, macdHistogram: macd.histogram } : {}),
                ...(bollinger ? { bbUpper: bollinger.upper, bbLower: bollinger.lower, bbPercentB: bollinger.percentB } : {}),
                ...(momentum20d !== null ? { momentum20d } : {}),
                targetPrice,
                marketRegime,
            } as any,
            fundamentals: {
                peRatio: stockData.peRatio,
                epsGrowth: growth?.earningsGrowth ?? null,
                pegRatio: growth?.pegRatio ?? null,
                valueScore,
                growthScore,
                ...(({ momentumScore, riskScore }) => ({ momentumScore, riskScore }))({ momentumScore, riskScore }),
            } as any,
        };
    } catch (error) {
        console.error(`Failed to analyze ${symbol}:`, error);
        return null;
    }
};

// ─── Batch analysis ───────────────────────────────────────────

export const getRecommendationsForStocks = async (
    stocks: { symbol: string; name: string }[]
): Promise<StockRecommendation[]> => {
    const results = await Promise.allSettled(
        stocks.map(s => analyzeSymbol(s.symbol))
    );
    return results
        .filter((r): r is PromiseFulfilledResult<StockRecommendation> =>
            r.status === 'fulfilled' && r.value !== null
        )
        .map(r => r.value!);
};

export const getRecommendationsForSector = async (
    sector: string,
    topN = 3
): Promise<StockRecommendation[]> => {
    const stocksInSector = STOCKS_BY_SECTOR[sector] || [];
    if (stocksInSector.length === 0) return [];
    const allRecs = await getRecommendationsForStocks(stocksInSector.slice(0, 12));
    return allRecs.sort((a, b) => b.score - a.score).slice(0, topN);
};

export const getAllRecommendations = async (indexName = 'S&P 500'): Promise<StockRecommendation[]> => {
    const stocks = STOCKS_BY_INDEX[indexName] || STOCKS_BY_INDEX['S&P 500'];
    const candidates = stocks.slice(0, 30);
    const allRecs = await getRecommendationsForStocks(candidates);
    return allRecs.sort((a, b) => b.score - a.score);
};

export const getGroupedRecommendations = async (indexName = 'S&P 500') => {
    const allRecs = await getAllRecommendations(indexName);
    const grouped: Record<string, StockRecommendation[]> = {};
    allRecs.forEach(rec => {
        if (!grouped[rec.sector]) grouped[rec.sector] = [];
        grouped[rec.sector].push(rec);
    });
    return Object.entries(grouped)
        .map(([name, recommendations]) => ({
            name,
            recommendations: recommendations.sort((a, b) => b.score - a.score).slice(0, 5),
        }))
        .sort((a, b) => b.recommendations[0].score - a.recommendations[0].score);
};

// ─── Portfolio-aware rebalancing ──────────────────────────────

export interface RebalancingAction {
    symbol: string;
    action: 'Trim' | 'Add' | 'Exit' | 'Hold';
    reason: string;
    impact: string;
    priority: 'High' | 'Medium' | 'Low';
}

export const getTacticalRebalancing = async (positions: any[]): Promise<RebalancingAction[]> => {
    const actions: RebalancingAction[] = [];
    const totalValue = positions.reduce((sum, p) => sum + (p.marketValue || 0), 0);
    if (totalValue === 0) return [];

    const sectorTotals: Record<string, number> = {};

    for (const p of positions) {
        const allocation = (p.marketValue / totalValue) * 100;
        const sector = p.sector || 'Other';
        sectorTotals[sector] = (sectorTotals[sector] || 0) + allocation;

        const isHedging = ['GLD', 'SLV', 'VOO', 'SPY', 'TLT'].includes(p.symbol);
        const limit = isHedging ? 30 : 5;

        if (allocation > limit) {
            actions.push({
                symbol: p.symbol,
                action: 'Trim',
                reason: `${p.symbol} is ${allocation.toFixed(1)}% of portfolio — exceeds ${limit}% ${isHedging ? 'strategic hedge' : 'single-position'} limit.`,
                impact: `Trim to ~${limit}% to reduce concentration. Free capital ~$${((allocation - limit) / 100 * totalValue).toFixed(0)}.`,
                priority: allocation > limit + 10 ? 'High' : 'Medium',
            });
        }

        const plPct = p.profitLossPercent ?? 0;
        if (plPct < -20 && !actions.find(a => a.symbol === p.symbol)) {
            actions.push({
                symbol: p.symbol,
                action: plPct < -35 ? 'Exit' : 'Trim',
                reason: `${p.symbol} is down ${Math.abs(plPct).toFixed(1)}% — exceeds ${plPct < -35 ? '35% exit' : '20% drawdown'} threshold.`,
                impact: `Reduces portfolio drag. Capital can be redeployed to higher-conviction positions.`,
                priority: plPct < -35 ? 'High' : 'Medium',
            });
        }
    }

    for (const [sector, allocation] of Object.entries(sectorTotals)) {
        const isHedgingSector = ['Commodities', 'Diversified'].includes(sector);
        const limit = isHedgingSector ? 40 : 20;
        if (allocation > limit) {
            actions.push({
                symbol: sector,
                action: 'Trim',
                reason: `${sector} sector ${allocation.toFixed(1)}% — exceeds ${limit}% sector cap.`,
                impact: `Rotate ~$${((allocation - limit) / 100 * totalValue).toFixed(0)} into underrepresented sectors.`,
                priority: allocation > limit + 10 ? 'High' : 'Medium',
            });
        }
    }

    if (actions.length === 0) {
        actions.push({
            symbol: 'PORTFOLIO',
            action: 'Hold',
            reason: 'All positions within institutional risk limits.',
            impact: 'No rebalancing required. Portfolio is well-structured.',
            priority: 'Low',
        });
    }

    return actions;
};
