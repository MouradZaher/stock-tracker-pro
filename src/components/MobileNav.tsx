import React from 'react';
import { LayoutDashboard, List, Briefcase, Activity, Sparkles } from 'lucide-react';
import { soundService } from '../services/soundService';
import { useHaptics } from '../hooks/useHaptics';
import type { TabType } from '../types';

interface MobileNavProps {
    activeTab: TabType;
    setActiveTab: (tab: TabType) => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab }) => {
    const { triggerLight } = useHaptics();

    const navItems: { id: TabType; label: string; icon: any }[] = [
        { id: 'search', label: 'Home', icon: LayoutDashboard },
        { id: 'watchlist', label: 'Watch', icon: List },
        { id: 'portfolio', label: 'Port', icon: Briefcase },
        { id: 'recommendations', label: 'AI', icon: Sparkles },
        { id: 'pulse', label: 'Pulse', icon: Activity },
    ];

    const handleTabClick = (tabId: TabType) => {
        soundService.playTap();
        triggerLight();
        setActiveTab(tabId);
    };

    return (
        <nav className="mobile-nav glass-blur" role="navigation" aria-label="Main navigation" style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            height: '70px', // Larger touch area
            paddingBottom: 'env(safe-area-inset-bottom)', // safe area for iPhone
            zIndex: 100,
            borderTop: '1px solid var(--glass-border)',
            background: 'rgba(10, 10, 15, 0.85)',
            backdropFilter: 'blur(12px)',
        }}>
            {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                    <button
                        key={item.id}
                        className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => handleTabClick(item.id)}
                        aria-label={item.label}
                        aria-current={isActive ? 'page' : undefined}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            width: '100%',
                            height: '100%',
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: isActive ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
                            position: 'relative',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                    >
                        {isActive && (
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                width: '40%',
                                height: '2px',
                                background: 'var(--color-accent)',
                                boxShadow: '0 0 10px var(--color-accent), 0 0 20px var(--color-accent)',
                                borderRadius: '0 0 4px 4px',
                            }} />
                        )}
                        <item.icon
                            aria-hidden="true"
                            size={isActive ? 24 : 22}
                            style={{
                                filter: isActive ? 'drop-shadow(0 0 8px var(--color-accent))' : 'none',
                                transition: 'all 0.3s ease'
                            }}
                        />
                        <span style={{
                            fontSize: '0.7rem',
                            fontWeight: isActive ? 600 : 400,
                            letterSpacing: '0.02em'
                        }}>
                            {item.label}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
};

export default MobileNav;
