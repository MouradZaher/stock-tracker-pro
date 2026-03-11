import React, { useState, useEffect } from 'react';
import { getCorrelationMatrix } from '../services/portfolioAnalyticsService';
import type { CorrelationData } from '../services/portfolioAnalyticsService';
import { usePortfolioStore } from '../hooks/usePortfolio';
import { Shield, AlertTriangle, Info, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const CorrelationMatrix: React.FC = () => {
    const { positions } = usePortfolioStore();
    const [correlations, setCorrelations] = useState<CorrelationData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const symbols = positions.map(p => p.symbol).slice(0, 10); // Limit to 10 for performance/visibility

    useEffect(() => {
        const fetchCorrelations = async () => {
            if (symbols.length < 2) return;
            setIsLoading(true);
            try {
                const data = await getCorrelationMatrix(positions);
                setCorrelations(data);
            } catch (error) {
                console.error('Failed to fetch correlations:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCorrelations();
    }, [positions.length]);

    const getCorrelationColor = (value: number) => {
        if (value > 0.8) return 'rgba(239, 68, 68, 0.8)'; // Highly Correlated (Red)
        if (value > 0.5) return 'rgba(245, 158, 11, 0.7)'; // Moderately Correlated (Orange)
        if (value > 0.2) return 'rgba(251, 191, 36, 0.5)'; // Low Correlation (Yellow)
        if (value < -0.2) return 'rgba(16, 185, 129, 0.6)'; // Inverse (Green)
        return 'rgba(255, 255, 255, 0.05)'; // Non-correlated (Neutral)
    };

    if (positions.length < 2) {
        return (
            <div className="glass-card p-8 flex flex-column align-items-center justify-content-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-800/50 flex align-items-center justify-content-center text-slate-500">
                    <Info size={32} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white mb-2">Insufficient Data</h3>
                    <p className="text-slate-400 max-w-xs">Add at least two assets to your portfolio to generate a correlation matrix.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="correlation-matrix-container">
            <div className="flex align-items-center justify-content-between mb-6">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight flex align-items-center gap-3">
                        Correlation Matrix
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30 font-bold uppercase letter-spacing-widest">
                            Beta Analysis
                        </span>
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">Detect hidden risks where your holdings move too closely together.</p>
                </div>
                {isLoading && (
                    <div className="flex align-items-center gap-2 text-blue-400 text-xs font-bold animate-pulse">
                        <TrendingUp size={14} className="animate-spin" /> Analyzing Physics...
                    </div>
                )}
            </div>

            <div className="glass-card overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr>
                                <th className="p-4 border-b border-r border-white/5 bg-slate-900/40"></th>
                                {symbols.map(s => (
                                    <th key={s} className="p-4 text-xs font-black text-slate-400 border-b border-white/5 uppercase tracking-tighter">
                                        {s}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {symbols.map(s1 => (
                                <tr key={s1}>
                                    <td className="p-4 text-xs font-black text-slate-400 border-r border-white/5 uppercase tracking-tighter bg-slate-900/40">
                                        {s1}
                                    </td>
                                    {symbols.map(s2 => {
                                        const corr = correlations.find(c => 
                                            (c.symbol1 === s1 && c.symbol2 === s2) || 
                                            (c.symbol1 === s2 && c.symbol2 === s1)
                                        )?.correlation ?? (s1 === s2 ? 1 : 0);
                                        
                                        return (
                                            <td 
                                                key={`${s1}-${s2}`}
                                                className="p-4 text-center transition-all hover:scale-105 relative cursor-help group"
                                                style={{ 
                                                    backgroundColor: getCorrelationColor(corr),
                                                    border: '1px solid rgba(255,255,255,0.03)'
                                                }}
                                            >
                                                <span className="text-xs font-bold text-white shadow-sm">
                                                    {corr === 1 ? '1.0' : corr.toFixed(2)}
                                                </span>
                                                
                                                {/* Tooltip */}
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-xs rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-2xl">
                                                    {s1} vs {s2} Correlation
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <div className="glass-card p-5 border-l-4 border-red-500 bg-red-500/5">
                    <div className="flex align-items-center gap-3 text-red-400 mb-2">
                        <AlertTriangle size={20} />
                        <h4 className="font-bold text-sm uppercase">High Risk ({'>'}0.8)</h4>
                    </div>
                    <p className="text-xs text-slate-400">Assets move in lockstep. This creates hidden concentration risk despite different symbols.</p>
                </div>
                <div className="glass-card p-5 border-l-4 border-amber-500 bg-amber-500/5">
                    <div className="flex align-items-center gap-3 text-amber-400 mb-2">
                        <Shield size={20} />
                        <h4 className="font-bold text-sm uppercase">Optimized Diversification</h4>
                    </div>
                    <p className="text-xs text-slate-400">Correlations between 0.2 and 0.5 offer broad exposure with reduced total variance.</p>
                </div>
                <div className="glass-card p-5 border-l-4 border-emerald-500 bg-emerald-500/5">
                    <div className="flex align-items-center gap-3 text-emerald-400 mb-2">
                        <TrendingUp size={20} />
                        <h4 className="font-bold text-sm uppercase">Hedging Signals</h4>
                    </div>
                    <p className="text-xs text-slate-400">Negative correlations (Green) indicate assets that move inversely, protecting against crashes.</p>
                </div>
            </div>
        </div>
    );
};

export default CorrelationMatrix;
