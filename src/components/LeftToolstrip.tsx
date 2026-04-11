import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Search, Brain, Shield, Bell, HelpCircle, Settings,
    Sun, Moon, LogOut, MessageSquare, Star, ChevronDown,
    LayoutGrid, Activity, Globe, Zap, Command, Tv, Calendar,
    PieChart, Eye, ShieldCheck
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useMarket, MARKETS, type MarketId } from '../contexts/MarketContext';
import { useNotifications } from '../contexts/NotificationContext';
import { soundService } from '../services/soundService';

import { useWindowStore, type WindowId } from '../hooks/useWindowStore';

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
    const { 
        isWindowOpen, isWindowMinimized, openWindow, 
        resetToInstitutionalLayout 
    } = useWindowStore();
    const navigate = useNavigate();
    const location = useLocation();

    const [isMarketOpen, setIsMarketOpen] = useState(false);
    const [isHomeMenuOpen, setIsHomeMenuOpen] = useState(false);
    const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);
    const marketBtnRef = useRef<HTMLDivElement>(null);
    const homeBtnRef = useRef<HTMLDivElement>(null);

    const isWindowOpen = (id: WindowId) => windows[id]?.isOpen && !windows[id]?.isMinimized;
    const isWindowMinimized = (id: WindowId) => windows[id]?.isMinimized;

    const iconStyle = (id: string, color?: string, isActive?: boolean, isMinimized?: boolean): React.CSSProperties => ({
        cursor: 'pointer',
        color: isActive ? (color || 'var(--color-accent)') : isMinimized ? '#222' : hoveredIcon === id ? (color || 'var(--color-accent)') : '#444',
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
        boxShadow: isActive ? '0 0 10px rgba(74, 222, 128, 0.1)' : 'none'
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
            
            {/* ─── TERMINAL LOGO (TOP / HOME / HEATMAP TICKET) ─── */}
            <div 
                ref={homeBtnRef}
                style={{ 
                    cursor: 'pointer',
                    marginBottom: '1rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    position: 'relative'
                }}
                onClick={() => { 
                    resetToInstitutionalLayout();
                    navigate('/home');
                    soundService.playTap(); 
                }}
            >
                <Zap 
                    size={22} 
                    color="var(--color-accent)" 
                    fill="var(--color-accent)" 
                    className="logo-flash"
                    style={{ 
                        filter: 'drop-shadow(0 0 8px var(--color-accent))',
                        opacity: 0.9
                    }} 
                />
            </div>
            
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
                style={iconStyle('pulse', undefined, isWindowOpen('pulse'), isWindowMinimized('pulse'))}
                onMouseEnter={() => setHoveredIcon('pulse')}
                onMouseLeave={() => setHoveredIcon(null)}
                onClick={() => { openWindow('pulse', 'Search Matrix'); navigate('/home'); soundService.playTap(); }}
            >
                <Search size={16} />
                {hoveredIcon === 'pulse' && !isWindowOpen('pulse') && <div style={tooltipStyle}>SEARCH ⌘K</div>}
                {isWindowOpen('pulse') && <div style={{ position: 'absolute', right: '-1px', top: '50%', transform: 'translateY(-50%)', width: '2px', height: '14px', background: 'var(--color-accent)', borderRadius: '1px' }} />}
            </div>

            <div
                style={iconStyle('heatmap', 'var(--color-accent)', isWindowOpen('heatmap'), isWindowMinimized('heatmap'))}
                onMouseEnter={() => setHoveredIcon('heatmap')}
                onMouseLeave={() => setHoveredIcon(null)}
                onClick={() => { openWindow('heatmap', 'Institutional Heatmap'); navigate('/home'); soundService.playTap(); }}
            >
                <LayoutGrid size={16} />
                {hoveredIcon === 'heatmap' && !isWindowOpen('heatmap') && <div style={tooltipStyle}>HEATMAP</div>}
                {isWindowOpen('heatmap') && <div style={{ position: 'absolute', right: '-1px', top: '50%', transform: 'translateY(-50%)', width: '2px', height: '14px', background: 'var(--color-accent)', borderRadius: '1px' }} />}
            </div>

            <div
                style={iconStyle('screener', 'var(--color-accent)', isWindowOpen('screener'), isWindowMinimized('screener'))}
                onMouseEnter={() => setHoveredIcon('screener')}
                onMouseLeave={() => setHoveredIcon(null)}
                onClick={() => { openWindow('screener', 'Data Matrix Screener'); navigate('/home'); soundService.playTap(); }}
            >
                <Activity size={16} />
                {hoveredIcon === 'screener' && !isWindowOpen('screener') && <div style={tooltipStyle}>SCREENER</div>}
                {isWindowOpen('screener') && <div style={{ position: 'absolute', right: '-1px', top: '50%', transform: 'translateY(-50%)', width: '2px', height: '14px', background: 'var(--color-accent)', borderRadius: '1px' }} />}
            </div>

            <div
                style={iconStyle('recommendations', 'var(--color-accent)', isWindowOpen('recommendations'), isWindowMinimized('recommendations'))}
                onMouseEnter={() => setHoveredIcon('recommendations')}
                onMouseLeave={() => setHoveredIcon(null)}
                onClick={() => { openWindow('recommendations', 'Institutional Intelligence'); navigate('/home'); soundService.playTap(); }}
            >
                <Brain size={16} />
                {hoveredIcon === 'recommendations' && !isWindowOpen('recommendations') && <div style={tooltipStyle}>INTELLIGENCE</div>}
                {isWindowOpen('recommendations') && <div style={{ position: 'absolute', right: '-1px', top: '50%', transform: 'translateY(-50%)', width: '2px', height: '14px', background: 'var(--color-accent)', borderRadius: '1px' }} />}
            </div>

            {separator}

            {/* ─── CORE MONITOR VIEWS ─── */}
            <div
                style={iconStyle('portfolio', '#10b981', isWindowOpen('portfolio'), isWindowMinimized('portfolio'))}
                onMouseEnter={() => setHoveredIcon('portfolio')}
                onMouseLeave={() => setHoveredIcon(null)}
                onClick={() => { openWindow('portfolio', 'Institutional Portfolio'); navigate('/home'); soundService.playTap(); }}
            >
                <PieChart size={16} />
                {hoveredIcon === 'portfolio' && !isWindowOpen('portfolio') && <div style={{ ...tooltipStyle, color: '#10b981' }}>PORTFOLIO</div>}
                {isWindowOpen('portfolio') && <div style={{ position: 'absolute', right: '-1px', top: '50%', transform: 'translateY(-50%)', width: '2px', height: '14px', background: '#10b981', borderRadius: '1px' }} />}
            </div>

            <div
                style={iconStyle('watchlist', '#3b82f6', isWindowOpen('watchlist'), isWindowMinimized('watchlist'))}
                onMouseEnter={() => setHoveredIcon('watchlist')}
                onMouseLeave={() => setHoveredIcon(null)}
                onClick={() => { openWindow('watchlist', 'Active Watchlist'); navigate('/home'); soundService.playTap(); }}
            >
                <Eye size={16} />
                {hoveredIcon === 'watchlist' && !isWindowOpen('watchlist') && <div style={{ ...tooltipStyle, color: '#3b82f6' }}>WATCHLIST</div>}
                {isWindowOpen('watchlist') && <div style={{ position: 'absolute', right: '-1px', top: '50%', transform: 'translateY(-50%)', width: '2px', height: '14px', background: '#3b82f6', borderRadius: '1px' }} />}
            </div>

            {separator}

            {/* ─── INTELLIGENCE FEEDS ─── */}
            <div
                style={iconStyle('calendar', '#f59e0b', isWindowOpen('calendar'), isWindowMinimized('calendar'))}
                onMouseEnter={() => setHoveredIcon('calendar')}
                onMouseLeave={() => setHoveredIcon(null)}
                onClick={() => { openWindow('calendar', 'Institutional Calendar'); navigate('/home'); soundService.playTap(); }}
            >
                <Calendar size={16} />
                {hoveredIcon === 'calendar' && !isWindowOpen('calendar') && <div style={{ ...tooltipStyle, color: '#f59e0b' }}>CALENDAR</div>}
                {isWindowOpen('calendar') && <div style={{ position: 'absolute', right: '-1px', top: '50%', transform: 'translateY(-50%)', width: '2px', height: '14px', background: '#f59e0b', borderRadius: '1px' }} />}
            </div>

            <div
                style={{ ...iconStyle('tv', '#ef4444', isWindowOpen('tv'), isWindowMinimized('tv')), position: 'relative' }}
                onMouseEnter={() => setHoveredIcon('tv')}
                onMouseLeave={() => setHoveredIcon(null)}
                onClick={() => { openWindow('tv', 'Intelligence Stream'); navigate('/home'); soundService.playTap(); }}
            >
                <Tv size={16} />
                {isWindowOpen('tv') && <div style={{ position: 'absolute', right: '-1px', top: '50%', transform: 'translateY(-50%)', width: '2px', height: '14px', background: '#ef4444', borderRadius: '1px' }} />}
                {hoveredIcon === 'tv' && !isWindowOpen('tv') && <div style={{ ...tooltipStyle, color: '#ef4444' }}>LIVE TV</div>}
            </div>

            <div
                style={iconStyle('advisor', '#888', isWindowOpen('advisor'), isWindowMinimized('advisor'))}
                onMouseEnter={() => setHoveredIcon('advisor')}
                onMouseLeave={() => setHoveredIcon(null)}
                onClick={() => { openWindow('advisor', 'Oracle Portfolio Audit'); navigate('/home'); soundService.playTap(); }}
            >
                <ShieldCheck size={16} />
                {hoveredIcon === 'advisor' && !isWindowOpen('advisor') && <div style={tooltipStyle}>ADVISORY</div>}
                {isWindowOpen('advisor') && <div style={{ position: 'absolute', right: '-1px', top: '50%', transform: 'translateY(-50%)', width: '2px', height: '14px', background: '#888', borderRadius: '1px' }} />}
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
                style={iconStyle('pricing', '#facc15', location.pathname === '/pricing')}
                onMouseEnter={() => setHoveredIcon('pricing')}
                onMouseLeave={() => setHoveredIcon(null)}
                onClick={() => { navigate('/pricing'); soundService.playTap(); }}
            >
                <Star size={16} fill={location.pathname === '/pricing' ? "#facc15" : "none"} />
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

            {/* Home Flyout Portal Removed in favor of direct Logo Reset */}

            <style>{`
                @keyframes homePulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.4; transform: scale(1.4); }
                }
                @keyframes logoFlash {
                    0%, 100% { opacity: 1; filter: drop-shadow(0 0 8px var(--color-accent)); }
                    50% { opacity: 0.7; filter: drop-shadow(0 0 12px var(--color-accent)); }
                }
                .logo-flash {
                    animation: logoFlash 2s infinite ease-in-out;
                }
            `}</style>
        </aside>
    );
};

export default LeftToolstrip;
