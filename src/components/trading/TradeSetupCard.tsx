import React from 'react';
import { TrendingUp, TrendingDown, Target, AlertTriangle } from 'lucide-react';
import type { TradeSetup } from '../../types/trading';

interface TradeSetupCardProps {
    setup: TradeSetup;
}

const TradeSetupCard: React.FC<TradeSetupCardProps> = ({ setup }) => {
    return (
        <div className="trade-setup-card glass-effect" style={{
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            border: '1px solid var(--glass-border)',
            marginBottom: '1rem',
            background: 'rgba(15, 15, 25, 0.4)'
        }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Detailed Trade Analysis
            </h3>

            <div className="table-container" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                <table className="analysis-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                            <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--color-text-tertiary)', borderBottom: '1px solid var(--glass-border)' }}>Parameter</th>
                            <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--color-text-tertiary)', borderBottom: '1px solid var(--glass-border)' }}>Value</th>
                            <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--color-text-tertiary)', borderBottom: '1px solid var(--glass-border)' }}>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--glass-border)', color: 'var(--color-text-secondary)' }}>Bias</td>
                            <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--glass-border)', color: setup.bias === 'BULLISH' ? 'var(--color-success)' : setup.bias === 'BEARISH' ? 'var(--color-error)' : 'var(--color-warning)', fontWeight: 700 }}>{setup.bias}</td>
                            <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--glass-border)', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>Primary sentiment for session</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--glass-border)', color: 'var(--color-text-secondary)' }}>Planned Entry</td>
                            <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--glass-border)', fontWeight: 600 }}>${setup.entry.toFixed(2)}</td>
                            <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--glass-border)', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>Wait for 5m consolidation</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--glass-border)', color: 'var(--color-text-secondary)' }}>Stop Loss</td>
                            <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--glass-border)', color: 'var(--color-error)', fontWeight: 600 }}>${setup.stopLoss.toFixed(2)}</td>
                            <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--glass-border)', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>Hard stop - manual exit if violated</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--glass-border)', color: 'var(--color-text-secondary)' }}>Primary Target</td>
                            <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--glass-border)', color: 'var(--color-success)', fontWeight: 600 }}>${setup.target1.toFixed(2)}</td>
                            <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--glass-border)', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>Scaling out 50% here</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--glass-border)', color: 'var(--color-text-secondary)' }}>Runner Target</td>
                            <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--glass-border)', color: 'var(--color-accent)', fontWeight: 600 }}>${setup.target2.toFixed(2)}</td>
                            <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--glass-border)', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>Trailing stop for extra juice</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--glass-border)', color: 'var(--color-text-secondary)' }}>Share Count</td>
                            <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--glass-border)', fontWeight: 600 }}>{setup.shares.toLocaleString()}</td>
                            <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--glass-border)', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>Based on 1% account risk</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '10px 12px', color: 'var(--color-text-secondary)' }}>Risk Amount</td>
                            <td style={{ padding: '10px 12px', color: 'var(--color-error)', fontWeight: 600 }}>${setup.riskAmount.toLocaleString()}</td>
                            <td style={{ padding: '10px 12px', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>Reward Ratio: {setup.riskRewardRatio}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <style>{`
                .analysis-table tr:hover {
                    background: rgba(255, 255, 255, 0.02);
                }
            `}</style>
        </div>
    );
};

export default TradeSetupCard;
