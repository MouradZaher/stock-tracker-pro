import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface SubNavbarProps {
    activeTab: string;
    onTabChange: (tab: any) => void;
    tabs: {
        id: string;
        label: string;
        icon: LucideIcon;
        color?: string;
    }[];
}

const SubNavbar: React.FC<SubNavbarProps> = ({ activeTab, onTabChange, tabs }) => {
    return (
        <div className="sub-navbar-container">
            <div className="sub-navbar-glass">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`sub-nav-btn ${isActive ? 'active' : ''}`}
                            style={isActive && tab.color ? { '--active-color': tab.color } as any : {}}
                        >
                            <Icon size={14} strokeWidth={isActive ? 2.5 : 2} />
                            <span>{tab.label}</span>
                            {isActive && <div className="active-indicator" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default SubNavbar;
