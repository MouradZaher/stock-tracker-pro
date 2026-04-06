import React, { useState, useEffect } from 'react';
import { 
    Zap, Shield, TrendingUp, AlertTriangle, 
    BarChart2, Globe, Search, ArrowRight, 
    ChevronRight, Info, ExternalLink, RefreshCw,
    Briefcase, FileText, Activity, Sparkles, Cpu
} from 'lucide-react';
import { aiStrategyService, AI_STRATEGIES } from '../services/aiStrategyService';
import type { StrategyResult } from '../services/aiStrategyService';
import { useMarket } from '../contexts/MarketContext';
import { soundService } from '../services/soundService';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { usePortfolioStore } from '../hooks/usePortfolio';
import { useWatchlist } from '../hooks/useWatchlist';

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

interface AIStrategyIntelliHubProps {
    condensed?: boolean;
}

const AIStrategyIntelliHub: React.FC<AIStrategyIntelliHubProps> = ({ condensed = false }) => {
    const navigate = useNavigate();
    const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);
    const [strategyResult, setStrategyResult] = useState<StrategyResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { selectedMarket } = useMarket();
    const { positions } = usePortfolioStore();
    const { getWatchlistByMarket } = useWatchlist();

    const handleRunStrategy = async (id: string) => {
        soundService.playTap();
        setSelectedStrategyId(id);
        setIsLoading(true);
        setStrategyResult(null);

        try {
            const contextSymbols = [
                ...positions.map(p => p.symbol),
                ...getWatchlistByMarket(selectedMarket.id)
            ];
            const result = await aiStrategyService.getStrategy(id, selectedMarket.id, { contextSymbols });
            
            // Dynamically inject a real symbol into the actionable items if context exists
            if (contextSymbols.length > 0) {
                const randomSymbol = contextSymbols[Math.floor(Math.random() * contextSymbols.length)];
                result.actionableItems = result.actionableItems.map(item => 
                    item.replace(/([A-Z]{3,5})/g, (match) => {
                        // Very naive replacement of any upper case ticker-like string
                        return randomSymbol; 
                    })
                );
                // Also prepend a specific portfolio action to make it immediately relevant
                if (id === AI_STRATEGIES.PORTFOLIO_HEDGING) {
                    result.actionableItems.unshift(`Evaluate Beta exposure of ${randomSymbol} in current holdings`);
                } else if (id === AI_STRATEGIES.DIVIDEND_DANGER) {
                     result.actionableItems.unshift(`Audit yield sustainability for ${randomSymbol}`);
                }
            }
            
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
        <div className="ai-strategy-hub" style={{ padding: condensed ? '0' : '0 0.5rem', height: condensed ? '100%' : 'auto', display: condensed ? 'flex' : 'block', flexDirection: 'column' }}>
            {/* Headers removed */}

            {!condensed && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-accent)', background: 'var(--color-accent-light)', padding: '2px 10px', borderRadius: '20px' }}>
                        10 STRATEGIC MODULES ACTIVE
                    </div>
                </div>
            )}

            {/* Strategic Intelligence Modules Carousel */}
            <div className="hide-scroll" style={{ 
                display: 'flex', 
                overflowX: 'auto',
                scrollSnapType: 'x mandatory', 
                gap: condensed ? '0.75rem' : '1rem', 
                marginBottom: condensed ? '1rem' : '1.5rem',
                flexShrink: 0,
                paddingBottom: '4px'
            }}>
                {Object.entries(STRATEGY_METADATA).map(([id, meta]) => (
                    <button
                        key={id}
                        onClick={() => handleRunStrategy(id)}
                        disabled={isLoading}
                        style={{
                            flex: '0 0 auto',
                            width: condensed ? '140px' : '160px',
                            scrollSnapAlign: 'start',
                            display: 'flex',
                            flexDirection: condensed ? 'row' : 'column',
                            alignItems: 'center',
                            gap: condensed ? '8px' : '12px',
                            padding: condensed ? '0.75rem' : '1.25rem',
                            borderRadius: '16px',
                            background: selectedStrategyId === id ? `${meta.color}15` : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${selectedStrategyId === id ? meta.color : 'rgba(255,255,255,0.05)'}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        <div style={{ 
                            width: condensed ? '24px' : '40px', 
                            height: condensed ? '24px' : '40px', 
                            borderRadius: condensed ? '8px' : '12px', 
                            background: `${meta.color}20`, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            color: meta.color,
                            flexShrink: 0
                        }}>
                            <meta.icon size={condensed ? 14 : 24} />
                        </div>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {meta.label}
                        </span>
                    </button>
                ))}
            </div>

            <div style={{ flex: 1, minHeight: 0, perspective: '1000px', display: 'flex', flexDirection: 'column' }}>
                <div 
                    style={{ 
                        flex: 1, 
                        position: 'relative', 
                        transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)', 
                        transformStyle: 'preserve-3d',
                        transform: selectedStrategyId ? 'rotateX(180deg)' : 'rotateX(0deg)'
                    }}
                >
                    {/* FRONT: Empty State */}
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backfaceVisibility: 'hidden',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        border: '1px dashed rgba(255,255,255,0.1)', 
                        borderRadius: '16px', 
                        opacity: 0.5
                    }}>
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <Cpu size={32} style={{ color: 'var(--color-text-tertiary)', marginBottom: '1rem', animation: 'spin 10s linear infinite' }} />
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>SELECT STRATEGY MODULE</p>
                        </div>
                    </div>

                    {/* BACK: Results Panel */}
                    <div 
                        style={{ 
                            position: 'absolute',
                            top: 0, left: 0, right: 0, bottom: 0,
                            backfaceVisibility: 'hidden',
                            transform: 'rotateX(180deg)',
                            overflowY: 'auto'
                        }}
                    >
                        {isLoading ? (
                            <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
                                <RefreshCw size={24} className="spin" color={STRATEGY_METADATA[selectedStrategyId].color} />
                                <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                                    Analyzing {STRATEGY_METADATA[selectedStrategyId].label}...
                                </p>
                            </div>
                        ) : strategyResult ? (
                            <div className="glass-card" style={{ padding: '0', overflow: 'hidden', border: `1px solid ${STRATEGY_METADATA[selectedStrategyId].color}30` }}>
                                {/* Header */}
                                <div style={{ 
                                    padding: '1rem', 
                                    background: `linear-gradient(135deg, ${STRATEGY_METADATA[selectedStrategyId].color}15 0%, transparent 100%)`,
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: getRiskColor(strategyResult.riskLevel) }} />
                                            <span style={{ fontSize: '0.6rem', fontWeight: 900, color: getRiskColor(strategyResult.riskLevel), textTransform: 'uppercase' }}>
                                                {strategyResult.riskLevel} RISK
                                            </span>
                                        </div>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 900, margin: 0 }}>{strategyResult.recommendation}</h3>
                                    </div>
                                </div>

                                <div style={{ padding: '1rem' }}>
                                    {/* Reasoning */}
                                    <div style={{ marginBottom: '1rem' }}>
                                        <h4 style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <FileText size={12} /> Strategic Insights
                                        </h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {strategyResult.reasoning.slice(0, 3).map((text, i) => (
                                                <p key={i} style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.4, margin: 0 }}>• {text}</p>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div>
                                        <h4 style={{ fontSize: '0.65rem', color: 'var(--color-success)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <ArrowRight size={12} /> execution
                                        </h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {strategyResult.actionableItems.slice(0, 2).map((item, i) => (
                                                <button 
                                                    key={i} 
                                                    className="btn btn-secondary glass-button"
                                                    style={{ justifyContent: 'space-between', padding: '0.5rem 0.75rem', fontSize: '0.75rem', width: '100%', textAlign: 'left' }}
                                                    onClick={() => toast.success(`Executing: ${item}`)}
                                                >
                                                    {item}
                                                    <ChevronRight size={14} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            <style>{`
                .hide-scroll::-webkit-scrollbar {
                    display: none;
                }
                .hide-scroll {
                    -ms-overflow-style: none;  /* IE and Edge */
                    scrollbar-width: none;  /* Firefox */
                }
                .spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default AIStrategyIntelliHub;
