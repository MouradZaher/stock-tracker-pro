import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Sparkles, TrendingUp, TrendingDown, Bot, User, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import { getStockData, getHistoricalPrices } from '../services/stockDataService';
import { getStockNews } from '../services/newsService';
import { analyzeSymbol } from '../services/aiRecommendationService';
import { usePortfolioStore } from '../hooks/usePortfolio';
import { getAllSymbols } from '../data/sectors';
import { formatCurrency, formatPercent } from '../utils/formatters';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    timestamp: Date;
    loading?: boolean;
}

// ─── AI Brain: parse intent & generate smart answers ─────────

async function processQuery(query: string, positions: any[]): Promise<string> {
    const q = query.toLowerCase().trim();

    // ── Intent: Portfolio summary ─────────────────────────────
    if (q.includes('portfolio') && (q.includes('total') || q.includes('worth') || q.includes('value') || q.includes('how much'))) {
        const total = positions.reduce((s, p) => s + p.marketValue, 0);
        const cost = positions.reduce((s, p) => s + p.purchaseValue, 0);
        const pl = total - cost;
        const plPct = cost > 0 ? (pl / cost) * 100 : 0;
        const gainers = positions.filter(p => p.profitLoss > 0).sort((a, b) => b.profitLoss - a.profitLoss);
        const losers = positions.filter(p => p.profitLoss < 0).sort((a, b) => a.profitLoss - b.profitLoss);
        return `📊 **Portfolio Overview**\n\nTotal Value: **${formatCurrency(total)}**\nTotal Cost: ${formatCurrency(cost)}\nTotal P/L: **${pl >= 0 ? '+' : ''}${formatCurrency(pl)} (${plPct >= 0 ? '+' : ''}${plPct.toFixed(2)}%)**\n\n🏆 Top Gainers: ${gainers.slice(0, 3).map(p => `${p.symbol} +${p.profitLossPercent?.toFixed(1)}%`).join(', ') || 'None'}\n📉 Top Losers: ${losers.slice(0, 3).map(p => `${p.symbol} ${p.profitLossPercent?.toFixed(1)}%`).join(', ') || 'None'}\n\nYou hold **${positions.length} positions** across your portfolio.`;
    }

    // ── Intent: Best / worst performer ───────────────────────
    if (q.includes('best') || q.includes('top') || q.includes('winning')) {
        const sorted = [...positions].sort((a, b) => (b.profitLossPercent || 0) - (a.profitLossPercent || 0));
        const top3 = sorted.slice(0, 3);
        return `🏆 **Top Performers**\n\n${top3.map((p, i) => `${i + 1}. **${p.symbol}** — ${p.profitLossPercent?.toFixed(2)}% (${formatCurrency(p.profitLoss)})`).join('\n')}\n\n${top3[0]?.symbol} is your star performer. ${top3[0]?.profitLossPercent > 20 ? "Consider trimming to lock in gains and rebalance." : "Keep holding — momentum looks intact."}`;
    }

    if (q.includes('worst') || q.includes('losing') || q.includes('down')) {
        const sorted = [...positions].sort((a, b) => (a.profitLossPercent || 0) - (b.profitLossPercent || 0));
        const bottom3 = sorted.slice(0, 3);
        return `📉 **Worst Performers**\n\n${bottom3.map((p, i) => `${i + 1}. **${p.symbol}** — ${p.profitLossPercent?.toFixed(2)}% (${formatCurrency(p.profitLoss)})`).join('\n')}\n\n${Math.abs(bottom3[0]?.profitLossPercent || 0) > 30 ? `⚠️ ${bottom3[0]?.symbol} is down over 30%. Consider an exit strategy or averaging down only if thesis intact.` : 'Moderate drawdowns — review each position thesis before adding.'}`;
    }

    // ── Intent: Stock analysis ────────────────────────────────
    const allSymbols = getAllSymbols().map(s => s.symbol);
    const mentionedSymbol = allSymbols.find(sym =>
        q.includes(sym.toLowerCase()) || q.includes(sym.toLowerCase().replace('^', ''))
    );

    if (mentionedSymbol || q.includes('analyze') || q.includes('analysis') || q.includes('should i buy') || q.includes('should i sell')) {
        const sym = mentionedSymbol;
        if (!sym) return `Please mention a specific stock symbol. For example: "Analyze AAPL" or "Should I buy NVDA?"\n\nYour current positions: ${positions.map(p => p.symbol).join(', ')}`;

        try {
            const [stockData, news, rec] = await Promise.all([
                getStockData(sym),
                getStockNews(sym, 3),
                analyzeSymbol(sym),
            ]);

            const stock = stockData.stock;
            const position = positions.find(p => p.symbol === sym);
            const positionNote = position
                ? `\n\n💼 **Your Position:** ${position.units} units @ $${position.avgCost} avg cost — currently **${position.profitLossPercent?.toFixed(2)}%** P/L`
                : '';

            const sentiment = news.length > 0
                ? `\n\n📰 Latest: ${news[0].headline}`
                : '';

            return `🔍 **${sym} — AI Analysis**\n\nPrice: **$${stock.price?.toFixed(2)}** (${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent?.toFixed(2)}% today)\nP/E: ${stock.peRatio?.toFixed(1) || 'N/A'} | 52W: $${stock.fiftyTwoWeekLow?.toFixed(0) || '?'}–$${stock.fiftyTwoWeekHigh?.toFixed(0) || '?'}\n\n🤖 **AI Score: ${rec?.score || 'N/A'}/100 → ${rec?.recommendation || 'Analyzing...'}\n\n**Key Signals:**\n${(rec?.reasoning || ['No signals available']).map(r => `• ${r}`).join('\n')}${positionNote}${sentiment}`;
        } catch {
            return `Unable to fetch live data for ${mentionedSymbol}. Please try again in a moment.`;
        }
    }

    // ── Intent: Sector breakdown ──────────────────────────────
    if (q.includes('sector') || q.includes('diversif') || q.includes('breakdown')) {
        const totalValue = positions.reduce((s, p) => s + p.marketValue, 0);
        const sectorTotals: Record<string, number> = {};
        positions.forEach(p => {
            const sec = p.sector || 'Other';
            sectorTotals[sec] = (sectorTotals[sec] || 0) + p.marketValue;
        });
        const sorted = Object.entries(sectorTotals).sort((a, b) => b[1] - a[1]);
        return `🗂️ **Sector Breakdown**\n\n${sorted.map(([sec, val]) =>
            `• **${sec}**: ${formatCurrency(val)} (${((val / totalValue) * 100).toFixed(1)}%)`
        ).join('\n')}\n\n${sorted[0][1] / totalValue > 0.4 ? `⚠️ **${sorted[0][0]}** is over 40% of portfolio — high concentration risk. Consider diversifying.` : '✅ Sector allocation looks reasonably diversified.'}`;
    }

    // ── Intent: Risk ──────────────────────────────────────────
    if (q.includes('risk') || q.includes('volatil') || q.includes('safe') || q.includes('crash')) {
        const highRiskPositions = positions.filter(p => ['TSLA', 'NVDA', 'AMD', 'UUUU', 'LRCX', 'SNDK', 'PLTR'].includes(p.symbol));
        const safePositions = positions.filter(p => ['GLD', 'SLV', 'VOO', 'JNJ', 'LMT'].includes(p.symbol));
        const totalValue = positions.reduce((s, p) => s + p.marketValue, 0);
        const riskValue = highRiskPositions.reduce((s, p) => s + p.marketValue, 0);
        const safeValue = safePositions.reduce((s, p) => s + p.marketValue, 0);

        return `⚠️ **Portfolio Risk Profile**\n\nHigher-risk positions: **${((riskValue / totalValue) * 100).toFixed(1)}%** (${highRiskPositions.map(p => p.symbol).join(', ') || 'None'})\nDefensive/safe holdings: **${((safeValue / totalValue) * 100).toFixed(1)}%** (${safePositions.map(p => p.symbol).join(', ') || 'None'})\n\n${riskValue / totalValue > 0.3 ? '⚠️ Over 30% in high-beta positions — portfolio sensitive to market sell-offs. Your GLD/SLV/VOO hedge is important.' : '✅ Risk is well-balanced. You have meaningful hedging via defensive holdings.'}\n\nIn a 20% market correction, estimated portfolio impact: **${formatCurrency(-totalValue * 0.2 * 1.1)}** (beta ~1.1)`;
    }

    // ── Intent: What to buy ───────────────────────────────────
    if (q.includes('what') && (q.includes('buy') || q.includes('invest') || q.includes('add'))) {
        const ownedSymbols = new Set(positions.map(p => p.symbol));
        const suggestions = [
            { sym: 'COST', reason: 'Defensive consumer staple, fortress balance sheet', score: 82 },
            { sym: 'BRK.B', reason: 'Berkshire Hathaway — ultimate diversifier / value play', score: 79 },
            { sym: 'PLTR', reason: 'AI data platform, rapid government + commercial growth', score: 76 },
            { sym: 'PANW', reason: 'Cybersecurity leader, recurring revenue, AI-native', score: 74 },
            { sym: 'UNH', reason: 'Healthcare defensive with strong pricing power', score: 73 },
        ].filter(s => !ownedSymbols.has(s.sym));

        return `💡 **AI Stock Ideas (Not In Your Portfolio)**\n\n${suggestions.slice(0, 4).map((s, i) =>
            `${i + 1}. **${s.sym}** — ${s.reason}\n   AI Score: ${s.score}/100`
        ).join('\n\n')}\n\n*These are AI suggestions based on current market conditions. Always do your own due diligence.*`;
    }

    // ── Intent: Price of a stock ──────────────────────────────
    if (q.includes('price') || q.includes('trading at') || q.includes('current price')) {
        const sym = allSymbols.find(s => q.includes(s.toLowerCase()));
        if (sym) {
            try {
                const data = await getStockData(sym);
                const stock = data.stock;
                return `📈 **${sym}** is currently trading at **$${stock.price?.toFixed(2)}**\n${stock.changePercent >= 0 ? '📈' : '📉'} ${stock.changePercent?.toFixed(2)}% today (${stock.change >= 0 ? '+' : ''}$${stock.change?.toFixed(2)})\n\n52W Range: $${stock.fiftyTwoWeekLow?.toFixed(0) || '?'} – $${stock.fiftyTwoWeekHigh?.toFixed(0) || '?'}`;
            } catch {
                return `Could not fetch live price for ${sym}. Try again in a moment.`;
            }
        }
    }

    // ── Intent: Rebalancing suggestion ───────────────────────
    if (q.includes('rebalance') || q.includes('trim') || q.includes('reduce') || q.includes('overweight')) {
        const totalValue = positions.reduce((s, p) => s + p.marketValue, 0);
        const overweight = positions
            .filter(p => (p.marketValue / totalValue) > 0.08 && !['GLD', 'SLV', 'VOO'].includes(p.symbol))
            .sort((a, b) => b.marketValue - a.marketValue);

        if (overweight.length === 0) return '✅ Your portfolio looks balanced! No individual stock is above the 8% single-position threshold (excluding hedging assets like GLD/SLV/VOO).';

        return `⚖️ **Rebalancing Suggestions**\n\n${overweight.slice(0, 3).map(p => {
            const alloc = (p.marketValue / totalValue * 100).toFixed(1);
            const trimAmount = Math.max(0, p.marketValue - totalValue * 0.08);
            return `• **${p.symbol}**: ${alloc}% allocation — trim ~${formatCurrency(trimAmount)} to reach 8% target`;
        }).join('\n')}`;
    }

    // ── Fallback ──────────────────────────────────────────────
    return `I'm your AI portfolio assistant! I can help with:\n\n• **"Analyze AAPL"** — Full AI analysis on any stock\n• **"What's my portfolio worth?"** — Portfolio summary\n• **"What are my biggest losers?"** — Performance review\n• **"What should I buy?"** — AI stock ideas\n• **"Show my sector breakdown"** — Diversification check\n• **"Am I taking too much risk?"** — Risk assessment\n• **"Should I rebalance?"** — Rebalancing suggestions\n• **"Price of TSLA"** — Live price lookup\n\nJust ask naturally!`;
}

// ─── Quick prompts ────────────────────────────────────────────
const QUICK_PROMPTS = [
    "What's my portfolio worth?",
    "What are my biggest losers?",
    "Show sector breakdown",
    "Am I taking too much risk?",
    "What should I buy?",
    "Should I rebalance?",
];

// ─── Chat Widget Component ────────────────────────────────────

const AIChatWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([{
        id: '0',
        role: 'assistant',
        text: "👋 Hi! I'm your AI portfolio assistant. I can analyze stocks, review your portfolio, spot risks, and suggest ideas.\n\nTry asking: *\"Analyze NVDA\"* or *\"What are my biggest losers?\"*",
        timestamp: new Date(),
    }]);

    const { positions } = usePortfolioStore();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim() || isLoading) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', text, timestamp: new Date() };
        const loadingMsg: Message = { id: `l-${Date.now()}`, role: 'assistant', text: '...', timestamp: new Date(), loading: true };

        setMessages(prev => [...prev, userMsg, loadingMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await processQuery(text, positions);
            setMessages(prev => prev.map(m => m.loading ? { ...m, text: response, loading: false } : m));
        } catch {
            setMessages(prev => prev.map(m => m.loading ? { ...m, text: 'Something went wrong. Please try again.', loading: false } : m));
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, positions]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    };

    // Format markdown-like text
    const formatText = (text: string) => {
        return text.split('\n').map((line, i) => {
            const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            const italic = bold.replace(/\*(.*?)\*/g, '<em>$1</em>');
            return <div key={i} dangerouslySetInnerHTML={{ __html: italic || '&nbsp;' }} />;
        });
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                style={{
                    position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
                    width: '60px', height: '60px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 32px rgba(99,102,241,0.5)',
                    transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                    animation: 'pulse-ring 2s infinite',
                }}
                title="AI Portfolio Assistant"
            >
                <Sparkles size={26} color="#fff" />
                <style>{`
                    @keyframes pulse-ring {
                        0% { box-shadow: 0 0 0 0 rgba(99,102,241,0.5); }
                        70% { box-shadow: 0 0 0 16px rgba(99,102,241,0); }
                        100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
                    }
                `}</style>
            </button>
        );
    }

    return (
        <div style={{
            position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
            width: '400px',
            height: isMinimized ? '56px' : '560px',
            background: 'linear-gradient(135deg, rgba(15,15,30,0.98) 0%, rgba(20,20,45,0.98) 100%)',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: '20px',
            boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
            transition: 'height 0.3s cubic-bezier(0.4,0,0.2,1)',
            backdropFilter: 'blur(20px)',
        }}>
            {/* Header */}
            <div style={{
                padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'linear-gradient(90deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1))',
                borderBottom: isMinimized ? 'none' : '1px solid rgba(255,255,255,0.06)',
                flexShrink: 0,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: '10px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Bot size={16} color="#fff" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#fff' }}>AI Portfolio Assistant</div>
                        <div style={{ fontSize: '0.65rem', color: 'rgba(99,102,241,0.9)', fontWeight: 600 }}>
                            ● LIVE — {positions.length} positions tracked
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => setIsMinimized(m => !m)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', padding: '4px', borderRadius: '6px' }}>
                        {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                    </button>
                    <button onClick={() => setIsOpen(false)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', padding: '4px', borderRadius: '6px' }}>
                        <X size={14} />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {/* Messages */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {messages.map(msg => (
                            <div key={msg.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                                <div style={{
                                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                                    background: msg.role === 'user' ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {msg.role === 'user' ? <User size={13} color="rgba(99,102,241,1)" /> : <Bot size={13} color="#fff" />}
                                </div>
                                <div style={{
                                    maxWidth: '78%',
                                    padding: '10px 13px',
                                    borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                                    background: msg.role === 'user' ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                                    border: `1px solid ${msg.role === 'user' ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.06)'}`,
                                    fontSize: '0.78rem',
                                    lineHeight: '1.5',
                                    color: 'rgba(255,255,255,0.9)',
                                }}>
                                    {msg.loading ? (
                                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                            <Loader2 size={12} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem' }}>Analyzing...</span>
                                            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                                        </div>
                                    ) : formatText(msg.text)}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick prompts */}
                    {messages.length <= 1 && (
                        <div style={{ padding: '0 12px 8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {QUICK_PROMPTS.map(p => (
                                <button
                                    key={p}
                                    onClick={() => sendMessage(p)}
                                    style={{
                                        padding: '5px 10px', borderRadius: '20px', fontSize: '0.68rem',
                                        background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                                        color: 'rgba(99,102,241,0.9)', cursor: 'pointer', fontWeight: 600,
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <div style={{
                        padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255,255,255,0.02)',
                    }}>
                        <input
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about any stock or your portfolio..."
                            style={{
                                flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99,102,241,0.2)',
                                borderRadius: '12px', padding: '9px 13px', color: '#fff', fontSize: '0.78rem',
                                outline: 'none',
                            }}
                            disabled={isLoading}
                        />
                        <button
                            onClick={() => sendMessage(input)}
                            disabled={!input.trim() || isLoading}
                            style={{
                                width: 36, height: 36, borderRadius: '10px', flexShrink: 0,
                                background: input.trim() && !isLoading ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.05)',
                                border: 'none', cursor: input.trim() && !isLoading ? 'pointer' : 'default',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s',
                            }}
                        >
                            <Send size={14} color={input.trim() && !isLoading ? '#fff' : 'rgba(255,255,255,0.3)'} />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default AIChatWidget;
