import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import StockHeatmap from './StockHeatmap';
import InstitutionalScreener from './InstitutionalScreener';
import MarketBreadth from './MarketBreadth';
import { FearGreedCard, IndustryRotationCard } from './MarketInsights';
import { useMarketInsights } from '../hooks/useMarketInsights';
import { useMarket } from '../contexts/MarketContext';

interface DashboardProps {
  onSelectSymbol: (symbol: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectSymbol }) => {
  const { homeView, setHomeView } = useMarket();
  const location = useLocation();
  const navigate = useNavigate();
  const [pulses, setPulses] = useState<{ id: number; x: number; y: number; size: number }[]>([]);

  // Sync state with URL path and redirect if needed
  useEffect(() => {
    const path = location.pathname.toLowerCase();
    if (path === '/home' || path === '/home/') {
      navigate(`/home/${homeView}`, { replace: true });
    } else if (path.includes('/heatmap')) {
      if (homeView !== 'heatmap') setHomeView('heatmap');
    } else if (path.includes('/screener')) {
      if (homeView !== 'screener') setHomeView('screener');
    }
  }, [location.pathname, navigate, homeView, setHomeView]);

  const viewMode = location.pathname.includes('/screener') ? 'screener' : 'heatmap';

  // Simulation: Add random "Volume Pulses" over the heatmap
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const newPulse = {
          id: Date.now(),
          x: Math.random() * 80 + 10, // 10% to 90%
          y: Math.random() * 80 + 10,
          size: Math.random() * 100 + 50
        };
        setPulses(prev => [...prev.slice(-5), newPulse]);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dashboard-container home-tab-content" style={{ 
      position: 'relative', 
      height: '100%', 
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      padding: 0,
      margin: 0
    }}>
      
      {/* 1. Main Section */}
      <div className="view-main-wrapper" style={{ 
        flex: 1, 
        width: '100%',
        position: 'relative', 
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Market Breadth removed as per request */}
        
        {/* Decorative Overlay for Depth */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(0,0,0,0.2) 100%)', pointerEvents: 'none', zIndex: 5 }} />
        
        {/* Volume Pulses Overlay */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10, overflow: 'hidden' }}>
          {pulses.map(p => (
            <div 
              key={p.id}
              style={{
                position: 'absolute',
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                background: 'radial-gradient(circle, rgba(79, 70, 229, 0.1) 0%, transparent 70%)',
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
                animation: 'pulseOut 2s ease-out forwards',
                border: '1px solid rgba(79, 70, 229, 0.05)'
              }}
            />
          ))}
        </div>

        {viewMode === 'heatmap' ? (
            <StockHeatmap />
        ) : (
            <InstitutionalScreener onSelectSymbol={onSelectSymbol} />
        )}
      </div>

      <style>{`
        @keyframes pulseOut {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.8; }
          100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
