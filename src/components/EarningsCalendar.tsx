import React from 'react';
import { Calendar, Bell, Clock, ChevronRight, AlertTriangle, Zap, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { usePortfolioStore } from '../hooks/usePortfolio';
import CompanyLogo from './CompanyLogo';

interface EarningsEvent {
    symbol: string;
    date: string;
    time: 'Before Market' | 'After Market' | 'During Market';
    estimatedEps: number;
    lastYearEps: number;
    impliedMove: string;
    convictionIndex: number;
}

const MOCK_EARNINGS: EarningsEvent[] = [
    { symbol: 'NVDA', date: '2026-03-18', time: 'After Market', estimatedEps: 5.12, lastYearEps: 3.42, impliedMove: '±8.2%', convictionIndex: 88 },
    { symbol: 'AZG', date: '2026-03-20', time: 'During Market', estimatedEps: 0.45, lastYearEps: 0.38, impliedMove: '±4.5%', convictionIndex: 72 },
    { symbol: 'AAPL', date: '2026-04-02', time: 'After Market', estimatedEps: 2.10, lastYearEps: 1.88, impliedMove: '±3.5%', convictionIndex: 94 },
    { symbol: 'TSLA', date: '2026-04-15', time: 'After Market', estimatedEps: 0.85, lastYearEps: 0.71, impliedMove: '±12.1%', convictionIndex: 65 },
    { symbol: 'MSFT', date: '2026-03-24', time: 'After Market', estimatedEps: 3.05, lastYearEps: 2.85, impliedMove: '±4.1%', convictionIndex: 91 },
];

const EarningsCalendar: React.FC = () => {
    const { positions } = usePortfolioStore();
    const ownedSymbols = new Set(positions.map(p => p.symbol));

    return (
        <div className="flex flex-column gap-6">
            {/* Header Section */}
            <div className="flex align-items-center justify-content-between">
                <div className="flex align-items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                        <Calendar size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className="m-0 text-sm font-black uppercase tracking-[0.15em] text-white">Earnings Alpha</h3>
                        <div className="flex align-items-center gap-2 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <p className="m-0 text-[9px] text-slate-500 font-black uppercase tracking-widest">AI-Predicted Volatility</p>
                        </div>
                    </div>
                </div>
                <button className="text-[10px] font-black text-slate-400 bg-white/5 px-4 py-2 rounded-xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all uppercase tracking-widest flex align-items-center gap-2">
                    Global Schedule <ChevronRight size={12} />
                </button>
            </div>

            {/* Timeline View */}
            <div className="flex flex-column gap-4 relative">
                {/* Vertical Timeline Line */}
                <div className="absolute left-[27px] top-6 bottom-6 w-px bg-gradient-to-b from-purple-500/50 via-blue-500/30 to-slate-800/20 z-0"></div>

                {MOCK_EARNINGS.map((event, i) => {
                    const isOwned = ownedSymbols.has(event.symbol);
                    const isHighVolatility = parseFloat(event.impliedMove.replace(/[±%]/g, '')) > 7;

                    return (
                        <div key={i} className="flex gap-4 group relative z-10">
                            {/* Date Badge */}
                            <div className="flex flex-column align-items-center shrink-0 w-14">
                                <div className={`w-14 h-14 rounded-2xl flex flex-column align-items-center justify-content-center border transition-all duration-500 ${isOwned ? 'bg-blue-600 border-blue-400 shadow-[0_8px_20px_rgba(37,99,235,0.3)]' : 'bg-slate-900 border-white/10 group-hover:border-purple-500/50'}`}>
                                    <span className={`text-[10px] font-black uppercase tracking-tighter ${isOwned ? 'text-blue-100' : 'text-slate-500'}`}>{event.date.split('-')[1] === '03' ? 'MAR' : 'APR'}</span>
                                    <span className={`text-xl font-black leading-none mt-0.5 ${isOwned ? 'text-white' : 'text-slate-200'}`}>{event.date.split('-')[2]}</span>
                                </div>
                            </div>

                            {/* Content Card */}
                            <div className={`flex-1 glass-card p-4 flex align-items-center gap-4 hover:bg-white/[0.04] transition-all cursor-pointer relative overflow-hidden ${isOwned ? 'border-purple-500/30' : 'border-white/5'}`} style={{ borderRadius: '24px' }}>
                                {isOwned && (
                                    <div className="absolute top-0 right-0 px-4 py-1.5 bg-blue-600 text-[9px] font-black uppercase tracking-widest text-white shadow-lg animate-in fade-in slide-in-from-top-2 duration-700 rounded-bl-2xl">
                                        In Portfolio
                                    </div>
                                )}

                                <div className="flex-1 min-w-0">
                                    <div className="flex align-items-center gap-3 mb-2.5">
                                        <div className="p-1 bg-white/5 rounded-lg border border-white/5">
                                            <CompanyLogo symbol={event.symbol} size={28} />
                                        </div>
                                        <div className="flex flex-column">
                                            <span className="text-base font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{event.symbol}</span>
                                            <div className="flex gap-2 mt-0.5">
                                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${event.time === 'After Market' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                                    {event.time === 'After Market' ? 'AMC' : 'BMO'}
                                                </span>
                                                {isHighVolatility && (
                                                    <span className="flex align-items-center gap-1 bg-red-500/10 text-red-500 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.15)]">
                                                        <Zap size={10} fill="currentColor" /> HIGH GAMMA
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                                            <span className="block text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1.5">EPS Forecast</span>
                                            <div className="flex align-items-baseline gap-1.5">
                                                <span className="text-sm text-slate-200 font-bold">${event.estimatedEps.toFixed(2)}</span>
                                                <span className="text-[10px] text-green-500/80 font-black">+{((event.estimatedEps/event.lastYearEps - 1)*100).toFixed(0)}% YoY</span>
                                            </div>
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                                            <span className="block text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1.5">Expected Move</span>
                                            <div className="flex align-items-center gap-1.5">
                                                <TrendingUp size={12} className="text-purple-400" />
                                                <span className="text-sm text-purple-400 font-bold">{event.impliedMove}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-column align-items-center gap-2 px-2">
                                    <button className={`w-10 h-10 rounded-2xl flex align-items-center justify-content-center transition-all duration-300 ${isOwned ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' : 'bg-slate-800/50 text-slate-500 border border-white/5 hover:border-blue-500/50 hover:text-blue-400'}`}>
                                        <Bell size={18} strokeWidth={2.5} />
                                    </button>
                                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Remind</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {/* AI Counsel Section */}
            <div className="p-5 bg-gradient-to-br from-blue-600/10 to-purple-600/5 rounded-[28px] border border-blue-600/20 relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full group-hover:bg-blue-500/20 transition-all duration-1000"></div>
                <div className="flex gap-4 relative z-10">
                    <div className="w-10 h-10 rounded-2xl bg-blue-600/20 flex align-items-center justify-content-center border border-blue-500/30 shrink-0 shadow-lg">
                        <AlertTriangle size={20} className="text-blue-400" fill="rgba(59,130,246,0.1)" />
                    </div>
                    <div>
                        <h4 className="m-0 text-xs font-black text-blue-400 uppercase tracking-[0.2em] mb-1.5">Institutional Strategic Counsel</h4>
                        <p className="m-0 text-[11px] text-slate-400/90 leading-relaxed font-medium">
                            Upcoming <span className="text-white font-bold">{ownedSymbols.size > 0 ? Array.from(ownedSymbols).slice(0,2).join('/') : 'key market'}</span> catalyst windows present elevated gamma risk profiles. Automated hedging scans suggest maintaining current <span className="text-yellow-500/80 font-bold italic">GLD/TLT</span> defensive positioning until post-volatility normalization.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EarningsCalendar;
