import React, { useState } from 'react';
import React, { useState } from 'react';
import TradingViewScreener from './TradingViewScreener';
import MarketPulsePage from './MarketPulsePage';
import { Activity, Search } from 'lucide-react';

interface RightTabbedPanelProps {
    onSelectSymbol: (symbol: string) => void;
}

const RightTabbedPanel: React.FC<RightTabbedPanelProps> = ({ onSelectSymbol }) => {
    const [activeTab, setActiveTab] = useState<'screener' | 'search'>('screener');

    const tabStyle = (id: 'screener' | 'search'): React.CSSProperties => ({
        padding: '8px 16px',
        cursor: 'pointer',
        fontSize: '0.6rem',
        fontWeight: 900,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: activeTab === id ? 'var(--color-accent)' : '#444',
        borderBottom: activeTab === id ? '2px solid var(--color-accent)' : '2px solid transparent',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.2s ease',
        background: activeTab === id ? 'rgba(74, 222, 128, 0.03)' : 'transparent'
    });

    return (
        <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', background: '#000' }}>
            <div style={{ 
                display: 'flex', 
                background: '#050505', 
                borderBottom: '1px solid #111',
                padding: '0 4px'
            }}>
                <div 
                    style={tabStyle('screener')} 
                    onClick={() => setActiveTab('screener')}
                >
                    <Activity size={12} /> SCREENER
                </div>
                <div 
                    style={tabStyle('search')} 
                    onClick={() => setActiveTab('search')}
                >
                    <Search size={12} /> SEARCH
                </div>
            </div>
            
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                {activeTab === 'screener' ? (
                    <TradingViewScreener />
                ) : (
                    <MarketPulsePage onSelectStock={onSelectSymbol} />
                )}
            </div>
        </div>
    );
};

export default RightTabbedPanel;
