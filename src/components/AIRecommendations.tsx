import React from 'react';
import AIInstitutionalHub from './AIInstitutionalHub';
import ErrorBoundary from './ErrorBoundary';

const AIRecommendations: React.FC<{ onSelectStock?: (symbol: string) => void }> = ({ onSelectStock }) => {
    return (
        <div className="tab-content dashboard-viewport" style={{ padding: 0, gap: 0, overflow: 'hidden' }}>
            {/* 
                Simplified AI Architecture
                Removes fragmented sub-tabs (Stocks, Navigator, Terminal, Strategy)
                Consolidates into a single, high-intelligence Search & Insight hub.
            */}
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                flex: 1, 
                height: '100%',
                minHeight: 0, 
                overflow: 'hidden'
            }}>
                <ErrorBoundary>
                    <AIInstitutionalHub />
                </ErrorBoundary>
            </div>

            {/* PIP System Pulse Visualizer (Institutional Aesthetic) */}
            <div className="pip-widget glass-card" style={{
                position: 'absolute', bottom: '2rem', right: '2rem', width: '220px', height: '80px', padding: '0.75rem', zIndex: 50,
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)', border: '1px solid var(--color-accent)', borderRadius: '12px',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                pointerEvents: 'none',
                background: 'rgba(10,10,18,0.8)',
                backdropFilter: 'blur(10px)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--color-text-tertiary)', letterSpacing: '0.05em' }}>SYSTEM PULSE</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-accent)', fontWeight: 800 }}>ACTIVE</span>
                </div>
                <div style={{ flex: 1, position: 'relative', marginTop: '8px' }}>
                    <svg viewBox="0 0 100 30" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                        <defs>
                            <linearGradient id="pipGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <path d="M0,25 Q10,20 20,22 T40,15 T60,18 T80,5 T100,2" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" className="pip-path" />
                        <path d="M0,25 Q10,20 20,22 T40,15 T60,18 T80,5 T100,2 L100,30 L0,30 Z" fill="url(#pipGradient)" />
                        <circle cx="100" cy="2" r="2" fill="white" className="pip-dot" />
                    </svg>
                </div>
            </div>

            <style>{`
                .pip-path {
                    stroke-dasharray: 200;
                    stroke-dashoffset: 200;
                    animation: dashDraw 2s ease-out forwards;
                }
                .pip-dot {
                    animation: pulseDot 1.5s infinite;
                }
                @keyframes dashDraw {
                    to { stroke-dashoffset: 0; }
                }
                @keyframes pulseDot {
                    0% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.4; transform: scale(1.5); }
                    100% { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
};

export default AIRecommendations;
