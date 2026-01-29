import React from 'react';
import StockHeatmap from './StockHeatmap';

interface MarketOverviewProps {
    onSelectStock?: (symbol: string) => void;
}

const MarketOverview: React.FC<MarketOverviewProps> = ({ onSelectStock }) => {
    return (
        <div className="market-overview" style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <StockHeatmap onSelectStock={onSelectStock} />
        </div>
    );
};

export default MarketOverview;
