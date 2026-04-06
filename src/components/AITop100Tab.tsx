import React, { useEffect, useState, useRef } from 'react';
import { getMultipleQuotes } from '../services/stockDataService';
import type { Stock } from '../types';
import { formatCurrency, formatPercent, getChangeClass } from '../utils/formatters';
import { TrendingUp, TrendingDown, Activity, Zap } from 'lucide-react';
import { useMarket } from '../contexts/MarketContext';
import MiniSparkline from './MiniSparkline';

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

interface AITop100TabProps {
    onStockClick: (symbol: string) => void;
    selectedSymbol: string | null;
}

const AITop100Tab: React.FC<AITop100TabProps> = ({ onStockClick, selectedSymbol }) => {
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [loading, setLoading] = useState(true);
    const { selectedMarket } = useMarket();
    
    // Auto-scroll logic could go here
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let isMounted = true;
        const fetchStocks = async () => {
            try {
                const map = await getMultipleQuotes(SP100_SYMBOLS);
                if (!isMounted) return;
                
                const loadedStocks: Stock[] = [];
                SP100_SYMBOLS.forEach(sym => {
                    if (map.has(sym)) {
                        loadedStocks.push(map.get(sym)!);
                    }
                });
                
                setStocks(loadedStocks);

                // Auto-select first stock if none selected
                if (!selectedSymbol && loadedStocks.length > 0) {
                    onStockClick(loadedStocks[0].symbol);
                }
            } catch (err) {
                console.error('Failed to load Top 100:', err);
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
    }, [selectedMarket.id, selectedSymbol, onStockClick]);

    if (loading && stocks.length === 0) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: '0 1rem', height: '100%', color: 'var(--color-text-tertiary)' }}>
                <div className="spinner" style={{ width: '20px', height: '20px', marginRight: '1rem' }} />
                <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em' }}>INITIALIZING TICKER DOCK...</div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 1rem', borderBottom: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap size={14} color="var(--color-accent)" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'white', letterSpacing: '0.05em' }}>SP100 TICKER DOCK</span>
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Activity size={10} className="text-success pulse-animation" /> MULTIPLEX CONNECTED
                </div>
            </div>

            <div 
                ref={scrollContainerRef}
                className="ticker-ribbon"
                style={{ 
                    flex: 1, 
                    overflowY: 'hidden',
                    overflowX: 'auto', 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0 1rem'
            }}>
                {stocks.map(stock => {
                    const isPositive = stock.changePercent >= 0;
                    const isSelected = selectedSymbol === stock.symbol;
                    
                    return (
                        <button 
                            key={stock.symbol}
                            onClick={() => onStockClick(stock.symbol)}
                            className={`glass-card hover-glow ${isSelected ? 'selected-stock' : ''}`}
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '1rem',
                                padding: '0.5rem 1rem', 
                                border: isSelected ? '1px solid var(--color-accent)' : '1px solid var(--glass-border)',
                                cursor: 'pointer',
                                background: isSelected ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255,255,255,0.02)',
                                borderRadius: '8px',
                                minWidth: 'fit-content',
                                transition: 'all 0.2s ease',
                                transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                                boxShadow: isSelected ? '0 0 15px rgba(56, 189, 248, 0.15)' : 'none'
                            }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 900, color: 'white' }}>{stock.symbol}</div>
                                <div style={{ fontSize: '0.6rem', color: 'var(--color-text-tertiary)' }}>{formatCurrency(stock.price)}</div>
                            </div>

                            <div style={{ width: '40px' }}>
                                <MiniSparkline symbol={stock.symbol} width={40} height={16} />
                            </div>

                            <div className={getChangeClass(stock.change)} style={{ fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '2px' }}>
                                {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                {formatPercent(stock.changePercent)}
                            </div>
                        </button>
                    );
                })}
            </div>
            
            <style>{`
                .ticker-ribbon::-webkit-scrollbar {
                    height: 4px;
                }
                .ticker-ribbon::-webkit-scrollbar-track {
                    background: rgba(0,0,0,0.1);
                }
                .ticker-ribbon::-webkit-scrollbar-thumb {
                    background: var(--color-accent-dark);
                    border-radius: 2px;
                }
                .pulse-animation {
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0% { opacity: 0.5; transform: scale(0.95); }
                    50% { opacity: 1; transform: scale(1.05); }
                    100% { opacity: 0.5; transform: scale(0.95); }
                }
                .hover-glow:hover {
                    border-color: rgba(255,255,255,0.2) !important;
                }
                .selected-stock {
                    z-index: 10;
                }
            `}</style>
        </div>
    );
};

export default AITop100Tab;
