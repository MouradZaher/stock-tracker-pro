import { LogOut, Sun, Moon, Shield, LayoutDashboard, List, Briefcase, Activity, Brain, Bell, X, Trash2, Zap, MessageSquare } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { useTheme } from '../contexts/ThemeContext';
import { soundService } from '../services/soundService';
import { useState, useRef, useEffect } from 'react';
import HomeIcon from './icons/HomeIcon';
import type { TabType } from '../types';

interface HeaderProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    onLogout: () => void;
    showAdmin?: boolean;
    onAdminClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange, onLogout, showAdmin, onAdminClick }) => {
    const { theme, toggleTheme } = useTheme();
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
    const [isNotifyOpen, setIsNotifyOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const tabs: { id: TabType; label: string; icon: any; isCustomIcon?: boolean }[] = [
        { id: 'search', label: 'Home', icon: HomeIcon, isCustomIcon: true },
        { id: 'recommendations', label: 'AI', icon: Brain, isCustomIcon: false },
        { id: 'watchlist', label: 'Watch', icon: List },
        { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
        { id: 'pulse', label: 'Pulse', icon: Activity },
    ];

    // Indicator logic removed for separate boxes

    const handleTabClick = (tabId: TabType) => {
        soundService.playTap();
        onTabChange(tabId);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsNotifyOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'alert': return <Bell size={14} color="var(--color-error)" />;
            case 'news': return <Shield size={14} color="var(--color-accent)" />;
            case 'ai': return <Zap size={14} color="var(--color-success)" />;
            case 'social': return <MessageSquare size={14} color="#1DA1F2" />;
            default: return <Bell size={14} />;
        }
    };

    return (
        <header className="header glass-blur" role="banner" style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.5rem 1rem',
            height: 'var(--header-height)',
            gap: '0.5rem'
        }}>
            {/* Logo Section - Aligned Left */}
            <div className="header-logo" onClick={() => handleTabClick('search')} style={{ cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="logo-icon" style={{ padding: '4px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" />
                        <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
                        <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
                    </svg>
                </div>
                <span className="logo-text" style={{ fontSize: '1.1rem' }}>
                    StockTracker <span>PRO</span>
                </span>
            </div>

            {/* Center Section: Nav + Ticker - Hidden on Mobile */}
            <div className="header-center desktop-only" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1, overflow: 'hidden' }}>
                <nav className="header-nav" style={{ padding: '4px', display: 'flex', justifyContent: 'center', gap: '8px' }} role="navigation" aria-label="Main navigation">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            className={`header-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => handleTabClick(tab.id)}
                            aria-label={`Navigate to ${tab.label}`}
                            aria-current={activeTab === tab.id ? 'page' : undefined}
                        >
                            {tab.isCustomIcon ? <tab.icon size={16} /> : <tab.icon size={16} />}
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Actions Section - Aligned Right */}
            <div className="header-actions" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {showAdmin && (
                    <button
                        className="glass-button icon-btn"
                        onClick={() => {
                            soundService.playTap();
                            onAdminClick?.();
                        }}
                        aria-label="Open Admin Panel"
                        title="Admin Panel"
                        style={{ color: 'var(--color-accent)', width: '32px', height: '32px' }}
                    >
                        <Shield size={16} />
                    </button>
                )}

                <div style={{ position: 'relative' }} ref={dropdownRef}>
                    <button
                        className="glass-button icon-btn"
                        onClick={() => {
                            soundService.playTap();
                            setIsNotifyOpen(!isNotifyOpen);
                            if (!isNotifyOpen) markAllAsRead();
                        }}
                        style={{ width: '32px', height: '32px', position: 'relative' }}
                    >
                        <Bell size={16} />
                        {unreadCount > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: '-2px',
                                right: '-2px',
                                background: 'var(--color-error)',
                                color: 'white',
                                borderRadius: '50%',
                                width: '16px',
                                height: '16px',
                                fontSize: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px solid var(--color-bg-primary)',
                                fontWeight: 800
                            }}>
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {isNotifyOpen && (
                        <div className="glass-card shadow-xl" style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '0.5rem',
                            width: '320px',
                            zIndex: 1000,
                            padding: '1rem',
                            maxHeight: '400px',
                            overflowY: 'auto',
                            border: '1px solid var(--glass-borderShadow)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Signals</h4>
                                <button
                                    onClick={clearNotifications}
                                    style={{ background: 'none', border: 'none', color: 'var(--color-text-tertiary)', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                    <Trash2 size={12} /> Clear
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {notifications.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-text-tertiary)', fontSize: '0.85rem' }}>
                                        No new signals detected.
                                    </div>
                                ) : (
                                    notifications.map(n => (
                                        <div key={n.id} style={{
                                            padding: '0.75rem',
                                            background: n.read ? 'transparent' : 'rgba(255,255,255,0.03)',
                                            borderRadius: '8px',
                                            border: '1px solid var(--glass-border)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                {getNotificationIcon(n.type)}
                                                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{n.title}</span>
                                            </div>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '0 0 4px 0', lineHeight: 1.4 }}>{n.message}</p>
                                            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)' }}>
                                                {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <button
                    className="glass-button icon-btn"
                    onClick={() => {
                        soundService.playTap();
                        toggleTheme();
                    }}
                    style={{ width: '32px', height: '32px' }}
                    aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                    {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                </button>

                <button
                    className="glass-button logout-btn"
                    onClick={() => {
                        soundService.playTap();
                        onLogout();
                    }}
                    style={{ padding: '0.4rem 0.8rem', height: '32px' }}
                    aria-label="Sign out"
                >
                    <LogOut size={14} />
                    <span className="desktop-only">Sign Out</span>
                </button>
            </div>
        </header>
    );
};

export default Header;
