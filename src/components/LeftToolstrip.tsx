import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
    Search, Brain, Shield, Bell, HelpCircle, Settings,
    Sun, Moon, LogOut, MessageSquare, Star, ChevronDown,
    LayoutGrid, Activity, Globe, Zap, Command
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

    const [isMarketOpen, setIsMarketOpen] = useState(false);
    const [isNotifyOpen, setIsNotifyOpen] = useState(false);
    const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);
    const marketBtnRef = useRef<HTMLDivElement>(null);

    const iconStyle = (id: string, color?: string): React.CSSProperties => ({
        cursor: 'pointer',
        color: hoveredIcon === id ? (color || 'var(--color-accent)') : '#444',
        transition: 'all 0.2s ease',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '36px',
        height: '36px',
        borderRadius: '6px',
        background: hoveredIcon === id ? 'rgba(255,255,255,0.04)' : 'transparent',
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
            {/* ─── LOGO ─── */}
            <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--color-accent), #22c55e)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '0.75rem', cursor: 'pointer',
            }}
                onClick={() => navigate('/home')}
                title="Home"
            >
                <Zap size={16} color="black" fill="black" />
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
                        position: 'fixed', top: '120px', left: '56px', zIndex: 9999,
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

                        {/* View Toggle */}
                        <div style={{ borderTop: '1px solid #222', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                            <div style={{ padding: '0.25rem 0.75rem', fontSize: '0.55rem', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 900, marginBottom: '4px' }}>
                                DEFAULT VIEW
                            </div>
                            {[{ id: 'heatmap', label: 'HEATMAP', Icon: LayoutGrid }, { id: 'screener', label: 'SCREENER', Icon: Activity }].map(v => (
                                <div key={v.id} style={{ display: 'flex', alignItems: 'center' }}>
                                    <button onClick={() => {
                                        setHomeView(v.id as any);
                                        navigate(`/home/${v.id}`);
                                        setIsMarketOpen(false);
                                        soundService.playTap();
                                    }} style={{
                                        flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem',
                                        padding: '0.5rem 0.75rem',
                                        background: homeView === v.id ? 'rgba(255,255,255,0.04)' : 'transparent',
                                        border: '1px solid transparent', cursor: 'pointer', textAlign: 'left',
                                        color: homeView === v.id ? 'white' : '#555', font: 'inherit',
                                    }}>
                                        <v.Icon size={12} />
                                        <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>{v.label}</span>
                                        {homeView === v.id && <div style={{ marginLeft: 'auto', width: '4px', height: '4px', borderRadius: '50%', background: 'var(--color-accent)' }} />}
                                    </button>
                                    <button onClick={(e) => {
                                        e.stopPropagation();
                                        setFavoriteHomeView(v.id as any);
                                        navigate(`/home/${v.id}`);
                                        setIsMarketOpen(false);
                                    }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '6px' }}>
                                        <Star size={10} color={favoriteHomeView === v.id ? '#facc15' : '#333'} fill={favoriteHomeView === v.id ? '#facc15' : 'none'} />
                                    </button>
                                </div>
                            ))}
                        </div>
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
        </aside>
    );
};

export default LeftToolstrip;
