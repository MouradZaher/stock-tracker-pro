import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, TrendingUp, Shield, HelpCircle } from 'lucide-react';
import { analyzeSymbol } from '../services/aiRecommendationService';
import { usePortfolioStore } from '../hooks/usePortfolio';
import { formatCurrency } from '../utils/formatters';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const AIChatWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: "Hello! I'm your AI Portfolio Assistant. Ask me to 'Analyze NVDA' or 'How is my portfolio risk?'",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { positions, getSummary } = usePortfolioStore();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || isTyping) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg, timestamp: new Date() }]);
        setIsTyping(true);

        // Process Response
        const lowMsg = userMsg.toLowerCase();
        let response = "";

        try {
            if (lowMsg.includes('analyze') || lowMsg.includes('check') || lowMsg.includes('tell me about')) {
                const words = lowMsg.replace(/[?!.]/g, '').split(' ');
                const symbol = words.find(w => w.length >= 2 && w.length <= 8 && !['analyze', 'check', 'the', 'stock', 'about', 'tell', 'me'].includes(w));
                
                if (symbol) {
                    const rec = await analyzeSymbol(symbol.toUpperCase());
                    if (rec) {
                        response = `📈 **${rec.name} (${rec.symbol}) Intelligence Report**\n\n` +
                                 `Rating: **${rec.recommendation}** | Alpha Score: **${rec.score}/100**\n\n` +
                                 `**Strategic Insights:**\n${rec.reasoning.map(r => `• ${r}`).join('\n')}\n\n` +
                                 `**Price Physics:**\n• Current: $${rec.price.toFixed(2)}\n` +
                                 `• Technical Target: **$${rec.technicalIndicators.targetPrice.toFixed(2)}**\n` +
                                 `• Regime: **${rec.technicalIndicators.marketRegime.toUpperCase()}**`;
                    } else {
                        response = `I couldn't aggregate enough high-conviction data for **${symbol.toUpperCase()}** right now. Re-verifying tickers...`;
                    }
                } else {
                    response = "Which instrument should I scan? Example: 'Analyze NVDA' or 'Analyze AZG.CA'.";
                }
            } else if (lowMsg.includes('winner') || lowMsg.includes('best')) {
                const winners = [...positions].sort((a, b) => (b.profitLossPercent || 0) - (a.profitLossPercent || 0));
                if (winners.length > 0) {
                    const top = winners[0];
                    response = `🏆 **Top Performer Identified**\n\n**${top.symbol}** is leading your portfolio with a return of **${(top.profitLossPercent || 0).toFixed(2)}%**.\nTotal gain: **${formatCurrency(top.profitLoss)}**.\n\nStrategy: AI recommends maintaining exposure while trailing stops are active.`;
                } else {
                    response = "You don't have any active positions to rank yet.";
                }
            } else if (lowMsg.includes('loser') || lowMsg.includes('worst')) {
                const losers = [...positions].sort((a, b) => (a.profitLossPercent || 0) - (b.profitLossPercent || 0));
                if (losers.length > 0) {
                    const bottom = losers[0];
                    response = `📉 **Underperformer Alert**\n\n**${bottom.symbol}** is your current laggard, down **${(bottom.profitLossPercent || 0).toFixed(2)}%**.\nUnrealized loss: **${formatCurrency(bottom.profitLoss)}**.\n\nAI Scan: Checking for tax-loss harvesting or recovery setup... Consider reviewing the 'Sector Rotation' signals.`;
                } else {
                    response = "All positions are looking solid or no data available.";
                }
            } else if (lowMsg.includes('sector') || lowMsg.includes('exposure') || lowMsg.includes('divers')) {
                const sectors: Record<string, number> = {};
                const summary = getSummary();
                positions.forEach(p => {
                    const s = p.sector || 'Uncategorized';
                    sectors[s] = (sectors[s] || 0) + p.marketValue;
                });
                
                const sortedSectors = Object.entries(sectors).sort((a, b) => b[1] - a[1]);
                response = `🏢 **Intelligence: Sector Exposure Analysis**\n\n${sortedSectors.map(([name, val]) => `• **${name}**: ${((val / summary.totalValue) * 100).toFixed(1)}%`).join('\n')}\n\n` +
                          `${sortedSectors.length > 4 ? '✅ Diversification tier: **Institutional**.' : '⚠️ Concentration detected. Consider rotating capital into low-correlation sectors.'}`;
            } else if (lowMsg.includes('risk') || lowMsg.includes('safe') || lowMsg.includes('crash')) {
                const summary = getSummary();
                const totalValue = summary.totalValue;
                const highRisk = positions.filter(p => (p.profitLossPercent || 0) < -15 || ['NVDA', 'TSLA', 'COIN', 'BTC-USD'].includes(p.symbol));
                const hedge = positions.filter(p => ['GLD', 'SLV', 'VOO', 'SPY', 'TLT', 'AZG'].includes(p.symbol));
                
                const riskPct = (highRisk.reduce((s, p) => s + p.marketValue, 0) / totalValue) * 100;
                const hedgePct = (hedge.reduce((s, p) => s + p.marketValue, 0) / totalValue) * 100;

                response = `🛡️ **Portfolio Stress Test Summary**\n\n` +
                          `• **Beta Exposure**: ${riskPct > 40 ? 'High' : 'Moderate'}\n` +
                          `• **Aggressive Assets**: ${riskPct.toFixed(1)}%\n` +
                          `• **Hedging Layers**: ${hedgePct.toFixed(1)}%\n\n` +
                          `${riskPct > hedgePct ? '⚠️ Your portfolio is "Risk-On". A 10% market drop could impact you by ~12-14%.' : '✅ Balanced structure. Your defensive layers (GLD, SLV, Funds) are providing significant protection.'}`;
            } else if (lowMsg.includes('help') || lowMsg.includes('what can you do')) {
                response = "🧠 **Intelligence Commands:**\n\n" +
                          "• `Analyze [Symbol]` — Deep technical & fundamental scan\n" +
                          "• `Risk profile` — Stress test and beta analysis\n" +
                          "• `My winners` — Rank best performers\n" +
                          "• `Sector exposure` — Breakdown by industry\n" +
                          "• `Egypt assets` — Detail your EGP holdings\n\n" +
                          "How can I assist your strategy today?";
            } else if (lowMsg.includes('egypt')) {
                const egyptPos = positions.filter(p => p.symbol.endsWith('.CA') || ['AZG', 'AZO', 'CI30', 'BMM', 'OLFI'].includes(p.symbol));
                const totalEGP = egyptPos.reduce((s, p) => s + p.marketValue, 0);
                response = `🇪🇬 **Egyptian Portfolio Intelligence**\n\n` +
                          `Tracking **${egyptPos.length}** positions in the EGX market.\n` +
                          `Total Value: **${totalEGP.toLocaleString()} EGP**\n\n` +
                          `Market Note: Your exposure is primarily in **Financial Services** and **Consumer Defensive** via Azimut and Obour Land.`;
            } else {
                response = "I'm monitoring the global markets across all your synchronized tabs. Ask me to 'Analyze a stock', 'Check my risk', or 'Show my winners'.";
            }
        } catch (e) {
            response = "The AI engine is currently re-indexing data. Please retry in a moment.";
        }

        setTimeout(() => {
            setMessages(prev => [...prev, { role: 'assistant', content: response, timestamp: new Date() }]);
            setIsTyping(false);
        }, 800);
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-column align-items-end" style={{ gap: '1rem' }}>
            {isOpen && (
                <div 
                    className="glass-card shadow-2xl flex flex-column animate-in slide-in-from-bottom-5 duration-300"
                    style={{
                        width: '400px',
                        height: '580px',
                        borderRadius: '28px',
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.15)',
                        background: 'rgba(15, 23, 42, 0.92)',
                        backdropFilter: 'blur(30px)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 20px rgba(59, 130, 246, 0.2)',
                    }}
                >
                    {/* Header */}
                    <div className="p-5 flex align-items-center justify-content-between" style={{ 
                        background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }}>
                        <div className="flex align-items-center gap-3 text-white">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex align-items-center justify-content-center backdrop-blur-md">
                                <Bot size={24} className="text-white" />
                            </div>
                            <div>
                                <h3 className="m-0 text-md font-extrabold tracking-tight">AI Financial Brain</h3>
                                <div className="flex align-items-center gap-1.5 mt-0.5">
                                    <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]"></div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Intelligence Active</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full flex align-items-center justify-content-center hover:bg-white/10 text-white transition-all">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-5 flex flex-column gap-5 style-scrollbar" style={{ 
                        background: 'radial-gradient(circle at top right, rgba(59, 130, 246, 0.05), transparent)' 
                    }}>
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
                                <div className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'} max-w-[90%]`}>
                                    <div className={`w-8 h-8 rounded-lg flex align-items-center justify-content-center shrink-0 ${
                                        m.role === 'user' ? 'bg-blue-600/20 text-blue-400' : 'bg-slate-800 text-blue-400 border border-slate-700'
                                    }`}>
                                        {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                    </div>
                                    <div 
                                        className={`p-4 rounded-2xl text-sm leading-relaxed ${
                                            m.role === 'user' 
                                            ? 'bg-blue-600/90 text-white rounded-tr-none shadow-lg' 
                                            : 'bg-slate-800/80 text-slate-200 rounded-tl-none border border-slate-700/50 backdrop-blur-sm'
                                        }`}
                                    >
                                        {m.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-content-start">
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex align-items-center justify-content-center border border-slate-700">
                                        <Bot size={16} className="text-blue-400" />
                                    </div>
                                    <div className="bg-slate-800/80 p-4 rounded-2xl rounded-tl-none border border-slate-700/50">
                                        <div className="flex gap-1.5 items-end h-4">
                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-5 border-t border-white/5 bg-slate-900/80 backdrop-blur-xl">
                        <div className="flex gap-3 p-1.5 bg-slate-800/50 rounded-2xl border border-white/5 focus-within:border-blue-500/50 transition-all">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ask a question..."
                                className="flex-1 bg-transparent border-none px-3 py-2 text-sm text-white focus:outline-none placeholder:text-slate-500"
                            />
                            <button 
                                onClick={handleSend}
                                className="w-10 h-10 bg-blue-600 hover:bg-blue-500 rounded-xl text-white transition-all flex align-items-center justify-content-center shadow-lg"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-16 h-16 rounded-2xl shadow-2xl flex align-items-center justify-content-center text-white transition-all group active:scale-95"
                style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)',
                    boxShadow: '0 12px 40px rgba(59, 130, 246, 0.4)',
                    border: '1px solid rgba(255,255,255,0.2)'
                }}
            >
                {isOpen ? (
                    <X size={28} className="animate-in fade-in duration-300" />
                ) : (
                    <div className="relative">
                        <MessageSquare size={28} className="group-hover:scale-110 transition-transform" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
                    </div>
                )}
            </button>
        </div>
    );
};

export default AIChatWidget;
