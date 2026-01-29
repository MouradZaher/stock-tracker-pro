import React from 'react';
import SymbolSearchInput from './SymbolSearchInput';

interface SearchEngineProps {
    onSelectSymbol: (symbol: string) => void;
}

const SearchEngine: React.FC<SearchEngineProps> = ({ onSelectSymbol }) => {
    const trendingSymbols = ['NVDA', 'TSLA', 'AAPL', 'MSFT', 'BTC', 'AMD'];

    const handleSelect = (symbol: string) => {
        onSelectSymbol(symbol);
    };

    return (
        <div className="search-container">
            <SymbolSearchInput
                onSelect={handleSelect}
                placeholder="Search stocks, ETFs (e.g., AAPL, VOO, QQQ)..."
                autoFocus
            />

            {/* Trending Quick-Chips */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Trending:</span>
                {trendingSymbols.map(symbol => (
                    <button
                        key={symbol}
                        className="glass-button"
                        onClick={() => handleSelect(symbol)}
                        style={{
                            padding: '4px 12px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            border: '1px solid var(--glass-border)'
                        }}
                    >
                        {symbol}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SearchEngine;
