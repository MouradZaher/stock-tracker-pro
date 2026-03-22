import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { LogOut, Sun, Moon, Shield, Star, Wallet, Zap, Bell, X, Trash2, MessageSquare, ChevronDown, LayoutGrid, Sparkles, Home, Eye, PieChart, Activity, Brain, HelpCircle, Settings as SettingsIcon } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { useTheme } from '../contexts/ThemeContext';
import { useMarket, MARKETS, type MarketId } from '../contexts/MarketContext';
import { soundService } from '../services/soundService';
import type { TabType } from '../types';
import MarketCountdown from './MarketCountdown';

interface HeaderProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    onLogout: () => void;
    showAdmin?: boolean;
    onAdminClick?: () => void;
    onOpenTutorial?: () => void;
    onOpenSettings?: () => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange, onLogout, showAdmin, onAdminClick, onOpenTutorial, onOpenSettings }) => {
    const { theme, toggleTheme } = useTheme();
    const { notifications, unreadCount, markAllAsRead, clearNotifications } = useNotifications();
    const { selectedMarket, setMarket, setHoverMarket } = useMarket();
    const [isNotifyOpen, setIsNotifyOpen] = useState(false);
    const [isMarketOpen, setIsMarketOpen] = useState(false);
    const marketBtnRef = useRef<HTMLButtonElement>(null);
    const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null);
    // Detect mobile viewport to pass smaller icon sizes directly to Lucide
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);
    const iconSize = isMobile ? 11 : 14;
    const btnH = isMobile ? '20px' : '26px';

    const tabs: { id: TabType; label: string; icon: React.ElementType; isCustomIcon?: boolean }[] = [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'recommendations', label: 'AI', icon: Brain },
        { id: 'watchlist', label: 'Watch', icon: Eye },
        { id: 'portfolio', label: 'Portfolio', icon: PieChart },
        { id: 'pulse', label: 'Pulse', icon: Activity },
        { id: 'pricing', label: 'Pro', icon: Star },
    ];

    const handleTabClick = (tabId: TabType) => {
        soundService.playTap();
        onTabChange(tabId);
    };

    // Close dropdowns on Escape key
    useEffect(() => {
        const keyHandler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsMarketOpen(false);
                setIsNotifyOpen(false);
            }
        };
        document.addEventListener('keydown', keyHandler);
        return () => document.removeEventListener('keydown', keyHandler);
    }, []);

    // Calculate dropdown position from button bounding rect
    const openMarketDropdown = useCallback(() => {
        soundService.playTap();
        setIsMarketOpen(prev => {
            if (!prev && marketBtnRef.current) {
                const rect = marketBtnRef.current.getBoundingClientRect();
                setDropdownPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
            }
            return !prev;
        });
    }, []);

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'alert': return <Bell size={14} color="var(--color-error)" />;
            case 'news': return <Shield size={14} color="var(--color-accent)" />;
            case 'ai': return <Sparkles size={14} color="var(--color-success)" />;
            case 'social': return <MessageSquare size={14} color="#1DA1F2" />;
            default: return <Bell size={14} />;
        }
    };

    const iconBtn: React.CSSProperties = {
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--glass-border)',
        borderRadius: '8px',
        color: 'var(--color-text-secondary)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '4px' : '6px',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        gap: '4px',
        fontSize: '0.7rem',
        fontWeight: 700,
        whiteSpace: 'nowrap' as const,
        height: isMobile ? '28px' : '32px',
        minWidth: isMobile ? '28px' : '32px',
    };

    return (
        <>
            <header className="header" role="banner" style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                alignItems: 'center',
                padding: '0 var(--spacing-xl)',
                height: 'var(--header-height)',
                gap: '1rem',
                borderBottom: '1px solid var(--glass-border)',
                boxSizing: 'border-box',
                position: 'fixed',
                top: '32px', // Below TopBar
                left: 0,
                right: 0,
                zIndex: 1001,
                background: 'var(--glass-bg)',
                backdropFilter: 'var(--glass-blur)',
                boxShadow: 'var(--glass-shadow)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
                {/* ── Logo ─────────────────────────────── */}
                <div className="header-logo" onClick={() => handleTabClick('home')} style={{ 
                    cursor: 'pointer', 
                    justifySelf: 'start',
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    padding: '6px 12px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--glass-border)',
                    transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                >
                    <div className="logo-icon" style={{ 
                        padding: '4px', 
                        borderRadius: '6px',
                        background: 'var(--gradient-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Zap size={16} color="white" fill="white" />
                    </div>
                    <span className="logo-text" style={{ 
                        fontSize: '0.9rem', 
                        fontWeight: 900, 
                        letterSpacing: '-0.02em',
                        background: 'linear-gradient(to right, #fff, rgba(255,255,255,0.7))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        StockTracker<span style={{ color: 'var(--color-accent)', WebkitTextFillColor: 'var(--color-accent)' }}>PRO</span>
                    </span>
                </div>

                {/* ── Center Navigation ─────────────────── */}
                <div className="desktop-only" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem' }}>
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabClick(tab.id)}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '6px',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: isActive ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    padding: '4px',
                                    borderBottom: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
                                    position: 'relative'
                                }}
                                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
                                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--color-text-tertiary)'; }}
                            >
                                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} style={{ 
                                    filter: isActive ? 'drop-shadow(0 0 8px var(--color-accent-light))' : 'none',
                                    transition: 'all 0.3s ease'
                                }} />
                                <span style={{ 
                                    fontSize: '0.65rem', 
                                    fontWeight: isActive ? 800 : 500, 
                                    letterSpacing: '0.05em', 
                                    textTransform: 'uppercase',
                                    opacity: isActive ? 1 : 0.7
                                }}>
                                    {tab.label}
                                </span>
                                {isActive && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '-2px',
                                        left: '15%',
                                        right: '15%',
                                        height: '2px',
                                        background: 'var(--color-accent)',
                                        boxShadow: '0 0 12px var(--color-accent)',
                                        borderRadius: '2px'
                                    }} />
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="mobile-only" />


                {/* ── Actions (right-aligned) ───────────── */}
                <div className="header-actions" style={{ justifySelf: 'end', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {/* Market Countdown Clock */}
                    {!isMobile && <MarketCountdown />}
                    {/* Market Selector */}
                    <div style={{ position: 'relative' }}>
                        <button
                            ref={marketBtnRef}
                            style={{ ...iconBtn, borderColor: `${selectedMarket.color}55`, padding: isMobile ? '2px 3px' : '2px 4px' }}
                            onClick={openMarketDropdown}
                            title="Select Market"
                            aria-label="Select market"
                        >
                            <img src={selectedMarket.flagUrl} alt={selectedMarket.shortName} style={{ width: isMobile ? '12px' : '14px', height: isMobile ? '8px' : '10px', borderRadius: '1px', objectFit: 'cover' }} />
                            <ChevronDown size={isMobile ? 7 : 8} strokeWidth={2.0} style={{ opacity: 0.5, transform: isMarketOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'var(--color-text-tertiary)' }} />
                        </button>
                    </div>

                    {/* Market Dropdown Portal — rendered outside header stacking context */}
                    {isMarketOpen && dropdownPos && ReactDOM.createPortal(
                        <>
                            {/* Transparent backdrop to close dropdown on outside click */}
                            <div
                                onClick={() => setIsMarketOpen(false)}
                                style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
                            />
                            <div style={{
                                position: 'fixed',
                                top: dropdownPos.top,
                                right: dropdownPos.right,
                                zIndex: 9999,
                                background: 'rgba(10,10,18,0.97)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 'var(--radius-lg)',
                                padding: '0.5rem',
                                minWidth: '200px',
                                backdropFilter: 'blur(30px)',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px',
                            }}
                                onMouseLeave={() => setHoverMarket(null)}
                            >
                                <div style={{ padding: '0.5rem 0.75rem 0.25rem', fontSize: '0.6rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>
                                    Select Market
                                </div>
                                {MARKETS.map(m => (
                                    <button
                                        key={m.id}
                                        onMouseEnter={() => setHoverMarket(m.id as MarketId)}
                                        onClick={() => { setMarket(m.id as MarketId); setIsMarketOpen(false); soundService.playTap(); }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            padding: '0.65rem 0.75rem',
                                            borderRadius: 'var(--radius-md)',
                                            background: selectedMarket.id === m.id ? `${m.color}18` : 'transparent',
                                            border: selectedMarket.id === m.id ? `1px solid ${m.color}44` : '1px solid transparent',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            transition: 'all 0.15s',
                                            width: '100%',
                                            color: 'inherit',
                                            font: 'inherit',
                                        }}
                                    >
                                        <img src={m.flagUrl} alt={m.shortName} style={{ width: '28px', height: '20px', borderRadius: '3px', objectFit: 'cover' }} />
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: selectedMarket.id === m.id ? m.color : 'var(--color-text-primary)' }}>
                                                {m.name}
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginTop: '1px' }}>
                                                {m.indexName}
                                            </div>
                                        </div>
                                        {selectedMarket.id === m.id && (
                                            <div style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', background: m.color, boxShadow: `0 0 8px ${m.color}` }} />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </>,
                        document.body
                    )}

                    {/* Help / Tutorial */}
                    <button
                        style={{ ...iconBtn }}
                        onClick={() => { soundService.playTap(); onOpenTutorial?.(); }}
                        aria-label="Help & Tutorial"
                        title="Help & Tutorial"
                    >
                        <HelpCircle size={iconSize} strokeWidth={2.0} />
                    </button>

                    {/* Support Email */}
                    <a
                        href="mailto:support@stocktrackerpro.com"
                        style={{ ...iconBtn, textDecoration: 'none' }}
                        onClick={() => soundService.playTap()}
                        aria-label="Contact Support"
                        title="Contact Support"
                    >
                        <MessageSquare size={iconSize} strokeWidth={2.0} />
                    </a>

                    {/* Settings */}
                    <button
                        style={{ ...iconBtn }}
                        onClick={() => { soundService.playTap(); onOpenSettings?.(); }}
                        aria-label="Settings"
                        title="Settings"
                    >
                        <SettingsIcon size={iconSize} strokeWidth={2.0} />
                    </button>

                    {/* Admin icon */}
                    {showAdmin && (
                        <button
                            style={{ ...iconBtn, color: 'var(--color-accent)', borderColor: 'var(--color-accent-light)' }}
                            onClick={() => { soundService.playTap(); onAdminClick?.(); }}
                            aria-label="Open Admin Panel"
                            title="Admin Dashboard"
                        >
                            <Shield size={iconSize} strokeWidth={2.0} />
                        </button>
                    )}

                    {/* Bell / Notifications */}
                    <button
                        style={{ ...iconBtn, position: 'relative' }}
                        onClick={() => { soundService.playTap(); setIsNotifyOpen(true); markAllAsRead(); }}
                        aria-label="Notifications"
                        title="Notifications"
                    >
                        <Bell size={iconSize} strokeWidth={2.0} />
                        {unreadCount > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: '-4px',
                                right: '-4px',
                                background: 'var(--color-error)',
                                color: 'white',
                                borderRadius: 'var(--radius-full)',
                                width: isMobile ? '12px' : '16px',
                                height: isMobile ? '12px' : '16px',
                                fontSize: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px solid var(--color-bg-primary)',
                                fontWeight: 800,
                            }}>
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Logout */}
                    <button
                        style={{ ...iconBtn, color: 'var(--color-error)', borderColor: 'rgba(239,68,68,0.2)' }}
                        onClick={() => { soundService.playTap(); onLogout(); }}
                        aria-label="Sign out"
                        title="Sign Out"
                    >
                        <LogOut size={iconSize} strokeWidth={2.0} />
                        <span className="desktop-only" style={{ marginLeft: '3px' }}>Sign Out</span>
                    </button>
                </div>
            </header>

            {/* ── Notifications: Centered Modal ──────── */}
            {isNotifyOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 3000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0,0,0,0.7)',
                        backdropFilter: 'blur(8px)',
                        padding: '1rem',
                    }}
                    onClick={(e) => { if (e.target === e.currentTarget) setIsNotifyOpen(false); }}
                >
                    <div className="glass-card" style={{
                        width: '100%',
                        maxWidth: '460px',
                        maxHeight: '80vh',
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'rgba(8,8,16,0.98)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 'var(--radius-xl)',
                        boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
                        overflow: 'hidden',
                        animation: 'slideUp 0.25s ease-out both',
                    }}>
                        {/* Modal Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>Tactical Signals</h4>
                                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>{notifications.length} active signal{notifications.length !== 1 ? 's' : ''}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <button
                                    onClick={clearNotifications}
                                    style={{ background: 'none', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--color-text-tertiary)', cursor: 'pointer', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, padding: '4px 8px', borderRadius: '8px' }}
                                >
                                    <Trash2 size={11} /> CLEAR ALL
                                </button>
                                <button
                                    onClick={() => setIsNotifyOpen(false)}
                                    style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Notification list */}
                        <div style={{ overflowY: 'auto', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {notifications.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-tertiary)', fontSize: '0.85rem' }}>
                                    <Bell size={28} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                                    <div>No active signals in queue.</div>
                                </div>
                            ) : (
                                notifications.map(n => (
                                    <div key={n.id} style={{
                                        padding: '1rem',
                                        background: n.read ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.04)',
                                        borderRadius: '12px',
                                        border: `1px solid ${n.read ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.08)'}`,
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {getNotificationIcon(n.type)}
                                            </div>
                                            <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>{n.title}</span>
                                            {!n.read && <div style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-accent)', boxShadow: '0 0 8px var(--color-accent)', flexShrink: 0 }} />}
                                        </div>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '0 0 6px 0', lineHeight: 1.5 }}>{n.message}</p>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', fontFamily: 'monospace' }}>
                                            {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;
