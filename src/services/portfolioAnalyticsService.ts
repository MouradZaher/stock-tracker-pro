import { getHistoricalPrices } from './stockDataService';
import type { PortfolioPosition } from '../types';

export interface StressTestResult {
  scenario: string;
  impact: number;
  impactPercent: number;
  description: string;
}

export interface CorrelationData {
  symbol1: string;
  symbol2: string;
  correlation: number;
}

export interface TaxLossOpportunity {
  symbol: string;
  loss: number;
  lossPercent: number;
  alternative: string;
  rationale: string;
}

// ─── MATH UTILS ───────────────────────────────────────────────

function calculateCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;

  const muX = x.reduce((a, b) => a + b, 0) / n;
  const muY = y.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - muX;
    const dy = y[i] - muY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : num / den;
}

function calculateReturns(prices: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  return returns;
}

// ─── CORE SERVICE ─────────────────────────────────────────────

export const portfolioAnalyticsService = {
  /**
   * Generates a correlation matrix for all portfolio positions
   */
  async getCorrelationMatrix(positions: PortfolioPosition[]): Promise<CorrelationData[]> {
    if (positions.length < 2) return [];

    const symbols = positions.map(p => p.symbol);
    const historyMap = new Map<string, number[]>();

    // Fetch history for all symbols
    await Promise.all(
      symbols.map(async sym => {
        const history = await getHistoricalPrices(sym, 30);
        if (history.length > 2) {
          historyMap.set(sym, calculateReturns(history));
        }
      })
    );

    const correlations: CorrelationData[] = [];
    for (let i = 0; i < symbols.length; i++) {
      for (let j = i + 1; j < symbols.length; j++) {
        const s1 = symbols[i];
        const s2 = symbols[j];
        const h1 = historyMap.get(s1);
        const h2 = historyMap.get(s2);

        if (h1 && h2) {
          correlations.push({
            symbol1: s1,
            symbol2: s2,
            correlation: calculateCorrelation(h1, h2)
          });
        }
      }
    }

    return correlations;
  },

  /**
   * Simulates portfolio impact under various market scenarios
   */
  async runStressTests(positions: PortfolioPosition[]): Promise<StressTestResult[]> {
    const totalValue = positions.reduce((sum, p) => sum + p.marketValue, 0);
    if (totalValue === 0) return [];

    // Mock Betas for common assets
    const BETA_MAP: Record<string, number> = {
      'AAPL': 1.28, 'TSLA': 2.1, 'NVDA': 1.6, 'MSFT': 0.89, 'GOOGL': 1.05,
      'GLD': 0.1, 'SLV': 0.2, 'TLT': -0.3, 'VOO': 1.0, 'SPY': 1.0, 'QQQ': 1.2,
      'BTC': 2.5, 'ETH': 3.1
    };

    const scenarios = [
      { id: 'crash', name: 'Global Market Crash', marketMove: -0.20, desc: 'Simulates a 20% correction in broad equities' },
      { id: 'rally', name: 'Tech Melt-up', marketMove: 0.15, desc: 'Simulates a 15% rapid growth rally' },
      { id: 'rates', name: 'Interest Rate Spike', marketMove: -0.10, desc: 'Simulates impact of rapid central bank tightening' }
    ];

    return scenarios.map(scenario => {
      let impact = 0;
      positions.forEach(p => {
        const beta = BETA_MAP[p.symbol] || 1.1; // Fallback to slightly high beta
        impact += (p.marketValue * scenario.marketMove * beta);
      });

      return {
        scenario: scenario.name,
        impact: impact,
        impactPercent: (impact / totalValue) * 100,
        description: scenario.desc
      };
    });
  },

  /**
   * Scans for positions that can be sold for a tax benefit and replaced
   */
  getTaxLossOpportunities(positions: PortfolioPosition[]): TaxLossOpportunity[] {
    const ALTERNATIVES: Record<string, { swap: string; rationale: string }> = {
      'VOO': { swap: 'IVV', rationale: 'S&P 500 equivalent with near-identical footprint' },
      'SPY': { swap: 'VOO', rationale: 'Lower expense ratio S&P 500 exposure' },
      'QQQ': { swap: 'VGT', rationale: 'Focus on technology growth with lower overlap' },
      'SLV': { swap: 'SIVR', rationale: 'Silver ETF alternative' },
      'GLD': { swap: 'IAU', rationale: 'Lower cost gold exposure' }
    };

    return positions
      .filter(p => p.profitLossPercent < -10)
      .map(p => ({
        symbol: p.symbol,
        loss: p.profitLoss,
        lossPercent: p.profitLossPercent,
        alternative: ALTERNATIVES[p.symbol]?.swap || 'Sector ETF',
        rationale: ALTERNATIVES[p.symbol]?.rationale || 'Maintain sector exposure while realizing loss'
      }));
  }
};
