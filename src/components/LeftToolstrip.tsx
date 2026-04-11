import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Search, Brain, Shield, Bell, HelpCircle, Settings,
    Sun, Moon, LogOut, MessageSquare, Star, ChevronDown,
    LayoutGrid, Activity, Globe, Zap, Command, Tv
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
    const { selectedMarket, setMarket, favoriteMarketId, setFavoriteMarket, homeView, setHomeView, favoriteHomeView, setFavoriteHomeView } = useMarket();
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

            {/* ─── HOME (Heatmap/Screener Toggle) ─── */}
            <div
                ref={homeBtnRef}
                style={{ ...iconStyle('home', undefined, isOnHome), position: 'relative' }}
                onMouseEnter={() => setHoveredIcon('home')}
                onMouseLeave={() => setHoveredIcon(null)}
                onClick={() => { setIsHomeMenuOpen(!isHomeMenuOpen); soundService.playTap(); }}
                title="Monitor View"
            >
                {homeView === 'heatmap' ? <LayoutGrid size={16} /> : <Activity size={16} />}
                {/* Pulsing dot to indicate active view */}
                <div style={{
                    position: 'absolute', bottom: '2px', right: '2px',
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: isOnHome ? 'var(--color-accent)' : '#333',
                    boxShadow: isOnHome ? '0 0 6px var(--color-accent)' : 'none',
                    animation: isOnHome ? 'homePulse 2s infinite' : 'none',
                }} />
                {hoveredIcon === 'home' && <div style={tooltipStyle}>{homeView === 'heatmap' ? 'HEATMAP' : 'SCREENER'}</div>}
            </div>

            {/* Home View Flyout */}
            {isHomeMenuOpen && ReactDOM.createPortal(
                <>
                    <div onClick={() => setIsHomeMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9998 }} />
                    <div style={{
                        position: 'fixed', top: '128px', left: '56px', zIndex: 9999,
                        background: '#0a0a0a', border: '1px solid #222',
                        padding: '0.5rem', minWidth: '180px',
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
                        <div style={{ borderTop: '1px solid #222', margin: '0.35rem 0' }} />
                        <div style={{ padding: '0.25rem 0.75rem', fontSize: '0.5rem', color: '#333' }}>
                            ★ SET DEFAULT VIEW
                        </div>
                        <div style={{ display: 'flex', gap: '4px', padding: '0 0.75rem 0.25rem' }}>
                            {['heatmap', 'screener'].map(v => (
                                <button key={v} onClick={() => {
                                    setFavoriteHomeView(v as any);
                                    soundService.playTap();
                                }} style={{
                                    fontSize: '0.5rem', fontWeight: 800, padding: '2px 6px',
                                    background: favoriteHomeView === v ? 'rgba(250, 204, 21, 0.1)' : 'transparent',
                                    border: favoriteHomeView === v ? '1px solid rgba(250, 204, 21, 0.3)' : '1px solid #222',
                                    color: favoriteHomeView === v ? '#facc15' : '#444',
                                    cursor: 'pointer',
                                }}>
                                    {v.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                </>,
                document.body
            )}

            {/* ─── TV / LIVE STREAMS ─── */}
            <div
                style={{ ...iconStyle('tv', '#ef4444', isOnTV), position: 'relative' }}
                onMouseEnter={() => setHoveredIcon('tv')}
                onMouseLeave={() => setHoveredIcon(null)}
                onClick={() => { navigate('/tv'); soundService.playTap(); }}
                title="Live TV Streams"
            >
                <Tv size={16} />
                {/* Live pulse dot */}
                <div style={{
                    position: 'absolute', top: '3px', right: '3px',
                    width: '5px', height: '5px', borderRadius: '50%',
                    background: '#ef4444',
                    boxShadow: '0 0 6px #ef4444',
                    animation: 'homePulse 1.5s infinite',
                }} />
                {hoveredIcon === 'tv' && <div style={{ ...tooltipStyle, color: '#ef4444' }}>LIVE TV</div>}
            </div>

            {/* ─── SEARCH (Ctrl+K) ─── */}
            <div
                style={iconStyle('search')}
                onMouseEnter={() => setHoveredIcon('search')}
                onMouseLeave={() => setHoveredIcon(null)}
                onClick={onOpenOmniSearch}
                title="Search (Ctrl+K)"
            >
                <Search size={16} />
                {hoveredIcon === 'search' && <div style={tooltipStyle}>SEARCH ⌘K</div>}
            </div>

            {/* ─── MARKET SELECTOR ─── */}
            <div
                ref={marketBtnRef}
                style={{ ...iconStyle('market'), border: `1px solid ${selectedMarket.color}33` }}
                onMouseEnter={() => setHoveredIcon('market')}
                onMouseLeave={() => setHoveredIcon(null)}
                onClick={() => { setIsMarketOpen(!isMarketOpen); soundService.playTap(); }}
                title={`Market: ${selectedMarket.shortName}`}
            >
                <img src={selectedMarket.flagUrl} alt={selectedMarket.shortName} style={{ width: '16px', height: '11px', objectFit: 'cover', borderRadius: '1px' }} />
                {hoveredIcon === 'market' && <div style={tooltipStyle}>{selectedMarket.name.toUpperCase()}</div>}
            </div>

            {/* Market Dropdown Portal */}
            {isMarketOpen && ReactDOM.createPortal(
                <>
                    <div onClick={() => setIsMarketOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9998 }} />
                    <div style={{
                        position: 'fixed', top: '210px', left: '56px', zIndex: 9999,
                        background: '#0a0a0a', border: '1px solid #222',
                        padding: '0.5rem', minWidth: '220px',
                    }}>
                        <div style={{ padding: '0.5rem 0.75rem 0.25rem', fontSize: '0.55rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 900 }}>
                            SELECT MARKET
                        </div>
                        {MARKETS.map(m => (
                            <button key={m.id} onClick={() => {
                                setMarket(m.id as MarketId);
                                navigate(`/home/${homeView}`);
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
                                <button onClick={(e) => {
                                    e.stopPropagation();
                                    setFavoriteMarket(m.id as MarketId);
                                    setMarket(m.id as MarketId);
                                    setIsMarketOpen(false);
                                    soundService.playTap();
                                }} style={{ marginLeft: 'auto', border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px' }}>
                                    <Star size={12} color={favoriteMarketId === m.id ? '#facc15' : '#333'} fill={favoriteMarketId === m.id ? '#facc15' : 'none'} />
                                </button>
                            </button>
                        ))}
                    </div>
                </>,
                document.body
            )}

            <div style={{ width: '24px', height: '1px', background: '#111', margin: '4px 0' }} />

            {/* ─── NOTIFICATIONS ─── */}
            <div
                style={iconStyle('bell')}
                onMouseEnter={() => setHoveredIcon('bell')}
                onMouseLeave={() => setHoveredIcon(null)}
                onClick={() => { markAllAsRead(); soundService.playTap();
                    window.dispatchEvent(new CustomEvent('open-notifications'));
                }}
                title="Notifications"
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

            {/* ─── HELP ─── */}
            <div
                style={iconStyle('help')}
                onMouseEnter={() => setHoveredIcon('help')}
                onMouseLeave={() => setHoveredIcon(null)}
                onClick={onOpenTutorial}
                title="Help & Support"
            >
                <HelpCircle size={16} />
                {hoveredIcon === 'help' && <div style={tooltipStyle}>HELP</div>}
            </div>

            {/* ─── THEME TOGGLE ─── */}
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

            {/* ─── SETTINGS ─── */}
            <div
                style={iconStyle('settings')}
                onMouseEnter={() => setHoveredIcon('settings')}
                onMouseLeave={() => setHoveredIcon(null)}
                onClick={onOpenSettings}
                title="Settings"
            >
                <Settings size={16} />
                {hoveredIcon === 'settings' && <div style={tooltipStyle}>SETTINGS</div>}
            </div>

            {/* ─── ADMIN (conditionally) ─── */}
            {showAdmin && (
                <div
                    style={iconStyle('admin', 'var(--color-accent)')}
                    onMouseEnter={() => setHoveredIcon('admin')}
                    onMouseLeave={() => setHoveredIcon(null)}
                    onClick={onAdminClick}
                    title="Admin Dashboard"
                >
                    <Shield size={16} />
                    {hoveredIcon === 'admin' && <div style={tooltipStyle}>ADMIN</div>}
                </div>
            )}

            {/* ─── SPACER ─── */}
            <div style={{ flex: 1 }} />

            {/* ─── CONTACT ─── */}
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

            {/* ─── LOGOUT ─── */}
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
