import React from 'react';
import { Calendar, Bell, Clock, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface EarningsEvent {
    symbol: string;
    date: string;
    time: 'Before Market' | 'After Market' | 'During Market';
    estimatedEps: number;
    lastYearEps: number;
    impliedMove: string;
}

const MOCK_EARNINGS: EarningsEvent[] = [
    { symbol: 'NVDA', date: '2026-03-18', time: 'After Market', estimatedEps: 5.12, lastYearEps: 3.42, impliedMove: '±8.2%' },
    { symbol: 'AAPL', date: '2026-04-02', time: 'After Market', estimatedEps: 2.10, lastYearEps: 1.88, impliedMove: '±3.5%' },
    { symbol: 'TSLA', date: '2026-04-15', time: 'After Market', estimatedEps: 0.85, lastYearEps: 0.71, impliedMove: '±12.1%' },
    { symbol: 'MSFT', date: '2026-03-24', time: 'After Market', estimatedEps: 3.05, lastYearEps: 2.85, impliedMove: '±4.1%' },
    { symbol: 'GOOGL', date: '2026-03-25', time: 'After Market', estimatedEps: 1.95, lastYearEps: 1.64, impliedMove: '±5.8%' },
];

const EarningsCalendar: React.FC = () => {
    return (
        <div className="flex flex-column gap-3">
            <div className="flex align-items-center justify-content-between mb-2">
                <div className="flex align-items-center gap-2">
                    <Calendar size={18} className="text-purple-400" />
                    <h3 className="m-0 text-sm font-bold uppercase tracking-wider text-slate-400">Earnings Alpha</h3>
                </div>
                <button className="text-[10px] font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded-lg hover:bg-blue-400/20 transition-all">
                    VIEW FULL CALENDAR
                </button>
            </div>

            {MOCK_EARNINGS.map((event, i) => (
                <div key={i} className="glass-card p-3 flex align-items-center gap-3 hover:bg-white/5 transition-all cursor-pointer group" style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex flex-column align-items-center justify-content-center border border-slate-700">
                        <span className="text-[10px] font-black text-slate-500 uppercase">{event.date.split('-')[1] === '03' ? 'MAR' : 'APR'}</span>
                        <span className="text-sm font-black text-white">{event.date.split('-')[2]}</span>
                    </div>
                    
                    <div className="flex-1">
                        <div className="flex align-items-center gap-2">
                            <span className="text-sm font-black text-white">{event.symbol}</span>
                            <div className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${event.time === 'After Market' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                {event.time === 'After Market' ? 'AMC' : 'BMO'}
                            </div>
                        </div>
                        <div className="flex align-items-center gap-3 mt-1">
                            <div className="flex align-items-center gap-1">
                                <span className="text-[10px] text-slate-500 font-bold uppercase">Est:</span>
                                <span className="text-[10px] text-slate-300 font-bold">{event.estimatedEps.toFixed(2)}</span>
                            </div>
                            <div className="flex align-items-center gap-1">
                                <span className="text-[10px] text-slate-500 font-bold uppercase">Implied:</span>
                                <span className="text-[10px] text-purple-400 font-bold">{event.impliedMove}</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-800/50 group-hover:bg-blue-600/20 transition-all">
                        <ChevronRight size={14} className="text-slate-500 group-hover:text-blue-400" />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default EarningsCalendar;
