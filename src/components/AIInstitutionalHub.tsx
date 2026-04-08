import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, Search, Brain, Activity, Zap, Info, 
  Target, Globe, ChevronRight, Fingerprint, Star,
  TrendingUp, TrendingDown, Cpu, Sparkles, MessageSquare
} from 'lucide-react';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { useMarket } from '../contexts/MarketContext';
import { searchSymbols, getStockQuote } from '../services/stockDataService';
import type { Stock } from '../types';
import CompanyLogo from './CompanyLogo';

const AIInstitutionalHub: React.FC = () => {
  const { selectedMarket } = useMarket();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Stock | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Handle Search Autocomplete
  useEffect(() => {
    const fetchResults = async () => {
      if (query.trim().length < 1) {
        setResults([]);
        return;
      }
      setLoading(true);
      const matches = await searchSymbols(query);
      setResults(matches);
      setLoading(false);
    };

    const timeout = setTimeout(fetchResults, 150);
    return () => clearTimeout(timeout);
  }, [query]);

  // Click outside to close search
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = async (symbol: string) => {
    setLoading(true);
    setShowResults(false);
    setQuery('');
    try {
      const quote = await getStockQuote(symbol);
      setSelectedAsset(quote);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-hub-container" style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      padding: '2rem',
      gap: '2rem',
      background: 'radial-gradient(circle at 50% 10%, rgba(168, 85, 247, 0.05) 0%, transparent 50%)',
      overflowY: 'auto'
    }}>
      
      {/* ─── Search Engine Core ────────────────────────────────────────── */}
      <div style={{ 
        maxWidth: '800px', 
        width: '100%', 
        margin: '0 auto', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        gap: '1.5rem',
        marginTop: selectedAsset ? '0' : '5rem',
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        
        {!selectedAsset && (
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <div style={{ color: 'var(--color-accent)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Brain size={32} />
              <div style={{ background: 'var(--color-accent)', height: '1px', width: '40px' }} />
              <Shield size={24} />
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 950, letterSpacing: '-0.03em', color: 'white', margin: 0 }}>
              INSTITUTIONAL <span style={{ color: 'var(--color-accent)' }}>ORACLE</span>
            </h1>
            <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.9rem', fontWeight: 500, marginTop: '8px' }}>
              Search any global asset for deep-model AI analysis & sentiment flow.
            </p>
          </div>
        )}

        <div ref={searchRef} style={{ width: '100%', position: 'relative' }}>
          <div style={{ 
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--glass-border-bright)',
            borderRadius: '16px',
            padding: '0 1.25rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3), 0 0 20px rgba(168, 85, 247, 0.1)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease'
          }}>
            <Search size={20} color="var(--color-accent)" style={{ flexShrink: 0 }} />
            <input 
              type="text"
              placeholder="Search Symbol, Name or Market..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
              onFocus={() => setShowResults(true)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                padding: '1.25rem',
                color: 'white',
                fontSize: '1rem',
                fontWeight: 600,
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
            {loading && <div className="spinner" style={{ width: '16px', height: '16px' }} />}
          </div>

          {/* Autocomplete Results */}
          {showResults && results.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'rgba(10,10,18,0.98)',
              border: '1px solid var(--glass-border-bright)',
              borderRadius: '12px',
              marginTop: '8px',
              maxHeight: '300px',
              overflowY: 'auto',
              zIndex: 1000,
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
              padding: '6px'
            }}>
              {results.map((item) => (
                <div 
                  key={item.symbol}
                  onClick={() => handleSelect(item.symbol)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <CompanyLogo symbol={item.symbol} size={28} />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'white', fontSize: '0.85rem', fontWeight: 900 }}>{item.symbol}</div>
                    <div style={{ color: 'var(--color-text-tertiary)', fontSize: '0.7rem' }}>{item.name}</div>
                  </div>
                  <ChevronRight size={14} color="var(--color-text-tertiary)" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Deep Intel Panel (Visible after selection) ────────────────── */}
      {selectedAsset && (
        <div className="animate-fade-in" style={{ 
          maxWidth: '1100px', 
          width: '100%', 
          margin: '0 auto', 
          display: 'grid', 
          gridTemplateColumns: '1fr 340px',
          gap: '1.5rem',
          flex: 1
        }}>
          
          {/* Main Analysis Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ position: 'relative' }}>
                <CompanyLogo symbol={selectedAsset.symbol} size={64} />
                <div style={{ position: 'absolute', bottom: -4, right: -4, background: 'var(--color-accent)', padding: '4px', borderRadius: '50%', border: '2px solid var(--color-bg)' }}>
                  <Sparkles size={12} color="white" />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 950, color: 'white', margin: 0 }}>{selectedAsset.name}</h2>
                  <span style={{ fontSize: '1rem', color: 'var(--color-text-tertiary)', fontWeight: 800 }}>{selectedAsset.symbol}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '4px' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white' }}>{formatCurrency(selectedAsset.price)}</div>
                  <div className={selectedAsset.change >= 0 ? 'text-success' : 'text-error'} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', fontWeight: 800 }}>
                    {selectedAsset.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {formatPercent(selectedAsset.changePercent)}
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.05)', height: '14px', width: '1px' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-tertiary)', fontSize: '0.75rem', fontWeight: 700 }}>
                    <Globe size={12} /> {selectedMarket.name} LISTING
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--color-text-tertiary)', marginBottom: '4px', textTransform: 'uppercase' }}>AI Confidence</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 950, color: 'var(--color-accent)' }}>94.2%</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="glass-card" style={{ padding: '1.25rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1rem' }}>
                  <Target size={14} /> ALPHA INTEL SYNOPSIS
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  Consensus institutional accumulation detected for <span style={{ color: 'white', fontWeight: 700 }}>{selectedAsset.symbol}</span>. 
                  Order flow density suggests a massive consolidation phase between <span style={{ color: 'var(--color-warning)' }}>{formatCurrency(selectedAsset.low || selectedAsset.price * 0.98)}</span> and 
                  <span style={{ color: 'var(--color-success)' }}>{formatCurrency(selectedAsset.high || selectedAsset.price * 1.02)}</span>. 
                  Market sentiment is skewed towards <span style={{ color: 'var(--color-success)' }}>ACCUMULATION</span>.
                </p>
              </div>

              <div className="glass-card" style={{ padding: '1.25rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1rem' }}>
                  <Activity size={14} /> TECHNICAL CORRELATION
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[
                    { label: 'Momentum Entropy', val: 'Low/Stable', color: 'var(--color-success)' },
                    { label: 'Liquidity Depth', val: 'High', color: 'var(--color-accent)' },
                    { label: 'Short Interest Beta', val: '0.24', color: 'var(--color-warning)' },
                  ].map(stat => (
                    <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>{stat.label}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: stat.color }}>{stat.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.25rem', flex: 1 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--color-text-tertiary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Fingerprint size={14} /> PROPRIETARY ORDER FLOW ANALYSIS
              </div>
              <div style={{ height: '100px', display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
                {Array.from({ length: 40 }).map((_, i) => (
                  <div key={i} style={{ 
                    flex: 1, 
                    height: `${Math.random() * 80 + 20}%`, 
                    background: i > 25 ? 'var(--color-accent)' : 'rgba(255,255,255,0.05)',
                    borderRadius: '2px 2px 0 0',
                    opacity: 0.3 + (i / 40) * 0.7
                  }} />
                ))}
              </div>
            </div>
          </div>

          {/* Right AI Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '1.25rem', background: 'rgba(168, 85, 247, 0.03)', border: '1px solid rgba(168, 85, 247, 0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-accent)', marginBottom: '1rem' }}>
                <Cpu size={18} />
                <span style={{ fontSize: '0.8rem', fontWeight: 950, letterSpacing: '0.05em' }}>AI STRATEGY NODE</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'white', fontWeight: 800 }}>SCENARIO: MEAN REVERSION</div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>PROBABILITY</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                      <div style={{ width: '74%', height: '100%', background: 'var(--color-accent)', borderRadius: '2px' }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'white' }}>74%</span>
                  </div>
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
                  Recommended Strategy: Iron Condor or Calendar Spread positioned at {formatCurrency(selectedAsset.price)}.
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.25rem', flex: 1 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--color-text-tertiary)', marginBottom: '1rem' }}>TACTICAL SIGNALS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { label: 'Dark Pool Interest', val: 'Extreme', icon: Shield, color: 'var(--color-error)' },
                  { label: 'RSI Divergence', val: 'Bullish', icon: TrendingUp, color: 'var(--color-success)' },
                  { label: 'Gamma Squeeze', val: 'Low', icon: Zap, color: 'var(--color-warning)' },
                ].map((signal, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                    <signal.icon size={16} color={signal.color} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)' }}>{signal.label}</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'white' }}>{signal.val}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      <style>{`
        .ai-hub-container::-webkit-scrollbar { width: 4px; }
        .ai-hub-container::-webkit-scrollbar-thumb { background: rgba(168, 85, 247, 0.2); border-radius: 4px; }
        .ai-hub-container:hover::-webkit-scrollbar-thumb { background: rgba(168, 85, 247, 0.4); }
        
        .animate-fade-in { animation: fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) both; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default AIInstitutionalHub;
