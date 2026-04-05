import React, { useState } from 'react';
import {
    LayoutGrid, Fingerprint, Cpu, Target
} from 'lucide-react';
import PortfolioIntelliHub from './PortfolioIntelliHub';
import MarketScannerHub from './MarketScannerHub';
import SubNavbar from './SubNavbar';

const AIRecommendations: React.FC<{ onSelectStock?: (symbol: string) => void }> = ({ onSelectStock }) => {
    const [viewMode, setViewMode] = useState<'portfolio' | 'scanner'>('portfolio');

    return (
        <div className="tab-content dashboard-viewport" style={{ padding: 0, gap: 0 }}>

            {/* Unified Sub-Navbar */}
            <SubNavbar
                activeTab={viewMode}
                onTabChange={(id) => setViewMode(id as any)}
                tabs={[
                    { id: 'portfolio', label: 'PORTFOLIO INTELLIGENCE', icon: Fingerprint, color: 'var(--color-accent)' },
                    { id: 'scanner', label: 'MARKET SCANNER', icon: Target, color: '#38bdf8' }
                ]}
            />

            {/* Main Content Area */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden', padding: '1.5rem' }}>
                {viewMode === 'portfolio' && (
                     <PortfolioIntelliHub />
                )}

                {viewMode === 'scanner' && (
                     <MarketScannerHub />
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
