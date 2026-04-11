import React from 'react';
import type { TabType } from '../types';

interface WorldMonitorTabsProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
}

const TABS: { id: TabType; label: string }[] = [
    { id: 'pulse', label: 'PULSE' },
    { id: 'recommendations', label: 'ORACLE AI' },
    { id: 'portfolio', label: 'PORTFOLIO' },
    { id: 'watchlist', label: 'WATCHLIST' },
];

const WorldMonitorTabs: React.FC<WorldMonitorTabsProps> = ({ activeTab, onTabChange }) => {
    return (
        <nav style={{ 
            height: '42px', 
            background: '#000000', 
            borderBottom: '1px solid #111', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            gap: '1px',
            zIndex: 100
        }}>
            {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        style={{
                            height: '100%',
                            padding: '0 1.25rem',
                            background: isActive ? '#0a0a0a' : 'transparent',
                            border: 'none',
                            borderBottom: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
                            color: isActive ? 'var(--color-accent)' : '#444',
                            fontSize: '0.65rem',
                            fontWeight: 900,
                            letterSpacing: '0.1em',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            outline: 'none',
                        }}
                        onMouseEnter={(e) => {
                            if (!isActive) e.currentTarget.style.color = '#888';
                        }}
                        onMouseLeave={(e) => {
                            if (!isActive) e.currentTarget.style.color = '#444';
                        }}
                    >
                        {tab.label}
                    </button>
                );
            })}
        </nav>
    );
};

export default WorldMonitorTabs;
