import React from 'react';
import { LayoutDashboard, List, Briefcase, Activity, Brain } from 'lucide-react';
import { soundService } from '../services/soundService';
import { useHaptics } from '../hooks/useHaptics';
import type { TabType } from '../types';

interface MobileNavProps {
    activeTab: TabType;
    setActiveTab: (tab: TabType) => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab }) => {
    const { triggerLight } = useHaptics();

    const navItems: { id: TabType; label: string; icon: React.ElementType }[] = [
        { id: 'search', label: 'Home', icon: LayoutDashboard },
        { id: 'recommendations', label: 'AI', icon: Brain },
        { id: 'watchlist', label: 'Watch', icon: List },
        { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
        { id: 'pulse', label: 'Pulse', icon: Activity },
    ];

    const handleTabClick = (tabId: TabType) => {
        soundService.playTap();
        triggerLight();
        setActiveTab(tabId);
    };

    // Hide on desktop
    const [isDesktop, setIsDesktop] = React.useState(window.innerWidth >= 768);

    React.useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (isDesktop) return null;

    return (
        <nav
            className="mobile-nav-container"
            role="navigation"
            aria-label="Main navigation"
            style={{
                /* ─── LOCKED: pinned to absolute bottom of viewport ─── */
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                width: '100%',
                zIndex: 1001,
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                background: 'var(--glass-bg)',
                backdropFilter: 'var(--glass-blur)',
                WebkitBackdropFilter: 'var(--glass-blur)',
                borderTop: '1px solid var(--glass-border)',
                boxShadow: '0 -4px 24px rgba(0,0,0,0.3)',
            }}
        >
            {/* Nav pill — equal-width tabs across 390px */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                padding: '5px 0',
                width: '100%',
            }}>
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const isAI = item.id === 'recommendations';
                    const IconComponent = item.icon;

                    const accentColor = isAI ? '#c084fc' : 'var(--color-accent)';
                    const accentBg = isAI
                        ? 'linear-gradient(135deg, rgba(139,92,246,0.28), rgba(168,85,247,0.28))'
                        : 'var(--color-accent-light)';
                    const accentShadow = isAI
                        ? '0 0 16px rgba(168,85,247,0.35)'
                        : '0 0 14px rgba(99,102,241,0.3)';

                    return (
                        <button
                            key={item.id}
                            onClick={() => handleTabClick(item.id)}
                            aria-label={item.label}
                            aria-current={isActive ? 'page' : undefined}
                            style={{
                                /* Flex child — equal share of 390px width */
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '3px',
                                padding: '4px 2px',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                WebkitTapHighlightColor: 'transparent',
                                transition: 'transform 0.15s ease',
                            }}
                        >
                            {/* Icon container */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '30px',
                                height: '26px',
                                borderRadius: '8px',
                                background: isActive ? accentBg : 'transparent',
                                color: isActive ? accentColor : 'var(--color-text-tertiary)',
                                boxShadow: isActive ? accentShadow : 'none',
                                transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                            }}>
                                <IconComponent size={17} strokeWidth={isActive ? 2.5 : 1.8} />
                            </div>

                            {/* Label */}
                            <span style={{
                                fontSize: '0.58rem',
                                fontWeight: isActive ? 700 : 500,
                                color: isActive ? accentColor : 'var(--color-text-tertiary)',
                                letterSpacing: '0.01em',
                                transition: 'color 0.2s ease',
                                lineHeight: 1,
                            }}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default MobileNav;
