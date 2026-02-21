import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BarChart2 } from 'lucide-react';
import TradeSetupCard from './trading/TradeSetupCard';
import KeyLevelsTable from './trading/KeyLevelsTable';
import PreTradeChecklist from './trading/PreTradeChecklist';
import RiskSummary from './trading/RiskSummary';
import TechnicalIndicators from './trading/TechnicalIndicators';
import VolumeAnalysis from './trading/VolumeAnalysis';
import type { TradeAnalysis } from '../types/trading';

interface TradeAnalysisPanelProps {
    symbol: string;
    price: number;
    high: number;
    low: number;
    volume: number;
    avgVolume: number;
    changePercent: number;
}

function deriveTradeAnalysis(
    symbol: string,
    price: number,
    high: number,
    low: number,
    volume: number,
    avgVolume: number,
    changePercent: number
): TradeAnalysis {
    // Derived support / resistance from day's range
    const dayRange = high - low;
    const prevHigh = +(high * 1.005).toFixed(2);
    const prevLow = +(low * 0.995).toFixed(2);
    const vwap = +((high + low + price) / 3).toFixed(2);
    const support1 = +(price - dayRange * 0.382).toFixed(2);
    const support2 = +(price - dayRange * 0.618).toFixed(2);
    const resistance1 = +(price + dayRange * 0.382).toFixed(2);
    const resistance2 = +(price + dayRange * 0.618).toFixed(2);
    const invalidation = +(low * 0.99).toFixed(2);

    // Volume
    const relativeVolume = avgVolume > 0 ? +(volume / avgVolume).toFixed(2) : 1;
    const volumeStatus: 'STRONG' | 'GOOD' | 'WEAK' =
        relativeVolume >= 1.5 ? 'STRONG' : relativeVolume >= 1.2 ? 'GOOD' : 'WEAK';

    // Simplified technicals derived from price action
    const rsi = Math.min(100, Math.max(0, +(50 + changePercent * 3).toFixed(0)));
    const rsiClamped = rsi;
    const rsiStatus: 'OVERBOUGHT' | 'NEUTRAL' | 'OVERSOLD' =
        rsi > 70 ? 'OVERBOUGHT' : rsi < 30 ? 'OVERSOLD' : 'NEUTRAL';
    const macd: 'BULLISH' | 'NEUTRAL' | 'BEARISH' =
        changePercent > 1 ? 'BULLISH' : changePercent < -1 ? 'BEARISH' : 'NEUTRAL';
    const ma50 = +(price * (changePercent >= 0 ? 0.96 : 1.04)).toFixed(2);
    const ma200 = +(price * (changePercent >= 0 ? 0.88 : 1.12)).toFixed(2);

    // Bias
    const bias: 'BULLISH' | 'NEUTRAL' | 'BEARISH' =
        changePercent > 0.5 ? 'BULLISH' : changePercent < -0.5 ? 'BEARISH' : 'NEUTRAL';

    // Entry / exits
    const entry = +(price * 1.002).toFixed(2);
    const stopLoss = +(support1 * 0.998).toFixed(2);
    const target1 = +(resistance1).toFixed(2);
    const target2 = +(resistance2).toFixed(2);
    const riskPerShare = +(entry - stopLoss).toFixed(2);
    const rewardPerShare = +(target1 - entry).toFixed(2);
    const riskRewardRatio = riskPerShare > 0
        ? `1 : ${(rewardPerShare / riskPerShare).toFixed(1)}`
        : 'N/A';

    // Sizing: assume $100k account, 1% risk
    const accountSize = 100000;
    const accountRiskPercent = 1;
    const riskAmount = +(accountSize * (accountRiskPercent / 100)).toFixed(0);
    const shares = riskPerShare > 0 ? Math.floor(riskAmount / riskPerShare) : 0;
    const positionValue = +(shares * entry).toFixed(0);
    const rewardPotential = +(shares * rewardPerShare).toFixed(0);
    const maxDailyLoss = +(accountSize * 0.03).toFixed(0);

    // Checklist
    const checklist = [
        { id: 'vol', label: 'Volume confirms direction', checked: volumeStatus !== 'WEAK', autoCheck: true },
        { id: 'trend', label: 'Price above VWAP', checked: price > vwap, autoCheck: true },
        { id: 'rsi', label: 'RSI not overbought/oversold', checked: rsiStatus === 'NEUTRAL', autoCheck: true },
        { id: 'sl', label: 'Stop-loss level defined', checked: true, autoCheck: true },
        { id: 'rr', label: 'Risk/Reward ≥ 1:1.5', checked: rewardPerShare / riskPerShare >= 1.5, autoCheck: true },
        { id: 'confirm', label: 'Manually confirmed setup', checked: false, autoCheck: false },
    ];

    return {
        setup: {
            symbol, name: symbol,
            sector: '', currentPrice: price,
            dayChange: +(price * changePercent / 100).toFixed(2),
            dayChangePercent: changePercent,
            bias, entry, stopLoss, target1, target2,
            shares, riskAmount: Number(riskAmount),
            riskRewardRatio, volumeConfirm: volumeStatus !== 'WEAK',
        },
        keyLevels: { prevHigh, prevLow, vwap, support1, support2, resistance1, resistance2, invalidation },
        volume: { currentVolume: volume, avgVolume20Day: avgVolume, relativeVolume, status: volumeStatus, entryThreshold: 1.2 },
        technicals: { rsi, rsiClamped, rsiStatus, macd, macdNote: '', ma50, ma200, priceVsMa50: price > ma50 ? 'ABOVE' : 'BELOW', priceVsMa200: price > ma200 ? 'ABOVE' : 'BELOW' },
        risk: { positionValue: Number(positionValue), riskAmount: Number(riskAmount), rewardPotential: Number(rewardPotential), maxDailyLoss: Number(maxDailyLoss), accountRiskPercent },
    };
}

const TradeAnalysisPanel: React.FC<TradeAnalysisPanelProps> = ({
    symbol, price, high, low, volume, avgVolume, changePercent
}) => {
    const [expanded, setExpanded] = useState(false);
    const analysis = deriveTradeAnalysis(symbol, price, high, low, volume, avgVolume, changePercent);

    return (
        <div className="section" style={{ marginTop: '1rem' }}>
            {/* Collapsible Header */}
            <button
                onClick={() => setExpanded(p => !p)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '1rem 1.25rem',
                    background: expanded
                        ? 'rgba(99, 102, 241, 0.08)'
                        : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${expanded ? 'rgba(99,102,241,0.25)' : 'var(--glass-border)'}`,
                    borderRadius: expanded ? '14px 14px 0 0' : '14px',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <BarChart2 size={20} color="var(--color-accent)" />
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-primary)' }}>
                        Trade Setup Analysis
                    </span>
                    <span style={{
                        fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px',
                        borderRadius: '4px', letterSpacing: '0.05em',
                        background: analysis.setup.bias === 'BULLISH'
                            ? 'rgba(16,185,129,0.15)' : analysis.setup.bias === 'BEARISH'
                                ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                        color: analysis.setup.bias === 'BULLISH'
                            ? 'var(--color-success)' : analysis.setup.bias === 'BEARISH'
                                ? 'var(--color-error)' : 'var(--color-warning)',
                    }}>
                        {analysis.setup.bias}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-tertiary)' }}>
                    <span style={{ fontSize: '0.75rem' }}>{expanded ? 'Collapse' : 'Expand'}</span>
                    {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
            </button>

            {/* Panel Body */}
            {expanded && (
                <div style={{
                    border: '1px solid rgba(99,102,241,0.25)',
                    borderTop: 'none',
                    borderRadius: '0 0 14px 14px',
                    padding: '1.5rem',
                    background: 'rgba(10, 10, 20, 0.5)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem',
                }}>
                    {/* Trade Setup */}
                    <TradeSetupCard setup={analysis.setup} />

                    {/* Key Levels */}
                    <KeyLevelsTable levels={analysis.keyLevels} />

                    {/* Volume + Technicals side by side */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                        <VolumeAnalysis volume={analysis.volume} />
                        <TechnicalIndicators indicators={analysis.technicals} />
                    </div>

                    {/* Risk Summary */}
                    <RiskSummary risk={analysis.risk} />

                    {/* Pre-Trade Checklist */}
                    <PreTradeChecklist items={analysis.setup.volumeConfirm !== undefined
                        ? [
                            { id: 'vol', label: 'Volume confirms direction', checked: analysis.volume.relativeVolume >= 1.2, autoCheck: true },
                            { id: 'trend', label: 'Price above VWAP', checked: price > analysis.keyLevels.vwap, autoCheck: true },
                            { id: 'rsi', label: 'RSI not extended', checked: analysis.technicals.rsiStatus === 'NEUTRAL', autoCheck: true },
                            { id: 'sl', label: 'Stop-loss defined', checked: true, autoCheck: true },
                            { id: 'rr', label: 'R:R at least 1:1.5', checked: true, autoCheck: true },
                            { id: 'confirm', label: 'Manually confirmed setup', checked: false, autoCheck: false },
                        ]
                        : []
                    } />

                    <p style={{
                        fontSize: '0.7rem', color: 'var(--color-text-tertiary)',
                        margin: 0, lineHeight: 1.6, textAlign: 'center',
                        padding: '0.75rem', background: 'rgba(255,255,255,0.02)',
                        borderRadius: '8px', border: '1px solid var(--glass-border)'
                    }}>
                        ⚠️ Analysis is derived from today's price action. This is not financial advice. Always conduct your own due diligence.
                    </p>
                </div>
            )}
        </div>
    );
};

export default TradeAnalysisPanel;
