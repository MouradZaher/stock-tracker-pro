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
            padding: 'var(--spacing-md)',
            border: '1px solid var(--glass-border)',
            background: 'rgba(15, 15, 25, 0.4)'
        }}>
            <h4 style={{
                margin: `0 0 var(--spacing-md) 0`,
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-secondary)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
            }}>
                Risk Management
            </h4>

            <div className="table-container" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                <table className="analysis-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                            <th style={{ textAlign: 'left', padding: 'var(--spacing-xs) var(--spacing-sm)', color: 'var(--color-text-tertiary)', borderBottom: '1px solid var(--glass-border)' }}>Metric</th>
                            <th style={{ textAlign: 'left', padding: 'var(--spacing-xs) var(--spacing-sm)', color: 'var(--color-text-tertiary)', borderBottom: '1px solid var(--glass-border)' }}>Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', borderBottom: '1px solid var(--glass-border)', color: 'var(--color-text-secondary)' }}>Position Value</td>
                            <td style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', borderBottom: '1px solid var(--glass-border)', fontWeight: 600 }}>{formatCurrency(risk.positionValue)}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', borderBottom: '1px solid var(--glass-border)', color: 'var(--color-text-secondary)' }}>Account Risk</td>
                            <td style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', borderBottom: '1px solid var(--glass-border)', color: 'var(--color-error)', fontWeight: 600 }}>{risk.accountRiskPercent}% (${risk.riskAmount})</td>
                        </tr>
                        <tr>
                            <td style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', borderBottom: '1px solid var(--glass-border)', color: 'var(--color-text-secondary)' }}>Max Daily Loss</td>
                            <td style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', borderBottom: '1px solid var(--glass-border)', color: 'var(--color-warning)', fontWeight: 600 }}>{formatCurrency(risk.maxDailyLoss)} (3%)</td>
                        </tr>
                        <tr>
                            <td style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', color: 'var(--color-text-secondary)' }}>Reward Potential</td>
                            <td style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', color: 'var(--color-success)', fontWeight: 700 }}>{formatCurrency(risk.rewardPotential)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RiskSummary;
