import React, { useState } from 'react';
import { User, Briefcase, Plus, ExternalLink, Calendar } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { soundService } from '../services/soundService';
import toast from 'react-hot-toast';

// Data for Famous Portfolios
const FAMOUS_PORTFOLIOS = [
    {
        id: 'nancy',
        name: "Nancy Pelosi's Picks",
        owner: "Nancy Pelosi",
        description: "High-conviction tech & semi-conductor plays.",
        holdings: [
            { symbol: 'NVDA', name: 'NVIDIA Corp', price: 887.00, change: 4.5, allocation: '28%', type: 'Tech', lastUpdated: '2025-01-15' },
            { symbol: 'MSFT', name: 'Microsoft Corp', price: 415.50, change: 1.2, allocation: '18%', type: 'Tech', lastUpdated: '2025-01-15' },
            { symbol: 'AAPL', name: 'Apple Inc.', price: 172.50, change: 0.5, allocation: '15%', type: 'Tech', lastUpdated: '2025-01-20' },
            { symbol: 'AVGO', name: 'Broadcom Inc.', price: 1285.30, change: -0.8, allocation: '12%', type: 'Semis', lastUpdated: '2025-02-10' },
            { symbol: 'CRWD', name: 'CrowdStrike', price: 320.10, change: 2.1, allocation: '10%', type: 'Cyber', lastUpdated: '2025-02-12' },
        ]
    },
    {
        id: 'warren',
        name: "Buffett's Core",
        owner: "Warren Buffett",
        description: "Value investing staples with strong moats.",
        holdings: [
            { symbol: 'AAPL', name: 'Apple Inc.', price: 172.50, change: 0.5, allocation: '40%', type: 'Tech', lastUpdated: '2025-01-01' },
            { symbol: 'BAC', name: 'Bank of America', price: 36.80, change: 1.1, allocation: '12%', type: 'Finance', lastUpdated: '2025-01-01' },
            { symbol: 'AXP', name: 'American Express', price: 235.40, change: 0.9, allocation: '10%', type: 'Finance', lastUpdated: '2025-01-01' },
            { symbol: 'KO', name: 'Coca-Cola', price: 62.20, change: -0.1, allocation: '8%', type: 'Consumer', lastUpdated: '2025-01-01' },
            { symbol: 'CVX', name: 'Chevron Corp', price: 160.10, change: 0.4, allocation: '6%', type: 'Energy', lastUpdated: '2025-01-01' },
        ]
    },
    {
        id: 'burry',
        name: "Burry's Big Short",
        owner: "Michael Burry",
        description: "Contrarian value & deep OTM puts.",
        holdings: [
            { symbol: 'JD', name: 'JD.com', price: 28.50, change: 2.1, allocation: '15%', type: 'China Tech', lastUpdated: '2025-01-15' },
            { symbol: 'BABA', name: 'Alibaba Group', price: 78.30, change: -0.2, allocation: '14%', type: 'China Tech', lastUpdated: '2025-01-15' },
            { symbol: 'HCA', name: 'HCA Healthcare', price: 320.10, change: 0.4, allocation: '10%', type: 'Health', lastUpdated: '2025-01-15' },
            { symbol: 'C', name: 'Citigroup', price: 55.20, change: 1.5, allocation: '8%', type: 'Finance', lastUpdated: '2025-01-15' },
        ]
    }
];

interface FamousHoldingsProps {
    onQuickAdd?: (symbol: string, name: string, price: number) => void;
}

const FamousHoldings: React.FC<FamousHoldingsProps> = ({ onQuickAdd }) => {
    const [activeTab, setActiveTab] = useState('nancy');

    const activePortfolio = FAMOUS_PORTFOLIOS.find(p => p.id === activeTab) || FAMOUS_PORTFOLIOS[0];

    const handleCopyTrade = (symbol: string, name: string, price: number) => {
        soundService.playTap();
        if (onQuickAdd) {
            onQuickAdd(symbol, name, price);
        } else {
            toast.success(`Copied ${symbol} trade setup`);
        }
    };

    return (
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--glass-border)' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Briefcase size={18} color="var(--color-accent)" /> Famous Portfolio Holdings
                </h3>
            </div>

            {/* Tabs - Improved Scroll Handling */}
            <div style={{
                display: 'flex',
                borderBottom: '1px solid var(--glass-border)',
                overflowX: 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
                padding: '0 4px',
                gap: '2px'
            }}>
                {FAMOUS_PORTFOLIOS.map(portfolio => (
                    <button
                        key={portfolio.id}
                        onClick={() => setActiveTab(portfolio.id)}
                        style={{
                            flex: 1,
                            padding: '1rem',
                            background: activeTab === portfolio.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                            border: 'none',
                            borderBottom: activeTab === portfolio.id ? '2px solid var(--color-accent)' : '2px solid transparent',
                            color: activeTab === portfolio.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                            fontWeight: activeTab === portfolio.id ? 600 : 400,
                            cursor: 'pointer',
                            minWidth: '130px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem' }}>
                            <User size={14} /> {portfolio.owner}
                        </div>
                    </button>
                ))}
            </div>

            <div style={{ padding: window.innerWidth < 480 ? '1rem' : '1.25rem' }}>
                <div style={{ marginBottom: '1.25rem' }}>
                    <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>{activePortfolio.name}</h4>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{activePortfolio.description}</div>
                </div>

                {/* Desktop Table - Hidden on very small screens */}
                <div style={{ overflowX: 'auto', display: window.innerWidth < 640 ? 'none' : 'block' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '550px' }}>
                        <thead>
                            <tr style={{ color: 'var(--color-text-tertiary)', fontSize: '0.75rem', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <th style={{ paddingBottom: '0.75rem' }}>Asset</th>
                                <th style={{ paddingBottom: '0.75rem', textAlign: 'right' }}>Price</th>
                                <th style={{ paddingBottom: '0.75rem', textAlign: 'right' }}>Alloc</th>
                                <th style={{ paddingBottom: '0.75rem', textAlign: 'right' }}>Update</th>
                                <th style={{ paddingBottom: '0.75rem', textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activePortfolio.holdings.map((stock) => (
                                <tr key={stock.symbol} style={{ borderTop: '1px solid var(--glass-border)' }}>
                                    <td style={{ padding: '0.75rem 0' }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{stock.symbol}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>{stock.type}</div>
                                    </td>
                                    <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{formatCurrency(stock.price)}</div>
                                        <div style={{ fontSize: '0.7rem', color: stock.change >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                                            {stock.change > 0 ? '+' : ''}{stock.change}%
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: 600, fontSize: '0.9rem' }}>
                                        {stock.allocation}
                                    </td>
                                    <td style={{ padding: '0.75rem 0', textAlign: 'right', color: 'var(--color-text-tertiary)', fontSize: '0.75rem' }}>
                                        {stock.lastUpdated.split('-').slice(1).join('/')}
                                    </td>
                                    <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>
                                        <button
                                            className="glass-button"
                                            style={{
                                                padding: '6px 10px',
                                                borderRadius: '8px',
                                                fontSize: '0.7rem',
                                                fontWeight: 700,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                            onClick={() => handleCopyTrade(stock.symbol, stock.name, stock.price)}
                                        >
                                            <Plus size={14} /> COPY
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card Grid - Visible on small screens */}
                <div style={{ display: window.innerWidth < 640 ? 'flex' : 'none', flexDirection: 'column', gap: '0.75rem' }}>
                    {activePortfolio.holdings.map((stock) => (
                        <div key={stock.symbol} className="glass-card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '1rem' }}>{stock.symbol}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>{stock.type}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{formatCurrency(stock.price)}</div>
                                    <div style={{ fontSize: '0.75rem', color: stock.change >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                                        {stock.change > 0 ? '+' : ''}{stock.change}%
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--glass-border)' }}>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Weight</div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{stock.allocation}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Updated</div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{stock.lastUpdated.split('-').slice(1).join('/')}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleCopyTrade(stock.symbol, stock.name, stock.price)}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '8px',
                                        background: 'var(--color-accent)',
                                        border: 'none',
                                        color: 'white',
                                        fontSize: '0.7rem',
                                        fontWeight: 800,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                >
                                    <Plus size={14} /> COPY
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FamousHoldings;
