import React from 'react';
import { LayoutGrid, Database, Activity, Zap, PieChart, TrendingUp, Search } from 'lucide-react';
import StockHeatmap from './StockHeatmap';
import PortfolioIntelligencePanel from './PortfolioIntelligencePanel';
import AIStrategyIntelliHub from './AIStrategyIntelliHub';
import AIPerformanceTracker from './AIPerformanceTracker';
import { useMarket } from '../contexts/MarketContext';

interface DashboardProps {
  onSelectSymbol: (symbol: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectSymbol }) => {
  const { selectedMarket } = useMarket();

  return (
    <div className="dashboard-container tab-content-wrapper" style={{ paddingBottom: '100px' }}>
      {/* Welcome Header */}
      <div style={{ padding: '0 var(--spacing-md) var(--spacing-lg)' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <LayoutGrid size={28} color="var(--color-accent)" />
          Command Center
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
          Real-time market intelligence and portfolio surveillance.
        </p>
      </div>

      <div className="bento-grid">
        {/* Main Heatmap Widget */}
        <div className="bento-item bento-span-8 glass-card" style={{ height: '520px', padding: 0, position: 'relative' }}>
          <div style={{ position: 'absolute', top: '16px', left: '20px', zIndex: 10, display: 'flex', alignItems: 'center', gap: '8px', color: 'white', background: 'rgba(0,0,0,0.4)', padding: '6px 12px', borderRadius: '10px', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Database size={16} />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {selectedMarket.indexName} Live Heatmap
            </span>
          </div>
          <StockHeatmap />
        </div>

        {/* Market Pulse Mini-Widget */}
        <div className="bento-item bento-span-4 glass-card" style={{ height: '520px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="var(--color-success)" />
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800 }}>Market Pulse</h3>
             </div>
             <div style={{ fontSize: '0.65rem', padding: '4px 8px', borderRadius: '6px', background: 'var(--color-success-light)', color: 'var(--color-success)', fontWeight: 800 }}>LIVE</div>
          </div>
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             {/* Simple placeholders as this is usually dynamic in MarketPulsePage */}
             <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>TOP GAINER</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800 }}>TSLA</span>
                    <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>+4.28%</span>
                </div>
             </div>
             <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>TOP LOSER</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800 }}>AMZN</span>
                    <span style={{ color: 'var(--color-error)', fontWeight: 700 }}>-1.12%</span>
                </div>
             </div>
             <div style={{ marginTop: 'auto', padding: '1rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.1) 100%)', borderRadius: '12px', border: '1px solid rgba(139,92,246,0.2)' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
                   <Zap size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                   AI detects sector rotation into <strong style={{ color: 'white' }}>Clean Energy</strong>.
                </p>
             </div>
          </div>
        </div>

        {/* AI Performance Quick View */}
        <div className="bento-item bento-span-4 glass-card" style={{ minHeight: '300px' }}>
            <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} color="var(--color-accent)" />
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800 }}>AI Accuracy</h3>
            </div>
            <AIPerformanceTracker />
        </div>

        {/* Portfolio Health Summary */}
        <div className="bento-item bento-span-8 glass-card" style={{ minHeight: '300px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(10, 10, 15, 0.2) 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <PieChart size={18} color="var(--color-success)" />
                   <h3 style={{ fontSize: '0.9rem', fontWeight: 800 }}>Portfolio Surveillance</h3>
                </div>
                <button 
                  onClick={() => onSelectSymbol('SURVEILLANCE')} 
                  style={{ fontSize: '0.7rem', color: 'var(--color-accent)', background: 'none', border: 'none', fontWeight: 800, cursor: 'pointer' }}
                >
                  FULL AUDIT
                </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                {[
                    { label: 'Risk Score', value: 'B+', color: 'var(--color-success)' },
                    { label: 'Volatility', value: '12.4%', color: 'white' },
                    { label: 'Sharpe Ratio', value: '2.1', color: 'var(--color-accent)' },
                ].map((stat, i) => (
                    <div key={i} style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>{stat.label}</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 900, color: stat.color }}>{stat.value}</div>
                    </div>
                ))}
            </div>
        </div>

        {/* Intelligence Strategy Snapshot */}
        <div className="bento-item bento-span-12 glass-card">
            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={20} color="var(--color-warning)" />
                <h3 style={{ fontSize: '1rem', fontWeight: 900 }}>Strategic Intelligence Hub</h3>
            </div>
            <AIStrategyIntelliHub />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
