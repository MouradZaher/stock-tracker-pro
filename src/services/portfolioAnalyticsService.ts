// ============================================================
// PORTFOLIO ANALYTICS SERVICE
// Correlation matrix, stress test, tax-loss harvesting,
// peer benchmark, earnings calendar, smart entry timing
// ============================================================
import { getHistoricalPrices, getStockQuote } from './stockDataService';
import { getAllSymbols } from '../data/sectors';

export interface CorrelationMatrix {
    symbols: string[];
    matrix: number[][];
}

export interface StressTestResult {
    scenario: string;
    drop: number;
    portfolioLoss: number;
    newValue: number;
    worstHolding: { symbol: string; loss: number };
    bestHolding: { symbol: string; loss: number };
    positionImpacts: { symbol: string; currentValue: number; stressedValue: number; loss: number; beta: number }[];
}

export interface HarvestingOpportunity {
    symbol: string;
    name: string;
    currentValue: number;
    costBasis: number;
    unrealizedLoss: number;
    lossPercent: number;
    suggestedSwap: string;
    swapRationale: string;
    taxSavingsEstimate: number;
}

export interface BenchmarkResult {
    portfolioReturn: number;
    benchmarkReturn: number;
    alpha: number;
    beta: number;
    sharpePortfolio: number;
    sharpeBenchmark: number;
    bestPeriod: string;
    worstPeriod: string;
}

export interface EarningsEvent {
    symbol: string;
    name: string;
    estimatedDate: string;
    daysUntil: number;
    expectedMove: number;
    currentPosition: number; // market value
    action: 'Hold through' | 'Trim before' | 'Watch';
}

// ─── Sector beta approximations (systematic risk vs market) ──
const SECTOR_BETAS: Record<string, number> = {
    Technology: 1.35, 'Communication Services': 1.15, 'Consumer Cyclical': 1.20,
    Healthcare: 0.80, Financials: 1.10, Energy: 1.00, Industrials: 0.95,
    Utilities: 0.50, 'Real Estate': 0.85, 'Consumer Defensive': 0.65,
    Materials: 1.05, Commodities: 0.60, Diversified: 1.00, 'Basic Materials': 1.05,
};

// Known approximate stock betas
const STOCK_BETAS: Record<string, number> = {
    TSLA: 2.0, NVDA: 1.8, AMD: 1.7, PLTR: 1.9, ARKK: 1.8,
    AAPL: 1.2, MSFT: 1.1, GOOGL: 1.1, META: 1.3, AMZN: 1.2,
    JPM: 1.1, GS: 1.3, BAC: 1.2,
    JNJ: 0.7, PFE: 0.7, UNH: 0.8, LLY: 0.9,
    XOM: 0.9, CVX: 0.9, PSX: 1.0,
    GLD: -0.1, SLV: 0.2, TLT: -0.3,
    VOO: 1.0, SPY: 1.0, QQQ: 1.15, IWM: 1.1,
    LRCX: 1.6, ASML: 1.3, MU: 1.7, INTC: 0.9, SNDK: 1.4,
    BABA: 1.1, DIS: 1.1, MCD: 0.7, SBUX: 0.9,
    LMT: 0.7, CAT: 1.1, GE: 1.1,
    UUUU: 1.6,
};

function getBeta(symbol: string, sector?: string): number {
    if (STOCK_BETAS[symbol]) return STOCK_BETAS[symbol];
    if (sector && SECTOR_BETAS[sector]) return SECTOR_BETAS[sector];
    return 1.0;
}

// ─── Correlation Matrix ───────────────────────────────────────

function pearsonCorrelation(a: number[], b: number[]): number {
    const n = Math.min(a.length, b.length);
    if (n < 5) return 0;
    const sa = a.slice(0, n);
    const sb = b.slice(0, n);
    const meanA = sa.reduce((s, v) => s + v, 0) / n;
    const meanB = sb.reduce((s, v) => s + v, 0) / n;
    let num = 0, devA = 0, devB = 0;
    for (let i = 0; i < n; i++) {
        const da = sa[i] - meanA;
        const db = sb[i] - meanB;
        num += da * db;
        devA += da * da;
        devB += db * db;
    }
    const denom = Math.sqrt(devA * devB);
    return denom === 0 ? 0 : num / denom;
}

function pricesToReturns(prices: number[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
        returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    return returns;
}

export async function calculateCorrelationMatrix(
    positions: { symbol: string; sector?: string }[]
): Promise<CorrelationMatrix> {
    const symbols = positions.map(p => p.symbol);
    const historyMap = new Map<string, number[]>();

    await Promise.all(
        symbols.map(async sym => {
            try {
                const prices = await getHistoricalPrices(sym, 30);
                if (prices.length > 5) historyMap.set(sym, pricesToReturns(prices));
            } catch { /* skip */ }
        })
    );

    const validSymbols = symbols.filter(s => historyMap.has(s));
    const n = validSymbols.length;
    const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
        matrix[i][i] = 1;
        for (let j = i + 1; j < n; j++) {
            const r = pearsonCorrelation(
                historyMap.get(validSymbols[i])!,
                historyMap.get(validSymbols[j])!
            );
            matrix[i][j] = r;
            matrix[j][i] = r;
        }
    }

    return { symbols: validSymbols, matrix };
}

// ─── Stress Test ──────────────────────────────────────────────

export const STRESS_SCENARIOS = [
    { name: '2008 Financial Crisis', drop: -0.38, description: 'Lehman-style banking collapse' },
    { name: '2020 COVID Crash', drop: -0.34, description: 'Pandemic liquidity shock' },
    { name: 'Moderate Correction', drop: -0.20, description: '20% bear market correction' },
    { name: 'Tech Selloff', drop: -0.30, description: 'Tech-specific 30% rotation selloff' },
    { name: 'Rate Shock', drop: -0.15, description: 'Fed aggressive rate hike cycle' },
    { name: 'Stagflation', drop: -0.25, description: 'High inflation + low growth regime' },
];

export function runStressTest(
    positions: { symbol: string; currentPrice: number; units: number; marketValue: number; sector?: string }[],
    scenarioDrop: number,
    scenarioName: string
): StressTestResult {
    const totalValue = positions.reduce((s, p) => s + p.marketValue, 0);

    const positionImpacts = positions.map(p => {
        const beta = getBeta(p.symbol, p.sector);
        // Tech selloff scenario uses higher beta for tech
        let effectiveDrop = scenarioDrop;
        if (scenarioName === 'Tech Selloff') {
            const isTech = ['Technology', 'Communication Services'].includes(p.sector || '');
            effectiveDrop = isTech ? scenarioDrop * 1.5 : scenarioDrop * 0.4;
        } else if (scenarioName === 'Rate Shock') {
            // Utilities and bonds hurt more; value stocks less
            const isRateSensitive = ['Utilities', 'Real Estate'].includes(p.sector || '');
            effectiveDrop = isRateSensitive ? scenarioDrop * 1.8 : scenarioDrop;
        }

        const positionDrop = effectiveDrop * beta;
        const stressedValue = p.marketValue * (1 + positionDrop);
        const loss = stressedValue - p.marketValue;

        return {
            symbol: p.symbol,
            currentValue: p.marketValue,
            stressedValue: Math.max(0, stressedValue),
            loss,
            beta,
        };
    });

    const totalLoss = positionImpacts.reduce((s, p) => s + p.loss, 0);
    const newValue = totalValue + totalLoss;

    const sorted = [...positionImpacts].sort((a, b) => a.loss - b.loss);

    return {
        scenario: scenarioName,
        drop: scenarioDrop,
        portfolioLoss: totalLoss,
        newValue,
        worstHolding: { symbol: sorted[0]?.symbol || '', loss: sorted[0]?.loss || 0 },
        bestHolding: { symbol: sorted[sorted.length - 1]?.symbol || '', loss: sorted[sorted.length - 1]?.loss || 0 },
        positionImpacts,
    };
}

// ─── Tax-Loss Harvesting ──────────────────────────────────────

// Known alternative similar stocks for harvesting swaps
const HARVEST_SWAPS: Record<string, { swap: string; rationale: string }> = {
    TSLA: { swap: 'RIVN', rationale: 'EV sector exposure maintained via Rivian' },
    NVDA: { swap: 'AMD', rationale: 'Semiconductor exposure, similar growth profile' },
    AMD: { swap: 'NVDA', rationale: 'Semiconductor exposure, similar growth profile' },
    AAPL: { swap: 'MSFT', rationale: 'Mega-cap tech defensive quality' },
    MSFT: { swap: 'GOOGL', rationale: 'Cloud + AI mega-cap alternative' },
    GOOGL: { swap: 'META', rationale: 'Digital advertising + AI exposure' },
    META: { swap: 'SNAP', rationale: 'Social media sector exposure' },
    AMZN: { swap: 'BABA', rationale: 'eCommerce + cloud exposure (emerging market discount)' },
    BABA: { swap: 'JD', rationale: 'Chinese eCommerce alternative' },
    XOM: { swap: 'CVX', rationale: 'Large-cap integrated oil alternative' },
    CVX: { swap: 'XOM', rationale: 'Large-cap integrated oil alternative' },
    PSX: { swap: 'VLO', rationale: 'Downstream refiner swap' },
    JNJ: { swap: 'ABT', rationale: 'Diversified healthcare defensive' },
    LLY: { swap: 'MRK', rationale: 'Big pharma with pipeline depth' },
    LRCX: { swap: 'AMAT', rationale: 'Semiconductor equipment sector' },
    MU: { swap: 'WDC', rationale: 'Memory storage sector exposure' },
    INTC: { swap: 'IBM', rationale: 'Legacy tech with AI reinvention story' },
    CAT: { swap: 'DE', rationale: 'Heavy industrials / machinery sector' },
    LMT: { swap: 'RTX', rationale: 'Defense sector exposure' },
    GLD: { swap: 'IAU', rationale: 'Gold ETF swap — same exposure, lower expense ratio' },
    SLV: { swap: 'SIVR', rationale: 'Silver ETF alternative' },
    DIS: { swap: 'CMCSA', rationale: 'Media/entertainment sector' },
    ASML: { swap: 'KLAC', rationale: 'Semiconductor capital equipment' },
    SNDK: { swap: 'WDC', rationale: 'Flash storage sector' },
};

export function scanTaxLossHarvesting(
    positions: { symbol: string; name: string; currentPrice: number; units: number;
                 avgCost: number; marketValue: number; purchaseValue: number;
                 profitLossPercent: number; profitLoss: number }[],
    taxRate = 0.25
): HarvestingOpportunity[] {
    return positions
        .filter(p => p.profitLoss < -100 && p.profitLossPercent < -5) // Only meaningful losses
        .sort((a, b) => a.profitLoss - b.profitLoss)
        .map(p => {
            const swap = HARVEST_SWAPS[p.symbol];
            return {
                symbol: p.symbol,
                name: p.name,
                currentValue: p.marketValue,
                costBasis: p.purchaseValue,
                unrealizedLoss: p.profitLoss,
                lossPercent: p.profitLossPercent,
                suggestedSwap: swap?.swap || 'Sector ETF',
                swapRationale: swap?.rationale || 'Maintain sector exposure via ETF',
                taxSavingsEstimate: Math.abs(p.profitLoss) * taxRate,
            };
        });
}

// ─── Peer Benchmark ───────────────────────────────────────────

export function calculateBenchmark(
    positions: { symbol: string; avgCost: number; currentPrice: number; units: number;
                 purchaseValue: number; marketValue: number }[],
    benchmarkSymbol = 'VOO'
): BenchmarkResult {
    const totalCost = positions.reduce((s, p) => s + p.purchaseValue, 0);
    const totalValue = positions.reduce((s, p) => s + p.marketValue, 0);
    const portfolioReturn = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;

    // Benchmark: assume VOO returned approximately based on portfolio's cost-weighted dates
    // Since weighted avg cost implies time, we estimate benchmark return proportionally
    // VOO approximate annual return ~10-12%. Use portfolio timeline proxy.
    const benchmarkAnnualReturn = 10; // VOO historical avg %
    const portfolioReturnAnnualized = portfolioReturn; // Not time-adjusted (simplified)

    const alpha = portfolioReturn - benchmarkAnnualReturn;

    // Portfolio beta (weighted avg)
    const weightedBeta = positions.reduce((sum, p) => {
        const weight = p.marketValue / (totalValue || 1);
        return sum + getBeta(p.symbol) * weight;
    }, 0);

    // Simplified Sharpe (return / estimated volatility)
    const estimatedVolatility = weightedBeta * 15; // approx portfolio vol
    const sharpePortfolio = estimatedVolatility > 0 ? portfolioReturn / estimatedVolatility : 0;
    const sharpeBenchmark = 15 > 0 ? benchmarkAnnualReturn / 15 : 0;

    return {
        portfolioReturn: parseFloat(portfolioReturn.toFixed(2)),
        benchmarkReturn: benchmarkAnnualReturn,
        alpha: parseFloat(alpha.toFixed(2)),
        beta: parseFloat(weightedBeta.toFixed(2)),
        sharpePortfolio: parseFloat(sharpePortfolio.toFixed(2)),
        sharpeBenchmark: parseFloat(sharpeBenchmark.toFixed(2)),
        bestPeriod: alpha > 0 ? 'Growth outperforming' : 'Benchmark outperforming',
        worstPeriod: portfolioReturn < 0 ? 'Current drawdown period' : 'No recent drawdown',
    };
}

// ─── Earnings Calendar (approximated) ────────────────────────

// Approximate quarterly earnings months per symbol category
function getEarningsEstimate(symbol: string): { month: number; day: number } {
    // Simplified: Q1 earnings → April, Q2 → July, Q3 → October, Q4 → January
    // Use symbol hash to vary day
    const hash = symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const now = new Date();
    const month = now.getMonth(); // 0-indexed
    // Next earnings month (quarterly cycle)
    const earningsMonths = [0, 3, 6, 9]; // Jan, Apr, Jul, Oct
    const nextIdxArr = earningsMonths.filter(m => m > month);
    const nextMonth = nextIdxArr[0] ?? earningsMonths[0];
    const day = 15 + (hash % 10); // Day 15-25
    const year = nextMonth <= month ? now.getFullYear() + 1 : now.getFullYear();
    return { month: nextMonth, day };
}

export function buildEarningsCalendar(
    positions: { symbol: string; name?: string; marketValue: number; profitLossPercent: number }[]
): EarningsEvent[] {
    const now = new Date();
    return positions
        .map(p => {
            const est = getEarningsEstimate(p.symbol);
            const earningsDate = new Date(now.getFullYear(), est.month, est.day);
            if (earningsDate < now) earningsDate.setFullYear(earningsDate.getFullYear() + 1);
            const daysUntil = Math.ceil((earningsDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const hash = p.symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
            const expectedMove = 3 + (hash % 8); // 3–10% typical earnings move

            let action: 'Hold through' | 'Trim before' | 'Watch' = 'Watch';
            if (daysUntil <= 14 && p.profitLossPercent > 20) action = 'Trim before';
            else if (daysUntil <= 14 && p.profitLossPercent < -15) action = 'Hold through';
            else if (daysUntil <= 30) action = 'Watch';

            return {
                symbol: p.symbol,
                name: p.name || p.symbol,
                estimatedDate: earningsDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                daysUntil,
                expectedMove,
                currentPosition: p.marketValue,
                action,
            };
        })
        .sort((a, b) => a.daysUntil - b.daysUntil);
}
