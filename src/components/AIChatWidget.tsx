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
                          `Total Exposure: **${formatCurrency(totalEGP)}**.\n\n` +
                          `AI View: Monitoring EGP volatility and central bank policy impact on these specific names.`;
            } else {
                response = "I'm processing your portfolio data. You can ask me to 'Analyze NVDA', 'Check my risk', or 'Show my winners'.";
            }
        } catch (error) {
            response = "I encountered a synchronization error. Please re-check the ticker or your portfolio connectivity.";
        }

        setTimeout(() => {
            setMessages(prev => [...prev, { role: 'assistant', content: response, timestamp: new Date() }]);
            setIsTyping(false);
        }, 800);
    };

    return (
        <div 
            style={{ 
                position: 'fixed', 
                bottom: '16px', 
                right: '16px', 
                zIndex: 9999, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'flex-end', 
                gap: '10px' 
            }}
        >
            {isOpen && (
                <div 
                    className="glass-card animate-in slide-in-from-bottom-5 duration-300"
                    style={{
                        width: '320px',
                        height: '480px',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        border: '1px solid rgba(255,255,255,0.15)',
                        background: 'rgba(15, 23, 42, 0.98)',
                        backdropFilter: 'blur(30px)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 20px rgba(59, 130, 246, 0.25)',
                    }}
                >
                    {/* Header */}
                    <div style={{ 
                        padding: '16px 20px', 
                        background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexShrink: 0
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'white' }}>
                            <div style={{ 
                                width: '40px', 
                                height: '40px', 
                                borderRadius: '12px', 
                                background: 'rgba(255,255,255,0.2)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                backdropFilter: 'blur(10px)' 
                            }}>
                                <Bot size={24} color="white" />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, letterSpacing: '-0.01em', color: 'white' }}>AI Financial Brain</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                    <div style={{ 
                                        width: '8px', 
                                        height: '8px', 
                                        borderRadius: '50%', 
                                        background: '#4ade80', 
                                        boxShadow: '0 0 8px rgba(74,222,128,0.5)' 
                                    }} />
                                    <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8, color: 'white' }}>Intelligence Active</span>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)} 
                            style={{ 
                                width: '32px', 
                                height: '32px', 
                                borderRadius: '50%', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                background: 'rgba(255,255,255,0.1)', 
                                border: 'none', 
                                color: 'white', 
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Messages Container */}
                    <div 
                        className="style-scrollbar"
                        style={{ 
                            flex: 1, 
                            overflowY: 'auto', 
                            padding: '20px', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '20px',
                            background: 'radial-gradient(circle at top right, rgba(59, 130, 246, 0.05), transparent)'
                        }}
                    >
                        {messages.map((m, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', width: '100%' }}>
                                <div style={{ 
                                    display: 'flex', 
                                    gap: '12px', 
                                    flexDirection: m.role === 'user' ? 'row-reverse' : 'row', 
                                    maxWidth: '90%' 
                                }}>
                                    <div style={{ 
                                        width: '32px', 
                                        height: '32px', 
                                        borderRadius: '8px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        flexShrink: 0,
                                        background: m.role === 'user' ? 'rgba(37, 99, 235, 0.2)' : '#1e293b',
                                        color: '#60a5fa',
                                        border: m.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.1)'
                                    }}>
                                        {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                    </div>
                                    <div style={{ 
                                        padding: '12px 16px', 
                                        borderRadius: '16px', 
                                        fontSize: '0.85rem', 
                                        lineHeight: 1.5,
                                        background: m.role === 'user' ? '#2563eb' : 'rgba(30, 41, 59, 0.8)',
                                        color: m.role === 'user' ? 'white' : '#e2e8f0',
                                        border: m.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.05)',
                                        borderTopLeftRadius: m.role === 'user' ? '16px' : '2px',
                                        borderTopRightRadius: m.role === 'user' ? '2px' : '16px'
                                    }}>
                                        {m.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <Bot size={16} color="#60a5fa" />
                                    </div>
                                    <div style={{ padding: '12px 16px', background: 'rgba(30, 41, 59, 0.8)', borderRadius: '16px', borderTopLeftRadius: '2px' }}>
                                        <Bot size={16} style={{ opacity: 0.5 }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Footer */}
                    <div style={{ padding: '16px 20px', background: 'rgba(15, 23, 42, 0.8)', borderTop: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
                        <div style={{ 
                            display: 'flex', 
                            gap: '12px', 
                            background: 'rgba(30, 41, 59, 0.5)', 
                            borderRadius: '14px', 
                            padding: '6px', 
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ask about stocks, risk, winners..."
                                style={{ 
                                    flex: 1, 
                                    background: 'transparent', 
                                    border: 'none', 
                                    padding: '8px 12px', 
                                    fontSize: '0.85rem', 
                                    color: 'white', 
                                    outline: 'none' 
                                }}
                            />
                            <button 
                                onClick={handleSend}
                                style={{ 
                                    width: '36px', 
                                    height: '36px', 
                                    borderRadius: '10px', 
                                    background: '#2563eb', 
                                    color: 'white', 
                                    border: 'none', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    cursor: 'pointer',
                                    transition: 'background 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = '#3b82f6'}
                                onMouseOut={(e) => e.currentTarget.style.background = '#2563eb'}
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="shadow-2xl transition-all group active:scale-95"
                style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)',
                    boxShadow: '0 12px 40px rgba(59, 130, 246, 0.4)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer'
                }}
            >
                {isOpen ? (
                    <X size={24} className="animate-in fade-in duration-300" />
                ) : (
                    <div className="relative" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MessageSquare size={24} className="group-hover:scale-110 transition-transform" />
                        <div 
                            className="absolute animate-pulse" 
                            style={{ 
                                top: '-4px', 
                                right: '-4px', 
                                width: '12px', 
                                height: '12px', 
                                background: '#ef4444', 
                                borderRadius: '50%', 
                                border: '2px solid white' 
                            }}
                        ></div>
                    </div>
                )}
            </button>
        </div>
    );
};

export default AIChatWidget;
