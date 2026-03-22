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
        <div className="flex flex-column gap-4">
            <div className="flex align-items-center justify-content-between mb-1">
                <div className="flex align-items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                        <Calendar size={16} />
                    </div>
                    <div>
                        <h3 className="m-0 text-sm font-black uppercase tracking-widest text-white/90">Earnings Alpha</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">AI-Predicted Volatility Windows</p>
                    </div>
                </div>
                <button className="text-[10px] font-black text-blue-400 bg-blue-400/10 px-3 py-1.5 rounded-xl border border-blue-400/20 hover:bg-blue-400/20 transition-all uppercase tracking-widest">
                    Global Schedule
                </button>
            </div>

            <div className="flex flex-column gap-3">
                {MOCK_EARNINGS.map((event, i) => {
                    const isOwned = ownedSymbols.has(event.symbol);
                    const isHighVolatility = parseFloat(event.impliedMove.replace(/[±%]/g, '')) > 7;

                    return (
                        <div key={i} className={`glass-card p-4 flex align-items-center gap-4 hover:bg-white/5 transition-all cursor-pointer group relative overflow-hidden ${isOwned ? 'border-l-4 border-blue-500' : 'border border-white/5'}`} style={{ borderRadius: '20px' }}>
                            {isOwned && (
                                <div className="absolute top-0 right-0 px-3 py-1 bg-blue-600 text-[10px] font-black uppercase tracking-tighter rounded-bl-xl text-white shadow-lg animate-in fade-in slide-in-from-top-1 duration-500">
                                    In Portfolio
                                </div>
                            )}

                            <div className="w-14 h-14 rounded-2xl bg-slate-900 flex flex-column align-items-center justify-content-center border border-white/5 shadow-inner shrink-0">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{event.date.split('-')[1] === '03' ? 'MAR' : 'APR'}</span>
                                <span className="text-xl font-black text-white leading-tight">{event.date.split('-')[2]}</span>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex align-items-center gap-2 flex-wrap">
                                    <CompanyLogo symbol={event.symbol} size={24} />
                                    <span className="text-base font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight truncate">{event.symbol}</span>
                                    <div className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter ${event.time === 'After Market' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20' : 'bg-blue-500/20 text-blue-400 border border-blue-500/20'}`}>
                                        {event.time === 'After Market' ? 'AMC' : 'BMO'}
                                    </div>
                                    {isHighVolatility && (
                                        <div className="flex align-items-center gap-1 bg-red-500/20 text-red-500 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter border border-red-500/20 animate-pulse">
                                            <Zap size={10} /> High Delta
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex align-items-center gap-4 mt-2">
                                    <div className="flex flex-column">
                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">EPS Forecast</span>
                                        <span className="text-xs text-slate-200 font-black">${event.estimatedEps.toFixed(2)} <span className="text-[10px] text-green-500/70 font-bold ml-1">vs ${event.lastYearEps.toFixed(2)} LY</span></span>
                                    </div>
                                    <div className="w-px h-6 bg-white/5"></div>
                                    <div className="flex flex-column">
                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Market Implied</span>
                                        <div className="flex align-items-center gap-1">
                                            <TrendingUp size={10} className="text-purple-400" />
                                            <span className="text-xs text-purple-400 font-black">{event.impliedMove}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-column align-items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex align-items-center justify-content-center transition-all ${isOwned ? 'bg-blue-600/20 text-blue-400 border border-blue-600/20' : 'bg-slate-800 text-slate-500'}`}>
                                    <Bell size={14} />
                                </div>
                                <div className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">Notify Me</div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <div className="p-4 bg-blue-600/5 rounded-2xl border border-blue-600/10 flex gap-3">
                <AlertTriangle size={18} className="text-blue-500 shrink-0 mt-0.5 shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
                <div>
                    <h4 className="m-0 text-[11px] font-black text-blue-400 uppercase tracking-widest">AI Strategic Counsel</h4>
                    <p className="m-0 text-[10px] text-slate-400/80 leading-relaxed mt-1">
                        Upcoming {ownedSymbols.size > 0 ? Array.from(ownedSymbols).slice(0,2).join('/') : 'key ticker'} earnings present a high Gamma risk profile. Automated hedging scans suggest maintaining current GLD exposure.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default EarningsCalendar;
