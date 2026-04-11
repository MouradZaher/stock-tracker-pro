import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Search, Brain, Shield, Bell, HelpCircle, Settings,
    Sun, Moon, LogOut, MessageSquare, Star, ChevronDown,
    LayoutGrid, Activity, Globe, Zap, Command, Tv, Calendar,
    PieChart, Eye
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useMarket, MARKETS, type MarketId } from '../contexts/MarketContext';
import { useNotifications } from '../contexts/NotificationContext';
import { soundService } from '../services/soundService';

interface LeftToolstripProps {
    onOpenOmniSearch: () => void;
    onOpenSettings: () => void;
    onOpenTutorial: () => void;
    onAdminClick: () => void;
    onLogout: () => void;
    showAdmin: boolean;
}

const LeftToolstrip: React.FC<LeftToolstripProps> = ({
    onOpenOmniSearch, onOpenSettings, onOpenTutorial,
    onAdminClick, onLogout, showAdmin
}) => {
    const { theme, toggleTheme } = useTheme();
    const { selectedMarket, setMarket, homeView, setHomeView, favoriteHomeView, setFavoriteHomeView } = useMarket();
    const { unreadCount, markAllAsRead } = useNotifications();
    const navigate = useNavigate();
    const location = useLocation();

    const [isMarketOpen, setIsMarketOpen] = useState(false);
    const [isHomeMenuOpen, setIsHomeMenuOpen] = useState(false);
    const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);
    const marketBtnRef = useRef<HTMLDivElement>(null);
    const homeBtnRef = useRef<HTMLDivElement>(null);

    const isOnHome = location.pathname.startsWith('/home');
    const isOnTV = location.pathname === '/tv';
    const isOnCalendar = location.pathname === '/calendar';
    const isOnPortfolio = location.pathname === '/portfolio';
    const isOnWatchlist = location.pathname === '/watchlist';
    const isOnPulse = location.pathname === '/pulse';
    const isOnPricing = location.pathname === '/pricing';

    const iconStyle = (id: string, color?: string, isActive?: boolean): React.CSSProperties => ({
        cursor: 'pointer',
        color: isActive ? (color || 'var(--color-accent)') : hoveredIcon === id ? (color || 'var(--color-accent)') : '#444',
        transition: 'all 0.2s ease',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '36px',
        height: '36px',
        borderRadius: '6px',
        background: isActive ? 'rgba(74, 222, 128, 0.08)' : hoveredIcon === id ? 'rgba(255,255,255,0.04)' : 'transparent',
        border: isActive ? '1px solid rgba(74, 222, 128, 0.2)' : '1px solid transparent',
    });

    const tooltipStyle: React.CSSProperties = {
        position: 'absolute',
        left: '52px',
        top: '50%',
        transform: 'translateY(-50%)',
        background: '#111',
        border: '1px solid #222',
        padding: '4px 8px',
        fontSize: '0.55rem',
        fontWeight: 800,
        color: '#888',
        whiteSpace: 'nowrap',
        zIndex: 9999,
        pointerEvents: 'none',
    };

    const separator = <div style={{ width: '24px', height: '1px', background: '#111', margin: '6px 0' }} />;

    return (
        <aside style={{
            width: '48px',
            borderRight: '1px solid #111',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '0.75rem 0',
            gap: '4px',
            background: '#000',
            flexShrink: 0,
        }}>
            
            {/* ─── MARKET SELECTOR (TOP) ─── */}
            <div
                ref={marketBtnRef}
                style={{ ...iconStyle('market'), border: `1px solid ${selectedMarket.color}33`, marginBottom: '4px' }}
                onMouseEnter={() => setHoveredIcon('market')}
                onMouseLeave={() => setHoveredIcon(null)}
                onClick={() => { setIsMarketOpen(!isMarketOpen); soundService.playTap(); }}
                title={`Active Market: ${selectedMarket.name}`}
            >
                <img src={selectedMarket.flagUrl} alt={selectedMarket.shortName} style={{ width: '16px', height: '12px', objectFit: 'cover', borderRadius: '1px' }} />
                {hoveredIcon === 'market' && <div style={tooltipStyle}>{selectedMarket.name.toUpperCase()}</div>}
            </div>

            {/* ─── SEARCH / INTELLIGENCE HUB ─── */}
            <div
                style={iconStyle('search', undefined, isOnPulse)}
                onMouseEnter={() => setHoveredIcon('search')}
                onMouseLeave={() => setHoveredIcon(null)}
                onClick={() => { navigate('/pulse'); soundService.playTap(); }}
                title="Intelligence Hub (Search)"
            >
                <Search size={16} />
                {hoveredIcon === 'search' && <div style={tooltipStyle}>INTELLIGENCE ⌘K</div>}
            </div>

            {separator}

            {/* ─── CORE MONITOR VIEWS ─── */}
            <div
                ref={homeBtnRef}
                style={{ ...iconStyle('home', undefined, isOnHome), position: 'relative' }}
                onMouseEnter={() => setHoveredIcon('home')}
                onMouseLeave={() => setHoveredIcon(null)}
                onClick={() => { setIsHomeMenuOpen(!isHomeMenuOpen); soundService.playTap(); }}
                title="Monitor (Heatmap/Screener)"
            >
                {homeView === 'heatmap' ? <LayoutGrid size={16} /> : <Activity size={16} />}
                {hoveredIcon === 'home' && <div style={tooltipStyle}>{homeView === 'heatmap' ? 'HEATMAP' : 'SCREENER'}</div>}
            </div>

            <div
                style={iconStyle('portfolio', '#10b981', isOnPortfolio)}
                onMouseEnter={() => setHoveredIcon('portfolio')}
                onMouseLeave={() => setHoveredIcon(null)}
                onClick={() => { navigate('/portfolio'); soundService.playTap(); }}
                title="Portfolio Holdings"
            >
                <PieChart size={16} />
                {hoveredIcon === 'portfolio' && <div style={{ ...tooltipStyle, color: '#10b981' }}>PORTFOLIO</div>}
            </div>

            <div
                style={iconStyle('watchlist', '#3b82f6', isOnWatchlist)}
                onMouseEnter={() => setHoveredIcon('watchlist')}
                onMouseLeave={() => setHoveredIcon(null)}
                onClick={() => { navigate('/watchlist'); soundService.playTap(); }}
                title="Active Watchlist"
            >
                <Eye size={16} />
                {hoveredIcon === 'watchlist' && <div style={{ ...tooltipStyle, color: '#3b82f6' }}>WATCHLIST</div>}
            </div>

            {separator}

            {/* ─── INTELLIGENCE FEEDS ─── */}
            <div
                style={iconStyle('calendar', '#f59e0b', isOnCalendar)}
                onMouseEnter={() => setHoveredIcon('calendar')}
                onMouseLeave={() => setHoveredIcon(null)}
                onClick={() => { navigate('/calendar'); soundService.playTap(); }}
                title="Corporate Actions Calendar"
            >
                <Calendar size={16} />
                {hoveredIcon === 'calendar' && <div style={{ ...tooltipStyle, color: '#f59e0b' }}>CALENDAR</div>}
            </div>

            <div
                style={{ ...iconStyle('tv', '#ef4444', isOnTV), position: 'relative' }}
                onMouseEnter={() => setHoveredIcon('tv')}
                onMouseLeave={() => setHoveredIcon(null)}
                onClick={() => { navigate('/tv'); soundService.playTap(); }}
                title="Live TV / News Streams"
            >
                <Tv size={16} />
                <div style={{
                    position: 'absolute', top: '3px', right: '3px',
                    width: '5px', height: '5px', borderRadius: '50%',
                    background: '#ef4444',
                    boxShadow: '0 0 6px #ef4444',
                    animation: 'homePulse 1.5s infinite',
                }} />
                {hoveredIcon === 'tv' && <div style={{ ...tooltipStyle, color: '#ef4444' }}>LIVE TV</div>}
            </div>

            <div
                style={iconStyle('bell')}
                onMouseEnter={() => setHoveredIcon('bell')}
                onMouseLeave={() => setHoveredIcon(null)}
                onClick={() => { markAllAsRead(); soundService.playTap(); window.dispatchEvent(new CustomEvent('open-notifications')); }}
                title="Notifications / Signals"
            >
                <Bell size={16} />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute', top: '2px', right: '2px',
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: '#ef4444', border: '2px solid #000',
                    }} />
                )}
                {hoveredIcon === 'bell' && <div style={tooltipStyle}>SIGNALS</div>}
            </div>

            {separator}

            {/* ─── PRO UPGRADE (ALONE) ─── */}
            <div
                style={iconStyle('pricing', '#facc15', isOnPricing)}
                onMouseEnter={() => setHoveredIcon('pricing')}
                onMouseLeave={() => setHoveredIcon(null)}
                onClick={() => { navigate('/pricing'); soundService.playTap(); }}
                title="Upgrade to Pro"
            >
                <Star size={16} fill={isOnPricing ? "#facc15" : "none"} />
                {hoveredIcon === 'pricing' && <div style={{ ...tooltipStyle, color: '#facc15' }}>UPGRADE PRO</div>}
            </div>

            {separator}

            {/* ─── SPACER ─── */}
            <div style={{ flex: 1 }} />

            {/* ─── SYSTEM / TOOLS (BOTTOM) ─── */}
            
            {/* Admin Panel (Restricted) */}
            {showAdmin && (
                <div
                    style={iconStyle('admin', 'var(--color-accent)')}
                    onMouseEnter={() => setHoveredIcon('admin')}
                    onMouseLeave={() => setHoveredIcon(null)}
                    onClick={onAdminClick}
                    title="Administrative Terminal"
                >
                    <Shield size={16} />
                    {hoveredIcon === 'admin' && <div style={tooltipStyle}>ADMIN</div>}
                </div>
            )}

            {/* Settings */}
            <div
                style={iconStyle('settings')}
                onMouseEnter={() => setHoveredIcon('settings')}
                onMouseLeave={() => setHoveredIcon(null)}
                onClick={onOpenSettings}
                title="Global Settings"
            >
                <Settings size={16} />
                {hoveredIcon === 'settings' && <div style={tooltipStyle}>SETTINGS</div>}
            </div>

            {/* Theme Toggle */}
            <div
                style={iconStyle('theme', theme === 'dark' ? '#facc15' : '#3b82f6')}
                onMouseEnter={() => setHoveredIcon('theme')}
                onMouseLeave={() => setHoveredIcon(null)}
                onClick={() => { toggleTheme(); soundService.playTap(); }}
                title={`Theme: ${theme}`}
            >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                {hoveredIcon === 'theme' && <div style={tooltipStyle}>THEME</div>}
            </div>

            {/* Contact Support */}
            <a
                href="mailto:support@stocktrackerpro.com"
                style={{ ...iconStyle('contact'), textDecoration: 'none' }}
                onMouseEnter={() => setHoveredIcon('contact')}
                onMouseLeave={() => setHoveredIcon(null)}
                title="Contact Support"
            >
                <MessageSquare size={14} />
                {hoveredIcon === 'contact' && <div style={tooltipStyle}>CONTACT</div>}
            </a>

            {/* Logout */}
            <div
                style={{ ...iconStyle('logout', '#ef4444'), marginBottom: '0.25rem' }}
                onMouseEnter={() => setHoveredIcon('logout')}
                onMouseLeave={() => setHoveredIcon(null)}
                onClick={() => { onLogout(); soundService.playTap(); }}
                title="Sign Out"
            >
                <LogOut size={16} />
                {hoveredIcon === 'logout' && <div style={{ ...tooltipStyle, color: '#ef4444' }}>SIGN OUT</div>}
            </div>

            {/* ─── PORTALS ─── */}
            
            {/* Market Dropdown Portal */}
            {isMarketOpen && ReactDOM.createPortal(
                <>
                    <div onClick={() => setIsMarketOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9998 }} />
                    <div style={{
                        position: 'fixed', top: '24px', left: '56px', zIndex: 9999,
                        background: '#0a0a0a', border: '1px solid #222',
                        padding: '0.5rem', minWidth: '220px', boxShadow: '0 8px 30px rgba(0,0,0,0.8)'
                    }}>
                        <div style={{ padding: '0.5rem 0.75rem 0.25rem', fontSize: '0.55rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 900 }}>
                            SELECT ACTIVE MARKET
                        </div>
                        {MARKETS.map(m => (
                            <button key={m.id} onClick={() => {
                                setMarket(m.id as MarketId);
                                navigate(location.pathname);
                                setIsMarketOpen(false);
                                soundService.playTap();
                            }} style={{
                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                padding: '0.6rem 0.75rem', width: '100%',
                                background: selectedMarket.id === m.id ? `${m.color}15` : 'transparent',
                                border: selectedMarket.id === m.id ? `1px solid ${m.color}33` : '1px solid transparent',
                                cursor: 'pointer', textAlign: 'left', color: 'inherit', font: 'inherit',
                            }}>
                                <img src={m.flagUrl} alt={m.shortName} style={{ width: '22px', height: '15px', objectFit: 'cover', borderRadius: '2px' }} />
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '0.7rem', color: selectedMarket.id === m.id ? m.color : 'white' }}>{m.name}</div>
                                    <div style={{ fontSize: '0.55rem', color: '#555' }}>{m.indexName}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </>,
                document.body
            )}

            {/* Home Flyout Portal */}
            {isHomeMenuOpen && ReactDOM.createPortal(
                <>
                    <div onClick={() => setIsHomeMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9998 }} />
                    <div style={{
                        position: 'fixed', top: '100px', left: '56px', zIndex: 9999,
                        background: '#0a0a0a', border: '1px solid #222',
                        padding: '0.5rem', minWidth: '180px', boxShadow: '0 8px 30px rgba(0,0,0,0.8)'
                    }}>
                        <div style={{ padding: '0.35rem 0.75rem 0.25rem', fontSize: '0.55rem', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 900 }}>
                            MONITOR VIEW
                        </div>
                        {[
                            { id: 'heatmap', label: 'HEATMAP', Icon: LayoutGrid, desc: 'S&P 100 Sector Grid' },
                            { id: 'screener', label: 'SCREENER', Icon: Activity, desc: 'Institutional Data Matrix' }
                        ].map(v => (
                            <button key={v.id} onClick={() => {
                                setHomeView(v.id as any);
                                navigate(`/home/${v.id}`);
                                setIsHomeMenuOpen(false);
                                soundService.playTap();
                            }} style={{
                                display: 'flex', alignItems: 'center', gap: '0.6rem',
                                padding: '0.55rem 0.75rem', width: '100%',
                                background: homeView === v.id ? 'rgba(74, 222, 128, 0.08)' : 'transparent',
                                border: homeView === v.id ? '1px solid rgba(74, 222, 128, 0.2)' : '1px solid transparent',
                                cursor: 'pointer', textAlign: 'left', color: 'inherit', font: 'inherit',
                            }}>
                                <v.Icon size={14} color={homeView === v.id ? 'var(--color-accent)' : '#555'} />
                                <div>
                                    <div style={{ fontSize: '0.65rem', fontWeight: 900, color: homeView === v.id ? 'var(--color-accent)' : 'white' }}>{v.label}</div>
                                    <div style={{ fontSize: '0.5rem', color: '#444' }}>{v.desc}</div>
                                </div>
                                {homeView === v.id && <div style={{ marginLeft: 'auto', width: '5px', height: '5px', borderRadius: '50%', background: 'var(--color-accent)', boxShadow: '0 0 6px var(--color-accent)' }} />}
                            </button>
                        ))}
                    </div>
                </>,
                document.body
            )}

            <style>{`
                @keyframes homePulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.4; transform: scale(1.4); }
                }
            `}</style>
        </aside>
    );
};

export default LeftToolstrip;
