import React from 'react';
import { LayoutDashboard, List, Briefcase, Activity, Brain, Star } from 'lucide-react';
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
        { id: 'home', label: 'Home', icon: LayoutDashboard },
        { id: 'watchlist', label: 'Watch', icon: List },
        { id: 'recommendations', label: 'Command', icon: Brain }, // This will be the central button
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
            className="mobile-nav-container glass-glow"
            role="navigation"
            aria-label="Main navigation"
            style={{
                position: 'fixed',
                bottom: 20, // Floating look
                left: '5%',
                right: '5%',
                width: '90%',
                zIndex: 1001,
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                background: 'rgba(15, 15, 25, 0.85)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.5), inset 0 0 20px rgba(255,255,255,0.02)',
                borderRadius: '24px',
            }}
        >
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                padding: '8px 5px',
                width: '100%',
                position: 'relative'
            }}>
                {navItems.map((item, index) => {
                    const isActive = activeTab === item.id;
                    const isCommand = item.id === 'recommendations';
                    const IconComponent = item.icon;

                    if (isCommand) {
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleTabClick(item.id)}
                                style={{
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, var(--color-accent), #c084fc)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '4px solid rgba(15, 15, 25, 0.9)',
                                    boxShadow: '0 8px 16px rgba(0,0,0,0.3), 0 0 20px rgba(139, 92, 246, 0.4)',
                                    marginTop: '-35px', // Lifted
                                    position: 'relative',
                                    zIndex: 10,
                                    cursor: 'pointer',
                                    WebkitTapHighlightColor: 'transparent',
                                    transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                    color: 'white'
                                }}
                                className="command-hub-btn"
                            >
                                <IconComponent size={30} strokeWidth={2.5} />
                            </button>
                        );
                    }

                    return (
                        <button
                            key={item.id}
                            onClick={() => handleTabClick(item.id)}
                            aria-label={item.label}
                            style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '4px',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                WebkitTapHighlightColor: 'transparent',
                                color: isActive ? 'var(--color-accent)' : 'rgba(255,255,255,0.4)',
                                transition: 'all 0.2s ease',
                            }}
                        >
                             <IconComponent size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                             <span style={{ fontSize: '0.65rem', fontWeight: isActive ? 800 : 500 }}>{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default MobileNav;
