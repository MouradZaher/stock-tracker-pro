import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, TrendingUp, Shield, HelpCircle } from 'lucide-react';
import { analyzeSymbol } from '../services/aiRecommendationService';
import { usePortfolioStore } from '../hooks/usePortfolio';
import { formatCurrency } from '../utils/formatters';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    toolsUsed?: string[];
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

    useEffect(() => {
        const handleOpenAI = () => setIsOpen(true);
        window.addEventListener('open-ai-chat', handleOpenAI);
        return () => window.removeEventListener('open-ai-chat', handleOpenAI);
    }, []);

    const handleSend = async () => {
        if (!input.trim() || isTyping) return;

        const userMsg = input.trim();
        setInput('');
        
        const newMessages = [...messages, { role: 'user', content: userMsg, timestamp: new Date() }];
        setMessages(newMessages as Message[]);
        setIsTyping(true);

        try {
            // Prepare messages for Ollama API (exclude timestamps to avoid format issues)
            const apiMessages = newMessages.map(m => ({
                role: m.role,
                content: m.content
            }));

            const response = await fetch('http://localhost:3001/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ messages: apiMessages })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to connect to AI server');
            }

            const data = await response.json();
            
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: data.message.content, 
                timestamp: new Date(),
                toolsUsed: data.tools_used
            }]);
        } catch (error: any) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: `⚠️ System Error: ${error.message}. Is the backend server running?`, 
                timestamp: new Date() 
            }]);
        } finally {
            setIsTyping(false);
        }
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
                                        {m.toolsUsed && m.toolsUsed.length > 0 && (
                                            <div style={{
                                                marginTop: '8px',
                                                paddingTop: '8px',
                                                borderTop: '1px solid rgba(255,255,255,0.1)',
                                                fontSize: '0.75rem',
                                                color: '#10b981',
                                                display: 'flex',
                                                gap: '6px',
                                                alignItems: 'center'
                                            }}>
                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                                                Agent Actions: {m.toolsUsed.join(', ')}
                                            </div>
                                        )}
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
