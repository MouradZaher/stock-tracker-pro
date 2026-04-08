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

        </div>
    );
};

export default AIRecommendations;
