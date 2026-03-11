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
            if (lowMsg.includes('analyze') || lowMsg.includes('check')) {
                const words = lowMsg.split(' ');
                const symbol = words.find(w => w.length >= 2 && w.length <= 6 && !['analyze', 'check', 'the', 'stock'].includes(w));
                
                if (symbol) {
                    const rec = await analyzeSymbol(symbol.toUpperCase());
                    if (rec) {
                        response = `📈 **${rec.name} (${rec.symbol}) Analysis**\n\nRecommendation: **${rec.recommendation}** (Score: ${rec.score}/100)\n\nKey Insights:\n${rec.reasoning.map(r => `• ${r}`).join('\n')}\n\nAI Target: **${formatCurrency(rec.technicalIndicators.targetPrice)}**`;
                    } else {
                        response = `I couldn't find detailed data for ${symbol.toUpperCase()} right now. Please check the spelling or try a major ticker.`;
                    }
                } else {
                    response = "Which stock should I analyze? Try 'Analyze AAPL'.";
                }
            } else if (lowMsg.includes('portfolio') || lowMsg.includes('my holdings') || lowMsg.includes('risk')) {
                const summary = getSummary();
                const totalValue = summary.totalValue;
                const profit = summary.totalProfitLoss;
                const highRiskPositions = positions.filter(p => p.profitLossPercent < -15);
                const safePositions = positions.filter(p => ['GLD', 'SLV', 'VOO', 'JNJ', 'LMT'].includes(p.symbol));
                
                const riskValue = highRiskPositions.reduce((s, p) => s + p.marketValue, 0);
                const safeValue = safePositions.reduce((s, p) => s + p.marketValue, 0);

                response = `⚠️ **Portfolio Risk Profile**\n\nHigher-risk positions: **${((riskValue / totalValue) * 100).toFixed(1)}%** (${highRiskPositions.map(p => p.symbol).join(', ') || 'None'})\nDefensive/safe holdings: **${((safeValue / totalValue) * 100).toFixed(1)}%** (${safePositions.map(p => p.symbol).join(', ') || 'None'})\n\n${riskValue / totalValue > 0.3 ? '⚠️ Over 30% in high-beta positions — portfolio sensitive to market sell-offs. Your GLD/SLV/VOO hedge is important.' : '✅ Risk is well-balanced. You have meaningful hedging via defensive holdings.'}\n\nIn a 20% market correction, estimated portfolio impact: **${formatCurrency(-totalValue * 0.2 * 1.1)}** (beta ~1.1)`;
            } else if (lowMsg.includes('divers')) {
                const sectors = new Set(positions.map(p => p.sector));
                response = `Your portfolio is spread across **${sectors.size} sectors**. ${sectors.size < 3 ? '⚠️ Consideration: Adding assets in non-correlated sectors could reduce your volatility.' : '✅ Good sector diversification detected.'}`;
            } else if (lowMsg.includes('help') || lowMsg.includes('what can you do')) {
                response = "I can:\n• Analyze any stock: 'Analyze AAPL'\n• Evaluate your risk: 'How safe is my portfolio?'\n• Check diversification: 'Am I diversified?'\n• Find opportunities: 'What should I buy?'";
            } else {
                response = "I'm focusing on financial analysis right now. Try asking 'How is my portfolio risk?' or 'Analyze NVDA'.";
            }
        } catch (e) {
            response = "I encountered an error processing that. Let me try again later.";
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
                        width: '380px',
                        height: '520px',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(15, 23, 42, 0.9)',
                        backdropFilter: 'blur(20px)',
                    }}
                >
                    {/* Header */}
                    <div className="p-4 flex align-items-center justify-content-between" style={{ background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)' }}>
                        <div className="flex align-items-center gap-2 text-white">
                            <Bot size={24} />
                            <div>
                                <h3 className="m-0 text-sm font-bold">AI Intelligence</h3>
                                <div className="flex align-items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                                    <span className="text-xs opacity-80">Online</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white opacity-60 hover:opacity-100 transition-opacity">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 flex flex-column gap-4 style-scrollbar">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
                                <div className="flex gap-2 max-w-[85%]">
                                    {m.role === 'assistant' && (
                                        <div className="w-8 h-8 rounded-full bg-slate-800 flex align-items-center justify-content-center text-blue-400 shrink-0">
                                            <Bot size={16} />
                                        </div>
                                    )}
                                    <div 
                                        className={`p-3 rounded-2xl text-sm whitespace-pre-wrap ${
                                            m.role === 'user' 
                                            ? 'bg-blue-600 text-white rounded-tr-none' 
                                            : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                                        }`}
                                    >
                                        {m.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-content-start">
                                <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-700">
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-slate-700 bg-slate-900/50">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ask about a stock or your risk..."
                                className="flex-1 bg-slate-800 border-none rounded-xl px-4 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                            <button 
                                onClick={handleSend}
                                className="p-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-white transition-colors"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 rounded-full shadow-lg flex align-items-center justify-content-center text-white transition-all transform hover:scale-110 active:scale-95"
                style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                    boxShadow: '0 8px 32px rgba(59, 130, 246, 0.4)'
                }}
            >
                {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
            </button>
        </div>
    );
};

export default AIChatWidget;
