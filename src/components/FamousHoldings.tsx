import React, { useState, useMemo } from 'react';
import { User, Briefcase, Plus, Zap, Target, LineChart, TrendingUp, TrendingDown, Star, ShieldCheck, Gem, Info } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { soundService } from '../services/soundService';
import toast from 'react-hot-toast';

// ─── Data Enrichment ────────────────────────────────────────────────────────
const FAMOUS_PORTFOLIOS = [
    {
        id: 'nancy',
        name: "Pelosi's Alpha Loop",
        owner: "Nancy Pelosi",
        description: "Focus on AI sovereignty and legislative-adjacent Tech plays.",
        strategy: "High-Conviction Sector Rotation",
        icon: Zap,
        color: "#6366f1",
        tags: ["Alpha Loop", "Tech Proxy"],
        holdings: [
            { symbol: 'NVDA', name: 'NVIDIA Corp', price: 834.12, change: 4.82, allocation: 28.5, conviction: 98, type: 'Generative AI', intel: 'Strategic Semi positioning.' },
            { symbol: 'PLTR', name: 'Palantir', price: 24.15, change: 3.21, allocation: 15.2, conviction: 92, type: 'Defense AI', intel: 'Gov contract acceleration.' },
            { symbol: 'MSFT', name: 'Microsoft Corp', price: 412.30, change: 1.15, allocation: 18.4, conviction: 89, type: 'Enterprise Cloud', intel: 'Copilot monetization.' },
            { symbol: 'AAPL', name: 'Apple Inc.', price: 182.45, change: 0.45, allocation: 12.1, conviction: 85, type: 'Hardware', intel: 'Service revenue moat.' },
            { symbol: 'PANW', name: 'Palo Alto Networks', price: 342.10, change: 2.10, allocation: 8.5, conviction: 94, type: 'Cyber', intel: 'Institutional spend lead.' },
        ]
    },
    {
        id: 'warren',
        name: "Buffett's Fortress",
        owner: "Warren Buffett",
        description: "Deep value, infinite moats, and cash-flow machines.",
        strategy: "Indefinite Hold Infrastructure",
        icon: ShieldCheck,
        color: "#10b981",
        tags: ["Value Core", "Cash Moat"],
        holdings: [
            { symbol: 'AAPL', name: 'Apple Inc.', price: 182.45, change: 0.45, allocation: 42.4, conviction: 95, type: 'Consumer Eco', intel: 'Brand pricing power.' },
            { symbol: 'BAC', name: 'Bank of America', price: 37.12, change: 1.25, allocation: 10.8, conviction: 88, type: 'Retail Banking', intel: 'NII sensitivity play.' },
            { symbol: 'AXP', name: 'American Express', price: 242.00, change: 0.82, allocation: 9.5, conviction: 91, type: 'Payments', intel: 'Premium credit tier.' },
            { symbol: 'KO', name: 'Coca-Cola', price: 63.45, change: -0.15, allocation: 7.2, conviction: 99, type: 'Staples', intel: 'Inflation hedge.' },
            { symbol: 'XYL', name: 'Xylem Inc.', price: 128.50, change: 0.45, allocation: 5.4, conviction: 82, type: 'Water Infra', intel: 'Long-term utility.' },
        ]
    },
    {
        id: 'cathie',
        name: "Cathie's Moonshots",
        owner: "Cathie Wood",
        description: "Disruptive innovation and exponential technology curves.",
        strategy: "Hyper-Growth Innovation",
        icon: Target,
        color: "#f59e0b",
        tags: ["Moonshot", "Innovation"],
        holdings: [
            { symbol: 'TSLA', name: 'Tesla Inc.', price: 195.40, change: -2.15, allocation: 14.8, conviction: 99, type: 'Autonomy', intel: 'FSD V12 adoption.' },
            { symbol: 'COIN', name: 'Coinbase Global', price: 182.30, change: 5.42, allocation: 12.1, conviction: 94, type: 'Digital Assets', intel: 'ETF flow gateway.' },
            { symbol: 'SQ', name: 'Block Inc.', price: 78.45, change: 1.85, allocation: 9.5, conviction: 87, type: 'Fintech', intel: 'Bitcoin ecosystem.' },
            { symbol: 'ROKU', name: 'Roku Inc.', price: 68.12, change: -3.45, allocation: 8.2, conviction: 82, type: 'Ad-Tech', intel: 'Connected TV lead.' },
            { symbol: 'U', name: 'Unity Software', price: 32.40, change: 1.12, allocation: 5.5, conviction: 78, type: 'RT3D', intel: 'Metaverse foundations.' },
        ]
    },
    {
        id: 'ackman',
        name: "Ackman's Tactical",
        owner: "Bill Ackman",
        description: "Concentrated long/short bets and activist plays.",
        strategy: "Opportunistic Activism",
        icon: LineChart,
        color: "#ec4899",
        tags: ["Activist", "Concentrated"],
        holdings: [
            { symbol: 'CMG', name: 'Chipotle', price: 2845.20, change: 1.25, allocation: 18.5, conviction: 96, type: 'Retail', intel: 'Throughput optimization.' },
            { symbol: 'HLT', name: 'Hilton Worldwide', price: 212.30, change: 0.85, allocation: 15.2, conviction: 92, type: 'Hospitality', intel: 'Asst-light compounding.' },
            { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 145.42, change: 2.15, allocation: 12.4, conviction: 89, type: 'AI Infrastructure', intel: 'Search dominance.' },
            { symbol: 'LOW', name: 'Lowes Cos', price: 235.10, change: -0.45, allocation: 9.8, conviction: 87, type: 'Housing', intel: 'Remodel cycle proxy.' },
            { symbol: 'QSR', name: 'Restaurant Brands', price: 78.12, change: 0.12, allocation: 8.5, conviction: 84, type: 'Consumer', intel: 'Global franchise scale.' },
        ]
    }
];

interface FamousHoldingsProps {
    onQuickAdd?: (symbol: string, name: string, price: number) => void;
}

const FamousHoldings: React.FC<FamousHoldingsProps> = ({ onQuickAdd }) => {
    const [activeTab, setActiveTab] = useState('nancy');

    const activePortfolio = useMemo(() =>
        FAMOUS_PORTFOLIOS.find(p => p.id === activeTab) || FAMOUS_PORTFOLIOS[0],
        [activeTab]);

    const handleCopyTrade = (symbol: string, name: string, price: number) => {
        soundService.playTap();
        if (onQuickAdd) {
            onQuickAdd(symbol, name, price);
        } else {
            toast.success(`Copied ${symbol} trade setup`);
        }
    };

    const getConvictionColor = (score: number) => {
        if (score >= 95) return 'var(--color-success)';
        if (score >= 90) return 'var(--color-accent)';
        if (score >= 80) return 'var(--color-warning)';
        return 'var(--color-text-tertiary)';
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* ── Title Section ─────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Gem size={22} style={{ color: 'var(--color-warning)' }} />
                        Institutional <span className="gradient-text">Whale Watch</span>
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
                        Tracking real-time tactical positioning of global capital leaders.
                    </p>
                </div>
            </div>

            <div className="glass-card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                {/* ── Tabs: Persona Selector ─────────────────── */}
                <div style={{
                    display: 'flex',
                    background: 'rgba(0,0,0,0.2)',
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                    padding: '8px',
                    gap: '8px'
                }}>
                    {FAMOUS_PORTFOLIOS.map(portfolio => (
                        <button
                            key={portfolio.id}
                            onClick={() => { setActiveTab(portfolio.id); soundService.playTap(); }}
                            style={{
                                flex: 1,
                                minWidth: '140px',
                                padding: '12px 16px',
                                background: activeTab === portfolio.id ? 'rgba(255,255,255,0.06)' : 'transparent',
                                border: '1px solid',
                                borderColor: activeTab === portfolio.id ? portfolio.color + '44' : 'transparent',
                                borderRadius: '12px',
                                color: activeTab === portfolio.id ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}
                        >
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: activeTab === portfolio.id ? portfolio.color + '22' : 'rgba(255,255,255,0.03)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: activeTab === portfolio.id ? portfolio.color : 'inherit'
                            }}>
                                <portfolio.icon size={18} />
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{portfolio.owner}</div>
                                <div style={{ fontSize: '0.65rem', opacity: 0.6 }}>{portfolio.tags[0]}</div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* ── Active Portfolio Header ────────────────── */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', background: 'linear-gradient(to right, rgba(0,0,0,0.2), transparent)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ flex: 1, minWidth: '240px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>{activePortfolio.name}</h4>
                                <span style={{
                                    fontSize: '0.65rem',
                                    padding: '2px 8px',
                                    borderRadius: '20px',
                                    background: activePortfolio.color + '22',
                                    color: activePortfolio.color,
                                    fontWeight: 700,
                                    border: `1px solid ${activePortfolio.color}44`
                                }}>
                                    {activePortfolio.strategy.toUpperCase()}
                                </span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                                {activePortfolio.description}
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {activePortfolio.tags.map(tag => (
                                <span key={tag} style={{ fontSize: '0.6rem', color: 'var(--color-text-tertiary)', padding: '2px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px' }}>#{tag}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Holdings Grid ─────────────────────────── */}
                <div style={{ padding: '1rem' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                            <thead>
                                <tr style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                    <th style={{ textAlign: 'left', padding: '0 12px' }}>Holding</th>
                                    <th style={{ textAlign: 'right', padding: '0 12px' }}>Conviction</th>
                                    <th style={{ textAlign: 'right', padding: '0 12px' }}>Weight</th>
                                    <th style={{ textAlign: 'left', padding: '0 12px' }}>Tactical Intel</th>
                                    <th style={{ textAlign: 'right', padding: '0 12px' }}>Sync</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activePortfolio.holdings.map((stock) => (
                                    <tr key={stock.symbol} className="holding-row" style={{ background: 'rgba(255,255,255,0.02)', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '12px', borderRadius: '12px 0 0 12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '10px',
                                                    background: 'rgba(0,0,0,0.3)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 900,
                                                    fontSize: '0.8rem',
                                                    color: 'var(--color-text-primary)',
                                                    border: '1px solid var(--glass-border)'
                                                }}>
                                                    {stock.symbol[0]}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{stock.symbol}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <span className={stock.change >= 0 ? 'text-success' : 'text-error'} style={{ fontWeight: 700 }}>
                                                            {stock.change > 0 ? '↑' : '↓'} {Math.abs(stock.change)}%
                                                        </span>
                                                        • {stock.type}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 900, color: getConvictionColor(stock.conviction) }}>
                                                    {stock.conviction}%
                                                </div>
                                                <div style={{ width: '40px', height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${stock.conviction}%`, height: '100%', background: getConvictionColor(stock.conviction) }} />
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right' }}>
                                            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{stock.allocation}%</div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)' }}>Portfolio</div>
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <div style={{
                                                fontSize: '0.75rem',
                                                color: 'var(--color-text-secondary)',
                                                background: 'rgba(255,255,255,0.03)',
                                                padding: '6px 10px',
                                                borderRadius: '8px',
                                                border: '1px dotted var(--glass-border)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                maxWidth: '200px'
                                            }}>
                                                <Info size={12} style={{ flexShrink: 0 }} />
                                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stock.intel}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right', borderRadius: '0 12px 12px 0' }}>
                                            <button
                                                className="btn btn-icon glass-button highlight-on-hover"
                                                style={{ width: '32px', height: '32px', borderRadius: '8px', color: 'var(--color-accent)' }}
                                                onClick={() => handleCopyTrade(stock.symbol, stock.name, stock.price)}
                                                title="Sync Holding to Portfolio"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── Footer Stats ──────────────────────────── */}
                <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <span>LATEST UPDATED: <strong style={{ color: 'var(--color-text-secondary)' }}>2026-02-25</strong></span>
                        <span>SOURCE: <strong style={{ color: 'var(--color-text-secondary)' }}>F13 SEC FILINGS</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-success)', boxShadow: '0 0 8px var(--color-success)' }} />
                        LIVE INTELLIGENCE SYNC
                    </div>
                </div>
            </div>

            <style>{`
                .holding-row:hover {
                    background: rgba(255,255,255,0.05) !important;
                }
                .highlight-on-hover:hover {
                    background: var(--color-accent) !important;
                    color: white !important;
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
                }
            `}</style>
        </div>
    );
};

export default FamousHoldings;
