import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { searchSymbols } from '../services/stockDataService';

interface SearchEngineProps {
    onSelectSymbol: (symbol: string) => void;
}

const SearchEngine: React.FC<SearchEngineProps> = ({ onSelectSymbol }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [showDropdown, setShowDropdown] = useState(false);
    const debounceTimeout = useRef<number | null>(null);

    useEffect(() => {
        if (!query || query.length < 1) {
            setResults([]);
            setShowDropdown(false);
            return;
        }

        setIsSearching(true);

        // Debounce search
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = window.setTimeout(async () => {
            const searchResults = await searchSymbols(query);
            setResults(searchResults);
            setShowDropdown(searchResults.length > 0);
            setIsSearching(false);
            setSelectedIndex(-1);
        }, 300);

        return () => {
            if (debounceTimeout.current) {
                window.clearTimeout(debounceTimeout.current);
            }
        };
    }, [query]);

    const handleSelect = (symbol: string) => {
        setQuery('');
        setShowDropdown(false);
        setResults([]);
        onSelectSymbol(symbol);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showDropdown || results.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0 && selectedIndex < results.length) {
                handleSelect(results[selectedIndex].symbol);
            } else if (results.length > 0) {
                handleSelect(results[0].symbol);
            }
        } else if (e.key === 'Escape') {
            setShowDropdown(false);
        }
    };

    return (
        <div className="search-container">
            <div className="search-input-wrapper">
                <Search className="search-icon" size={20} />
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search stocks, ETFs (e.g., AAPL, VOO, QQQ)..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        if (results.length > 0) setShowDropdown(true);
                    }}
                />
            </div>

            {showDropdown && results.length > 0 && (
                <div className="search-dropdown">
                    {results.map((result, index) => (
                        <div
                            key={result.symbol}
                            className={`search-result-item ${index === selectedIndex ? 'selected' : ''}`}
                            onClick={() => handleSelect(result.symbol)}
                            onMouseEnter={() => setSelectedIndex(index)}
                        >
                            <div className="search-result-symbol">
                                {result.symbol} <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>• {result.type}</span>
                            </div>
                            <div className="search-result-name">{result.name}</div>
                        </div>
                    ))}
                </div>
            )}

            {isSearching && (
                <div style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                    Searching...
                </div>
            )}
        </div>
    );
};

export default SearchEngine;
