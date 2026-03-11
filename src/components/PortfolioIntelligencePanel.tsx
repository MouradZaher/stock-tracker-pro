import React, { useState, useEffect } from 'react';
import {
    TrendingUp, TrendingDown, AlertTriangle, Shield, DollarSign,
    Calendar, BarChart2, Target, Zap, RefreshCw, ChevronDown, ChevronRight
} from 'lucide-react';
import {
    calculateCorrelationMatrix, runStressTest, scanTaxLossHarvesting,
    calculateBenchmark, buildEarningsCalendar, STRESS_SCENARIOS,
    type StressTestResult, type HarvestingOpportunity, type EarningsEvent,
    type BenchmarkResult,
} from '../services/portfolioAnalyticsService';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { usePortfolioStore } from '../hooks/usePortfolio';

// ─── Correlation Heatmap ──────────────────────────────────────

function getCorrelationColor(value: number): string {
    if (value >= 0.8) return '#ef4444';   // high correlation = red (risky)
    if (value >= 0.5) return '#f97316';   // moderate = orange
    if (value >= 0.1) return '#eab308';   // low positive = yellow
    if (value >= -0.2) return '#22c55e';  // uncorrelated = green (good diversification)
    return '#3b82f6';                      // negative = blue (hedge)
}

function CorrelationHeatmap({ positions }: { positions: any[] }) {
    const [matrix, setMatrix] = useState<{ symbols: string[]; matrix: number[][] } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (positions.length < 2) return;
        setLoading(true);
        calculateCorrelationMatrix(positions).then(m => {
            setMatrix(m);
            setLoading(false);
        });
    }, [positions.map(p => p.symbol).join(',')]);

    if (positions.length < 2) return (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-tertiary)' }}>
            Add at least 2 positions to see correlation data.
        </div>
    );

    if (loading) return <LoadingCard label="Computing correlations from 30-day history..." />;
    if (!matrix || matrix.symbols.length === 0) return <LoadingCard label="No historical data available." />;

    const { symbols, matrix: m } = matrix;
    const cellSize = Math.max(28, Math.min(48, Math.floor(560 / symbols.length)));

    return (
        <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: '1rem' }}>
                🔴 High correlation = concentrated risk  &nbsp;|&nbsp;  🟢 Low/negative = good diversification
            </p>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'separate', borderSpacing: '2px' }}>
                    <thead>
                        <tr>
                            <th style={{ width: cellSize }} />
                            {symbols.map(s => (
                                <th key={s} style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--color-text-secondary)', textAlign: 'center', width: cellSize, padding: '2px' }}>
                                    {s.substring(0, 4)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {symbols.map((rowSym, i) => (
                            <tr key={rowSym}>
                                <td style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--color-text-secondary)', paddingRight: '6px', whiteSpace: 'nowrap' }}>
                                    {rowSym.substring(0, 4)}
                                </td>
                                {symbols.map((_, j) => {
                                    const v = m[i][j];
                                    return (
                                        <td key={j} style={{ width: cellSize, height: cellSize }}>
                                            <div
                                                title={`${rowSym} ↔ ${symbols[j]}: ${v.toFixed(2)}`}
                                                style={{
                                                width: '100%', height: cellSize,
                                                background: getCorrelationColor(v),
                                                borderRadius: '4px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '0.55rem', fontWeight: 700, color: '#fff',
                                                opacity: i === j ? 1 : 0.6 + Math.abs(v) * 0.4,
                                            }}>
                                                {v.toFixed(1)}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── Stress Test Panel ────────────────────────────────────────

function StressTestPanel({ positions }: { positions: any[] }) {
    const [selectedScenario, setSelectedScenario] = useState(STRESS_SCENARIOS[2]); // Moderate Correction
    const [result, setResult] = useState<StressTestResult | null>(null);

    useEffect(() => {
        if (positions.length === 0) return;
        const r = runStressTest(positions, selectedScenario.drop, selectedScenario.name);
        setResult(r);
    }, [selectedScenario, positions]);

    if (positions.length === 0) return <LoadingCard label="Add positions to run stress tests." />;

    const totalValue = positions.reduce((s: number, p: any) => s + p.marketValue, 0);

    return (
        <div>
            {/* Scenario selector */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '1.25rem' }}>
                {STRESS_SCENARIOS.map(sc => (
                    <button
                        key={sc.name}
                        onClick={() => setSelectedScenario(sc)}
                        style={{
                            padding: '6px 14px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700,
                            cursor: 'pointer', transition: 'all 0.2s',
                            background: selectedScenario.name === sc.name ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${selectedScenario.name === sc.name ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`,
                            color: selectedScenario.name === sc.name ? '#ef4444' : 'var(--color-text-secondary)',
                        }}
                    >
                        {sc.name} ({(sc.drop * 100).toFixed(0)}%)
                    </button>
                ))}
            </div>

            {result && (
                <>
                    {/* Summary cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
                        {[
                            { label: 'Current Value', value: formatCurrency(totalValue), color: 'var(--color-text-primary)' },
                            { label: 'Stressed Value', value: formatCurrency(result.newValue), color: '#ef4444' },
                            { label: 'Estimated Loss', value: formatCurrency(result.portfolioLoss), color: '#ef4444' },
                        ].map(({ label, value, color }) => (
                            <div key={label} style={{
                                padding: '1rem', background: 'rgba(239,68,68,0.05)',
                                border: '1px solid rgba(239,68,68,0.15)', borderRadius: '12px', textAlign: 'center',
                            }}>
                                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 700 }}>{label}</div>
                                <div style={{ fontSize: '1.15rem', fontWeight: 800, color }}>{value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Position impacts */}
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-tertiary)', marginBottom: '8px', textTransform: 'uppercase' }}>
                        Position Impact (sorted by loss)
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '260px', overflowY: 'auto' }}>
                        {result.positionImpacts
                            .sort((a, b) => a.loss - b.loss)
                            .map(p => (
                                <div key={p.symbol} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '8px 12px', background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontWeight: 800, fontSize: '0.8rem' }}>{p.symbol}</span>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)' }}>β={p.beta.toFixed(1)}</span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ef4444' }}>
                                            {formatCurrency(p.loss)}
                                        </div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)' }}>
                                            {formatCurrency(p.currentValue)} → {formatCurrency(p.stressedValue)}
                                        </div>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Tax-Loss Harvesting ──────────────────────────────────────

function TaxLossPanel({ positions }: { positions: any[] }) {
    const opportunities = scanTaxLossHarvesting(positions);

    if (opportunities.length === 0) return (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-tertiary)' }}>
            <Shield size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
            <p>No significant tax-loss harvesting opportunities found. Your losers are within normal ranges or non-material.</p>
        </div>
    );

    const totalSavings = opportunities.reduce((s, o) => s + o.taxSavingsEstimate, 0);

    return (
        <div>
            <div style={{
                padding: '12px 16px', marginBottom: '1rem',
                background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px',
                display: 'flex', alignItems: 'center', gap: '12px',
            }}>
                <DollarSign size={20} color="var(--color-success)" />
                <div>
                    <div style={{ fontWeight: 800, color: 'var(--color-success)' }}>Estimated Tax Savings: {formatCurrency(totalSavings)}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)' }}>Based on 25% tax rate on realized losses (consult tax advisor)</div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {opportunities.map(opp => (
                    <div key={opp.symbol} style={{
                        padding: '14px', background: 'rgba(239,68,68,0.04)',
                        border: '1px solid rgba(239,68,68,0.12)', borderRadius: '12px',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <div>
                                <div style={{ fontWeight: 800 }}>{opp.symbol}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>
                                    {opp.lossPercent.toFixed(1)}% down — unrealized loss {formatCurrency(opp.unrealizedLoss)}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--color-success)', fontWeight: 700 }}>
                                    Save ~{formatCurrency(opp.taxSavingsEstimate)}
                                </div>
                            </div>
                        </div>
                        <div style={{
                            padding: '8px 12px', background: 'rgba(99,102,241,0.08)',
                            borderRadius: '8px', fontSize: '0.72rem',
                            border: '1px solid rgba(99,102,241,0.15)',
                        }}>
                            <span style={{ fontWeight: 700, color: 'rgba(99,102,241,0.9)' }}>Suggested Swap: {opp.suggestedSwap}</span>
                            <span style={{ color: 'var(--color-text-tertiary)' }}> — {opp.swapRationale}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Peer Benchmark ───────────────────────────────────────────

function BenchmarkPanel({ positions }: { positions: any[] }) {
    const result: BenchmarkResult = calculateBenchmark(positions);

    const metrics = [
        { label: 'Portfolio Return', value: `${result.portfolioReturn >= 0 ? '+' : ''}${result.portfolioReturn.toFixed(2)}%`, color: result.portfolioReturn >= 0 ? 'var(--color-success)' : 'var(--color-error)' },
        { label: 'VOO Benchmark', value: `+${result.benchmarkReturn.toFixed(1)}%`, color: 'var(--color-text-secondary)' },
        { label: 'Alpha (vs VOO)', value: `${result.alpha >= 0 ? '+' : ''}${result.alpha.toFixed(2)}%`, color: result.alpha >= 0 ? 'var(--color-success)' : 'var(--color-error)' },
        { label: 'Portfolio Beta', value: result.beta.toFixed(2), color: result.beta > 1.2 ? 'var(--color-warning)' : 'var(--color-text-primary)' },
        { label: 'Sharpe (Portfolio)', value: result.sharpePortfolio.toFixed(2), color: result.sharpePortfolio > 1 ? 'var(--color-success)' : 'var(--color-warning)' },
        { label: 'Sharpe (VOO)', value: result.sharpeBenchmark.toFixed(2), color: 'var(--color-text-secondary)' },
    ];

    return (
        <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: '1rem' }}>
                Benchmark: <strong>VOO (S&P 500 ETF)</strong> · {result.bestPeriod}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '1.5rem' }}>
                {metrics.map(({ label, value, color }) => (
                    <div key={label} style={{
                        padding: '14px', background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', textAlign: 'center',
                    }}>
                        <div style={{ fontSize: '0.62rem', color: 'var(--color-text-tertiary)', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 700 }}>{label}</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color }}>{value}</div>
                    </div>
                ))}
            </div>

            {/* Alpha meter */}
            <div style={{ padding: '14px', background: result.alpha >= 0 ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)', borderRadius: '12px', border: `1px solid ${result.alpha >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                {result.alpha >= 0 ? (
                    <div style={{ fontSize: '0.82rem', color: 'var(--color-success)' }}>
                        🏆 <strong>Outperforming VOO</strong> by +{result.alpha.toFixed(2)}% — your stock picking is adding value.
                        {result.beta > 1.3 && ` Note: higher beta (${result.beta.toFixed(2)}) means you're taking more risk for that return.`}
                    </div>
                ) : (
                    <div style={{ fontSize: '0.82rem', color: 'var(--color-error)' }}>
                        📉 <strong>Underperforming VOO</strong> by {result.alpha.toFixed(2)}%.
                        Consider increasing index fund allocations (VOO) or reviewing losing positions.
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Earnings Calendar ────────────────────────────────────────

function EarningsCalendarPanel({ positions }: { positions: any[] }) {
    const events = buildEarningsCalendar(positions);

    if (events.length === 0) return <LoadingCard label="No positions to show earnings for." />;

    const actionColors: Record<string, string> = {
        'Trim before': '#ef4444',
        'Hold through': '#22c55e',
        'Watch': '#eab308',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)', marginBottom: '0.5rem' }}>
                ⚠️ Earnings dates are estimated based on quarterly cycles. Verify exact dates on your broker.
            </p>
            {events.map(ev => (
                <div key={ev.symbol} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', background: ev.daysUntil <= 14 ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${ev.daysUntil <= 14 ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)'}`,
                    borderRadius: '10px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: '0.82rem' }}>{ev.symbol}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)' }}>
                                ~{ev.estimatedDate} ({ev.daysUntil}d)
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ textAlign: 'right', fontSize: '0.68rem', color: 'var(--color-text-tertiary)' }}>
                            ±{ev.expectedMove}% expected
                        </div>
                        <span style={{
                            padding: '3px 9px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 800,
                            background: `${actionColors[ev.action]}22`,
                            color: actionColors[ev.action],
                            border: `1px solid ${actionColors[ev.action]}44`,
                        }}>
                            {ev.action}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Loading helper ───────────────────────────────────────────

function LoadingCard({ label }: { label: string }) {
    return (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-tertiary)', fontSize: '0.8rem' }}>
            <RefreshCw size={20} style={{ marginBottom: '8px', opacity: 0.4 }} />
            <p>{label}</p>
        </div>
    );
}

// ─── Main Panel ───────────────────────────────────────────────

type IntelTab = 'correlation' | 'stress' | 'harvest' | 'benchmark' | 'earnings';

const TABS: { id: IntelTab; label: string; icon: React.ReactNode; description: string }[] = [
    { id: 'correlation', label: 'Correlation', icon: <BarChart2 size={14} />, description: 'How your holdings move together' },
    { id: 'stress', label: 'Stress Test', icon: <AlertTriangle size={14} />, description: 'Simulate market crashes' },
    { id: 'harvest', label: 'Tax Harvest', icon: <DollarSign size={14} />, description: 'Identify loss harvesting opportunities' },
    { id: 'benchmark', label: 'Benchmark', icon: <Target size={14} />, description: 'Compare vs VOO / S&P 500' },
    { id: 'earnings', label: 'Earnings', icon: <Calendar size={14} />, description: 'Upcoming earnings calendar' },
];

const PortfolioIntelligencePanel: React.FC = () => {
    const { positions } = usePortfolioStore();
    const [activeTab, setActiveTab] = useState<IntelTab>('correlation');

    return (
        <div style={{ marginTop: '0' }}>
            {/* Tab strip */}
            <div style={{
                display: 'flex', gap: '6px', flexWrap: 'wrap',
                padding: '4px', background: 'rgba(255,255,255,0.02)',
                borderRadius: '14px', marginBottom: '1.5rem',
                border: '1px solid rgba(255,255,255,0.05)',
            }}>
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '8px 14px', borderRadius: '10px', fontSize: '0.76rem', fontWeight: 700,
                            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                            background: activeTab === tab.id ? 'var(--gradient-primary)' : 'transparent',
                            color: activeTab === tab.id ? '#fff' : 'var(--color-text-tertiary)',
                            flex: '1', justifyContent: 'center',
                        }}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Active description */}
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: '1rem' }}>
                {TABS.find(t => t.id === activeTab)?.description}
            </p>

            {/* Panel content */}
            <div style={{ background: 'rgba(255,255,255,0.01)', borderRadius: '16px', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                {activeTab === 'correlation' && <CorrelationHeatmap positions={positions} />}
                {activeTab === 'stress' && <StressTestPanel positions={positions} />}
                {activeTab === 'harvest' && <TaxLossPanel positions={positions} />}
                {activeTab === 'benchmark' && <BenchmarkPanel positions={positions} />}
                {activeTab === 'earnings' && <EarningsCalendarPanel positions={positions} />}
            </div>
        </div>
    );
};

export default PortfolioIntelligencePanel;
