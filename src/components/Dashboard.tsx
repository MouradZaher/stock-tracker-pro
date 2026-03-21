import React from 'react';
import StockHeatmap from './StockHeatmap';
import AIIntelligenceStream from './AIIntelligenceStream';

interface DashboardProps {
  onSelectSymbol: (symbol: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectSymbol }) => {
  return (
    <div className="dashboard-container">
      {/* 
          AI Narrative Hub - Overlay at the top
          Using z-index and absolute positioning to keep heatmap full-size 
      */}
      <div 
        className="intelligence-overlay-container" 
        style={{ 
          position: 'absolute', 
          top: '12px', 
          left: '12px', 
          right: '12px', 
          zIndex: 100,
          pointerEvents: 'none' /* Let clicks go through to heatmap if needed */
        }}
      >
        <div style={{ pointerEvents: 'auto' }}>
          <AIIntelligenceStream />
        </div>
      </div>

      {/* Full-screen Heatmap Container - Maximized */}
      <div className="heatmap-main-wrapper" style={{ flex: 1, minHeight: 0, height: '100%' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.01) 0%, transparent 100%)', pointerEvents: 'none', zIndex: 1 }} />
        <StockHeatmap />
      </div>
    </div>
  );
};

export default Dashboard;
