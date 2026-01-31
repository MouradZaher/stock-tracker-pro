import React, { useState, useRef, useEffect } from 'react';
import MarketStatus from './MarketStatus';
import LiveTicker from './LiveTicker';
import { soundService } from '../services/soundService';
import { useTheme } from '../contexts/ThemeContext';
import { LogOut, Sun, Moon, Shield } from 'lucide-react';
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
    const tabs: { id: TabType; label: string }[] = [
        { id: 'search', label: 'Search' },
        { id: 'watchlist', label: 'Watchlist' },
        { id: 'portfolio', label: 'Portfolio' },
        { id: 'recommendations', label: 'AI Insights' },
        { id: 'pulse', label: 'Pulse' },
    ];

    const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});
    const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

    // Use useLayoutEffect with ResizeObserver for robust sizing
    React.useLayoutEffect(() => {
        const updateIndicator = () => {
            const activeTabElement = tabRefs.current[activeTab];
            if (activeTabElement) {
                setIndicatorStyle({
                    left: `${activeTabElement.offsetLeft}px`,
                    width: `${activeTabElement.offsetWidth}px`,
                    height: `${activeTabElement.offsetHeight}px`,
                    top: `${activeTabElement.offsetTop}px`,
                });
            }
        };

        // Update immediately
        updateIndicator();

        // Observe the nav container for any size changes (robust against font loads, layout shifts)
        // Find the nav container via the active tab's parent
        const activeTabElement = tabRefs.current[activeTab];
        const navContainer = activeTabElement?.parentElement;

        if (navContainer) {
            const resizeObserver = new ResizeObserver(() => {
                updateIndicator();
            });
            resizeObserver.observe(navContainer);

            // Also observe the active tab itself
            if (activeTabElement) {
                resizeObserver.observe(activeTabElement);
            }

            return () => {
                resizeObserver.disconnect();
            };
        } else {
            // Fallback if ref not yet attached
            const timeoutId = setTimeout(updateIndicator, 50);
            return () => clearTimeout(timeoutId);
        }
    }, [activeTab, theme]);

    const handleTabClick = (tabId: TabType) => {
        soundService.playTap();
        onTabChange(tabId);
    };

    return (
        <header className="header glass-blur" role="banner" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 1.5rem', height: 'auto' }}>
            {/* Logo Section */}
            <div className="header-logo" onClick={() => handleTabClick('search')} style={{ cursor: 'pointer', flexShrink: 0 }}>
                <div className="logo-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" />
                        <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
                        <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
                    </svg>
                </div>
                <span className="logo-text">
                    StockTracker <span>PRO</span>
                </span>
            </div>

            {/* Center Section: Nav + Ticker */}
            <div className="header-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1, overflow: 'hidden' }}>
                <nav className="header-nav glass-card" style={{ padding: '4px', display: 'flex', justifyContent: 'center' }} role="navigation" aria-label="Main navigation">
                    <div className="tab-indicator" style={{ ...indicatorStyle, background: 'var(--color-accent)' }} aria-hidden="true" />
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            ref={(el) => { tabRefs.current[tab.id] = el; }}
                            className={`header-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => handleTabClick(tab.id)}
                            style={{ position: 'relative', zIndex: 2 }}
                            aria-label={`Navigate to ${tab.label}`}
                            aria-current={activeTab === tab.id ? 'page' : undefined}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>

                {/* Scaled Down Ticker */}
                <div style={{ transform: 'scale(0.8)', transformOrigin: 'top center', opacity: 0.9, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <LiveTicker />
                    <MarketStatus />
                </div>
            </div>

            {/* Actions Section */}
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
                        style={{ color: 'var(--color-accent)' }}
                    >
                        <Shield size={18} />
                    </button>
                )}

                <button
                    className="glass-button icon-btn"
                    onClick={() => {
                        soundService.playTap();
                        toggleTheme();
                    }}
                    aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                <button
                    className="glass-button logout-btn"
                    onClick={() => {
                        soundService.playTap();
                        onLogout();
                    }}
                    aria-label="Sign out"
                >
                    <LogOut size={16} />
                    <span className="desktop-only">Sign Out</span>
                </button>
            </div>
        </header>
    );
};

export default Header;
