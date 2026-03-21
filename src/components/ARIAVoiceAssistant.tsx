import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, X, Brain, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

interface ARIAVoiceAssistantProps {
    onNavigate?: (tab: string) => void;
    onSelectSymbol?: (symbol: string) => void;
}

// ── Command patterns ────────────────────────────────────────────────────────
const COMMANDS = [
    { pattern: /go to (home|watchlist|portfolio|ai|pulse|pricing|recommendations)/i, action: 'navigate' },
    { pattern: /show (?:me |)(apple|tesla|nvidia|amazon|microsoft|google|meta|netflix)/i, action: 'symbol' },
    { pattern: /look.?up ([A-Z]{1,5})/i, action: 'symbol_raw' },
    { pattern: /what(?:'s| is) the (?:market|stock)/i, action: 'market' },
    { pattern: /close|dismiss|stop|bye/i, action: 'close' },
];

const SYMBOL_MAP: Record<string, string> = {
    apple: 'AAPL', tesla: 'TSLA', nvidia: 'NVDA', amazon: 'AMZN',
    microsoft: 'MSFT', google: 'GOOGL', googl: 'GOOGL', meta: 'META', netflix: 'NFLX',
};

const TAB_MAP: Record<string, string> = {
    home: 'home', watchlist: 'watchlist', portfolio: 'portfolio',
    ai: 'recommendations', recommendations: 'recommendations',
    pulse: 'pulse', pricing: 'pricing',
};

const ARIA_RESPONSES = {
    greeting: ["Hey! I'm ARIA, your market copilot. How can I help?", "ARIA online. What would you like to know?"],
    nav: (tab: string) => `Navigating to ${tab}...`,
    symbol: (s: string) => `Pulling up ${s} for you...`,
    market: "Markets are live. I'll pull you to the home screen.",
    unknown: ["I didn't catch that. Try saying a stock name or tab name.", "Can you repeat that? I'm here to help with navigation and stocks."],
    close: "ARIA signing off. Tap the mic anytime to call me back!",
};

// ── Main Component ──────────────────────────────────────────────────────────
const ARIAVoiceAssistant: React.FC<ARIAVoiceAssistantProps> = ({ onNavigate, onSelectSymbol }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [response, setResponse] = useState('');
    const [supported, setSupported] = useState(false);
    const [pulseAnim, setPulseAnim] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const recognitionRef = useRef<any>(null);

    // Check if Web Speech API is available
    useEffect(() => {
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        setSupported(!!SR);
    }, []);

    const speak = useCallback((text: string) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.rate = 1.05;
        utterance.pitch = 1.1;
        utterance.volume = 0.9;
        // Prefer a female voice if available
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v => v.name.includes('Google UK English Female') || v.name.includes('Samantha') || v.name.includes('Female'));
        if (preferred) utterance.voice = preferred;
        window.speechSynthesis.speak(utterance);
    }, []);

    const processCommand = useCallback((text: string) => {
        const lower = text.toLowerCase();

        // Navigate tab
        const navMatch = lower.match(/go to (\w+)/i);
        if (navMatch) {
            const tab = TAB_MAP[navMatch[1].toLowerCase()];
            if (tab && onNavigate) {
                const msg = ARIA_RESPONSES.nav(navMatch[1]);
                setResponse(msg); speak(msg);
                onNavigate(tab);
                return;
            }
        }

        // Named stock
        const stockMatch = lower.match(/(?:show|open|pull up|check|look up) (?:me |)?(\w+)/i);
        if (stockMatch) {
            const name = stockMatch[1].toLowerCase();
            const symbol = SYMBOL_MAP[name] || name.toUpperCase();
            if (symbol.length <= 6 && onSelectSymbol) {
                const msg = ARIA_RESPONSES.symbol(symbol);
                setResponse(msg); speak(msg);
                onSelectSymbol(symbol);
                return;
            }
        }

        // Raw ticker (user says letters like "AAPL")
        const tickerMatch = text.match(/\b([A-Z]{1,5})\b/);
        if (tickerMatch && onSelectSymbol) {
            const sym = tickerMatch[1];
            if (!['ME', 'MY', 'ON', 'GO', 'UP', 'AT', 'IN', 'THE', 'AND'].includes(sym)) {
                const msg = ARIA_RESPONSES.symbol(sym);
                setResponse(msg); speak(msg);
                onSelectSymbol(sym);
                return;
            }
        }

        // Market question
        if (/market|stock|price/i.test(lower)) {
            const msg = ARIA_RESPONSES.market;
            setResponse(msg); speak(msg);
            if (onNavigate) onNavigate('home');
            return;
        }

        // Close
        if (/close|stop|bye|dismiss/i.test(lower)) {
            const msg = ARIA_RESPONSES.close;
            setResponse(msg); speak(msg);
            setTimeout(() => setIsOpen(false), 2000);
            return;
        }

        // Unknown
        const msg = ARIA_RESPONSES.unknown[Math.floor(Math.random() * ARIA_RESPONSES.unknown.length)];
        setResponse(msg); speak(msg);
    }, [onNavigate, onSelectSymbol, speak]);

    const startListening = useCallback(() => {
        if (!supported) {
            toast.error('Voice recognition not supported in this browser. Try Chrome.');
            return;
        }
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SR();
        recognition.lang = 'en-US';
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => { setIsListening(true); setPulseAnim(true); };
        recognition.onend = () => { setIsListening(false); setPulseAnim(false); };
        recognition.onresult = (e: any) => {
            const t = Array.from(e.results).map((r: any) => r[0].transcript).join('');
            setTranscript(t);
            if (e.results[e.results.length - 1].isFinal) {
                processCommand(t);
            }
        };
        recognition.onerror = () => { setIsListening(false); setPulseAnim(false); };

        recognitionRef.current = recognition;
        recognition.start();
    }, [supported, processCommand]);

    const stopListening = () => {
        recognitionRef.current?.stop();
        setIsListening(false);
        setPulseAnim(false);
    };

    const handleOpen = () => {
        setIsOpen(true);
        setTranscript('');
        const greeting = ARIA_RESPONSES.greeting[Math.floor(Math.random() * ARIA_RESPONSES.greeting.length)];
        setResponse(greeting);
        speak(greeting);
    };

    if (!supported) return null;

    return (
        <>
            {/* Floating ARIA button */}
            <button
                onClick={isOpen ? () => setIsOpen(false) : handleOpen}
                className="aria-voice-assistant-trigger"
                style={{
                    position: 'fixed',
                    right: '20px',
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    background: isOpen
                        ? 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)'
                        : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isOpen ? '0 0 20px rgba(99, 102, 241, 0.4)' : '0 4px 15px rgba(0,0,0,0.3)',
                    zIndex: 5000,
                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    transform: pulseAnim ? 'scale(1.1)' : 'scale(1)',
                    animation: (pulseAnim || isSpeaking) ? 'aria-brain-pulse 2s infinite' : 'none',
                }}
                title="ARIA - Voice Assistant"
                aria-label="Open ARIA Voice Assistant"
            >
                {isSpeaking ? <Volume2 size={24} color="white" /> : <Brain size={24} color="white" />}
            </button>

            {/* ARIA Panel */}
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    bottom: '144px',
                    right: '20px',
                    width: '300px',
                    background: 'rgba(10, 10, 20, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                    borderRadius: '20px',
                    padding: '1.25rem',
                    zIndex: 4999,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(99,102,241,0.2)',
                    animation: 'slideUpFade 0.25s ease',
                }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981', animation: 'blink 1.5s infinite' }} />
                            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'white' }}>ARIA</span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Market Copilot</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', display: 'flex' }}>
                            <X size={16} />
                        </button>
                    </div>

                    {/* Response area */}
                    <div style={{
                        background: 'rgba(99, 102, 241, 0.06)',
                        borderRadius: '12px',
                        padding: '0.85rem',
                        minHeight: '70px',
                        marginBottom: '1rem',
                        border: '1px solid rgba(99,102,241,0.15)',
                        fontSize: '0.85rem',
                        color: 'var(--color-text-primary)',
                        lineHeight: 1.5,
                    }}>
                        {response || 'Tap the mic and say a stock symbol or tab name...'}
                    </div>

                    {/* Transcript */}
                    {transcript && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)', marginBottom: '0.75rem', fontStyle: 'italic', paddingLeft: '4px' }}>
                            🎤 "{transcript}"
                        </div>
                    )}

                    {/* Mic button */}
                    <button
                        onClick={isListening ? stopListening : startListening}
                        style={{
                            width: '100%',
                            padding: '0.7rem',
                            borderRadius: '12px',
                            border: 'none',
                            background: isListening
                                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                                : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease',
                            boxShadow: isListening ? '0 0 20px rgba(239,68,68,0.5)' : '0 0 20px rgba(99,102,241,0.4)',
                        }}
                    >
                        {isListening ? <><MicOff size={16} /> Stop Listening</> : <><Mic size={16} /> Tap to Speak</>}
                    </button>

                    {/* Quick commands */}
                    <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {['Go to AI', 'Show TSLA', 'Watchlist'].map(cmd => (
                            <button key={cmd} onClick={() => { setTranscript(cmd); processCommand(cmd); }}
                                style={{ fontSize: '0.65rem', padding: '3px 8px', borderRadius: '6px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                                {cmd}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes aria-brain-pulse {
                    0%, 100% { transform: scale(1); box-shadow: 0 4px 20px rgba(99,102,241,0.5); }
                    50% { transform: scale(1.1); box-shadow: 0 4px 40px rgba(99,102,241,0.8), 0 0 30px rgba(99,102,241,0.4); }
                }
                @keyframes slideUpFade {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes blink {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.3; transform: scale(0.8); }
                }
            `}</style>
        </>
    );
};

export default ARIAVoiceAssistant;
