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
        { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
        { id: 'recommendations', label: 'AI', icon: Sparkles },
        { id: 'pulse', label: 'Pulse', icon: Activity },
    ];

    const handleTabClick = (tabId: TabType) => {
        soundService.playTap();
        triggerLight();
        setActiveTab(tabId);
    };

    // Hide on desktop programmatically to ensure it's removed
    const [isDesktop, setIsDesktop] = React.useState(window.innerWidth >= 768);

    React.useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (isDesktop) return null;

    return (
        <nav className="mobile-nav" role="navigation" aria-label="Main navigation" style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '80px', // Slightly taller to accommodate floating buttons
            paddingBottom: 'env(safe-area-inset-bottom)',
            zIndex: 100,
            background: 'transparent', // Transparent container
            pointerEvents: 'none', // Let clicks pass through empty areas
            paddingLeft: '1rem',
            paddingRight: '1rem',
        }}>
            <div style={{
                display: 'flex',
                gap: '12px',
                pointerEvents: 'auto', // Re-enable clicks for buttons
                padding: '0 1rem',
                overflowX: 'auto',
                maxWidth: '100%',
                scrollbarWidth: 'none', // Hide scrollbar
                msOverflowStyle: 'none',
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
                                minWidth: '70px',
                                height: '60px',
                                background: isActive
                                    ? 'rgba(99, 102, 241, 0.2)' // Accent color bg when active
                                    : 'rgba(20, 20, 30, 0.6)', // Glass bg when inactive
                                backdropFilter: 'blur(12px)',
                                border: isActive
                                    ? '1px solid var(--color-accent)'
                                    : '1px solid var(--glass-border)',
                                borderRadius: '16px', // Rounded corners for "box" look
                                color: isActive ? 'white' : 'var(--color-text-secondary)',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: isActive
                                    ? '0 0 15px rgba(99, 102, 241, 0.3)'
                                    : '0 4px 6px rgba(0,0,0,0.1)',
                                transform: isActive ? 'translateY(-2px)' : 'none',
                            }}
                        >
                            <item.icon
                                aria-hidden="true"
                                size={isActive ? 22 : 20}
                                style={{
                                    filter: isActive ? 'drop-shadow(0 0 8px var(--color-accent))' : 'none',
                                    transition: 'all 0.3s ease',
                                    marginBottom: '2px'
                                }}
                            />
                            <span style={{
                                fontSize: '0.65rem',
                                fontWeight: isActive ? 600 : 500,
                                letterSpacing: '0.02em',
                                opacity: isActive ? 1 : 0.8
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
