import React from 'react';
import { soundService } from '../services/soundService';
import { useTheme } from '../contexts/ThemeContext';
import { LogOut, Sun, Moon, Shield, LayoutDashboard, List, Briefcase, Activity } from 'lucide-react';
import BrainIcon from './icons/BrainIcon';
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
    const tabs: { id: TabType; label: string; icon: any; isCustomIcon?: boolean }[] = [
        { id: 'search', label: 'Home', icon: LayoutDashboard },
        { id: 'watchlist', label: 'Watch', icon: List },
        { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
        { id: 'recommendations', label: 'AI', icon: BrainIcon, isCustomIcon: true },
        { id: 'pulse', label: 'Pulse', icon: Activity },
    ];

    // Indicator logic removed for separate boxes

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
