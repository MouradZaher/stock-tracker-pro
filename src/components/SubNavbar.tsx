import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { soundService } from '../services/soundService';

interface SubNavbarProps {
    activeTab: string;
    onTabChange: (tab: any) => void;
    tabs: {
        id: string;
        label: string;
        icon: LucideIcon;
        color?: string;
        badge?: string;
    }[];
}

const SubNavbar: React.FC<SubNavbarProps> = ({ activeTab, onTabChange, tabs }) => {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '0.6rem 1rem',
            flexShrink: 0,
            borderBottom: '1px solid var(--glass-border)',
            background: 'linear-gradient(to bottom, rgba(10,10,15,0.6), rgba(10,10,15,0.3))',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
        }}>
            <div style={{
                display: 'flex',
                gap: '0.2rem',
                padding: '0.2rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '14px',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
            }}>
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    const color = tab.color || 'var(--color-accent)';
                    return (
                        <button
                            key={tab.id}
                            onClick={() => {
                                onTabChange(tab.id);
                                soundService.playTap();
                            }}
                            style={{
                                position: 'relative',
                                height: '30px',
                                padding: '0 1.1rem',
                                border: 'none',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.68rem',
                                fontWeight: 900,
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                                transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                                whiteSpace: 'nowrap',
                                ...(isActive ? {
                                    background: `linear-gradient(135deg, ${color}25, ${color}15)`,
                                    color: color,
                                    boxShadow: `0 0 20px -4px ${color}60, inset 0 1px 0 rgba(255,255,255,0.1)`,
                                    border: `1px solid ${color}40`,
                                } : {
                                    background: 'transparent',
                                    color: 'var(--color-text-tertiary)',
                                    border: '1px solid transparent',
                                }),
                            }}
                        >
                            {/* Active glow dot */}
                            {isActive && (
                                <span style={{
                                    position: 'absolute',
                                    top: '-1px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: '30%',
                                    height: '2px',
                                    background: color,
                                    borderRadius: '0 0 4px 4px',
                                    boxShadow: `0 0 8px 2px ${color}`,
                                }} />
                            )}
                            <Icon size={12} strokeWidth={isActive ? 2.5 : 2} />
                            <span>{tab.label}</span>
                            {tab.badge && (
                                <span style={{
                                    background: color,
                                    color: '#000',
                                    fontSize: '0.55rem',
                                    fontWeight: 900,
                                    padding: '1px 5px',
                                    borderRadius: '6px',
                                    lineHeight: 1.4,
                                }}>{tab.badge}</span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default SubNavbar;
