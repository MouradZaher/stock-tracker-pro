import React from 'react';
import { LayoutDashboard, List, Briefcase, Activity } from 'lucide-react';
import { soundService } from '../services/soundService';
import { useHaptics } from '../hooks/useHaptics';
import BrainIcon from './icons/BrainIcon';
import type { TabType } from '../types';

interface MobileNavProps {
    activeTab: TabType;
    setActiveTab: (tab: TabType) => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab }) => {
    const { triggerLight } = useHaptics();

    const navItems: { id: TabType; label: string; icon: any; isCustomIcon?: boolean }[] = [
        { id: 'search', label: 'Home', icon: LayoutDashboard },
        { id: 'watchlist', label: 'Watch', icon: List },
        { id: 'portfolio', label: 'Port', icon: Briefcase },
        { id: 'recommendations', label: 'AI', icon: BrainIcon, isCustomIcon: true },
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
        <nav className="mobile-nav" role="navigation" aria-label="Main navigation">
            {navItems.map((item) => {
                const isActive = activeTab === item.id;
                const IconComponent = item.icon;

                return (
                    <button
                        key={item.id}
                        className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => handleTabClick(item.id)}
                        aria-label={item.label}
                        aria-current={isActive ? 'page' : undefined}
                    >
                        {/* Active indicator line at top */}
                        {isActive && <div className="active-indicator" />}

                        {item.isCustomIcon ? (
                            <IconComponent size={20} />
                        ) : (
                            <IconComponent aria-hidden="true" size={20} />
                        )}
                        <span className="nav-label">{item.label}</span>
                    </button>
                );
            })}

            <style>{`
                .mobile-nav {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    display: flex;
                    justify-content: space-around;
                    align-items: center;
                    background: rgba(15, 15, 25, 0.95);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 8px 0;
                    padding-bottom: max(8px, env(safe-area-inset-bottom));
                    z-index: 100;
                }

                .mobile-nav-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    padding: 8px 16px;
                    background: transparent;
                    border: none;
                    color: rgba(255, 255, 255, 0.5);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    position: relative;
                    min-width: 60px;
                }

                .mobile-nav-item:hover {
                    color: rgba(255, 255, 255, 0.7);
                }

                .mobile-nav-item.active {
                    color: var(--color-primary, #6366f1);
                }

                .mobile-nav-item .active-indicator {
                    position: absolute;
                    top: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 24px;
                    height: 3px;
                    background: var(--color-primary, #6366f1);
                    border-radius: 0 0 3px 3px;
                }

                .mobile-nav-item .nav-label {
                    font-size: 11px;
                    font-weight: 500;
                    letter-spacing: 0.3px;
                }

                @media (min-width: 768px) {
                    .mobile-nav {
                        display: none !important;
                    }
                }
            `}</style>
        </nav>
    );
};

export default MobileNav;
