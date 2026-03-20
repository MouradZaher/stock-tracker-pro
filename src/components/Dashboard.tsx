import React from 'react';
import StockHeatmap from './StockHeatmap';
import { useMarket } from '../contexts/MarketContext';
import { Database } from 'lucide-react';

interface DashboardProps {
  onSelectSymbol: (symbol: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectSymbol }) => {
  const { selectedMarket } = useMarket();

  return (
    <div className="dashboard-container tab-content-wrapper" style={{ paddingBottom: '20px' }}>
      {/* Welcome Header */}
      <div style={{ padding: '0 var(--spacing-md) var(--spacing-sm)' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '-0.02em' }}>
          <Database size={24} color="var(--color-accent)" />
          {selectedMarket.indexName} Live Heatmap
        </h1>
        <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.8rem', fontWeight: 500, margin: 0 }}>
          Institutional Market Pulse • Real-time Data Feed
        </p>
      </div>

      {/* Full-screen Heatmap Container - Maximized */}
      <div
        style={{
          width: '100%',
          /* Maximize height: 100vh - header - mobile nav - tight margin */
          height: 'calc(100vh - var(--header-height, 64px) - var(--mobile-nav-height, 72px) - 20px)',
          minHeight: '450px',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid var(--glass-border-bright)',
          background: 'rgba(5,5,15,0.6)',
          position: 'relative',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)', pointerEvents: 'none', zIndex: 1 }} />
        <StockHeatmap />
      </div>
    </div>
  );
};

export default Dashboard;
