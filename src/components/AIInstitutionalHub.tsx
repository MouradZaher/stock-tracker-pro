import React, { useState } from 'react';
import { 
  Shield, TrendingUp, TrendingDown, Target, Brain, 
  BarChart2, Award, Zap, Globe, Clock, Activity,
  Search, Info, Database, Layers, MessageSquare, 
  ChevronRight, ArrowUpRight, ArrowDownRight, Fingerprint
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

const AIInstitutionalHub: React.FC = () => {
  const [activeResearchTab, setActiveResearchTab] = useState<'thesis' | 'analyst' | 'scenarios' | 'moat'>('thesis');

  // Dummy data extracted from user request
  const marketTimings = [
    { id: 'EGX', range: '10:00 AM - 02:30 PM', label: 'Cairo' },
    { id: 'LND', range: '10:00 AM - 06:30 PM', label: 'London' },
    { id: 'NYC', range: '04:30 PM - 11:00 PM', label: 'New York' },
    { id: 'HKG', range: '04:30 AM - 11:00 AM', label: 'Hong Kong' },
  ];

  return (
    <div className="institutional-hub-root" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {/* ─── Row 1: Global Pulse & Timing ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', height: '160px' }}>
        
        {/* Global Timings Panel */}
        <div className="glass-card" style={{ padding: '0.75rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.75rem', fontSize: '0.65rem', fontWeight: 900, color: 'var(--color-text-tertiary)', letterSpacing: '0.1em' }}>
            <Globe size={12} className="text-accent" /> GLOBAL PULSE SESSION
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            {marketTimings.map(m => (
              <div key={m.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'white', marginBottom: '2px' }}>{m.id} <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 500 }}>{m.label}</span></div>
                <div style={{ fontSize: '0.65rem', color: 'var(--color-accent)', fontWeight: 600 }}>{m.range}</div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Timing Score Utility */}
        <div className="glass-card" style={{ padding: '0.75rem', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.75rem', fontSize: '0.65rem', fontWeight: 900, color: 'var(--color-text-tertiary)', letterSpacing: '0.1em' }}>
            <Target size={12} className="text-accent" /> ALPHA TIMING SCORE
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
            <div style={{ position: 'relative', width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg style={{ transform: 'rotate(-90deg)', width: '70px', height: '70px' }}>
                <circle cx="35" cy="35" r="30" stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="none" />
                <circle cx="35" cy="35" r="30" stroke="var(--color-accent)" strokeWidth="6" fill="none" strokeDasharray={`${Math.PI * 60}`} strokeDashoffset={`${Math.PI * 60 * (1 - 0.61)}`} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
              </svg>
              <div style={{ position: 'absolute', fontSize: '1.25rem', fontWeight: 900, color: 'white' }}>61</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>SMART ENTRY WINDOW</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--color-success)', fontWeight: 700 }}>14:30 - 15:30 EST</div>
              <p style={{ fontSize: '0.55rem', color: 'var(--color-text-tertiary)', marginTop: '4px', fontStyle: 'italic' }}>Mean-reversion tendencies detected.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Row 2: Institutional Intelligence Hub ────────────────────────────── */}
      <div className="glass-card" style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={16} className="text-accent" />
            <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'white', letterSpacing: '0.05em' }}>INSTITUTIONAL HUB • ARIA_CORE_v4.2</span>
          </div>
          <div style={{ padding: '4px 8px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '6px', fontSize: '0.6rem', color: '#38bdf8', fontWeight: 800 }}>SYNC ACTIVE</div>
        </div>

        {/* Intelligence Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '1rem', background: 'rgba(0,0,0,0.2)', padding: '2px', borderRadius: '8px', flexShrink: 0 }}>
          {['thesis', 'analyst', 'scenarios', 'moat'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveResearchTab(tab as any)}
              style={{
                flex: 1,
                padding: '6px',
                border: 'none',
                background: activeResearchTab === tab ? 'var(--color-accent)' : 'transparent',
                color: activeResearchTab === tab ? 'white' : 'var(--color-text-tertiary)',
                fontSize: '0.6rem',
                fontWeight: 900,
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textTransform: 'uppercase'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingRight: '4px' }}>
          {activeResearchTab === 'thesis' && (
            <div className="animate-fade-in">
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-warning)', fontWeight: 800, marginBottom: '6px' }}>CORE THESIS</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  Consensus Tier-1 accumulation detected. Margin expansion expected via AI optimization. Institutional flow remains "ACCUMULATING".
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '3px solid var(--color-success)' }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--color-text-tertiary)', marginBottom: '2px' }}>SENTIMENT FLOW</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 900, color: 'white' }}>BULLISH_AGGREGATE</div>
                </div>
                <div style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '3px solid var(--color-accent)' }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--color-text-tertiary)', marginBottom: '2px' }}>MOMENTUM FLOW</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 900, color: 'white' }}>46.4% RETRACING</div>
                </div>
              </div>
            </div>
          )}

          {activeResearchTab === 'scenarios' && (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { label: 'BULL', val: '+25%', desc: 'AI productivity breakout', color: 'var(--color-success)' },
                  { label: 'BASE', val: '+12%', desc: 'Organic scaling', color: 'var(--color-accent)' },
                  { label: 'BEAR', val: '-8%', desc: 'Macro slowdown', color: 'var(--color-error)' }
                ].map(s => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                    <div style={{ width: '40px', fontSize: '0.65rem', fontWeight: 900, color: s.color }}>{s.label}</div>
                    <div style={{ fontWeight: 900, fontSize: '0.8rem', color: 'white', minWidth: '40px' }}>{s.val}</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--color-text-tertiary)' }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ... Other tabs ... */}
          {(activeResearchTab === 'analyst' || activeResearchTab === 'moat') && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-tertiary)', fontSize: '0.7rem', fontStyle: 'italic' }}>
              Decrypting depth-data... sync in progress
            </div>
          )}
        </div>
      </div>

      <style>{`
        .institutional-hub-root {
          scrollbar-width: thin;
          scrollbar-color: var(--color-accent-light) transparent;
        }
        .institutional-hub-root::-webkit-scrollbar { width: 4px; }
        .institutional-hub-root::-webkit-scrollbar-thumb { background: var(--color-accent-light); border-radius: 4px; }
      `}</style>
    </div>
  );
};

export default AIInstitutionalHub;
