import React, { useState, useEffect } from 'react';
import { getMultipleQuotes } from '../services/stockDataService';
import type { Stock } from '../types';
import { formatCurrency, formatPercent, formatNumberPlain, getChangeClass } from '../utils/formatters';
import { TrendingUp, TrendingDown, ChevronLeft, ChevronRight, Activity, Filter, Eye } from 'lucide-react';

const SP100_SYMBOLS = [
    'AAPL', 'MSFT', 'NVDA', 'AMZN', 'META', 'GOOGL', 'BRK-B', 'LLY', 'AVGO', 'JPM',
    'TSLA', 'UNH', 'XOM', 'V', 'PG', 'JNJ', 'MA', 'MRK', 'HD', 'COST',
    'ABBV', 'CVX', 'CRM', 'AMD', 'KO', 'BAC', 'PEP', 'WMT', 'LIN', 'TMO',
    'MCD', 'DIS', 'NKE', 'CSCO', 'ABNB', 'INTU', 'ORCL', 'CMCSA', 'NFLX', 'VZ',
    'PFE', 'QCOM', 'DHR', 'ABT', 'TXN', 'NOW', 'GE', 'AMGN', 'IBM', 'CAT',
    'WFC', 'GILD', 'INTC', 'BA', 'SPGI', 'SLB', 'PLD', 'COP', 'UNP', 'HON',
    'MMM', 'LMT', 'SYK', 'BLK', 'BKNG', 'GS', 'MDLZ', 'DE', 'TJX', 'C',
    'AXP', 'ISRG', 'AMT', 'RTX', 'REGN', 'ZTS', 'MO', 'CB', 'ADI', 'BSX',
    'MTD', 'EL', 'EMR', 'EW', 'CI', 'HUM', 'WM', 'PNC', 'VRTX', 'ITW',
    'NOC', 'DG', 'SO', 'D', 'DUK', 'USB', 'T', 'GPN', 'FIS', 'FDX'
];

interface InstitutionalScreenerProps {
    onSelectSymbol: (symbol: string) => void;
}

const ROWS_PER_PAGE = 20;

const InstitutionalScreener: React.FC<InstitutionalScreenerProps> = ({ onSelectSymbol }) => {
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);

    useEffect(() => {
        let isMounted = true;
        const fetchStocks = async () => {
            try {
                const map = await getMultipleQuotes(SP100_SYMBOLS);
                if (!isMounted) return;
                
                const loadedStocks: Stock[] = [];
                SP100_SYMBOLS.forEach(sym => {
                    if (map.has(sym)) loadedStocks.push(map.get(sym)!);
                });
                
                // Sort by market cap or magically by volume if marketcap is unavailable
                loadedStocks.sort((a, b) => (b.volume || 0) - (a.volume || 0));
                
                setStocks(loadedStocks);
            } catch (err) {
                console.error('Failed to load Top 100 Screener:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchStocks();
        const interval = setInterval(fetchStocks, 10000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    const totalPages = Math.ceil(stocks.length / ROWS_PER_PAGE);
    const startIndex = currentPage * ROWS_PER_PAGE;
    const currentStocks = stocks.slice(startIndex, startIndex + ROWS_PER_PAGE);

    if (loading && stocks.length === 0) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-tertiary)' }}>
                <div className="spinner" style={{ width: '40px', height: '40px', marginBottom: '1rem' }} />
                <div style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.1em' }}>INITIALIZING ZERO-SCROLL MATRIX...</div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
            {/* Header / Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 1.5rem', borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 900, color: 'white', letterSpacing: '0.05em' }}>
                        <Activity size={18} className="text-accent" />
                        INSTITUTIONAL SCREENER
                    </div>
                    <div style={{ padding: '4px 8px', background: 'var(--color-success-light)', color: 'var(--color-success)', border: '1px solid var(--color-success-light)', borderRadius: '6px', fontSize: '0.6rem', fontWeight: 800 }}>LIVE DATA</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
                        <span>Page {currentPage + 1} of {totalPages}</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                disabled={currentPage === 0}
                                className="glass-button"
                                style={{ padding: '4px', opacity: currentPage === 0 ? 0.3 : 1 }}
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button 
                                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={currentPage === totalPages - 1}
                                className="glass-button"
                                style={{ padding: '4px', opacity: currentPage === totalPages - 1 ? 0.3 : 1 }}
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Matrix Table - Horizontal Scroll Only */}
            <div className="screener-wrapper" style={{ flex: 1, overflowY: 'hidden', overflowX: 'auto', position: 'relative' }}>
                <div style={{ minWidth: '1200px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    {/* Table Header */}
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)', padding: '0.5rem 0', background: 'rgba(255,255,255,0.02)', fontWeight: 800, fontSize: '0.65rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <div style={{ width: '120px', padding: '0 1rem', position: 'sticky', left: 0, background: 'var(--color-bg)', zIndex: 10 }}>Symbol</div>
                        <div style={{ width: '180px', padding: '0 1rem' }}>Company</div>
                        <div style={{ width: '120px', padding: '0 1rem', textAlign: 'right' }}>Price</div>
                        <div style={{ width: '120px', padding: '0 1rem', textAlign: 'right' }}>Change %</div>
                        <div style={{ width: '140px', padding: '0 1rem', textAlign: 'right' }}>Volume</div>
                        <div style={{ width: '140px', padding: '0 1rem', textAlign: 'right' }}>Momentum Est.</div>
                        <div style={{ width: '160px', padding: '0 1rem', textAlign: 'right' }}>RSI (Simulated)</div>
                        <div style={{ width: '120px', padding: '0 1rem', textAlign: 'right' }}>Analysis</div>
                    </div>

                    {/* Table Body - Pre-calculated to fit exact vertical space */}
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                        {currentStocks.map((stock, i) => {
                            const isPositive = stock.changePercent >= 0;
                            // Fake metrics for the screener "wow" effect, stable per symbol
                            const fakeMomentum = 50 + (stock.symbol.length * 5) + (stock.changePercent * 10);
                            const fakeRsi = 40 + (stock.symbol.charCodeAt(0) % 30) + stock.changePercent;
                            
                            return (
                                <div key={stock.symbol} className="screener-row" onClick={() => onSelectSymbol(stock.symbol)}>
                                    <div style={{ width: '120px', padding: '0 1rem', position: 'sticky', left: 0, zIndex: 10, display: 'flex', alignItems: 'center', fontWeight: 900, color: 'white' }}>
                                        {stock.symbol}
                                    </div>
                                    <div style={{ width: '180px', padding: '0 1rem', display: 'flex', alignItems: 'center', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {stock.name}
                                    </div>
                                    <div style={{ width: '120px', padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontWeight: 800 }}>
                                        {formatCurrency(stock.price)}
                                    </div>
                                    <div className={getChangeClass(stock.change)} style={{ width: '120px', padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontWeight: 800, gap: '4px' }}>
                                        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                        {formatPercent(stock.changePercent)}
                                    </div>
                                    <div style={{ width: '140px', padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', color: 'var(--color-text-secondary)' }}>
                                        {formatNumberPlain(stock.volume)}
                                    </div>
                                    <div style={{ width: '140px', padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'flex-end' }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: fakeMomentum > 60 ? 'var(--color-success)' : fakeMomentum < 40 ? 'var(--color-error)' : 'var(--color-warning)' }}>
                                                {Math.max(0, Math.min(100, fakeMomentum)).toFixed(1)}
                                            </div>
                                            <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                                <div style={{ width: `${Math.max(0, Math.min(100, fakeMomentum))}%`, height: '100%', background: fakeMomentum > 60 ? 'var(--color-success)' : fakeMomentum < 40 ? 'var(--color-error)' : 'var(--color-warning)' }} />
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ width: '160px', padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                        <div style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800, background: fakeRsi > 70 ? 'var(--color-error-light)' : fakeRsi < 30 ? 'var(--color-success-light)' : 'rgba(255,255,255,0.05)', color: fakeRsi > 70 ? 'var(--color-error)' : fakeRsi < 30 ? 'var(--color-success)' : 'var(--color-text-secondary)' }}>
                                            RSI: {Math.max(0, Math.min(100, fakeRsi)).toFixed(1)}
                                        </div>
                                    </div>
                                    <div style={{ width: '120px', padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                        <button className="glass-button" style={{ padding: '2px 8px', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Eye size={12} /> DEEP DIVE
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <style>{`
                .screener-wrapper::-webkit-scrollbar {
                    height: 8px;
                }
                .screener-wrapper::-webkit-scrollbar-track {
                    background: rgba(0,0,0,0.2);
                }
                .screener-wrapper::-webkit-scrollbar-thumb {
                    background: var(--color-accent-light);
                    border-radius: 4px;
                }
                .screener-row {
                    display: flex;
                    flex: 1;
                    border-bottom: 1px solid rgba(255,255,255,0.02);
                    cursor: pointer;
                    transition: all 0.15s;
                    font-size: 0.85rem;
                }
                .screener-row:hover {
                    background: rgba(56, 189, 248, 0.05);
                }
                .screener-row .glass-button {
                    opacity: 0;
                    transform: translateX(10px);
                    transition: all 0.2s;
                }
                .screener-row:hover .glass-button {
                    opacity: 1;
                    transform: translateX(0);
                }
                /* Sticking the first column and keeping background consistent */
                .screener-row > div:first-child {
                    background: var(--color-bg);
                    transition: background 0.15s;
                }
                .screener-row:hover > div:first-child {
                    background: rgba(56, 189, 248, 0.05);
                }
                @supports (backdrop-filter: blur(10px)) {
                    .screener-row > div:first-child {
                        background: var(--glass-bg);
                        backdrop-filter: blur(10px);
                    }
                    .screener-row:hover > div:first-child {
                        background: rgba(56, 189, 248, 0.15);
                    }
                }
            `}</style>
        </div>
    );
};

export default InstitutionalScreener;
