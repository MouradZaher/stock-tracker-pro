import React from 'react';
import SymbolSearchInput from './SymbolSearchInput';

interface SearchEngineProps {
    onSelectSymbol: (symbol: string) => void;
}

const SearchEngine: React.FC<SearchEngineProps> = ({ onSelectSymbol }) => {
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
        </div>
    );
};

export default SearchEngine;
