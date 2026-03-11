import React, { useState, useEffect } from 'react';
import { Shield, Activity, TrendingDown, Layers, ArrowUpRight, AlertTriangle, Info, RefreshCw } from 'lucide-react';
import { usePortfolioStore } from '../hooks/usePortfolio';
import { portfolioAnalyticsService, type StressTestResult, type CorrelationData, type TaxLossOpportunity } from '../services/portfolioAnalyticsService';
import { formatCurrency, formatPercent } from '../utils/formatters';

const PortfolioIntelligencePanel: React.FC = () => {
    const { positions } = usePortfolioStore();
    const [correlations, setCorrelations] = useState<CorrelationData[]>([]);
    const [stressResults, setStressResults] = useState<StressTestResult[]>([]);
    const [taxOpps, setTaxOpps] = useState<TaxLossOpportunity[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'correlation' | 'stress' | 'tax'>('correlation');

    const loadData = async () => {
        if (positions.length === 0) return;
        setIsLoading(true);
        try {
            const [corr, stress] = await Promise.all([
                portfolioAnalyticsService.getCorrelationMatrix(positions),
                portfolioAnalyticsService.runStressTests(positions)
            ]);
            setCorrelations(corr);
            setStressResults(stress);
            setTaxOpps(portfolioAnalyticsService.getTaxLossOpportunities(positions));
        } catch (e) {
            console.error('Failed to load intelligence data', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [positions]);

    if (positions.length === 0) {
        return (
            <div className="flex flex-column align-items-center justify-content-center p-8 text-center" style={{ minHeight: '60vh' }}>
                <Layers size={48} className="text-slate-600 mb-4 opacity-20" />
                <h2 className="m-0 text-xl font-bold text-slate-400">No Data Available</h2>
                <p className="text-sm text-slate-500 max-w-xs mt-2">Add assets to your portfolio to unlock AI-powered correlation and stress analysis.</p>
            </div>
        );
    }

    const uniqueSymbols = Array.from(new Set(positions.map(p => p.symbol)));

    return (
        <div className="p-4 flex flex-column gap-6 animate-in fade-in duration-500" style={{ paddingBottom: '100px' }}>
            {/* Header Card */}
            <div className="glass-card p-6 relative overflow-hidden" style={{ borderRadius: '24px' }}>
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Shield size={120} />
                </div>
                <div className="flex align-items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400">
                        <Shield size={20} />
                    </div>
                    <h1 className="m-0 text-2xl font-black">Portfolio IQ <span className="text-blue-500">3.0</span></h1>
                </div>
                <p className="m-0 text-sm text-slate-400 max-w-md">Advanced risk modeling and architectural health scan of your total holdings.</p>
                
                <div className="flex gap-2 mt-6">
                    {['correlation', 'stress', 'tax'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                activeTab === tab 
                                ? 'bg-blue-600 text-white shadow-lg' 
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                        >
                            {tab.toUpperCase()}
                        </button>
                    ))}
                    <button 
                        onClick={loadData} 
                        className="ml-auto p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                        title="Refresh Intelligence"
                    >
                        <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {activeTab === 'correlation' && (
                <div className="glass-card p-6" style={{ borderRadius: '24px' }}>
                    <div className="flex align-items-center justify-content-between mb-6">
                        <div className="flex align-items-center gap-2">
                            <Activity size={18} className="text-blue-400" />
                            <h3 className="m-0 text-sm font-bold">Correlation Matrix</h3>
                        </div>
                        <div className="flex align-items-center gap-1 text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                            <Info size={12} /> Real-time Price Returns
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table style={{ borderCollapse: 'separate', borderSpacing: '4px', width: '100%' }}>
                            <thead>
                                <tr>
                                    <th></th>
                                    {uniqueSymbols.map(s => (
                                        <th key={s} className="text-xs font-bold text-slate-500 p-2">{s}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {uniqueSymbols.map(s1 => (
                                    <tr key={s1}>
                                        <td className="text-xs font-bold text-slate-500 p-2 text-right">{s1}</td>
                                        {uniqueSymbols.map(s2 => {
                                            if (s1 === s2) return <td key={s2} className="p-2 text-center rounded-lg bg-slate-800/50 text-slate-600 text-[10px] font-bold">1.0</td>;
                                            
                                            const corrObj = correlations.find(c => (c.symbol1 === s1 && c.symbol2 === s2) || (c.symbol1 === s2 && c.symbol2 === s1));
                                            const val = corrObj?.correlation || 0;
                                            const opacity = Math.abs(val);
                                            const color = val > 0 ? `rgba(59, 130, 246, ${opacity})` : `rgba(239, 68, 68, ${opacity})`;

                                            return (
                                                <td 
                                                    key={s2} 
                                                    className="p-2 text-center rounded-lg text-white font-bold text-[10px]"
                                                    style={{ background: color, transition: 'all 0.3s' }}
                                                    title={`${s1} vs ${s2}: ${val.toFixed(2)}`}
                                                >
                                                    {val.toFixed(2)}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'stress' && (
                <div className="flex flex-column gap-4">
                    {stressResults.map((res, i) => (
                        <div key={i} className="glass-card p-6 flex align-items-center gap-4 animate-in slide-in-from-right-4 duration-500" style={{ borderRadius: '20px', borderLeft: `4px solid ${res.impact < 0 ? '#ef4444' : '#22c55e'}` }}>
                            <div className="flex-1">
                                <h4 className="m-0 text-sm font-bold text-slate-200">{res.scenario}</h4>
                                <p className="m-0 text-xs text-slate-500 mt-1">{res.description}</p>
                            </div>
                            <div className="text-right">
                                <div className={`text-lg font-black ${res.impact < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                    {res.impact < 0 ? '' : '+'}{formatCurrency(res.impact)}
                                </div>
                                <div className="text-[10px] font-bold uppercase opacity-50">
                                    {res.impactPercent.toFixed(2)}% Impact
                                </div>
                            </div>
                        </div>
                    ))}
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex gap-3">
                        <AlertTriangle size={16} className="text-yellow-500 shrink-0" />
                        <p className="m-0 text-xs text-yellow-500/80 leading-relaxed">
                            <strong>Note:</strong> Stress tests use historical betas and estimated sensitivities. Real market outcomes may vary during systemic liquidity events.
                        </p>
                    </div>
                </div>
            )}

            {activeTab === 'tax' && (
                <div className="flex flex-column gap-4">
                    {taxOpps.length === 0 ? (
                        <div className="p-8 text-center glass-card" style={{ borderRadius: '24px' }}>
                            <ArrowUpRight size={32} className="text-green-500 opacity-20 mx-auto mb-2" />
                            <p className="m-0 text-sm text-slate-400 font-bold">No High-Loss Positions Detected</p>
                            <p className="m-0 text-xs text-slate-600 mt-1">Excellent portfolio health. Your active positions are all near or above cost basis.</p>
                        </div>
                    ) : (
                        taxOpps.map((opp, i) => (
                            <div key={i} className="glass-card p-6 flex flex-column gap-4" style={{ borderRadius: '20px' }}>
                                <div className="flex align-items-center justify-content-between">
                                    <div className="flex align-items-center gap-2">
                                        <TrendingDown size={18} className="text-red-400" />
                                        <h4 className="m-0 text-sm font-black">{opp.symbol} Harvesting Opportunity</h4>
                                    </div>
                                    <div className="px-2 py-1 rounded bg-red-500/20 text-red-500 text-[10px] font-black tracking-tighter">
                                        LOSS: {opp.lossPercent.toFixed(1)}%
                                    </div>
                                </div>
                                
                                <div className="flex gap-4">
                                    <div className="flex-1 p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                                        <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Unrealized Loss</div>
                                        <div className="text-lg font-bold text-slate-300">{formatCurrency(opp.loss)}</div>
                                    </div>
                                    <div className="flex-1 p-3 rounded-xl bg-blue-600/10 border border-blue-600/20">
                                        <div className="text-[10px] text-blue-400 font-bold uppercase mb-1">Suggested Swap</div>
                                        <div className="text-lg font-bold text-white">{opp.alternative}</div>
                                    </div>
                                </div>

                                <div className="p-3 bg-slate-800/30 rounded-xl">
                                    <p className="m-0 text-xs text-slate-400 leading-relaxed">
                                        <strong>Strategy:</strong> Selling {opp.symbol} realizes the Capital Loss to offset gains elsewhere. {opp.rationale}.
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default PortfolioIntelligencePanel;
