import React from 'react';
import { Plus, Info, LayoutGrid } from 'lucide-react';
import { STOCKS_BY_INDEX } from '../data/sectors';
import { useMarket } from '../contexts/MarketContext';
import { soundService } from '../services/soundService';
import toast from 'react-hot-toast';

interface IndexComponentsProps {
    onQuickAdd: (symbol: string) => void;
}

const IndexComponents: React.FC<IndexComponentsProps> = ({ onQuickAdd }) => {
    const { selectedMarket } = useMarket();

    const indexName = selectedMarket.id === 'us' ? 'S&P 500' :
        selectedMarket.id === 'egypt' ? 'EGX 30' :
            'FTSE ADX 15';

    const constituents = STOCKS_BY_INDEX[indexName] || [];

    const handleAdd = (symbol: string) => {
        soundService.playTap();
        onQuickAdd(symbol);
        toast.success(`Added ${symbol} to your ${selectedMarket.name} watchlist`);
    };

    if (constituents.length === 0) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <LayoutGrid size={22} style={{ color: selectedMarket.color }} />
                        {indexName} <span className="gradient-text">Constituents</span>
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
                        Major components of the {selectedMarket.name} benchmark index.
                    </p>
                </div>
            </div>

            <div className="glass-card" style={{ padding: '1rem', border: '1px solid var(--glass-border)' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '12px'
                }}>
                    {constituents.slice(0, 12).map((stock) => (
                        <div
                            key={stock.symbol}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '10px 12px',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '10px',
                                border: '1px solid transparent',
                                transition: 'all 0.2s',
                                cursor: 'default'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.borderColor = selectedMarket.color + '44';
                                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.borderColor = 'transparent';
                                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                            }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>{stock.symbol}</span>
                                <span style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--color-text-tertiary)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {stock.name}
                                </span>
                            </div>
                            <button
                                className="btn btn-icon glass-button highlight-on-hover"
                                style={{ width: '28px', height: '28px', borderRadius: '6px', color: selectedMarket.color }}
                                onClick={() => handleAdd(stock.symbol)}
                                title={`Add ${stock.symbol} to watchlist`}
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    ))}
                </div>

                {constituents.length > 12 && (
                    <div style={{
                        marginTop: '1rem',
                        padding: '8px',
                        textAlign: 'center',
                        fontSize: '0.75rem',
                        color: 'var(--color-text-tertiary)',
                        borderTop: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        Showing top 12 of {constituents.length} index components
                    </div>
                )}
            </div>

            <style>{`
                .highlight-on-hover:hover {
                    background: ${selectedMarket.color} !important;
                    color: white !important;
                    box-shadow: 0 4px 12px ${selectedMarket.color}44;
                }
            `}</style>
        </div>
    );
};

export default IndexComponents;
