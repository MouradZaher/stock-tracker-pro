import React from 'react';
import { Home, Brain, Eye, PieChart, Activity, LogOut, ChevronRight, Menu, X, Shield } from 'lucide-react';
import { soundService } from '../services/soundService';
import type { TabType } from '../types';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onLogout: () => void;
  showAdmin?: boolean;
  onAdminClick?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, onLogout, showAdmin, onAdminClick }) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const menuItems = [
    { id: 'search', label: 'Dashboard', icon: Home },
    { id: 'recommendations', label: 'AI Intelligence', icon: Brain },
    { id: 'watchlist', label: 'Watchlist', icon: Eye },
    { id: 'portfolio', label: 'Portfolio', icon: PieChart },
    { id: 'pulse', label: 'Market Pulse', icon: Activity },
  ];

  const handleTabClick = (tabId: TabType) => {
    soundService.playTap();
    onTabChange(tabId);
  };

  const sidebarWidth = isCollapsed ? '80px' : '260px';

  return (
    <div 
      className="sidebar glass-blur desktop-only" 
      style={{ 
        width: sidebarWidth, 
        height: '100vh', 
        position: 'fixed', 
        left: 0, 
        top: 0, 
        zIndex: 1000,
        background: 'rgba(10, 10, 15, 0.8)',
        borderRight: '1px solid var(--glass-border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden'
      }}
    >
      {/* Brand Section */}
      <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
        <div style={{ 
          minWidth: '40px', 
          height: '40px', 
          borderRadius: '12px', 
          background: 'var(--gradient-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" />
            <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
          </svg>
        </div>
        {!isCollapsed && (
          <span style={{ fontSize: '1.1rem', fontWeight: 900, whiteSpace: 'nowrap', background: 'white', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ST <span style={{ color: 'var(--color-accent)', WebkitTextFillColor: 'var(--color-accent)' }}>PRO</span>
          </span>
        )}
      </div>

      {/* Navigation Section */}
      <nav style={{ flex: 1, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id as TabType)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
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
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
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

        {showAdmin && (
          <button
            onClick={() => { soundService.playTap(); onAdminClick?.(); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              borderRadius: '12px',
              background: 'transparent',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              color: 'var(--color-success)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginTop: '12px'
            }}
          >
            <Shield size={20} />
            {!isCollapsed && <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Admin Panel</span>}
          </button>
        )}
      </nav>

      {/* Bottom Actions */}
      <div style={{ padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--glass-border)' }}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            borderRadius: '12px',
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-tertiary)',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          {isCollapsed ? <Menu size={20} /> : <X size={20} />}
          {!isCollapsed && <span style={{ fontSize: '0.85rem' }}>Collapse Menu</span>}
        </button>
        
        <button
          onClick={() => { soundService.playTap(); onLogout(); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.05)',
            border: 'none',
            color: 'var(--color-error)',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          <LogOut size={20} />
          {!isCollapsed && <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Sign Out</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
