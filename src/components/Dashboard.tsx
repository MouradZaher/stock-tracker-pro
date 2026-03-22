import React, { useState, useEffect } from 'react';
import StockHeatmap from './StockHeatmap';
import MarketBreadth from './MarketBreadth';

interface DashboardProps {
  onSelectSymbol: (symbol: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectSymbol }) => {
  const [pulses, setPulses] = useState<{ id: number; x: number; y: number; size: number }[]>([]);

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
    <div className="dashboard-container" style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
      
      {/* Floating Overlays */}
      <div style={{ 
        position: 'absolute', 
        top: '20px', 
        right: '25px', 
        zIndex: 10,
        pointerEvents: 'none'
      }}>
        <MarketBreadth value={72} />
      </div>

      {/* Volume Pulses Overlay */}
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

      {/* Full-screen Heatmap Container - Maximized */}
      <div className="heatmap-main-wrapper" style={{ flex: 1, minHeight: 0, height: '100%' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.01) 0%, transparent 100%)', pointerEvents: 'none', zIndex: 1 }} />
        <StockHeatmap />
      </div>

      <style>{`
        @keyframes pulseOut {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.8; }
          100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
        }
        @keyframes slideInRight {
          0% { transform: translateX(30px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
