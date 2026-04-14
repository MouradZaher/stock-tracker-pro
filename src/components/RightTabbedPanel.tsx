import React, { useState } from 'react';
import TradingViewScreener from './TradingViewScreener';
import MarketPulsePage from './MarketPulsePage';
import MarketNews from './MarketNews';
import { Activity, Search, Newspaper } from 'lucide-react';

interface RightTabbedPanelProps {
    onSelectSymbol: (symbol: string) => void;
}

const RightTabbedPanel: React.FC<RightTabbedPanelProps> = ({ onSelectSymbol }) => {
    const [activeTab, setActiveTab] = useState<'screener' | 'search' | 'news'>('screener');

    const tabStyle = (id: 'screener' | 'search' | 'news'): React.CSSProperties => ({
        padding: '10px 15px',
        cursor: 'pointer',
        fontSize: '0.62rem',
        fontWeight: 900,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: activeTab === id ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
        borderBottom: activeTab === id ? '2px solid var(--color-accent)' : '2px solid transparent',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        background: activeTab === id ? 'rgba(168, 85, 247, 0.05)' : 'transparent',
        borderRight: '1px solid var(--color-border)',
        marginTop: '0'
    });

    return (
        <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-primary)' }}>
            <div style={{ 
                display: 'flex', 
                background: 'var(--color-bg-tertiary)', 
                borderBottom: '1px solid var(--color-border)',
                padding: '0'
            }}>
                <div 
                    style={tabStyle('screener')} 
                    onClick={() => setActiveTab('screener')}
                >
                    <Activity size={11} /> SCREENER
                </div>
                <div 
                    style={tabStyle('news')} 
                    onClick={() => setActiveTab('news')}
                >
                    <Newspaper size={11} /> NEWS
                </div>
                <div 
                    style={tabStyle('search')} 
                    onClick={() => setActiveTab('search')}
                >
                    <Search size={11} /> SEARCH
                </div>
            </div>
            
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                {activeTab === 'screener' && <TradingViewScreener />}
                {activeTab === 'news' && <MarketNews />}
                {activeTab === 'search' && <MarketPulsePage onSelectStock={onSelectSymbol} />}
            </div>
        </div>
    );
};

export default RightTabbedPanel;
