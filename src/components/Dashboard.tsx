import React from 'react';
import StockHeatmap from './StockHeatmap';
import { useMarket } from '../contexts/MarketContext';
import { Database } from 'lucide-react';

interface DashboardProps {
  onSelectSymbol: (symbol: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectSymbol }) => {
  return (
    <div className="dashboard-container" style={{ width: '100%', height: 'calc(100vh - var(--header-height))', padding: 0, margin: 0 }}>
      {/* Full-screen Heatmap Container - Maximized */}
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '0',
          overflow: 'hidden',
          background: 'rgba(5,5,15,0.6)',
          position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)', pointerEvents: 'none', zIndex: 1 }} />
        <StockHeatmap />
      </div>
    </div>
  );
};

export default Dashboard;
