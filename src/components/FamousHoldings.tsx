import React from 'react';
import { Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatPercent } from '../utils/formatters';

interface FamousHolding {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    sector: string;
}

// Mock data for display - in a real app, these would fetch live prices
// For now, we'll just use static data or we could fetch them if we want to be fancy later
// but the requirement is just "bring back the 12 famous portfolio holdings"
const FAMOUS_STOCKS: FamousHolding[] = [
    { symbol: 'AAPL', name: 'Apple Inc.', price: 185.92, change: 1.25, changePercent: 0.68, sector: 'Technology' },
    { symbol: 'MSFT', name: 'Microsoft Corp.', price: 420.55, change: 3.45, changePercent: 0.82, sector: 'Technology' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 178.22, change: -1.10, changePercent: -0.61, sector: 'Consumer Cyclical' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 147.14, change: 2.15, changePercent: 1.48, sector: 'Communication Services' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 788.17, change: 15.22, changePercent: 1.97, sector: 'Technology' },
    { symbol: 'META', name: 'Meta Platforms', price: 484.03, change: -0.55, changePercent: -0.11, sector: 'Communication Services' },
    { symbol: 'TSLA', name: 'Tesla Inc.', price: 199.95, change: -2.35, changePercent: -1.16, sector: 'Consumer Cyclical' },
    { symbol: 'BRK.B', name: 'Berkshire Hathaway', price: 417.22, change: 4.12, changePercent: 1.00, sector: 'Financial Services' },
    { symbol: 'LLY', name: 'Eli Lilly & Co.', price: 782.10, change: 8.50, changePercent: 1.10, sector: 'Healthcare' },
    { symbol: 'AVGO', name: 'Broadcom Inc.', price: 1296.25, change: 12.45, changePercent: 0.97, sector: 'Technology' },
    { symbol: 'JPM', name: 'JPMorgan Chase', price: 183.45, change: 1.15, changePercent: 0.63, sector: 'Financial Services' },
    { symbol: 'V', name: 'Visa Inc.', price: 285.33, change: 0.85, changePercent: 0.30, sector: 'Financial Services' }
];

interface FamousHoldingsProps {
    onQuickAdd: (symbol: string, name: string, price: number) => void;
}

const FamousHoldings: React.FC<FamousHoldingsProps> = ({ onQuickAdd }) => {
    return (
        <div style={{ marginTop: '3rem', marginBottom: '2rem' }}>
            <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
            }}>
                <span className="logo-icon" style={{ width: '32px', height: '32px', padding: '6px' }}>
                    <TrendingUp size={18} color="white" />
                </span>
                Popular Holdings
                <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: 'var(--color-text-tertiary)',
                    background: 'var(--color-bg-tertiary)',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    marginLeft: 'auto'
                }}>
                    Quick Add
                </span>
            </h3>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1rem'
            }}>
                {FAMOUS_STOCKS.map((stock) => (
                    <div
                        key={stock.symbol}
                        className="glass-card"
                        style={{
                            padding: '1.25rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                            cursor: 'default',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{stock.symbol}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{stock.name}</div>
                            </div>
                            <button
                                className="btn btn-icon btn-small glass-button"
                                onClick={() => onQuickAdd(stock.symbol, stock.name, stock.price)}
                                title="Add to Portfolio"
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    color: 'var(--color-accent)'
                                }}
                            >
                                <Plus size={18} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--glass-border)' }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                                {formatCurrency(stock.price)}
                            </div>
                            <div className={stock.change >= 0 ? 'text-success' : 'text-error'} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 500 }}>
                                {stock.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                {formatPercent(stock.changePercent)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FamousHoldings;
