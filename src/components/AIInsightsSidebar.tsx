import React from 'react';
import { Brain, TrendingUp, AlertTriangle, Lightbulb, ChevronRight } from 'lucide-react';

interface AIInsightsSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const INSIGHTS = [
    { 
        type: 'momentum', 
        title: 'Tech Momentum Surge', 
        desc: 'Institutional flow into Semiconductors (NVDA, AMD) at highest levels in 30 days.',
        icon: TrendingUp,
        color: 'var(--color-success)'
    },
    { 
        type: 'risk', 
        title: 'Macro Exposure Alert', 
        desc: 'Egypt Real Estate sector showing divergence from treasury yields.',
        icon: AlertTriangle,
        color: 'var(--color-warning)'
    },
    { 
        type: 'strategy', 
        title: 'Yield Curve Context', 
        desc: 'Financials outperforming as yield curve flattens; structural positioning advised.',
        icon: Lightbulb,
        color: 'var(--color-accent)'
    }
];

const AIInsightsSidebar: React.FC<AIInsightsSidebarProps> = ({ isOpen, onClose }) => {
    return (
        <div style={{ 
            width: isOpen ? '320px' : '0px', 
            transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)', 
            background: 'rgba(10,10,18,0.6)', 
            backdropFilter: 'blur(16px)',
            borderLeft: isOpen ? '1px solid rgba(255,255,255,0.05)' : 'none',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative'
        }}>
            <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Brain className="text-accent" size={18} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Insights</span>
                </div>
                <button onClick={onClose} style={{ color: 'var(--color-text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <ChevronRight size={18} />
                </button>
            </div>

            <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                {INSIGHTS.map((insight, i) => (
                    <div 
                        key={i} 
                        style={{ 
                            background: 'rgba(255,255,255,0.02)', 
                            border: '1px solid rgba(255,255,255,0.03)', 
                            borderRadius: '12px', 
                            padding: '1.25rem',
                            marginBottom: '1rem',
                            transition: 'all 0.3s ease'
                        }}
                        className="insight-card-hover"
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.75rem' }}>
                            <insight.icon size={16} style={{ color: insight.color }} />
                            <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'white' }}>{insight.title}</span>
                        </div>
                        <p style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)', lineHeight: 1.6, margin: 0 }}>
                            {insight.desc}
                        </p>
                    </div>
                ))}

                <div style={{ 
                    marginTop: '2rem', 
                    padding: '1.25rem', 
                    background: 'linear-gradient(135deg, rgba(var(--color-accent-rgb), 0.1), transparent)', 
                    borderRadius: '12px', 
                    border: '1px solid rgba(var(--color-accent-rgb), 0.1)'
                }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--color-accent)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Analyst Note</div>
                    <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', margin: 0, fontStyle: 'italic' }}>
                        "Market is front-running the FED pivot; sectors with high PEG ratios show resilience."
                    </p>
                </div>
            </div>

            <style>{`
                .insight-card-hover:hover {
                    background: rgba(255,255,255,0.04);
                    border-color: rgba(255,255,255,0.08);
                    transform: translateY(-2px);
                }
            `}</style>
        </div>
    );
};

export default AIInsightsSidebar;
