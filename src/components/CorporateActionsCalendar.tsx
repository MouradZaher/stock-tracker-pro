import React, { useState } from 'react';
import { 
    Calendar, TrendingUp, DollarSign, Rocket, 
    FileText, ChevronLeft, ChevronRight, Info,
    ArrowUpRight, AlertCircle, Globe, Zap, Clock
} from 'lucide-react';
import { useMarket } from '../contexts/MarketContext';
import CompanyLogo from './CompanyLogo';

interface CorporateAction {
    id: string;
    symbol: string;
    name: string;
    type: 'Dividend' | 'IPO' | 'Rights' | 'Stock Split' | 'Merger';
    date: string;
    description: string;
    value?: string;
    marketId: string;
    status: 'Upcoming' | 'Active' | 'Completed';
    impact: 'High' | 'Medium' | 'Low';
}

const MOCK_ACTIONS: CorporateAction[] = [
    // US Markets
    { id: '1', symbol: 'AAPL', name: 'Apple Inc.', type: 'Dividend', date: '2026-04-15', description: 'Quarterly Cash Dividend', value: '$0.24', marketId: 'us', status: 'Upcoming', impact: 'Medium' },
    { id: '2', symbol: 'MSFT', name: 'Microsoft Corp.', type: 'Dividend', date: '2026-04-18', description: 'Quarterly Cash Dividend', value: '$0.75', marketId: 'us', status: 'Upcoming', impact: 'Medium' },
    { id: '3', symbol: 'RDDT', name: 'Reddit Inc.', type: 'IPO', date: '2026-04-22', description: 'Initial Public Offering - Secondary Sale', marketId: 'us', status: 'Upcoming', impact: 'High' },
    
    // Egypt Markets
    { id: '4', symbol: 'COMI', name: 'Commercial International Bank', type: 'Dividend', date: '2026-04-12', description: 'Annual Cash Dividend', value: '4.55 EGP', marketId: 'egypt', status: 'Active', impact: 'High' },
    { id: '5', symbol: 'HRHO', name: 'EFG Hermes', type: 'Rights', date: '2026-04-25', description: 'Capital Increase Rights Issue', marketId: 'egypt', status: 'Upcoming', impact: 'High' },
    { id: '6', symbol: 'FWRY', name: 'Fawry for Banking & Payment', type: 'Stock Split', date: '2026-05-01', description: '1-to-2 Stock Split', marketId: 'egypt', status: 'Upcoming', impact: 'Medium' },
    
    // UAE Markets
    { id: '7', symbol: 'DEWA', name: 'Dubai Electricity & Water', type: 'Dividend', date: '2026-04-20', description: 'Final Dividend Payment', value: '0.04 AED', marketId: 'uae', status: 'Upcoming', impact: 'High' },
    { id: '8', symbol: 'AIRARABIA', name: 'Air Arabia PJSC', type: 'Dividend', date: '2026-04-14', description: 'Cash Dividend Distribution', value: '0.20 AED', marketId: 'uae', status: 'Upcoming', impact: 'Medium' },
    { id: '9', symbol: 'ETISALAT', name: 'e& (Etisalat)', type: 'Merger', date: '2026-05-15', description: 'Strategy Acquisition completion - Vodafone Stake', marketId: 'uae', status: 'Upcoming', impact: 'Medium' },
];

const CorporateActionsCalendar: React.FC = () => {
    const { selectedMarket } = useMarket();
    const [filterType, setFilterType] = useState<string>('All');

    const filteredActions = MOCK_ACTIONS.filter(action => {
        const marketMatch = action.marketId === selectedMarket.id;
        const typeMatch = filterType === 'All' || action.type === filterType;
        return marketMatch && typeMatch;
    });

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'Dividend': return <DollarSign size={14} />;
            case 'IPO': return <Rocket size={14} />;
            case 'Rights': return <FileText size={14} />;
            case 'Stock Split': return <TrendingUp size={14} />;
            default: return <Zap size={14} />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'Dividend': return '#10b981';
            case 'IPO': return '#6366f1';
            case 'Rights': return '#f59e0b';
            case 'Stock Split': return '#ec4899';
            default: return '#94a3b8';
        }
    };

    return (
        <div className="corporate-actions-container" style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            padding: '1.5rem',
            overflow: 'hidden'
        }}>
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ 
                        margin: 0, fontSize: '1.25rem', fontStyle: 'italic', fontWeight: 900, 
                        letterSpacing: '-0.02em', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' 
                    }}>
                        <Calendar size={22} color="var(--color-accent)" />
                        CORPORATE ACTIONS CALENDAR
                    </h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.7rem', color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Strategic Events for <span style={{ color: selectedMarket.color }}>{selectedMarket.name}</span> Institutional Coverage
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['All', 'Dividend', 'IPO', 'Rights'].map(type => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            style={{
                                background: filterType === type ? 'rgba(255,255,255,0.05)' : 'transparent',
                                border: filterType === type ? '1px solid #333' : '1px solid transparent',
                                color: filterType === type ? 'white' : '#444',
                                padding: '4px 12px',
                                borderRadius: '8px',
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {type.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Grid */}
            <div style={{ 
                flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem',
                scrollbarWidth: 'none', msOverflowStyle: 'none'
            }}>
                {filteredActions.length === 0 ? (
                    <div style={{ 
                        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', 
                        justifyContent: 'center', color: '#333', gap: '1rem' 
                    }}>
                        <AlertCircle size={48} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            No corporate actions detected for this selection
                        </span>
                    </div>
                ) : (
                    filteredActions.map(action => (
                        <div key={action.id} style={{
                            background: 'rgba(2,2,6,0.5)',
                            border: '1px solid #111',
                            borderRadius: '16px',
                            padding: '1.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1.5rem',
                            position: 'relative',
                            overflow: 'hidden',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#222';
                            e.currentTarget.style.background = 'rgba(10,10,15,0.8)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#111';
                            e.currentTarget.style.background = 'rgba(2,2,6,0.5)';
                        }}
                        >
                            {/* Accent line */}
                            <div style={{ 
                                position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px',
                                background: getTypeColor(action.type), opacity: 0.6
                            }} />

                            {/* Date Column */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px' }}>
                                <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#444', textTransform: 'uppercase' }}>
                                    {new Date(action.date).toLocaleDateString('en-US', { month: 'short' })}
                                </span>
                                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white' }}>
                                    {new Date(action.date).getDate()}
                                </span>
                            </div>

                            {/* Logo & Symbol */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                                <div style={{ 
                                    width: '40px', height: '40px', borderRadius: '10px', 
                                    background: 'white', display: 'flex', alignItems: 'center', 
                                    justifyContent: 'center', padding: '4px' 
                                }}>
                                    <CompanyLogo symbol={action.symbol} size={32} />
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '0.95rem', fontWeight: 900, color: 'white' }}>{action.symbol}</span>
                                        <span style={{ 
                                            background: `${getTypeColor(action.type)}22`, 
                                            color: getTypeColor(action.type),
                                            fontSize: '0.55rem', fontWeight: 900, padding: '2px 6px', 
                                            borderRadius: '6px', border: `1px solid ${getTypeColor(action.type)}44`,
                                            display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase'
                                        }}>
                                            {getTypeIcon(action.type)}
                                            {action.type}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#888', fontWeight: 500, marginTop: '2px' }}>{action.name}</div>
                                </div>
                            </div>

                            {/* Description */}
                            <div style={{ flex: 1.5 }}>
                                <div style={{ fontSize: '0.7rem', color: '#555', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Event Brief</div>
                                <div style={{ fontSize: '0.85rem', color: '#ccc', fontWeight: 600, marginTop: '4px' }}>{action.description}</div>
                            </div>

                            {/* Value/Details */}
                            {action.value && (
                                <div style={{ minWidth: '100px', textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.7rem', color: '#555', fontWeight: 800, textTransform: 'uppercase' }}>Distribution</div>
                                    <div style={{ fontSize: '1rem', fontWeight: 900, color: '#10b981', marginTop: '2px' }}>{action.value}</div>
                                </div>
                            )}

                            {/* Impact/Action */}
                            <div style={{ textAlign: 'center', minWidth: '80px' }}>
                                <div style={{ fontSize: '0.6rem', fontWeight: 900, color: action.impact === 'High' ? '#ef4444' : '#555', textTransform: 'uppercase' }}>Impact</div>
                                <div style={{ 
                                    marginTop: '4px', fontSize: '0.7rem', fontWeight: 900, color: 'white', 
                                    display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' 
                                }}>
                                    {action.impact.toUpperCase()}
                                    <ArrowUpRight size={12} />
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Institutional Summary Footer */}
            <div style={{ 
                background: 'rgba(5,5,10,0.8)', border: '1px solid #111', borderRadius: '16px', padding: '1rem',
                display: 'flex', alignItems: 'center', gap: '1rem'
            }}>
                <div style={{ 
                    width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(74, 222, 128, 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(74, 222, 128, 0.2)'
                }}>
                    <Zap size={16} color="var(--color-accent)" />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Institutional Intelligence Summary</div>
                    <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '2px', fontStyle: 'italic' }}>
                        High-volatility event window detected for <span style={{ color: 'white' }}>{selectedMarket.name}</span>. Recommended risk-offset via sector rotation prior to ex-dividend dates and IPO book-building completion.
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#444', textTransform: 'uppercase' }}>Next Major Event</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 900, color: 'white', marginTop: '2px' }}>In 48 Hours</div>
                </div>
            </div>
        </div>
    );
};

export default CorporateActionsCalendar;
