import React from 'react';
import StockHeatmap from './StockHeatmap';

const MarketOverview: React.FC = () => {
    return (
        <div className="market-overview" style={{ width: '100%' }}>
            <StockHeatmap />
        </div>
    );
};

export default MarketOverview;
