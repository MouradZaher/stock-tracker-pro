import React, { useState, useEffect } from 'react';
import StockHeatmap from './StockHeatmap';
import InstitutionalScreener from './InstitutionalScreener';
import MarketBreadth from './MarketBreadth';
import { FearGreedCard, IndustryRotationCard } from './MarketInsights';
import { useMarketInsights } from '../hooks/useMarketInsights';

interface DashboardProps {
  onSelectSymbol: (symbol: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectSymbol }) => {
  const [viewMode, setViewMode] = useState<'heatmap' | 'screener'>('heatmap');
  const [pulses, setPulses] = useState<{ id: number; x: number; y: number; size: number }[]>([]);
  const { sectorData, sentimentScore, overallSentiment, sentimentColor } = useMarketInsights();

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
      
      {/* View Toggle */}
      <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 100, display: 'flex', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', borderRadius: '8px', border: '1px solid var(--glass-border)', padding: '4px' }}>
         <button 
            onClick={() => setViewMode('heatmap')}
            style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, background: viewMode === 'heatmap' ? 'rgba(255,255,255,0.1)' : 'transparent', color: viewMode === 'heatmap' ? 'white' : 'var(--color-text-secondary)', transition: 'all 0.2s', border: 'none', cursor: 'pointer' }}
         >
            HEATMAP
         </button>
         <button 
            onClick={() => setViewMode('screener')}
            style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, background: viewMode === 'screener' ? 'rgba(255,255,255,0.1)' : 'transparent', color: viewMode === 'screener' ? 'white' : 'var(--color-text-secondary)', transition: 'all 0.2s', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
         >
            SCREENER
         </button>
      </div>

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
