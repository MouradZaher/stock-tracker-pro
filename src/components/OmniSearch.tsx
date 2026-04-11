import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, ArrowRight } from 'lucide-react';
import { searchSymbols } from '../services/stockDataService';
import CompanyLogo from './CompanyLogo';

interface OmniSearchProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectSymbol: (symbol: string) => void;
}

const OmniSearch: React.FC<OmniSearchProps> = ({ isOpen, onClose, onSelectSymbol }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                if (isOpen) onClose();
                else window.dispatchEvent(new Event('open-omni-search'));
            }
            if (e.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            setQuery('');
            setResults([]);
        }
    }, [isOpen]);

    useEffect(() => {
        if (query.trim().length < 1) { setResults([]); return; }
        setLoading(true);
        const timeout = setTimeout(async () => {
            const matches = await searchSymbols(query);
            setResults(matches.slice(0, 8));
            setLoading(false);
        }, 200);
        return () => clearTimeout(timeout);
    }, [query]);

    if (!isOpen) return null;

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
                backdropFilter: 'blur(8px)', zIndex: 9999,
                display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                paddingTop: '15vh'
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    width: '560px', background: '#0a0a0a',
                    border: '1px solid #222', overflow: 'hidden'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #111', gap: '10px' }}>
                    <Search size={16} color="#4ade80" />
                    <input
                        ref={inputRef} value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search assets, markets..."
                        style={{
                            flex: 1, background: 'transparent', border: 'none', color: 'white',
                            fontSize: '0.85rem', fontWeight: 600, outline: 'none',
                            fontFamily: "'JetBrains Mono', monospace"
                        }}
                    />
                    <kbd style={{ fontSize: '0.6rem', color: '#444', background: '#111', padding: '2px 6px', border: '1px solid #222' }}>ESC</kbd>
                </div>

                {results.length > 0 && (
                    <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                        {results.map(item => (
                            <div
                                key={item.symbol}
                                onClick={() => { onSelectSymbol(item.symbol); onClose(); }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #0a0a0a',
                                    transition: 'background 0.15s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#111'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <CompanyLogo symbol={item.symbol} size={24} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{ color: 'white', fontSize: '0.75rem', fontWeight: 900 }}>{item.symbol}</div>
                                        {item.isGlobal && (
                                            <div style={{ padding: '1px 4px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '3px', fontSize: '0.4rem', fontWeight: 900, color: '#3b82f6' }}>GLOBAL</div>
                                        )}
                                    </div>
                                    <div style={{ color: '#555', fontSize: '0.6rem' }}>{item.name}</div>
                                </div>
                                <ArrowRight size={12} color="#333" />
                            </div>
                        ))}
                    </div>
                )}

                {query && results.length === 0 && !loading && (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#333', fontSize: '0.7rem' }}>
                        NO RESULTS FOUND
                    </div>
                )}
            </div>
        </div>
    );
};

export default OmniSearch;
