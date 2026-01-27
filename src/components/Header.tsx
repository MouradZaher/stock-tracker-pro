import React, { useState, useRef, useEffect } from 'react';
import type { TabType } from '../types';

interface HeaderProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => {
    const tabs: { id: TabType; label: string }[] = [
        { id: 'search', label: 'Search Stocks' },
        { id: 'watchlist', label: 'My Watchlist' },
        { id: 'portfolio', label: 'My Portfolio' },
        { id: 'recommendations', label: 'AI Recommendations' },
        { id: 'pulse', label: 'Market Pulse' },
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

    return (
        <header className="header">
            <div className="header-logo">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" opacity="0.5" />
                    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>StockTracker Pro</span>
            </div>

            <nav className="header-nav">
                <div className="tab-indicator" style={indicatorStyle} />
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        ref={(el) => { tabRefs.current[tab.id] = el; }}
                        className={`header-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => onTabChange(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>

            <div style={{ width: '20px' }} />
        </header>
    );
};

export default Header;
