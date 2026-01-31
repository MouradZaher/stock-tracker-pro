import React, { useState, useRef, useEffect } from 'react';
import MarketStatus from './MarketStatus';
import { soundService } from '../services/soundService';
import { useTheme } from '../contexts/ThemeContext';
import { LogOut, Sun, Moon } from 'lucide-react';
import type { TabType } from '../types';

interface HeaderProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange, onLogout }) => {
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

    // Use useLayoutEffect to prevent visual flickering of the tab indicator
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

        // Update on resize
        window.addEventListener('resize', updateIndicator);

        // Update when fonts are ready (fixes layout shift issues)
        document.fonts.ready.then(updateIndicator);

        // Fallback: Check again after a short delay to ensure DOM is settled
        const timeoutId = setTimeout(updateIndicator, 100);

        return () => {
            window.removeEventListener('resize', updateIndicator);
            clearTimeout(timeoutId);
        };
    }, [activeTab, theme]);

    const handleTabClick = (tabId: TabType) => {
        soundService.playTap();
        onTabChange(tabId);
    };

    return (
        <>
            <div className="market-top-bar">
                <MarketStatus />
            </div>

            <header className="header glass-blur" role="banner">
                <div className="header-logo" onClick={() => handleTabClick('search')} style={{ cursor: 'pointer' }}>
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

                <nav className="header-nav glass-card" style={{ padding: '4px' }} role="navigation" aria-label="Main navigation">
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

                <div className="header-actions">
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
        </>
    );
};

export default Header;
