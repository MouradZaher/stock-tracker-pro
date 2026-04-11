import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Command, ArrowRight, Activity, Zap, PieChart, Shield } from 'lucide-react';
import { searchSymbols } from '../services/stockDataService';
import CompanyLogo from './CompanyLogo';
import StockDetail from './StockDetail';
import { soundService } from '../services/soundService';

interface MarketPulsePageProps {
    onSelectStock?: (symbol: string) => void;
}

const MarketPulsePage: React.FC<MarketPulsePageProps> = ({ onSelectStock }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const params = new URLSearchParams(location.search);
    const symbol = params.get('symbol');

    useEffect(() => {
        if (!symbol && inputRef.current) {
            inputRef.current.focus();
        }
    }, [symbol]);

    useEffect(() => {
        if (query.trim().length < 1) { setResults([]); return; }
        setLoading(true);
        const timeout = setTimeout(async () => {
            const matches = await searchSymbols(query);
            setResults(matches.slice(0, 10));
            setLoading(false);
        }, 150);
        return () => clearTimeout(timeout);
    }, [query]);

    const handleSelect = (s: string) => {
        setQuery('');
        setResults([]);
        if (onSelectStock) {
            onSelectStock(s);
        } else {
            navigate(`/pulse?symbol=${s}`);
        }
        soundService.playTap();
    };

    // IF A SYMBOL IS ACTIVE, RENDER THE STOCK DETAIL VIEW IN THIS TAB
    if (symbol) {
        return (
            <div className="tab-content dashboard-viewport" style={{ padding: 0, gap: 0, background: '#000' }}>
                <div style={{ 
                    padding: '0.6rem 1.25rem', 
                    background: 'rgba(0,0,0,0.4)', 
                    borderBottom: '1px solid #111', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    height: '44px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button 
                            onClick={() => navigate('/pulse')}
                            style={{ 
                                background: 'transparent', border: 'none', color: 'var(--color-accent)', 
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                                fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase'
                            }}
                        >
                            <Search size={14} /> NEW SEARCH
                        </button>
                        <div style={{ width: '1px', height: '14px', background: '#222' }} />
                        <div style={{ fontSize: '0.75rem', fontWeight: 900, color: 'white', letterSpacing: '0.05em' }}>{symbol}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ fontSize: '0.55rem', color: '#444', fontWeight: 900 }}>TERMINAL_SESSION: ACTIVE</div>
                    </div>
                </div>
                <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                    <StockDetail symbol={symbol} />
                </div>
            </div>
        );
    }

    // DEFAULT SEARCH VIEW
    return (
        <div className="tab-content dashboard-viewport" style={{ 
            padding: 0, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' 
        }}>
            <div style={{ maxWidth: '640px', width: '90%', marginTop: '-10vh' }}>
                
                {/* Branding / Greeting */}
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: '10px', 
                        padding: '6px 12px', background: 'rgba(74, 222, 128, 0.05)', 
                        border: '1px solid rgba(74, 222, 128, 0.1)', borderRadius: '100px',
                        marginBottom: '1.5rem'
                    }}>
                        <Shield size={12} color="var(--color-accent)" />
                        <span style={{ fontSize: '0.55rem', fontWeight: 900, color: 'var(--color-accent)', letterSpacing: '0.15em' }}>SECURE ASSET IDENTIFICATION</span>
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', margin: 0, letterSpacing: '-0.02em', fontStyle: 'italic' }}>SEARCH</h1>
                    <p style={{ fontSize: '0.7rem', color: '#444', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.5rem' }}>
                        Access Global Market Intelligence & Real-Time Data Matrix
                    </p>
                </div>

                {/* Primary Search Bar */}
                <div style={{ position: 'relative' }}>
                    <div style={{ 
                        display: 'flex', alignItems: 'center', padding: '1.25rem 1.75rem', 
                        background: '#050505', border: '1px solid #111', gap: '1.25rem',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                    }}>
                        <Search size={24} color={query ? 'var(--color-accent)' : '#222'} style={{ transition: 'color 0.2s' }} />
                        <input
                            ref={inputRef} value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Enter Ticker, Company Name, or ISIN..."
                            style={{
                                flex: 1, background: 'transparent', border: 'none', color: 'white',
                                fontSize: '1.25rem', fontWeight: 700, outline: 'none',
                                fontFamily: "'JetBrains Mono', monospace"
                            }}
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <kbd style={{ fontSize: '0.6rem', color: '#444', background: '#0a0a0a', padding: '4px 8px', border: '1px solid #222', borderRadius: '4px' }}>⌘K</kbd>
                        </div>
                    </div>

                    {/* Results Overlay */}
                    {results.length > 0 && (
                        <div style={{ 
                            position: 'absolute', top: '100%', left: 0, right: 0, 
                            background: '#050505', border: '1px solid #111', borderTop: 'none',
                            maxHeight: '400px', overflowY: 'auto', zIndex: 100,
                            boxShadow: '0 30px 60px rgba(0,0,0,0.8)'
                        }}>
                            {results.map(item => (
                                <div
                                    key={item.symbol}
                                    onClick={() => handleSelect(item.symbol)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '1rem',
                                        padding: '1rem 1.75rem', cursor: 'pointer', borderBottom: '1px solid #0a0a0a',
                                        transition: 'all 0.15s ease'
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = 'rgba(74, 222, 128, 0.03)';
                                        e.currentTarget.style.paddingLeft = '2.25rem';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.paddingLeft = '1.75rem';
                                    }}
                                >
                                    <CompanyLogo symbol={item.symbol} size={32} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ color: 'white', fontSize: '1rem', fontWeight: 900 }}>{item.symbol}</div>
                                            {item.isGlobal && (
                                                <div style={{ padding: '2px 5px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '4px', fontSize: '0.45rem', fontWeight: 900, color: '#3b82f6', letterSpacing: '0.05em' }}>GLOBAL REGISTRY</div>
                                            )}
                                        </div>
                                        <div style={{ color: '#444', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>{item.name}</div>
                                    </div>
                                    <ArrowRight size={16} color="#222" />
                                </div>
                            ))}
                        </div>
                    )}

                    {query && results.length === 0 && !loading && (
                        <div style={{ 
                            position: 'absolute', top: '100%', left: 0, right: 0, 
                            background: '#050505', border: '1px solid #111', borderTop: 'none',
                            padding: '3rem', textAlign: 'center', color: '#333', fontSize: '0.7rem', fontWeight: 900 
                        }}>
                            NO ASSETS FOUND FOR "{query.toUpperCase()}"
                        </div>
                    )}
                </div>

                {/* Quick Shortcuts (Hidden when results are showing to prevent overlap) */}
                {!results.length && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '3rem', opacity: 0.4 }}>
                        {[
                            { icon: Activity, label: 'MARKET SCAN' },
                            { icon: PieChart, label: 'PORTFOLIO AUDIT' },
                            { icon: Zap, label: 'QUANT SIGNALS' }
                        ].map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <item.icon size={12} />
                                <span style={{ fontSize: '0.55rem', fontWeight: 900, letterSpacing: '0.05em' }}>{item.label}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MarketPulsePage;
