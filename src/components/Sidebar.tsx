import React from 'react';
import { Home, Brain, Eye, PieChart, Activity, ChevronRight, Menu, X, Star } from 'lucide-react';
import { soundService } from '../services/soundService';
import type { TabType } from '../types';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onLogout?: () => void;
  showAdmin?: boolean;
  onAdminClick?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const menuItems = [
    { id: 'search', label: 'Dashboard', icon: Home },
    { id: 'recommendations', label: 'AI Intelligence', icon: Brain },
    { id: 'watchlist', label: 'Watchlist', icon: Eye },
    { id: 'portfolio', label: 'Portfolio', icon: PieChart },
    { id: 'pulse', label: 'Market Pulse', icon: Activity },
    { id: 'pricing', label: 'Upgrade to Pro', icon: Star },
  ];

  const handleTabClick = (tabId: TabType) => {
    soundService.playTap();
    onTabChange(tabId);
  };

  const sidebarWidth = isCollapsed ? '72px' : '240px';

  return (
    <div
      className="sidebar glass-blur desktop-only"
      style={{
        width: sidebarWidth,
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 990,
        background: 'rgba(10, 10, 15, 0.87)',
        borderRight: '1px solid var(--glass-border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden'
      }}
    >
      {/* Brand */}
      <div style={{ padding: '20px 16px', display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
        <div style={{
          minWidth: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'var(--gradient-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)',
          flexShrink: 0
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" />
            <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
          </svg>
        </div>
        {!isCollapsed && (
          <span style={{ fontSize: '1rem', fontWeight: 900, whiteSpace: 'nowrap', background: 'white', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ST <span style={{ color: 'var(--color-accent)', WebkitTextFillColor: 'var(--color-accent)' }}>PRO</span>
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id as TabType)}
              title={isCollapsed ? item.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 12px',
                borderRadius: '12px',
                background: isActive ? 'var(--color-accent-light)' : 'transparent',
                border: 'none',
                color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                width: '100%',
                textAlign: 'left',
                position: 'relative'
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} style={{ flexShrink: 0 }} />
              {!isCollapsed && (
                <span style={{ fontSize: '0.85rem', fontWeight: isActive ? 700 : 500, whiteSpace: 'nowrap' }}>{item.label}</span>
              )}
              {isActive && (
                <div style={{ position: 'absolute', left: 0, top: '25%', bottom: '25%', width: '3px', background: 'var(--color-accent)', borderRadius: '0 4px 4px 0' }} />
              )}
              {!isCollapsed && isActive && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
            </button>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid var(--glass-border)' }}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 12px',
            borderRadius: '12px',
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-tertiary)',
            cursor: 'pointer',
            width: '100%',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          {isCollapsed ? <Menu size={18} /> : <X size={18} />}
          {!isCollapsed && <span style={{ fontSize: '0.8rem' }}>Collapse</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
