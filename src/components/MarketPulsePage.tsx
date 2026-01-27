import React from 'react';
import EconomicCalendar from './EconomicCalendar';
import TopMovers from './TopMovers';

const MarketPulsePage: React.FC = () => {
    return (
        <div style={{ padding: 'var(--spacing-md)', maxWidth: '100%', margin: '0 auto', height: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', height: '100%' }}>
                <div style={{ height: '100%' }}>
                    <TopMovers />
                </div>
                <div style={{ height: '100%' }}>
                    <EconomicCalendar />
                </div>
            </div>
        </div>
    );
};

export default MarketPulsePage;
