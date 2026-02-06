import React from 'react';
import type { KeyLevels } from '../../types/trading';

interface KeyLevelsTableProps {
    levels: KeyLevels;
}

const KeyLevelsTable: React.FC<KeyLevelsTableProps> = ({ levels }) => {
    const formatPrice = (price: number) => `$${price.toFixed(2)}`;

    return (
        <div className="key-levels-table glass-effect" style={{
            borderRadius: 'var(--radius-lg)',
            padding: '1rem',
            border: '1px solid var(--glass-border)',
            marginBottom: '1rem'
        }}>
            <h4 style={{
                margin: '0 0 0.75rem',
                fontSize: '0.9rem',
                color: 'var(--color-accent)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
            }}>
                Key Levels Summary
            </h4>

            <div style={{ overflowX: 'auto' }}>
                <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.8rem'
                }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <th style={{ padding: '0.5rem', textAlign: 'left', opacity: 0.7, fontWeight: 500 }}>Prev High</th>
                            <th style={{ padding: '0.5rem', textAlign: 'left', opacity: 0.7, fontWeight: 500 }}>Prev Low</th>
                            <th style={{ padding: '0.5rem', textAlign: 'left', opacity: 0.7, fontWeight: 500 }}>VWAP</th>
                            <th style={{ padding: '0.5rem', textAlign: 'left', opacity: 0.7, fontWeight: 500, color: 'var(--color-error)' }}>S1</th>
                            <th style={{ padding: '0.5rem', textAlign: 'left', opacity: 0.7, fontWeight: 500, color: 'var(--color-error)' }}>S2</th>
                            <th style={{ padding: '0.5rem', textAlign: 'left', opacity: 0.7, fontWeight: 500, color: 'var(--color-success)' }}>R1</th>
                            <th style={{ padding: '0.5rem', textAlign: 'left', opacity: 0.7, fontWeight: 500, color: 'var(--color-success)' }}>R2</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ padding: '0.5rem', fontFamily: 'monospace', fontWeight: 500 }}>{formatPrice(levels.prevHigh)}</td>
                            <td style={{ padding: '0.5rem', fontFamily: 'monospace', fontWeight: 500 }}>{formatPrice(levels.prevLow)}</td>
                            <td style={{ padding: '0.5rem', fontFamily: 'monospace', fontWeight: 500, color: 'var(--color-accent)' }}>{formatPrice(levels.vwap)}</td>
                            <td style={{ padding: '0.5rem', fontFamily: 'monospace', fontWeight: 500 }}>{formatPrice(levels.support1)}</td>
                            <td style={{ padding: '0.5rem', fontFamily: 'monospace', fontWeight: 500 }}>{formatPrice(levels.support2)}</td>
                            <td style={{ padding: '0.5rem', fontFamily: 'monospace', fontWeight: 500 }}>{formatPrice(levels.resistance1)}</td>
                            <td style={{ padding: '0.5rem', fontFamily: 'monospace', fontWeight: 500 }}>{formatPrice(levels.resistance2)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Invalidation Level */}
            <div style={{
                marginTop: '0.75rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8rem'
            }}>
                <span style={{ opacity: 0.7 }}>Invalidation:</span>
                <span style={{
                    color: 'var(--color-error)',
                    fontWeight: 600,
                    fontFamily: 'monospace'
                }}>
                    Below {formatPrice(levels.invalidation)}
                </span>
            </div>
        </div>
    );
};

export default KeyLevelsTable;
