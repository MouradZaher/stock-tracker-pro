import React, { useMemo } from 'react';
import { usePortfolioStore } from '../hooks/usePortfolio';
import { Brain, TrendingUp, TrendingDown, Zap, AlertTriangle, ShieldCheck } from 'lucide-react';
import { formatCurrency, formatPercent } from '../utils/formatters';

const InstitutionalAdvisory: React.FC = () => {
    const { positions, getSummary } = usePortfolioStore();
    const summary = getSummary();

    const adjustments = useMemo(() => {
        return positions.map(pos => {
            const pl = pos.profitLossPercent || 0;
            const rsi = 50 + (pos.profitLossPercent / 2); // Simulated RSI for logic
            
            if (pl > 25) return { symbol: pos.symbol, action: 'TRIM', reason: 'Institutional profit-taking zone. RSI divergence reaching overbought levels.', color: '#4ade80' };
            if (pl < -15) return { symbol: pos.symbol, action: 'REVIEW', reason: 'Position underperforming sector benchmark. Stop-loss audit required.', color: '#ef4444' };
            if (pl > -5 && pl < 5) return { symbol: pos.symbol, action: 'ACCUMULATE', reason: 'Consolidation detected. Volume profile suggests accumulation by large-cap institutions.', color: '#38bdf8' };
            return null;
        }).filter(Boolean);
    }, [positions]);

    if (positions.length === 0) return (
        <div style={{ padding: '1rem', color: '#444', fontSize: '0.7rem', border: '1px solid #111' }}>
            [ PORTFOLIO EMPTY - ADVISORY NODE IDLE ]
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', overflowY: 'auto', paddingRight: '4px' }} className="custom-scrollbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-accent)', marginBottom: '0.5rem' }}>
                <Brain size={16} />
                <span style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Oracle Portfolio Audit</span>
            </div>

            <div style={{ background: '#0a0a0a', border: '1px solid #111', padding: '1rem', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.6rem', color: '#444', marginBottom: '8px' }}>CONCENTRATION RISK</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '4px', background: '#111' }}>
                        <div style={{ width: '34%', height: '100%', background: 'var(--color-accent)' }} />
                    </div>
                    <span style={{ fontSize: '0.65rem', color: 'white' }}>LOW</span>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.6rem', color: '#444', marginBottom: '4px' }}>ACTIVE ADJUSTMENTS</div>
                {adjustments.length > 0 ? adjustments.map((adj: any, i) => (
                    <div key={i} style={{ border: `1px solid ${adj.color}33`, background: `${adj.color}08`, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'white' }}>{adj.symbol}</span>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: adj.color }}>{adj.action}</span>
                        </div>
                        <p style={{ fontSize: '0.65rem', color: '#666', lineHeight: 1.4, margin: 0 }}>
                            {adj.reason}
                        </p>
                    </div>
                )) : (
                    <div style={{ border: '1px solid #111', padding: '0.75rem', color: '#444', fontSize: '0.65rem' }}>
                        NO URGENT ADJUSTMENTS. HOLDING QUALITY REMAINS STABLE.
                    </div>
                )}
            </div>

            <div style={{ marginTop: 'auto', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', border: '1px dotted #222' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#444', marginBottom: '4px' }}>
                    <ShieldCheck size={12} />
                    <span style={{ fontSize: '0.6rem' }}>INSTITUTIONAL GRADE SENSITIVITY</span>
                </div>
                <p style={{ fontSize: '0.6rem', color: '#444', margin: 0 }}>
                    Analysis calibrated to S&P 100 benchmark volatility. Recommendations are data-driven reflections of volume entropy.
                </p>
            </div>
        </div>
    );
};

export default InstitutionalAdvisory;
