import React, { useState, useRef, useEffect } from 'react';
import MarketStatus from './MarketStatus';
import { soundService } from '../services/soundService';
import { LogOut } from 'lucide-react';
import type { TabType } from '../types';

interface HeaderProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange, onLogout }) => {
    const tabs: { id: TabType; label: string }[] = [
        { id: 'search', label: 'Search' },
        { id: 'watchlist', label: 'Watchlist' },
        { id: 'portfolio', label: 'Portfolio' },
        { id: 'recommendations', label: 'AI Insights' },
        { id: 'pulse', label: 'Pulse' },
    ];

    const [indicatorStyle, setIndicatorStyle] = useState({});
    const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

    useEffect(() => {
        const activeTabElement = tabRefs.current[activeTab];
        if (activeTabElement) {
            setIndicatorStyle({
                left: `${activeTabElement.offsetLeft}px`,
                width: `${activeTabElement.offsetWidth}px`,
                height: `${activeTabElement.offsetHeight}px`,
                top: `${activeTabElement.offsetTop}px`,
            });
        }
    }, [activeTab]);

    const handleTabClick = (tabId: TabType) => {
        soundService.playTap();
        onTabChange(tabId);
    };

    return (
        <header className="header glass-blur" style={{ padding: 'var(--spacing-md) var(--spacing-xl)' }} role="banner">
            <div className="header-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => handleTabClick('search')}>
                <div style={{
                    background: 'var(--gradient-primary)',
                    padding: '6px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                }} aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" />
                        <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
                        <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
                    </svg>
                </div>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'var(--color-text-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'flex', alignItems: 'center' }}>
                    StockTracker <span style={{ marginLeft: '4px', color: 'var(--color-accent)' }}>PRO</span>
                </span>
            </div>

            <nav className="header-nav glass-card" style={{ padding: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)' }} role="navigation" aria-label="Main navigation">
                <div className="tab-indicator" style={{ ...indicatorStyle, background: 'var(--color-accent)', boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)' }} aria-hidden="true" />
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

            <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="desktop-only">
                    <MarketStatus />
                </div>
                <button
                    className="glass-button"
                    onClick={() => {
                        soundService.playTap();
                        onLogout();
                    }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'var(--color-text-secondary)',
                        backdropFilter: 'blur(8px)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                        e.currentTarget.style.color = 'var(--color-text-primary)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.color = 'var(--color-text-secondary)';
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
