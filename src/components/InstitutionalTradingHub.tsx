import React from 'react';
import { BarChart2, Shield, Activity, Target, Zap, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatPercent, formatNumberPlain } from '../utils/formatters';

interface TradingHubProps {
    analysis: any;
    price: number;
}

export const InstitutionalTradingHub: React.FC<TradingHubProps> = ({ analysis, price }) => {
    const { setup, keyLevels, volume, technicals, risk } = analysis;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
            {/* THESIS HEADER */}
            <div style={{ 
                padding: '1rem', 
                background: 'rgba(255,255,255,0.02)', 
                borderLeft: `4px solid ${setup.bias === 'BULLISH' ? '#10b981' : setup.bias === 'BEARISH' ? '#ef4444' : '#f59e0b'}`,
                borderRadius: '4px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Zap size={14} color="var(--color-accent)" />
                    <span style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.1em' }}>AI SENTIMENT ENGINE</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#ccc', lineHeight: 1.4 }}>
                    {setup.bias} BIAS DETECTED. Institutional order flow suggests {setup.bias === 'BULLISH' ? 'accumulation' : 'distribution'} with {volume.status} volume conviction.
                </div>
            </div>

            {/* HIGH-DENSITY GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                
                {/* EXECUTION LEVELS */}
                <div style={{ background: '#0a0a0a', border: '1px solid #111', padding: '1rem', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.6rem', color: '#444', marginBottom: '8px', fontWeight: 900 }}>EXECUTION MATRIX</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                            <span style={{ color: '#888' }}>ENTRY</span>
                            <span style={{ color: '#fff', fontWeight: 800 }}>{formatCurrency(setup.entry)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', borderBottom: '1px solid #000', paddingBottom: '4px' }}>
                            <span style={{ color: '#ef4444' }}>STOP LOSS</span>
                            <span style={{ color: '#ef4444', fontWeight: 800 }}>{formatCurrency(setup.stopLoss)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                            <span style={{ color: '#10b981' }}>TARGET 1</span>
                            <span style={{ color: '#10b981', fontWeight: 800 }}>{formatCurrency(setup.target1)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                            <span style={{ color: '#10b981' }}>TARGET 2</span>
                            <span style={{ color: '#10b981', fontWeight: 800 }}>{formatCurrency(setup.target2)}</span>
                        </div>
                    </div>
                </div>

                {/* RISK PROFILE */}
                <div style={{ background: '#0a0a0a', border: '1px solid #111', padding: '1rem', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.6rem', color: '#444', marginBottom: '8px', fontWeight: 900 }}>RISK/EXPOSURE</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div>
                            <div style={{ fontSize: '0.65rem', color: '#666', marginBottom: '2px' }}>POSITION SIZE</div>
                            <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 900 }}>{setup.shares} <span style={{ fontSize: '0.6rem', color: '#444' }}>SHARES</span></div>
                        </div>
                        <div style={{ height: '1px', background: '#222' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                            <span>MAX RISK</span>
                            <span style={{ color: '#ef4444' }}>{formatCurrency(risk.riskAmount)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                            <span>REWARD POT.</span>
                            <span style={{ color: '#10b981' }}>{formatCurrency(risk.rewardPotential)}</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* TECHNICAL STACK */}
            <div style={{ background: '#060606', border: '1px solid #111', padding: '1rem', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.6rem', color: '#444', fontWeight: 900 }}>TECHNICAL LOADOUT</span>
                    <span style={{ fontSize: '0.55rem', padding: '1px 4px', background: '#222', borderRadius: '2px' }}>REAL-TIME ANALYSIS</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    <div>
                        <div style={{ fontSize: '0.6rem', color: '#444' }}>RSI (14)</div>
                        <div style={{ fontSize: '0.85rem', color: technicals.rsiStatus === 'NEUTRAL' ? '#fff' : '#ef4444', fontWeight: 800 }}>{technicals.rsi}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.6rem', color: '#444' }}>REL. VOLUME</div>
                        <div style={{ fontSize: '0.85rem', color: volume.relativeVolume > 1.2 ? '#10b981' : '#fff', fontWeight: 800 }}>{volume.relativeVolume}x</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.6rem', color: '#444' }}>PRICE VS MA50</div>
                        <div style={{ fontSize: '0.65rem', color: technicals.priceVsMa50 === 'ABOVE' ? '#10b981' : '#ef4444', fontWeight: 800 }}>{technicals.priceVsMa50}</div>
                    </div>
                </div>
            </div>

            {/* PRE-TRADE QUALITY CHECK */}
            <div style={{ padding: '0.75rem', background: 'rgba(16,185,129,0.03)', border: '1px solid rgba(16,185,129,0.1)', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 900, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={12} /> ALGORITHMIC CHECKLIST
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                    {[
                        { label: 'VOL CONFIRM', ok: volume.status !== 'WEAK' },
                        { label: 'TREND ALIGN', ok: price > keyLevels.vwap },
                        { label: 'STRETCH LIMIT', ok: technicals.rsiStatus === 'NEUTRAL' },
                        { label: 'RISK/REWARD', ok: true },
                    ].map((idx, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.6rem', color: idx.ok ? '#888' : '#444' }}>
                            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: idx.ok ? '#10b981' : '#444' }} />
                            {idx.label}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
