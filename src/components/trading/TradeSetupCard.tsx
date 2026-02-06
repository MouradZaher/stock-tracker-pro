import React from 'react';
import { TrendingUp, TrendingDown, Target, AlertTriangle } from 'lucide-react';
import type { TradeSetup } from '../../types/trading';

interface TradeSetupCardProps {
    setup: TradeSetup;
}

const TradeSetupCard: React.FC<TradeSetupCardProps> = ({ setup }) => {
    const getBiasColor = (bias: string) => {
        switch (bias) {
            case 'BULLISH': return 'var(--color-success)';
            case 'BEARISH': return 'var(--color-error)';
            default: return 'var(--color-warning)';
        }
    };

    const getBiasBg = (bias: string) => {
        switch (bias) {
            case 'BULLISH': return 'rgba(16, 185, 129, 0.15)';
            case 'BEARISH': return 'rgba(239, 68, 68, 0.15)';
            default: return 'rgba(245, 158, 11, 0.15)';
        }
    };

    return (
        <div className="trade-setup-card glass-effect" style={{
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            border: '1px solid var(--glass-border)',
            marginBottom: '1rem'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid var(--color-border)'
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                            {setup.symbol}
                        </h3>
                        <span style={{
                            fontSize: '0.7rem',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            background: getBiasBg(setup.bias),
                            color: getBiasColor(setup.bias),
                            fontWeight: 600
                        }}>
                            {setup.bias}
                        </span>
                    </div>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', opacity: 0.7 }}>
                        {setup.name} • {setup.sector}
                    </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'monospace' }}>
                        ${setup.currentPrice.toFixed(2)}
                    </div>
                    <div style={{
                        color: setup.dayChange >= 0 ? 'var(--color-success)' : 'var(--color-error)',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '0.25rem'
                    }}>
                        {setup.dayChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {setup.dayChange >= 0 ? '+' : ''}{setup.dayChangePercent.toFixed(2)}%
                    </div>
                </div>
            </div>

            {/* Trade Parameters Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.75rem'
            }}>
                {/* Entry */}
                <div className="param-box" style={{
                    background: 'rgba(6, 182, 212, 0.1)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    borderLeft: '3px solid var(--color-accent)'
                }}>
                    <div style={{ fontSize: '0.7rem', opacity: 0.6, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Entry</div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, fontFamily: 'monospace' }}>${setup.entry.toFixed(2)}</div>
                </div>

                {/* Stop Loss */}
                <div className="param-box" style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    borderLeft: '3px solid var(--color-error)'
                }}>
                    <div style={{ fontSize: '0.7rem', opacity: 0.6, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Stop Loss</div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, fontFamily: 'monospace' }}>${setup.stopLoss.toFixed(2)}</div>
                </div>

                {/* Target 1 */}
                <div className="param-box" style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    borderLeft: '3px solid var(--color-success)'
                }}>
                    <div style={{ fontSize: '0.7rem', opacity: 0.6, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Target 1</div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, fontFamily: 'monospace' }}>${setup.target1.toFixed(2)}</div>
                </div>

                {/* Target 2 */}
                <div className="param-box" style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    borderLeft: '3px solid var(--color-success)'
                }}>
                    <div style={{ fontSize: '0.7rem', opacity: 0.6, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Target 2</div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, fontFamily: 'monospace' }}>${setup.target2.toFixed(2)}</div>
                </div>
            </div>

            {/* Bottom Stats */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--color-border)',
                fontSize: '0.8rem'
            }}>
                <div>
                    <span style={{ opacity: 0.6 }}>Shares: </span>
                    <span style={{ fontWeight: 600 }}>{setup.shares.toLocaleString()}</span>
                </div>
                <div>
                    <span style={{ opacity: 0.6 }}>Risk: </span>
                    <span style={{ fontWeight: 600, color: 'var(--color-error)' }}>${setup.riskAmount.toLocaleString()}</span>
                </div>
                <div>
                    <span style={{ opacity: 0.6 }}>R:R: </span>
                    <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>{setup.riskRewardRatio}</span>
                </div>
                {setup.volumeConfirm && (
                    <div style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Target size={12} />
                        Vol ✓
                    </div>
                )}
            </div>
        </div>
    );
};

export default TradeSetupCard;
