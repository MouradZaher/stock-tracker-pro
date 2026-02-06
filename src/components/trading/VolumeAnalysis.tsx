import React from 'react';
import { BarChart3 } from 'lucide-react';
import type { VolumeData } from '../../types/trading';

interface VolumeAnalysisProps {
    volume: VolumeData;
}

const VolumeAnalysis: React.FC<VolumeAnalysisProps> = ({ volume }) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'STRONG': return 'var(--color-success)';
            case 'GOOD': return 'var(--color-accent)';
            default: return 'var(--color-error)';
        }
    };

    const getStatusBg = (status: string) => {
        switch (status) {
            case 'STRONG': return 'rgba(16, 185, 129, 0.15)';
            case 'GOOD': return 'rgba(6, 182, 212, 0.15)';
            default: return 'rgba(239, 68, 68, 0.15)';
        }
    };

    const formatVolume = (vol: number) => {
        if (vol >= 1000000000) return (vol / 1000000000).toFixed(2) + 'B';
        if (vol >= 1000000) return (vol / 1000000).toFixed(2) + 'M';
        if (vol >= 1000) return (vol / 1000).toFixed(2) + 'K';
        return vol.toString();
    };

    return (
        <div className="volume-analysis glass-effect" style={{
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
                <BarChart3 size={16} style={{ color: 'var(--color-accent)' }} />
                <h4 style={{
                    margin: 0,
                    fontSize: '0.9rem',
                    color: 'var(--color-accent)',
                    fontWeight: 600,
                    textTransform: 'uppercase'
                }}>
                    Volume Analysis
                </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ opacity: 0.7 }}>Current Vol</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>{formatVolume(volume.currentVolume)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ opacity: 0.7 }}>20-Day Avg</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>{formatVolume(volume.avgVolume20Day)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ opacity: 0.7 }}>Relative</span>
                    <span style={{
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        color: volume.relativeVolume >= 1.5 ? 'var(--color-success)' : volume.relativeVolume >= 1.2 ? 'var(--color-accent)' : 'var(--color-text-primary)'
                    }}>
                        {volume.relativeVolume.toFixed(2)}x
                    </span>
                </div>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '0.5rem',
                    paddingTop: '0.5rem',
                    borderTop: '1px solid var(--color-border)'
                }}>
                    <span style={{ opacity: 0.7, fontSize: '0.8rem' }}>Status</span>
                    <span style={{
                        fontSize: '0.75rem',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        background: getStatusBg(volume.status),
                        color: getStatusColor(volume.status),
                        fontWeight: 600
                    }}>
                        {volume.status}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default VolumeAnalysis;
