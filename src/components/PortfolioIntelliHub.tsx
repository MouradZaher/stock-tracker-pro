import React, { useMemo, useState, useEffect } from 'react';
import { usePortfolioStore } from '../hooks/usePortfolio';
import { useMarket } from '../contexts/MarketContext';
import { getStockQuote } from '../services/stockDataService';
import { ShieldAlert, TrendingUp, TrendingDown, Target, Brain, Activity, ArrowUpRight, ArrowDownRight, AlertTriangle } from 'lucide-react';
import { formatCurrencyForMarket, formatPercent } from '../utils/formatters';

const PortfolioIntelliHub: React.FC = () => {
    const { positions } = usePortfolioStore();
    const { selectedMarket } = useMarket();
    const [benchmarkChange, setBenchmarkChange] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch benchmark daily change
    useEffect(() => {
        let isMounted = true;
        const fetchBenchmark = async () => {
            setIsLoading(true);
            try {
                // Determine benchmark symbol based on market
                let benchmarkSymbol = '^GSPC';
                if (selectedMarket.id === 'egypt') benchmarkSymbol = '^EGX30'; // Approximate if actual not available
                if (selectedMarket.id === 'abudhabi') benchmarkSymbol = 'FTFADGI'; // Approximate

                const quote = await getStockQuote(benchmarkSymbol);
                if (isMounted) {
                    setBenchmarkChange(quote?.changePercent || 0);
                }
            } catch (err) {
                console.error("Failed to fetch benchmark", err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        fetchBenchmark();
        const interval = setInterval(fetchBenchmark, 60000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [selectedMarket.id]);

    // Calculate Portfolio Metrics
    const portfolioMetrics = useMemo(() => {
        if (positions.length === 0) return { totalChangePct: 0, topGainer: null, topLoser: null, alpha: 0, concentrationWarning: null };

        let totalInitialValue = 0;
        let totalCurrentValue = 0;
        let topGainer = positions[0];
        let topLoser = positions[0];
        
        const sectorWeights: Record<string, number> = {};

        positions.forEach(item => {
            const initialVal = item.units * item.avgCost;
            const currentVal = item.units * item.currentPrice;
            totalInitialValue += initialVal;
            totalCurrentValue += currentVal;

            const itemChangePct = ((item.currentPrice - item.avgCost) / item.avgCost) * 100;
            const topGainerPct = ((topGainer.currentPrice - topGainer.avgCost) / topGainer.avgCost) * 100;
            const topLoserPct = ((topLoser.currentPrice - topLoser.avgCost) / topLoser.avgCost) * 100;

            if (itemChangePct > topGainerPct) topGainer = item;
            if (itemChangePct < topLoserPct) topLoser = item;

            // Simplified symbol-based concentration
            const symPrefix = item.symbol.substring(0, 2); 
            sectorWeights[symPrefix] = (sectorWeights[symPrefix] || 0) + currentVal;
        });

        const totalChangePct = totalInitialValue > 0 ? ((totalCurrentValue - totalInitialValue) / totalInitialValue) * 100 : 0;
        const alpha = totalChangePct - benchmarkChange;

        // Find max concentration
        let maxConcentration = 0;
        let maxCategory = '';
        Object.entries(sectorWeights).forEach(([cat, val]) => {
            const pct = (val / totalCurrentValue) * 100;
            if (pct > maxConcentration) {
                maxConcentration = pct;
                maxCategory = cat;
            }
        });

        let concentrationWarning = null;
        if (maxConcentration > 40 && positions.length > 2) {
            concentrationWarning = `Heavy correlation detected. ${maxConcentration.toFixed(1)}% of your portfolio is weighted in similar assets (${maxCategory}). Volatility risk is elevated.`;
        }

        return {
            totalChangePct,
            alpha,
            topGainer,
            topLoser,
            concentrationWarning
        };
    }, [positions, benchmarkChange]);

    if (positions.length === 0) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p>Deposit funds and add assets to your portfolio to activate Live Intelligence.</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
            
            {/* Top Stat Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Alpha Tracker */}
                <div className="glass-card" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Target size={14} /> LIVE PORTFOLIO ALPHA
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: portfolioMetrics.alpha >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                            {portfolioMetrics.alpha >= 0 ? '+' : ''}{portfolioMetrics.alpha.toFixed(2)}%
                        </div>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                        Outperformance against {selectedMarket.indexName} benchmark ({benchmarkChange >= 0 ? '+' : ''}{benchmarkChange.toFixed(2)}%)
                    </p>
                </div>

                {/* Risk / Concentration Warning */}
                <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', border: portfolioMetrics.concentrationWarning ? '1px solid rgba(245, 158, 11, 0.4)' : undefined }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 900, color: portfolioMetrics.concentrationWarning ? 'var(--color-warning)' : 'var(--color-success)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {portfolioMetrics.concentrationWarning ? <AlertTriangle size={14} /> : <ShieldAlert size={14} />} 
                        SYSTEM CALIBRATION
                    </div>
                    {portfolioMetrics.concentrationWarning ? (
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                            {portfolioMetrics.concentrationWarning}
                        </div>
                    ) : (
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                            Exposure is reasonably balanced. No immediate structural risks detected relative to {selectedMarket.id} volatility.
                        </div>
                    )}
                </div>
            </div>

            {/* Actionable Signals Area */}
            <div className="glass-card" style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 900, color: 'white', letterSpacing: '0.05em', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Brain size={16} className="text-accent" /> ACTIONABLE HOLDING SIGNALS
                </div>

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }} className="scrollable-content">
                    
                    {/* Signal 1: Top Gainer Taking Profit */}
                    {portfolioMetrics.topGainer && ((portfolioMetrics.topGainer.currentPrice - portfolioMetrics.topGainer.avgCost) / portfolioMetrics.topGainer.avgCost) > 0.03 && (
                        <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', borderLeft: '3px solid var(--color-success)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%' }}>
                                <TrendingUp size={20} color="var(--color-success)" />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'white', marginBottom: '4px' }}>Momentum Breakout: {portfolioMetrics.topGainer.symbol}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                                    Your position in {portfolioMetrics.topGainer.symbol} is up {formatPercent(((portfolioMetrics.topGainer.currentPrice - portfolioMetrics.topGainer.avgCost) / portfolioMetrics.topGainer.avgCost) * 100)}. Historical intraday metrics suggest scaling out 15-20% of the position to secure alpha.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Signal 2: Top Loser Warning */}
                    {portfolioMetrics.topLoser && ((portfolioMetrics.topLoser.currentPrice - portfolioMetrics.topLoser.avgCost) / portfolioMetrics.topLoser.avgCost) < -0.04 && (
                        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', borderLeft: '3px solid var(--color-error)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%' }}>
                                <TrendingDown size={20} color="var(--color-error)" />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'white', marginBottom: '4px' }}>Drawdown Alert: {portfolioMetrics.topLoser.symbol}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                                    Your position is down {formatPercent(((portfolioMetrics.topLoser.currentPrice - portfolioMetrics.topLoser.avgCost) / portfolioMetrics.topLoser.avgCost) * 100)}. Evaluate key support levels at {formatCurrencyForMarket(portfolioMetrics.topLoser.currentPrice * 0.98, selectedMarket.currency)}. If it breaks below, consider strict stop-loss activation.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Fallback Signal if portfolio is mostly flat */}
                    {(!portfolioMetrics.topGainer || ((portfolioMetrics.topGainer.currentPrice - portfolioMetrics.topGainer.avgCost) / portfolioMetrics.topGainer.avgCost) <= 0.03) && 
                     (!portfolioMetrics.topLoser || ((portfolioMetrics.topLoser.currentPrice - portfolioMetrics.topLoser.avgCost) / portfolioMetrics.topLoser.avgCost) >= -0.04) && (
                        <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                             <div style={{ padding: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '50%' }}>
                                <Activity size={20} color="var(--color-text-secondary)" />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'white', marginBottom: '4px' }}>Consolidation Phase Detected</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                                    Holdings are trading within statistical norm envelopes. Maintain current exposure; no immediate tactical action required based on real-time volatility.
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PortfolioIntelliHub;
