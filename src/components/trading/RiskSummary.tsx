import React from 'react';
import { Shield, DollarSign, Target, AlertTriangle } from 'lucide-react';
import type { RiskSummary as RiskSummaryType } from '../../types/trading';

interface RiskSummaryProps {
    risk: RiskSummaryType;
}

const RiskSummary: React.FC<RiskSummaryProps> = ({ risk }) => {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    return (
        <div className="risk-summary glass-effect" style={{
            borderRadius: 'var(--radius-lg)',
            padding: '1rem',
            border: '1px solid var(--glass-border)',
            marginBottom: '1rem'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.75rem'
            }}>
                <Shield size={16} style={{ color: 'var(--color-accent)' }} />
                <h4 style={{
                    margin: 0,
                    fontSize: '0.9rem',
                    color: 'var(--color-accent)',
                    fontWeight: 600,
                    textTransform: 'uppercase'
                }}>
                    Risk Summary
                </h4>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.75rem'
            }}>
                {/* Position Value */}
                <div style={{
                    background: 'rgba(6, 182, 212, 0.08)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', opacity: 0.7, fontSize: '0.7rem' }}>
                        <DollarSign size={12} />
                        Position Value
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, fontFamily: 'monospace' }}>
                        {formatCurrency(risk.positionValue)}
                    </div>
                </div>

                {/* Risk Amount */}
                <div style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', opacity: 0.7, fontSize: '0.7rem' }}>
                        <AlertTriangle size={12} />
                        Risk ({risk.accountRiskPercent}%)
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, fontFamily: 'monospace', color: 'var(--color-error)' }}>
                        {formatCurrency(risk.riskAmount)}
                    </div>
                </div>

                {/* Reward Potential */}
                <div style={{
                    background: 'rgba(16, 185, 129, 0.08)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', opacity: 0.7, fontSize: '0.7rem' }}>
                        <Target size={12} />
                        Reward Potential
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, fontFamily: 'monospace', color: 'var(--color-success)' }}>
                        {formatCurrency(risk.rewardPotential)}
                    </div>
                </div>

                {/* Max Daily Loss */}
                <div style={{
                    background: 'rgba(245, 158, 11, 0.08)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', opacity: 0.7, fontSize: '0.7rem' }}>
                        <Shield size={12} />
                        Max Daily Loss (3%)
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, fontFamily: 'monospace', color: 'var(--color-warning)' }}>
                        {formatCurrency(risk.maxDailyLoss)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RiskSummary;
