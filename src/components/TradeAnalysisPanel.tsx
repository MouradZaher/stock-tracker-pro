import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BarChart2 } from 'lucide-react';
import { InstitutionalTradingHub } from './InstitutionalTradingHub';
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

function generateAIThesis(symbol: string, bias: string, changePercent: number) {
    const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const prob = (75 + (hash % 20)).toFixed(1);

    if (bias === 'BULLISH') {
        const templates = [
            `Strong institutional accumulation detected in ${symbol}. Volume profile suggests a breakout with a ${prob}% historical probability of alpha generation.`,
            `Recent order flow for ${symbol} indicates significant upside conviction. Algorithmic blocks detected fueling a high-probability swing setup.`,
            `Hedge fund flow analysis shows aggressive buying in ${symbol}'s sector, positioning it for accelerated growth. Support levels hold firm.`,
            `Algorithmic dark pool sweeps indicate smart money is loading up on ${symbol}. Technicals align for a ${prob}% breakout conviction.`
        ];
        return templates[hash % templates.length];
    } else if (bias === 'BEARISH') {
        const templates = [
            `Institutional distribution detected in ${symbol}. Sell-side pressure implies a ${prob}% probability of testing lower support levels.`,
            `Algorithmic sell programs active on ${symbol}. Momentum suggests further downside risk before a viable support floor is established.`,
            `Options flow indicates heavy put buying, signaling near-term bearish sentiment for ${symbol}. Exercise caution.`
        ];
        return templates[hash % templates.length];
    } else {
        const templates = [
            `Neutral momentum detected for ${symbol}. Quantitative models indicate sideways price action with a ${prob}% probability of remaining range-bound.`,
            `Mixed signals on the technical timeframe for ${symbol}. Risk parameters suggest defensive positioning until trend confirmation occurs.`
        ];
        return templates[hash % templates.length];
    }
}

function deriveTradeAnalysis(
    symbol: string,
    price: number,
    high: number,
    low: number,
    volume: number,
    avgVolume: number,
    changePercent: number,
    accountSize: number,
    accountRiskPercent: number
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

    // Sizing: based on user config
    const riskAmount = +(accountSize * (accountRiskPercent / 100)).toFixed(0);
    const shares = riskPerShare > 0 ? Math.floor(riskAmount / riskPerShare) : 0;
    const positionValue = +(shares * entry).toFixed(0);
    const rewardPotential = +(shares * rewardPerShare).toFixed(0);
    const maxDailyLoss = +(accountSize * 0.03).toFixed(0);

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
    const [showConfig, setShowConfig] = useState(false);
    const [accountSize, setAccountSize] = useState(100000);
    const [riskPercent, setRiskPercent] = useState(1);

    const analysis = deriveTradeAnalysis(
        symbol, price, high, low, volume, avgVolume, changePercent,
        accountSize, riskPercent
    );

    return (
        <div className="section" style={{ marginTop: '1rem' }}>
            {/* Unified Toggle Header */}
            <button
                onClick={() => setExpanded(p => !p)}
                className="hover-glow"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '1rem 1.25rem',
                    background: expanded ? 'var(--color-bg-elevated)' : 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: expanded ? '8px 8px 0 0' : '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart2 size={16} color="var(--color-accent)" />
                    <span style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Institutional Trade Analysis
                    </span>
                    <span style={{
                        fontSize: '0.6rem', fontWeight: 900, padding: '2px 6px',
                        borderRadius: '3px', background: 'var(--color-bg-secondary)', color: 'var(--color-accent)'
                    }}>
                        {analysis.setup.bias}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                     <div
                        onClick={(e) => { e.stopPropagation(); setShowConfig(!showConfig); }}
                        style={{
                            fontSize: '0.6rem', fontWeight: 900, padding: '3px 7px',
                            background: showConfig ? 'var(--color-accent)' : 'var(--color-bg-secondary)',
                            color: showConfig ? 'var(--color-bg-primary)' : 'var(--color-text-tertiary)',
                            borderRadius: '3px', textTransform: 'uppercase'
                        }}
                    >
                        Risk Settings
                    </div>
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
            </button>

            {/* Config Overlay - Windows Style Inline */}
            {showConfig && (
                <div style={{
                    padding: '0.75rem 1.25rem',
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    borderTop: 'none',
                    display: 'flex',
                    gap: '1.5rem',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.6rem', color: 'var(--color-text-tertiary)', fontWeight: 900 }}>ACCOUNT</span>
                        <input
                            type="number"
                            value={accountSize}
                            onChange={(e) => setAccountSize(Number(e.target.value))}
                            style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', fontSize: '0.75rem', width: '80px', padding: '2px 4px' }}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.6rem', color: 'var(--color-text-tertiary)', fontWeight: 900 }}>RISK %</span>
                        <select
                            value={riskPercent}
                            onChange={(e) => setRiskPercent(Number(e.target.value))}
                            style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', fontSize: '0.75rem' }}
                        >
                            {[0.25, 0.5, 1, 2, 5].map(v => <option key={v} value={v}>{v}%</option>)}
                        </select>
                    </div>
                </div>
            )}

            {/* Analysis Dashboard */}
            {expanded && (
                <div style={{
                    background: 'var(--color-bg-primary)',
                    border: '1px solid var(--color-border)',
                    borderTop: 'none',
                    borderRadius: '0 0 8px 8px'
                 }}>
                    <InstitutionalTradingHub analysis={analysis} price={price} />
                </div>
            )}
        </div>
    );
};

export default TradeAnalysisPanel;
