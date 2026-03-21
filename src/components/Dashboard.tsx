import React from 'react';
import StockHeatmap from './StockHeatmap';

interface DashboardProps {
  onSelectSymbol: (symbol: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectSymbol }) => {
  return (
    <div className="dashboard-container">

      {/* Full-screen Heatmap Container - Maximized */}
      <div className="heatmap-main-wrapper" style={{ flex: 1, minHeight: 0, height: '100%' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.01) 0%, transparent 100%)', pointerEvents: 'none', zIndex: 1 }} />
        <StockHeatmap />
      </div>
    </div>
  );
};

export default Dashboard;
