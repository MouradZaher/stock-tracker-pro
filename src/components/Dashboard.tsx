import React, { useState, useEffect } from 'react';
import StockHeatmap from './StockHeatmap';
import MarketBreadth from './MarketBreadth';
import { FearGreedCard, IndustryRotationCard } from './MarketInsights';
import { useMarketInsights } from '../hooks/useMarketInsights';

interface DashboardProps {
  onSelectSymbol: (symbol: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectSymbol }) => {
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
    <div className="dashboard-container" style={{ 
      position: 'relative', 
      height: '100%', 
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      padding: '8px'
    }}>
      
      {/* 1. Heatmap Section - Fixed Proportion */}
      <div className="heatmap-main-wrapper" style={{ 
        flex: '0 0 42%', 
        position: 'relative', 
        borderRadius: '12px', 
        overflow: 'hidden',
        border: '1px solid var(--glass-border)'
      }}>
        <div className="market-breadth-wrapper" style={{ 
          position: 'absolute', 
          top: '10px', 
          right: '10px', 
          zIndex: 60,
          pointerEvents: 'none'
        }}>
          <MarketBreadth value={72} />
        </div>
        
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.01) 0%, transparent 100%)', pointerEvents: 'none', zIndex: 1 }} />
        
        {/* Volume Pulses Overlay (Internal to heatmap) */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5, overflow: 'hidden' }}>
          {pulses.map(p => (
            <div 
              key={p.id}
              style={{
                position: 'absolute',
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                background: 'radial-gradient(circle, rgba(79, 70, 229, 0.15) 0%, transparent 70%)',
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
                animation: 'pulseOut 2s ease-out forwards',
                border: '1px solid rgba(79, 70, 229, 0.1)'
              }}
            />
          ))}
        </div>

        <StockHeatmap />
      </div>

      {/* 2. Market Insights Section - Remaining Space */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '8px',
        minHeight: 0 // Crucial for nested flex overflow
      }}>
        <FearGreedCard 
          sentimentScore={sentimentScore}
          overallSentiment={overallSentiment}
          sentimentColor={sentimentColor}
          isCompact={true}
        />
        <IndustryRotationCard 
          sectorData={sectorData}
          isCompact={true}
        />
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
