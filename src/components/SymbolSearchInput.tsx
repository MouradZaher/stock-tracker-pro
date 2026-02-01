import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { searchSymbols } from '../services/stockDataService';

interface SymbolSearchInputProps {
    onSelect: (symbol: string) => void;
    placeholder?: string;
    className?: string;
    initialValue?: string;
    autoFocus?: boolean;
}

const SymbolSearchInput: React.FC<SymbolSearchInputProps> = ({
    onSelect,
    placeholder = "Search symbols...",
    className = "",
    initialValue = "",
    autoFocus = false
}) => {
    const [query, setQuery] = useState(initialValue);
    const [results, setResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [showDropdown, setShowDropdown] = useState(false);
    const debounceTimeout = useRef<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!query || query.length < 1) {
            setResults([]);
            setShowDropdown(false);
            return;
        }

        setIsSearching(true);

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = window.setTimeout(async () => {
            try {
                const searchResults = await searchSymbols(query);
                setResults(searchResults);
                setShowDropdown(searchResults.length > 0);
            } catch (error) {
                console.error("Search failed:", error);
            } finally {
                setIsSearching(false);
                setSelectedIndex(-1);
            }
        }, 300);

        return () => {
            if (debounceTimeout.current) {
                window.clearTimeout(debounceTimeout.current);
            }
        };
    }, [query]);

    const handleSelect = (symbol: string) => {
        setQuery(symbol);
        setShowDropdown(false);
        setResults([]);
        onSelect(symbol);
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
        <div className={`symbol-search-input-container ${className}`} ref={containerRef} style={{ position: 'relative', width: '100%' }}>
            <div className="search-input-wrapper glass-effect" style={{ borderRadius: 'var(--radius-md)', padding: '0 12px', display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)' }}>
                <Search size={16} style={{ opacity: 0.5, marginRight: '8px' }} />
                <input
                    type="text"
                    className="form-input"
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => setQuery(e.target.value.toUpperCase())}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        if (results.length > 0) setShowDropdown(true);
                    }}
                    autoFocus={autoFocus}

                    style={{
                        background: 'transparent',
                        border: 'none',
                        padding: '10px 0',
                        flex: 1,
                        outline: 'none',
                        color: isSearching ? 'var(--color-text-tertiary)' : 'inherit',
                        cursor: isSearching ? 'not-allowed' : 'text'
                    }}
                />
                {isSearching && (
                    <div style={{ marginLeft: '12px', display: 'flex', alignItems: 'center' }}>
                        <div className="agent-loader" style={{ width: '16px', height: '16px', border: '2px solid var(--color-accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    </div>
                )}

            </div>



            {showDropdown && results.length > 0 && (
                <div className="search-dropdown glass-effect" style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 100,
                    marginTop: '4px',
                    borderRadius: 'var(--radius-md)',
                    padding: '4px',
                    maxHeight: '240px',
                    overflowY: 'auto',
                    boxShadow: 'var(--shadow-lg)',
                    border: '1px solid var(--glass-border)'
                }}>
                    {results.map((result, index) => (
                        <div
                            key={result.symbol}
                            className={`search-result-item ${index === selectedIndex ? 'selected' : ''}`}
                            style={{
                                padding: '8px 12px',
                                borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer',
                                background: index === selectedIndex ? 'rgba(255,255,255,0.1)' : 'transparent',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                            onClick={() => handleSelect(result.symbol)}
                            onMouseEnter={() => setSelectedIndex(index)}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{result.symbol}</span>
                                <span style={{ fontSize: '0.75rem', opacity: 0.6, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{result.name}</span>
                            </div>
                            <span style={{ fontSize: '0.7rem', opacity: 0.5, background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>{result.type}</span>
                        </div>
                    ))}
                </div>
            )}


            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default SymbolSearchInput;
