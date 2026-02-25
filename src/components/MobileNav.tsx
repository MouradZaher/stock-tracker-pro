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

    const navItems: { id: TabType; label: string; icon: React.ElementType }[] = [
        { id: 'search', label: 'Home', icon: LayoutDashboard },
        { id: 'recommendations', label: 'AI', icon: Sparkles },
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
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (isDesktop) return null;

    return (
        <nav className="mobile-nav-container" role="navigation" aria-label="Main navigation">
            {/* Glassmorphism Pill Container */}
            <div className="mobile-nav-pill">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const isAI = item.id === 'recommendations';
                    const IconComponent = item.icon;

                    return (
                        <button
                            key={item.id}
                            className={`mobile-nav-btn ${isActive ? 'active' : ''} ${isAI ? 'ai-btn' : ''}`}
                            onClick={() => handleTabClick(item.id)}
                            aria-label={item.label}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <div className={`nav-icon-wrapper ${isActive ? 'active' : ''} ${isAI && isActive ? 'ai-active' : ''}`}>
                                <IconComponent size={18} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className="nav-label">{item.label}</span>
                        </button>
                    );
                })}
            </div>

            <style>{`
                .mobile-nav-container {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    width: 100%;
                    z-index: 1001;
                    padding-bottom: env(safe-area-inset-bottom, 0px);
                    background: var(--glass-bg);
                    backdrop-filter: var(--glass-blur);
                    -webkit-backdrop-filter: var(--glass-blur);
                    border-top: 1px solid var(--glass-border);
                    box-shadow: var(--glass-shadow);
                }

                .mobile-nav-pill {
                    display: flex;
                    align-items: center;
                    justify-content: space-around;
                    padding: 6px 0;
                    width: 100%;
                    background: transparent;
                    border: none;
                    border-radius: 0;
                    box-shadow: none;
                }

                .mobile-nav-btn {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    padding: 4px 6px;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    min-width: 50px;
                }

                .nav-icon-wrapper {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 32px;
                    height: 32px;
                    border-radius: 10px;
                    background: transparent;
                    color: var(--color-text-tertiary);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .nav-icon-wrapper.active {
                    background: var(--color-accent-light);
                    color: var(--color-accent);
                    box-shadow: 0 0 16px var(--color-accent-light);
                }

                .nav-icon-wrapper.ai-active {
                    background: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(168, 85, 247, 0.3));
                    color: #c084fc;
                    box-shadow: 0 0 20px rgba(168, 85, 247, 0.4);
                }

                .nav-label {
                    font-size: 0.65rem;
                    font-weight: 500;
                    color: var(--color-text-tertiary);
                    letter-spacing: 0.01em;
                    transition: color 0.3s ease;
                }

                @media (max-width: 360px) {
                    .mobile-nav-btn {
                        min-width: 45px;
                        padding: 4px 2px;
                    }
                    .nav-icon-wrapper {
                        width: 28px;
                        height: 28px;
                    }
                    .nav-label {
                        font-size: 0.6rem;
                    }
                }

                .mobile-nav-btn.active .nav-label {
                    color: var(--color-accent);
                }

                .mobile-nav-btn.ai-btn.active .nav-label {
                    color: #c084fc;
                }

                .mobile-nav-btn:hover .nav-icon-wrapper:not(.active) {
                    background: var(--color-surface-hover);
                    color: var(--color-text-secondary);
                }

                .mobile-nav-btn:active {
                    transform: scale(0.95);
                }

                @media (min-width: 768px) {
                    .mobile-nav-container {
                        display: none !important;
                    }
                }
            `}</style>
        </nav>
    );
};

export default MobileNav;
