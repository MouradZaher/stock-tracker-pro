import React, { useState, useEffect } from 'react';
import { Shield, Activity, TrendingDown, Layers, ArrowUpRight, AlertTriangle, Info, RefreshCw, Zap, Target, Clock, BarChart3 } from 'lucide-react';
import { usePortfolioStore } from '../hooks/usePortfolio';
import { portfolioAnalyticsService, type StressTestResult, type TaxLossOpportunity } from '../services/portfolioAnalyticsService';
import { formatCurrency } from '../utils/formatters';
import CorrelationMatrix from './CorrelationMatrix';
import OptionsFlowSimulator from './OptionsFlowSimulator';
import AlphaForesightPlot from './AlphaForesightPlot';

const PortfolioIntelligencePanel: React.FC = () => {
    const { positions } = usePortfolioStore();
    const [stressResults, setStressResults] = useState<StressTestResult[]>([]);
    const [taxOpps, setTaxOpps] = useState<TaxLossOpportunity[]>([]);
    const [entryPoints, setEntryPoints] = useState<{ symbol: string; recommendedDay: string; confidence: number; rationale: string }[]>([]);
    const [benchmarkData, setBenchmarkData] = useState<{ portfolioReturn: number; benchmarkReturn: number; alpha: number; status: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'correlation' | 'stress' | 'tax' | 'options' | 'entry' | 'alpha'>('correlation');

    const loadData = async () => {
        if (positions.length === 0) return;
        setIsLoading(true);
        try {
            const stress = await portfolioAnalyticsService.runStressTests(positions);
            setStressResults(stress);
            setTaxOpps(portfolioAnalyticsService.getTaxLossOpportunities(positions));
            setEntryPoints(portfolioAnalyticsService.getSmartEntryPoints(positions));
            setBenchmarkData(portfolioAnalyticsService.getPeerBenchmark(positions));
        } catch (e) {
            console.error('Failed to load intelligence data', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [positions.length]);

    if (positions.length === 0) {
        return (
            <div className="flex flex-column align-items-center justify-content-center p-8 text-center" style={{ minHeight: '60vh' }}>
                <Layers size={48} className="text-slate-600 mb-4 opacity-20" />
                <h2 className="m-0 text-xl font-bold text-slate-400">No Data Available</h2>
                <p className="text-sm text-slate-500 max-w-xs mt-2">Add assets to your portfolio to unlock AI-powered correlation and stress analysis.</p>
            </div>
        );
    }

    return (
        <div className="p-4 flex flex-column gap-6 animate-in fade-in duration-500" style={{ paddingBottom: '100px' }}>
            {/* Header Card */}
            <div className="glass-card p-6 relative overflow-hidden" style={{ borderRadius: '24px' }}>
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Shield size={120} />
                </div>
                <div className="flex align-items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                        <Shield size={20} />
                    </div>
                    <div>
                        <h1 className="m-0 text-2xl font-black tracking-tight">Strategy <span className="text-blue-500">Intelligence</span></h1>
                        <p className="m-0 text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Multi-Layer Alpha Analytics Engine</p>
                    </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-6">
                    {(['correlation', 'stress', 'tax', 'options', 'entry', 'alpha'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all transform active:scale-95 ${
                                activeTab === tab 
                                ? 'bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.4)]' 
                                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-white border border-white/5'
                            }`}
                        >
                            {tab === 'correlation' ? 'Correlation' : 
                             tab === 'stress' ? 'Stress Test' : 
                             tab === 'tax' ? 'Tax Harvest' : 
                             tab === 'options' ? 'Options Flow' : 
                             tab === 'entry' ? 'Smart Entry' : 'Alpha Bench'}
                        </button>
                    ))}
                    <button 
                        onClick={loadData} 
                        className="ml-auto p-2 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white border border-white/5 transition-colors"
                        title="Refresh Intelligence"
                    >
                        <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="animate-in slide-in-from-bottom-4 duration-500">
                {activeTab === 'correlation' && <CorrelationMatrix />}
                
                {activeTab === 'stress' && (
                    <div className="flex flex-column gap-4">
                        <div className="mb-2">
                            <h3 className="text-lg font-bold text-white flex align-items-center gap-2">
                                <Activity size={18} className="text-red-400" />
                                Scenario Modeling
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">Simulated impact of historical crises on your current portfolio structure.</p>
                        </div>
                        {stressResults.map((res, i) => (
                            <div key={i} className="glass-card p-6 flex align-items-center gap-4 group hover:bg-slate-800/40 transition-all border border-white/5" style={{ borderRadius: '20px', borderLeft: `6px solid ${res.impact < 0 ? '#ef4444' : '#22c55e'}` }}>
                                <div className="flex-1">
                                    <h4 className="m-0 text-sm font-black text-slate-200 uppercase tracking-wide group-hover:text-white transition-colors">{res.scenario}</h4>
                                    <p className="m-0 text-xs text-slate-500 mt-1.5 leading-relaxed">{res.description}</p>
                                </div>
                                <div className="text-right">
                                    <div className={`text-xl font-black tracking-tighter ${res.impact < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                        {res.impact < 0 ? '' : '+'}{formatCurrency(res.impact)}
                                    </div>
                                    <div className="text-[10px] font-black uppercase opacity-60 mt-1">
                                        {res.impactPercent.toFixed(2)}% Delta
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'tax' && (
                    <div className="flex flex-column gap-4">
                        <div className="mb-2">
                            <h3 className="text-lg font-bold text-white flex align-items-center gap-2">
                                <TrendingDown size={18} className="text-green-400" />
                                Tax Benefit Scanner
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">Identifies loss-crystallization opportunities to offset capital gains.</p>
                        </div>
                        {taxOpps.length === 0 ? (
                            <div className="p-12 text-center glass-card border border-dashed border-white/10" style={{ borderRadius: '24px' }}>
                                <Shield size={48} className="text-green-500/20 mx-auto mb-4" />
                                <p className="m-0 text-sm text-slate-400 font-bold">Portfolio Health Optimal</p>
                                <p className="m-0 text-xs text-slate-600 mt-1">No significant unrealized losses detected for harvesting.</p>
                            </div>
                        ) : (
                            taxOpps.map((opp, i) => (
                                <div key={i} className="glass-card p-6 flex flex-column gap-4 border border-white/5" style={{ borderRadius: '20px' }}>
                                    <div className="flex align-items-center justify-content-between">
                                        <div className="flex align-items-center gap-2">
                                            <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400">
                                                <AlertTriangle size={14} />
                                            </div>
                                            <h4 className="m-0 text-sm font-black tracking-tight">{opp.symbol} Yield Optimization</h4>
                                        </div>
                                        <div className="px-2 py-1 rounded-lg bg-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-tighter border border-red-500/20">
                                            -{opp.lossPercent.toFixed(1)}% ERODED
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-4">
                                        <div className="flex-1 p-4 rounded-2xl bg-slate-900/50 border border-white/5 relative overflow-hidden group">
                                            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Crystallize Loss</div>
                                            <div className="text-xl font-black text-slate-200">{formatCurrency(opp.loss)}</div>
                                            <div className="absolute -right-2 -bottom-2 opacity-5 scale-150 rotate-12 transition-transform group-hover:rotate-0">
                                                <TrendingDown size={48} />
                                            </div>
                                        </div>
                                        <div className="flex-1 p-4 rounded-2xl bg-blue-600/10 border border-blue-600/20 relative overflow-hidden group">
                                            <div className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-1">AI Counter-Pick</div>
                                            <div className="text-xl font-black text-white">{opp.alternative}</div>
                                            <div className="absolute -right-2 -bottom-2 opacity-10 scale-150 -rotate-12 transition-transform group-hover:rotate-0">
                                                <BarChart3 size={48} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-800/40 rounded-2xl border border-white/5">
                                        <p className="m-0 text-[11px] text-slate-400 leading-relaxed">
                                            <span className="text-blue-400 font-black uppercase mr-2 tracking-tighter">Strategic Rationale:</span> 
                                            Realizing the {opp.symbol} loss creates a tax-deferred credit. Swapping into {opp.alternative} maintains sector weighting while {opp.rationale.toLowerCase()}.
                                        </p>
                                    </div>
                                    
                                    <button className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest transition-all transform active:scale-[0.98] shadow-lg shadow-blue-600/20 flex align-items-center justify-content-center gap-2">
                                        <ArrowUpRight size={14} />
                                        Execute Optimal Swap Simulation
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'options' && (
                    <div className="flex flex-column gap-4">
                        <div className="mb-2">
                            <h3 className="text-lg font-bold text-white flex align-items-center gap-2">
                                <Zap size={18} className="text-yellow-400" />
                                Options Flow Signals
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">Unusual institutional activity and whale maneuvers in the derivatives market.</p>
                        </div>
                        <OptionsFlowSimulator />
                    </div>
                )}

                {activeTab === 'entry' && (
                    <div className="flex flex-column gap-4">
                        <div className="mb-2">
                            <h3 className="text-lg font-bold text-white flex align-items-center gap-2">
                                <Target size={18} className="text-blue-400" />
                                Smart Entry Timing
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">Historical probability analysis for optimal buying windows based on cyclical data.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {entryPoints.map((p, i) => (
                                <div key={i} className="glass-card p-6 border border-white/5 relative overflow-hidden" style={{ borderRadius: '24px' }}>
                                    <div className="flex align-items-center justify-content-between mb-4">
                                        <div className="text-xl font-black text-white">{p.symbol}</div>
                                        <div className="text-[10px] font-black uppercase bg-blue-500 text-white px-2 py-0.5 rounded">
                                            {p.confidence}% CONFIDENCE
                                        </div>
                                    </div>
                                    <div className="flex align-items-center gap-3 mb-4">
                                        <div className="p-3 rounded-2xl bg-blue-600/20 text-blue-400 uppercase font-black text-xs tracking-widest">
                                            Optimal Day: {p.recommendedDay}
                                        </div>
                                    </div>
                                    <p className="m-0 text-xs text-slate-400 leading-relaxed italic border-l-2 border-blue-500/30 pl-3">
                                        "{p.rationale}"
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'alpha' && benchmarkData && (
                    <div className="flex flex-column gap-6">
                        <div className="mb-2">
                            <h3 className="text-lg font-bold text-white flex align-items-center gap-2">
                                <BarChart3 size={18} className="text-purple-400" />
                                Alpha Peer Benchmark
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">Comparing your portfolio's performance against the S&P 500 benchmark.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="glass-card p-8 flex flex-column align-items-center text-center gap-2" style={{ borderRadius: '24px' }}>
                                <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Your Alpha</div>
                                <div className={`text-4xl font-black ${benchmarkData.alpha > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {benchmarkData.alpha > 0 ? '+' : ''}{benchmarkData.alpha.toFixed(2)}%
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${benchmarkData.alpha > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {benchmarkData.status}
                                </div>
                            </div>
                            
                            <div className="glass-card p-8 flex flex-column gap-6" style={{ borderRadius: '24px' }}>
                                <div className="flex align-items-center justify-content-between">
                                    <span className="text-xs font-bold text-slate-400">Portfolio Return</span>
                                    <span className="text-sm font-black text-white">{benchmarkData.portfolioReturn.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-blue-500 h-full" style={{ width: `${Math.min(100, Math.max(0, benchmarkData.portfolioReturn + 50))}%` }}></div>
                                </div>
                                <div className="flex align-items-center justify-content-between">
                                    <span className="text-xs font-bold text-slate-400">S&P 500 (SPY)</span>
                                    <span className="text-sm font-black text-white">{benchmarkData.benchmarkReturn.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-slate-400 h-full" style={{ width: `${Math.min(100, Math.max(0, benchmarkData.benchmarkReturn + 50))}%` }}></div>
                                </div>
                            </div>
                        </div>

                        {/* Mega Deep Dive advanced visualization */}
                        <AlphaForesightPlot />

                        <div className="p-5 bg-blue-600/5 border border-blue-600/10 rounded-2xl">
                            <p className="m-0 text-xs text-blue-400/80 leading-relaxed font-medium">
                                <strong>AI Intelligence Note:</strong> Your portfolio exhibits {benchmarkData.alpha > 0 ? 'positive Alpha' : 'Beta-dependent performance'}. This indicates that your recent asset selection has {benchmarkData.alpha > 0 ? 'successfully outperformed' : 'not yet surpassed'} the broad market risk-adjusted return.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PortfolioIntelligencePanel;
