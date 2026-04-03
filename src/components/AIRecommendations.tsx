import React, { useState } from 'react';
import {
    LayoutGrid, Fingerprint, Cpu, Target
} from 'lucide-react';
import AIIntelligenceStream from './AIIntelligenceStream';
import AIPerformanceTracker from './AIPerformanceTracker';
import AIStrategyIntelliHub from './AIStrategyIntelliHub';
import AIInstitutionalHub from './AIInstitutionalHub';
import SubNavbar from './SubNavbar';

const AIRecommendations: React.FC<{ onSelectStock?: (symbol: string) => void }> = ({ onSelectStock }) => {
    const [viewMode, setViewMode] = useState<'terminal' | 'intel' | 'strategy'>('terminal');

    return (
        <div className="tab-content dashboard-viewport" style={{ padding: 0, gap: 0 }}>
            {/* TOP HEADER ROW (Intelligence Stream) */}
            <div style={{ display: 'flex', gap: '1rem', padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--glass-border)', flexShrink: 0, alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <AIIntelligenceStream />
                </div>
            </div>

            {/* Unified Sub-Navbar */}
            <SubNavbar
                activeTab={viewMode}
                onTabChange={(id) => setViewMode(id as any)}
                tabs={[
                    { id: 'terminal', label: 'TERMINAL', icon: LayoutGrid, color: 'var(--color-accent)' },
                    { id: 'intel', label: 'ALPHA INTEL', icon: Target, color: '#38bdf8' },
                    { id: 'strategy', label: 'STRATEGY', icon: Cpu, color: 'var(--color-warning)' }
                ]}
            />

            {/* Main Content Area */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                {viewMode === 'terminal' && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr minmax(340px, 400px)',
                        gap: '1.5rem',
                        padding: '1.5rem',
                        flex: 1,
                        minHeight: 0,
                        overflow: 'hidden'
                    }}>
                        {/* Intelligence Hub column */}
                        <div className="scrollable-panel" style={{ background: 'rgba(0,0,0,0.1)', borderRadius: '16px' }}>
                            <AIInstitutionalHub />
                        </div>

                        {/* Performance & Strategy column */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 0 }}>
                            <div style={{ height: '140px', flexShrink: 0 }}>
                                <AIPerformanceTracker condensed={true} />
                            </div>
                            <div className="glass-card scrollable-panel" style={{ flex: 1, padding: '1rem' }}>
                                <h3 style={{ fontSize: '0.75rem', fontWeight: 900, marginBottom: '1rem' }}>STRATEGIC COMMAND</h3>
                                <AIStrategyIntelliHub condensed={true} />
                            </div>
                        </div>
                    </div>
                )}

                {viewMode === 'intel' && (
                    <div className="scrollable-panel" style={{ flex: 1, padding: '1.5rem' }}>
                        <AIInstitutionalHub />
                    </div>
                )}

                {viewMode === 'strategy' && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(400px, 1fr) minmax(340px, 400px)',
                        gap: '1.5rem',
                        padding: '1.5rem',
                        flex: 1,
                        minHeight: 0,
                        overflow: 'hidden'
                    }}>
                        <div className="scrollable-panel" style={{ background: 'rgba(0,0,0,0.1)', borderRadius: '16px' }}>
                            <AIStrategyIntelliHub />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 0 }}>
                            <AIPerformanceTracker />
                            <div className="glass-card" style={{ padding: '1.5rem', flex: 1 }}>
                                <h3 style={{ fontSize: '0.8rem', fontWeight: 900, marginBottom: '1rem' }}>SYSTEM CALIBRATION</h3>
                                <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
                                    <Fingerprint size={100} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @media (max-width: 1024px) {
                    .tab-content.dashboard-viewport > div > div {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default AIRecommendations;
