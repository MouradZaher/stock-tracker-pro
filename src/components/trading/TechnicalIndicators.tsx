import React from 'react';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { TechnicalIndicators as TechIndicatorsType } from '../../types/trading';

interface TechnicalIndicatorsProps {
    indicators: TechIndicatorsType;
}

const TechnicalIndicators: React.FC<TechnicalIndicatorsProps> = ({ indicators }) => {
    const getRsiColor = (status: string) => {
        switch (status) {
            case 'OVERBOUGHT': return 'var(--color-error)';
            case 'OVERSOLD': return 'var(--color-success)';
            default: return 'var(--color-text-secondary)';
        }
    };

    const getMacdColor = (macd: string) => {
        switch (macd) {
            case 'BULLISH': return 'var(--color-success)';
            case 'BEARISH': return 'var(--color-error)';
            default: return 'var(--color-warning)';
        }
    };

    return (
        <div className="technical-indicators glass-effect" style={{
            borderRadius: 'var(--radius-lg)',
            padding: '1rem',
            border: '1px solid var(--glass-border)',
            flex: 1
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.75rem'
            }}>
                <Activity size={16} style={{ color: 'var(--color-accent)' }} />
                <h4 style={{
                    margin: 0,
                    fontSize: '0.9rem',
                    color: 'var(--color-accent)',
                    fontWeight: 600,
                    textTransform: 'uppercase'
                }}>
                    Technicals
                </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {/* RSI */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                    <span style={{ opacity: 0.7 }}>RSI (14)</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>{indicators.rsi}</span>
                        <span style={{
                            fontSize: '0.65rem',
                            color: getRsiColor(indicators.rsiStatus),
                            opacity: 0.8
                        }}>
                            {indicators.rsiStatus === 'NEUTRAL' ? 'Neutral' : indicators.rsiStatus.toLowerCase()}
                        </span>
                    </div>
                </div>

                {/* MACD */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                    <span style={{ opacity: 0.7 }}>MACD</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {indicators.macd === 'BULLISH' ? <TrendingUp size={12} style={{ color: 'var(--color-success)' }} /> :
                            indicators.macd === 'BEARISH' ? <TrendingDown size={12} style={{ color: 'var(--color-error)' }} /> :
                                <Minus size={12} style={{ color: 'var(--color-warning)' }} />}
                        <span style={{
                            fontWeight: 500,
                            color: getMacdColor(indicators.macd)
                        }}>
                            {indicators.macd}
                        </span>
                    </div>
                </div>

                {/* MA 50 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                    <span style={{ opacity: 0.7 }}>MA 50</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>${indicators.ma50.toFixed(2)}</span>
                        <span style={{
                            fontSize: '0.65rem',
                            color: indicators.priceVsMa50 === 'ABOVE' ? 'var(--color-success)' : 'var(--color-error)'
                        }}>
                            {indicators.priceVsMa50}
                        </span>
                    </div>
                </div>

                {/* MA 200 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                    <span style={{ opacity: 0.7 }}>MA 200</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>${indicators.ma200.toFixed(2)}</span>
                        <span style={{
                            fontSize: '0.65rem',
                            color: indicators.priceVsMa200 === 'ABOVE' ? 'var(--color-success)' : 'var(--color-error)'
                        }}>
                            {indicators.priceVsMa200}
                        </span>
                    </div>
                </div>
            </div>

            {indicators.macdNote && (
                <div style={{
                    marginTop: '0.5rem',
                    paddingTop: '0.5rem',
                    borderTop: '1px solid var(--color-border)',
                    fontSize: '0.7rem',
                    opacity: 0.7,
                    fontStyle: 'italic'
                }}>
                    {indicators.macdNote}
                </div>
            )}
        </div>
    );
};

export default TechnicalIndicators;
