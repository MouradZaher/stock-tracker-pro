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
    const [isHomeMenuOpen, setIsHomeMenuOpen] = React.useState(false);

    const navItems: { id: TabType; label: string; icon: React.ElementType; color?: string }[] = [
        { id: 'home', label: 'Home', icon: LayoutDashboard },
        { id: 'watchlist', label: 'Watch', icon: List, color: '#3b82f6' },
        { id: 'recommendations', label: 'Command', icon: Brain, color: '#a855f7' }, // Central button
        { id: 'portfolio', label: 'Portfolio', icon: Briefcase, color: '#10b981' },
        { id: 'pulse', label: 'Pulse', icon: Activity, color: '#f97316' },
    ];

    const handleTabClick = (tabId: TabType) => {
        soundService.playTap();
        triggerLight();
        if (tabId === 'home') {
            setIsHomeMenuOpen(!isHomeMenuOpen);
        } else {
            setIsHomeMenuOpen(false);
        }
        setActiveTab(tabId);
    };

    const handleHomeOptionSelect = (mode: 'heatmap' | 'screener') => {
        soundService.playTap();
        setIsHomeMenuOpen(false);
        window.dispatchEvent(new CustomEvent('change-home-view', { detail: { mode } }));
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
                bottom: 0,
                left: 0,
                right: 0,
                width: '100%',
                zIndex: 1001,
                paddingBottom: 0, /* Removed safe-area so it touches the absolute bottom */
                background: 'rgba(15, 15, 25, 0.95)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 -4px 24px rgba(0,0,0,0.8)',
                borderRadius: 0,
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
                            <div key={item.id} style={{ flex: 1, position: 'relative' }}>
                                <button
                                    onClick={() => handleTabClick(item.id)}
                                    aria-label={item.label}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '4px',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        WebkitTapHighlightColor: 'transparent',
                                        color: isActive ? (item.color || 'var(--color-accent)') : 'rgba(255,255,255,0.4)',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                     <IconComponent size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                                     <span style={{ fontSize: '0.65rem', fontWeight: isActive ? 800 : 500, color: isActive ? (item.color || 'var(--color-accent)') : 'inherit' }}>{item.label}</span>
                                </button>

                                {item.id === 'home' && isHomeMenuOpen && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '100%',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        background: 'rgba(15, 15, 25, 0.98)',
                                        border: '1px solid var(--glass-border-bright)',
                                        borderRadius: '12px',
                                        padding: '4px',
                                        marginBottom: '12px',
                                        minWidth: '120px',
                                        boxShadow: '0 -10px 40px rgba(0,0,0,0.8)',
                                        zIndex: 100,
                                        backdropFilter: 'blur(20px)'
                                    }}>
                                        <button 
                                            onClick={() => handleHomeOptionSelect('heatmap')}
                                            style={{ width: '100%', padding: '10px', textAlign: 'left', background: 'transparent', border: 'none', color: 'white', fontSize: '0.7rem', fontWeight: 800, borderRadius: '8px' }}
                                        >
                                            HEATMAP
                                        </button>
                                        <button 
                                            onClick={() => handleHomeOptionSelect('screener')}
                                            style={{ width: '100%', padding: '10px', textAlign: 'left', background: 'transparent', border: 'none', color: 'white', fontSize: '0.7rem', fontWeight: 800, borderRadius: '8px' }}
                                        >
                                            SCREENER
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                })}
            </div>
        </nav>
    );
};

export default MobileNav;
