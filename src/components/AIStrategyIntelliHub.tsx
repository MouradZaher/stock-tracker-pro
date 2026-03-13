import React, { useState, useEffect } from 'react';
import { 
    Zap, Shield, TrendingUp, AlertTriangle, 
    BarChart2, Globe, Search, ArrowRight, 
    ChevronRight, Info, ExternalLink, RefreshCw,
    Briefcase, FileText, Activity
} from 'lucide-react';
import { aiStrategyService, AI_STRATEGIES } from '../services/aiStrategyService';
import type { StrategyResult } from '../services/aiStrategyService';
import { soundService } from '../services/soundService';
import toast from 'react-hot-toast';

// Simple Fallback for MessageSquare if not found in Lucide (usually it is)
const MessageSquare = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
);

const STRATEGY_METADATA: Record<string, { icon: any, color: string, label: string }> = {
    [AI_STRATEGIES.PORTFOLIO_HEDGING]: { icon: Shield, color: '#6366f1', label: 'Portfolio Hedging' },
    [AI_STRATEGIES.INSTITUTIONAL_POSITIONING]: { icon: Briefcase, color: '#10b981', label: 'Institutional Tracking' },
    [AI_STRATEGIES.DIVIDEND_DANGER]: { icon: AlertTriangle, color: '#f59e0b', label: 'Dividend Danger' },
    [AI_STRATEGIES.CRISIS_CORRELATION]: { icon: Activity, color: '#ef4444', label: 'Crisis Correlation' },
    [AI_STRATEGIES.SENTIMENT_ARBITRAGE]: { icon: MessageSquare, color: '#3b82f6', label: 'Sentiment Arbitrage' },
    [AI_STRATEGIES.MACRO_ANALYSIS]: { icon: Globe, color: '#8b5cf6', label: 'Macro Analysis' },
    [AI_STRATEGIES.SHORT_SQUEEZE]: { icon: TrendingUp, color: '#ec4899', label: 'Short Squeeze' },
};

const AIStrategyIntelliHub: React.FC = () => {
    const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);
    const [strategyResult, setStrategyResult] = useState<StrategyResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleRunStrategy = async (id: string) => {
        soundService.playTap();
        setSelectedStrategyId(id);
        setIsLoading(true);
        setStrategyResult(null);

        try {
            const result = await aiStrategyService.getStrategy(id);
            setStrategyResult(result);
            soundService.playSuccess();
        } catch (error) {
            console.error('Failed to run strategy:', error);
            toast.error('Strategy execution failed.');
        } finally {
            setIsLoading(false);
        }
    };

    const getRiskColor = (level: string) => {
        switch (level) {
            case 'Low': return 'var(--color-success)';
            case 'Medium': return 'var(--color-warning)';
            case 'High': return 'var(--color-error)';
            case 'Extreme': return '#991b1b'; // Deep Red
            default: return 'var(--color-text-tertiary)';
        }
    };

    return (
        <div className="ai-strategy-hub" style={{ padding: '0 0.5rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Zap size={24} color="var(--color-warning)" /> AI Strategy Intelligence Hub
                </h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                    Advanced market analysis engines for institutional-grade decision making.
                </p>
            </div>

            {/* Strategy Selection Grid */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                {Object.entries(STRATEGY_METADATA).map(([id, meta]) => {
                    const Icon = meta.icon;
                    const isActive = selectedStrategyId === id;
                    
                    return (
                        <div 
                            key={id}
                            onClick={() => handleRunStrategy(id)}
                            className="glass-card-hover"
                            style={{
                                padding: '1.25rem',
                                borderRadius: '16px',
                                background: isActive ? `${meta.color}15` : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${isActive ? meta.color : 'rgba(255,255,255,0.05)'}`,
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                background: `${meta.color}20`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <Icon size={24} color={meta.color} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'white' }}>{meta.label}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                                    {id === AI_STRATEGIES.PORTFOLIO_HEDGING ? 'Risk Mitigation' : 
                                     id === AI_STRATEGIES.INSTITUTIONAL_POSITIONING ? '13F Alpha' :
                                     id === AI_STRATEGIES.DIVIDEND_DANGER ? 'Yield Safety' :
                                     id === AI_STRATEGIES.CRISIS_CORRELATION ? 'Macro Anomalies' :
                                     id === AI_STRATEGIES.SENTIMENT_ARBITRAGE ? 'Price-Fund Divergence' :
                                     id === AI_STRATEGIES.MACRO_ANALYSIS ? 'Fed/GDP Pulse' : 'Momentum Squeeze'}
                                </div>
                            </div>
                            <ChevronRight size={18} color="var(--color-text-tertiary)" />
                            
                            {isActive && isLoading && (
                                <div style={{ position: 'absolute', bottom: 0, left: 0, height: '3px', width: '100%', background: meta.color, animation: 'loading-bar 1.5s infinite' }} />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Results Section */}
            {selectedStrategyId && (
                <div 
                    className="strategy-results-panel animate-fade-in" 
                    style={{ 
                        animation: 'fadeInUp 0.5s ease forwards',
                        opacity: 0,
                        transform: 'translateY(20px)'
                    }}
                >
                    {isLoading ? (
                        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
                            <RefreshCw size={32} className="spin" color={STRATEGY_METADATA[selectedStrategyId].color} />
                            <p style={{ marginTop: '1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                                Executing {STRATEGY_METADATA[selectedStrategyId].label} Analysis...
                            </p>
                        </div>
                    ) : strategyResult ? (
                        <div className="glass-card" style={{ padding: '0', overflow: 'hidden', border: `1px solid ${STRATEGY_METADATA[selectedStrategyId].color}30` }}>
                            {/* Header */}
                            <div style={{ 
                                padding: '1.5rem', 
                                background: `linear-gradient(135deg, ${STRATEGY_METADATA[selectedStrategyId].color}15 0%, transparent 100%)`,
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getRiskColor(strategyResult.riskLevel) }} />
                                        <span style={{ fontSize: '0.7rem', fontWeight: 900, color: getRiskColor(strategyResult.riskLevel), textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            {strategyResult.riskLevel} RISK PROFILE
                                        </span>
                                    </div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>{strategyResult.recommendation}</h3>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', fontWeight: 700 }}>STRATEGY_ID</div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: STRATEGY_METADATA[selectedStrategyId].color }}>{strategyResult.id.toUpperCase()}</div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1px', background: 'rgba(255,255,255,0.05)' }}>
                                {/* Main Reasoning */}
                                <div style={{ padding: '1.5rem', background: 'var(--color-bg-secondary)' }}>
                                    <h4 style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <FileText size={14} /> Strategic Insights
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {strategyResult.reasoning.map((text, i) => (
                                            <div key={i} style={{ display: 'flex', gap: '12px' }}>
                                                <div style={{ marginTop: '4px', width: '16px', height: '16px', borderRadius: '50%', background: `${STRATEGY_METADATA[selectedStrategyId!].color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: STRATEGY_METADATA[selectedStrategyId!].color }} />
                                                </div>
                                                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>{text}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Metrics & Actionable */}
                                <div style={{ background: 'var(--color-bg-secondary)', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                    {/* Metrics Grid */}
                                    <div style={{ padding: '1.5rem', flex: 1 }}>
                                        <h4 style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <BarChart2 size={14} /> Key Performance Metrics
                                        </h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            {Object.entries(strategyResult.metrics).map(([label, value]) => (
                                                <div key={label} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
                                                    <div style={{ fontSize: '1rem', fontWeight: 900, color: 'white' }}>{String(value)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Actionable Items */}
                                    <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', flex: 1 }}>
                                        <h4 style={{ fontSize: '0.8rem', color: 'var(--color-success)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <ArrowRight size={14} /> Actionable Execution
                                        </h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {strategyResult.actionableItems.map((item, i) => (
                                                <button 
                                                    key={i} 
                                                    className="btn btn-secondary glass-button"
                                                    style={{ justifyContent: 'space-between', padding: '0.75rem 1rem', fontSize: '0.85rem', width: '100%', textAlign: 'left' }}
                                                    onClick={() => toast.success(`Executing: ${item}`)}
                                                >
                                                    {item}
                                                    <ChevronRight size={16} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer / Sources */}
                            <div style={{ padding: '1rem 1.5rem', background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', fontWeight: 700 }}>SOURCES:</span>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {strategyResult.sources.map(s => (
                                            <span key={s} style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>{s}</span>
                                        ))}
                                    </div>
                                </div>
                                <button className="btn btn-icon" onClick={() => handleRunStrategy(selectedStrategyId!)}>
                                    <RefreshCw size={16} color="var(--color-text-tertiary)" />
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>
            )}

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes loading-bar {
                    0% { left: -100%; width: 30%; }
                    50% { left: 40%; width: 40%; }
                    100% { left: 100%; width: 30%; }
                }
            `}</style>
        </div>
    );
};

export default AIStrategyIntelliHub;
