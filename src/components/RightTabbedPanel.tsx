import React, { useState } from 'react';
import TradingViewScreener from './TradingViewScreener';
import MarketPulsePage from './MarketPulsePage';
import MarketNews from './MarketNews';
import { Activity, Search, Newspaper } from 'lucide-react';

interface RightTabbedPanelProps {
    onSelectSymbol: (symbol: string) => void;
}

const RightTabbedPanel: React.FC<RightTabbedPanelProps> = ({ onSelectSymbol }) => {
    return (
        <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-primary)' }}>
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                <TradingViewScreener />
            </div>
        </div>
    );
};

export default RightTabbedPanel;
