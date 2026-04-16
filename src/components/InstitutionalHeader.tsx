import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Search, Brain, Shield, Bell, HelpCircle, Settings,
    Sun, Moon, LogOut, MessageSquare, Star, ChevronDown,
    LayoutGrid, Activity, Globe, Zap, Command, Tv, Calendar,
    PieChart, Eye, ShieldCheck, Newspaper
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useMarket, MARKETS, type MarketId } from '../contexts/MarketContext';
import { useNotifications } from '../contexts/NotificationContext';
import { soundService } from '../services/soundService';

import { useWindowStore, type WindowId } from '../hooks/useWindowStore';

interface InstitutionalHeaderProps {
    onOpenOmniSearch: () => void;
    onOpenSettings: () => void;
    onOpenTutorial: () => void;
    onAdminClick: () => void;
    onLogout: () => void;
    showAdmin: boolean;
}

const InstitutionalHeader: React.FC<InstitutionalHeaderProps> = ({
    onOpenOmniSearch, onOpenSettings, onOpenTutorial,
    onAdminClick, onLogout, showAdmin
}) => {
    const { theme, toggleTheme } = useTheme();
    const { selectedMarket, setMarket } = useMarket();
    const { unreadCount, markAllAsRead } = useNotifications();
    const { 
        isWindowOpen, isWindowMinimized, openWindow, 
        resetToInstitutionalLayout 
    } = useWindowStore();
    const navigate = useNavigate();
    const location = useLocation();

    const [isMarketOpen, setIsMarketOpen] = useState(false);
    const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);

    const iconStyle = (id: string, color?: string, isActive?: boolean, isMinimized?: boolean): React.CSSProperties => ({
        cursor: 'pointer',
        color: isActive ? (color || 'var(--color-accent)') : isMinimized ? 'var(--color-text-tertiary)' : hoveredIcon === id ? (color || 'var(--color-accent)') : 'var(--color-text-secondary)',
        transition: 'all 0.2s ease',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        borderRadius: '6px',
        background: isActive ? 'rgba(74, 222, 128, 0.08)' : hoveredIcon === id ? 'rgba(255,255,255,0.04)' : 'transparent',
        border: isActive ? '1px solid rgba(74, 222, 128, 0.2)' : '1px solid transparent',
        boxShadow: isActive ? '0 0 10px rgba(74, 222, 128, 0.1)' : 'none'
    });

    const tooltipStyle: React.CSSProperties = {
        position: 'absolute',
        top: '40px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--color-bg-primary)',
        border: '1px solid var(--color-border)',
        padding: '4px 8px',
        fontSize: '0.55rem',
        fontWeight: 800,
        color: '#888',
        whiteSpace: 'nowrap',
        zIndex: 9999,
        pointerEvents: 'none',
    };

    const separator = <div style={{ height: '20px', width: '1px', background: 'var(--color-border)', margin: '0 8px' }} />;

    return (
        <header className="institutional-header" style={{
            height: '48px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 1rem',
            background: 'var(--color-bg-elevated)',
            flexShrink: 0,
            zIndex: 1000,
            width: '100%',
        }}>
            
            {/* ─── TERMINAL LOGO (FLASH) ─── */}
            <div 
                style={{ 
                    cursor: 'pointer',
                    marginRight: '1rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    position: 'relative'
                }}
                onMouseEnter={() => setHoveredIcon('home')}
                onMouseLeave={() => setHoveredIcon(null)}
                onClick={() => { 
                    resetToInstitutionalLayout();
                    navigate('/home');
                    soundService.playTap(); 
                }}
            >
                <Zap 
                    size={20} 
                    color="var(--color-accent)" 
                    fill="var(--color-accent)" 
                    className="logo-flash"
                />
                {hoveredIcon === 'home' && <div style={tooltipStyle}>HOME</div>}
            </div>
            
            {/* ─── MARKET SELECTOR (MODIFIED AS HEADER FLAG) ─── */}
            <div
                style={{ ...iconStyle('market'), border: `1px solid ${selectedMarket.color}33`, marginRight: '4px' }}
                onMouseEnter={() => setHoveredIcon('market')}
                onMouseLeave={() => setHoveredIcon(null)}
                onClick={() => { setIsMarketOpen(!isMarketOpen); soundService.playTap(); }}
            >
                <img src={selectedMarket.flagUrl} alt={selectedMarket.shortName} style={{ width: '18px', height: '12px', objectFit: 'cover', borderRadius: '1px' }} />
                {hoveredIcon === 'market' && <div style={tooltipStyle}>{selectedMarket.name.toUpperCase()}</div>}
            </div>

            {separator}

            {/* ─── NAVIGATION TOOLS ─── */}
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <div
                    style={iconStyle('heatmap', 'var(--color-accent)', isWindowOpen('heatmap'), isWindowMinimized('heatmap'))}
                    onMouseEnter={() => setHoveredIcon('heatmap')}
                    onMouseLeave={() => setHoveredIcon(null)}
                    onClick={() => { openWindow('heatmap', 'Heatmap'); navigate('/home'); soundService.playTap(); }}
                >
                    <LayoutGrid size={16} />
                    {hoveredIcon === 'heatmap' && <div style={tooltipStyle}>HEATMAP</div>}
                </div>

                <div
                    style={iconStyle('screener', 'var(--color-accent)', isWindowOpen('screener'), isWindowMinimized('screener'))}
                    onMouseEnter={() => setHoveredIcon('screener')}
                    onMouseLeave={() => setHoveredIcon(null)}
                    onClick={() => { openWindow('screener', 'Screener'); navigate('/home'); soundService.playTap(); }}
                >
                    <Activity size={16} />
                    {hoveredIcon === 'screener' && <div style={tooltipStyle}>SCREENER</div>}
                </div>

                <div
                    style={iconStyle('portfolio', '#10b981', isWindowOpen('portfolio'), isWindowMinimized('portfolio'))}
                    onMouseEnter={() => setHoveredIcon('portfolio')}
                    onMouseLeave={() => setHoveredIcon(null)}
                    onClick={() => { openWindow('portfolio', 'Portfolio'); navigate('/home'); soundService.playTap(); }}
                >
                    <PieChart size={16} />
                    {hoveredIcon === 'portfolio' && <div style={{ ...tooltipStyle, color: '#10b981' }}>PORTFOLIO</div>}
                </div>

                <div
                    style={iconStyle('watchlist', '#3b82f6', isWindowOpen('watchlist'), isWindowMinimized('watchlist'))}
                    onMouseEnter={() => setHoveredIcon('watchlist')}
                    onMouseLeave={() => setHoveredIcon(null)}
                    onClick={() => { openWindow('watchlist', 'Active Watchlist'); navigate('/home'); soundService.playTap(); }}
                >
                    <Eye size={16} />
                    {hoveredIcon === 'watchlist' && <div style={{ ...tooltipStyle, color: '#3b82f6' }}>WATCHLIST</div>}
                </div>
            </div>

            {separator}

            {/* ─── INTELLIGENCE ─── */}
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <div
                    style={iconStyle('calendar', '#f59e0b', isWindowOpen('calendar'), isWindowMinimized('calendar'))}
                    onMouseEnter={() => setHoveredIcon('calendar')}
                    onMouseLeave={() => setHoveredIcon(null)}
                    onClick={() => { openWindow('calendar', 'Institutional Calendar'); navigate('/home'); soundService.playTap(); }}
                >
                    <Calendar size={16} />
                    {hoveredIcon === 'calendar' && <div style={{ ...tooltipStyle, color: '#f59e0b' }}>CALENDAR</div>}
                </div>

                <div
                    style={iconStyle('tv', '#ef4444', isWindowOpen('tv'), isWindowMinimized('tv'))}
                    onMouseEnter={() => setHoveredIcon('tv')}
                    onMouseLeave={() => setHoveredIcon(null)}
                    onClick={() => { openWindow('tv', 'Live News'); navigate('/home'); soundService.playTap(); }}
                >
                    <Tv size={16} />
                    {hoveredIcon === 'tv' && <div style={{ ...tooltipStyle, color: '#ef4444' }}>LIVE NEWS</div>}
                </div>

                <div
                    style={iconStyle('news', '#3b82f6', isWindowOpen('news'), isWindowMinimized('news'))}
                    onMouseEnter={() => setHoveredIcon('news')}
                    onMouseLeave={() => setHoveredIcon(null)}
                    onClick={() => { openWindow('news', 'Market News'); navigate('/home'); soundService.playTap(); }}
                >
                    <Newspaper size={16} />
                    {hoveredIcon === 'news' && <div style={{ ...tooltipStyle, color: '#3b82f6' }}>NEWS FEED</div>}
                </div>

                <div
                    style={iconStyle('bell')}
                    onMouseEnter={() => setHoveredIcon('bell')}
                    onMouseLeave={() => setHoveredIcon(null)}
                    onClick={() => { markAllAsRead(); soundService.playTap(); window.dispatchEvent(new CustomEvent('open-notifications')); }}
                >
                    <Bell size={16} />
                    {unreadCount > 0 && (
                        <span style={{
                            position: 'absolute', top: '2px', right: '2px',
                            width: '6px', height: '6px', borderRadius: '50%',
                            background: '#ef4444', border: '1px solid var(--color-bg-primary)',
                        }} />
                    )}
                    {hoveredIcon === 'bell' && <div style={tooltipStyle}>SIGNALS</div>}
                </div>
            </div>

            {separator}

            <div
                style={iconStyle('pricing', '#facc15', location.pathname === '/pricing')}
                onMouseEnter={() => setHoveredIcon('pricing')}
                onMouseLeave={() => setHoveredIcon(null)}
                onClick={() => { navigate('/pricing'); soundService.playTap(); }}
            >
                <Star size={16} fill={location.pathname === '/pricing' ? "#facc15" : "none"} />
                {hoveredIcon === 'pricing' && <div style={{ ...tooltipStyle, color: '#facc15' }}>PRO</div>}
            </div>

            <div style={{ flex: 1 }} />

            {/* ─── SYSTEM CONTROLS (RIGHT) ─── */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {showAdmin && (
                    <div
                        style={iconStyle('admin', 'var(--color-accent)')}
                        onMouseEnter={() => setHoveredIcon('admin')}
                        onMouseLeave={() => setHoveredIcon(null)}
                        onClick={onAdminClick}
                    >
                        <Shield size={16} />
                        {hoveredIcon === 'admin' && <div style={tooltipStyle}>ADMIN</div>}
                    </div>
                )}

                <div
                    style={iconStyle('restore', 'var(--color-accent)')}
                    onMouseEnter={() => setHoveredIcon('restore')}
                    onMouseLeave={() => setHoveredIcon(null)}
                    onClick={() => { resetToInstitutionalLayout(); soundService.playTap(); }}
                >
                    <ShieldCheck size={16} />
                    {hoveredIcon === 'restore' && <div style={tooltipStyle}>RESTORE</div>}
                </div>

                <div
                    style={iconStyle('settings')}
                    onMouseEnter={() => setHoveredIcon('settings')}
                    onMouseLeave={() => setHoveredIcon(null)}
                    onClick={onOpenSettings}
                >
                    <Settings size={16} />
                    {hoveredIcon === 'settings' && <div style={tooltipStyle}>SETTINGS</div>}
                </div>

                <div
                    style={iconStyle('theme', theme === 'dark' ? '#facc15' : '#3b82f6')}
                    onMouseEnter={() => setHoveredIcon('theme')}
                    onMouseLeave={() => setHoveredIcon(null)}
                    onClick={() => { toggleTheme(); soundService.playTap(); }}
                >
                    {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                    {hoveredIcon === 'theme' && <div style={tooltipStyle}>THEME</div>}
                </div>

                <a
                    href="mailto:support@stocktrackerpro.com"
                    style={{ ...iconStyle('contact'), textDecoration: 'none' }}
                    onMouseEnter={() => setHoveredIcon('contact')}
                    onMouseLeave={() => setHoveredIcon(null)}
                >
                    <MessageSquare size={14} />
                    {hoveredIcon === 'contact' && <div style={tooltipStyle}>SUPPORT</div>}
                </a>

                <div
                    style={iconStyle('logout', '#ef4444')}
                    onMouseEnter={() => setHoveredIcon('logout')}
                    onMouseLeave={() => setHoveredIcon(null)}
                    onClick={onLogout}
                >
                    <LogOut size={16} />
                    {hoveredIcon === 'logout' && <div style={{ ...tooltipStyle, color: '#ef4444' }}>LOGOUT</div>}
                </div>
            </div>

            {/* PORTALS */}
            {isMarketOpen && ReactDOM.createPortal(
                <>
                    <div onClick={() => setIsMarketOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9998 }} />
                    <div style={{
                        position: 'fixed', top: '52px', left: '40px', zIndex: 9999,
                        background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)',
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

            <style>{`
                .logo-flash {
                    animation: logoFlash 2s infinite ease-in-out;
                }
                @keyframes logoFlash {
                    0%, 100% { opacity: 1; filter: drop-shadow(0 0 8px var(--color-accent)); }
                    50% { opacity: 0.7; filter: drop-shadow(0 0 12px var(--color-accent)); }
                }
            `}</style>
        </header>
    );
};

export default InstitutionalHeader;
