import React, { useState, useEffect, useRef } from 'react';
import { X, Maximize2, Move, Volume2, VolumeX, GripHorizontal, ChevronLeft, ChevronRight, Activity, Search } from 'lucide-react';
import { usePiPStore } from '../services/usePiPStore';
import { useNavigate } from 'react-router-dom';
import { CHANNELS } from './LiveIntelligenceStreams';

const FloatingStream: React.FC = () => {
    const { activeStream, setActiveStream, isPiPActive, setPiPActive, isMuted, setMuted } = usePiPStore();
    const navigate = useNavigate();
    
    const [position, setPosition] = useState({ x: window.innerWidth - 340, y: window.innerHeight - 300 });
    const [size, setSize] = useState({ width: 320, height: 180 });
    const [dragMode, setDragMode] = useState<'move' | 'resize' | null>(null);
    const [initialDrag, setInitialDrag] = useState({ x: 0, y: 0, w: 0, h: 0 });

    // For mouse-drag scrolling
    const stripRef = useRef<HTMLDivElement>(null);
    const [isScrolling, setIsScrolling] = useState(false);
    const [scrollStartX, setScrollStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const containerRef = useRef<HTMLDivElement>(null);

    if (!isPiPActive || !activeStream) return null;

    const handleMouseDown = (e: React.MouseEvent, mode: 'move' | 'resize') => {
        e.preventDefault();
        setDragMode(mode);
        setInitialDrag({ 
            x: e.clientX, 
            y: e.clientY, 
            w: size.width, 
            h: size.height 
        });
    };

    // Scroll drag handlers
    const handleStripMouseDown = (e: React.MouseEvent) => {
        setIsScrolling(true);
        setScrollStartX(e.pageX - (stripRef.current?.offsetLeft || 0));
        setScrollLeft(stripRef.current?.scrollLeft || 0);
    };

    const handleStripMouseMove = (e: React.MouseEvent) => {
        if (!isScrolling) return;
        e.preventDefault();
        const x = e.pageX - (stripRef.current?.offsetLeft || 0);
        const walk = (x - scrollStartX) * 2; // Scroll speed
        if (stripRef.current) {
            stripRef.current.scrollLeft = scrollLeft - walk;
        }
    };

    const handleStripMouseUp = () => setIsScrolling(false);

    useEffect(() => {
        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (!dragMode) return;

            if (dragMode === 'move') {
                const dx = e.clientX - initialDrag.x;
                const dy = e.clientY - initialDrag.y;
                setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
                setInitialDrag({ x: e.clientX, y: e.clientY, w: size.width, h: size.height });
            } else if (dragMode === 'resize') {
                const dw = e.clientX - initialDrag.x;
                const dh = dw * (9/16); // Keep aspect ratio
                setSize(prev => ({
                    width: Math.max(200, Math.min(600, prev.width + dw)),
                    height: Math.max(112, Math.min(337, prev.height + dh))
                }));
                setInitialDrag({ x: e.clientX, y: e.clientY, w: size.width, h: size.height });
            }
        };

        const handleGlobalMouseUp = () => {
            setDragMode(null);
            setIsScrolling(false);
        };

        if (dragMode || isScrolling) {
            window.addEventListener('mousemove', handleGlobalMouseMove);
            window.addEventListener('mouseup', handleGlobalMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleGlobalMouseMove);
            window.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [dragMode, isScrolling, initialDrag, size, scrollLeft, scrollStartX]);

    const handleRestore = () => {
        setPiPActive(false);
        navigate('/pulse');
    };

    return (
        <div 
            ref={containerRef}
            style={{
                position: 'fixed',
                left: `${Math.max(0, Math.min(window.innerWidth - size.width, position.x))}px`,
                top: `${Math.max(0, Math.min(window.innerHeight - size.height - 80, position.y))}px`,
                width: `${size.width}px`,
                zIndex: 9999,
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)',
                background: '#0a0a0f',
                border: '1px solid var(--glass-border-bright)',
                animation: 'slideUp 0.3s cubic-bezier(0.19, 1, 0.22, 1)',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {/* Control Strip / Drag Handle */}
            <div 
                onMouseDown={(e) => handleMouseDown(e, 'move')}
                style={{
                    padding: '8px 12px',
                    background: 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: dragMode === 'move' ? 'grabbing' : 'grab',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    userSelect: 'none'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px' }}>
                        <img src={activeStream.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {activeStream.shortName}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <button 
                        onClick={() => setMuted(!isMuted)}
                        className="pip-mini-btn"
                        title={isMuted ? 'Unmute' : 'Mute'}
                    >
                        {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                    </button>
                    <button 
                        onClick={handleRestore}
                        className="pip-mini-btn"
                        title="Expand back to Pulse"
                    >
                        <Maximize2 size={13} />
                    </button>
                    <button 
                        onClick={() => setPiPActive(false)}
                        className="pip-mini-btn"
                        style={{ color: '#ff4444' }}
                        title="Close Stream"
                    >
                        <X size={13} />
                    </button>
                </div>
            </div>

            {/* Video Container */}
            <div style={{ width: '100%', height: `${size.height}px`, position: 'relative', background: '#000' }}>
                <iframe
                    src={activeStream.videoId 
                        ? `https://www.youtube.com/embed/${activeStream.videoId}?autoplay=1&mute=${isMuted ? 1 : 0}&rel=0&modestbranding=1&playsinline=1`
                        : `https://www.youtube.com/embed/live_stream?channel=${activeStream.youtubeId}&autoplay=1&mute=${isMuted ? 1 : 0}&rel=0&modestbranding=1&playsinline=1`
                    }
                    style={{ width: '100%', height: '100%', border: 'none', pointerEvents: dragMode ? 'none' : 'auto' }}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    title={activeStream.name}
                />
                
                {/* Resize Handle */}
                <div 
                    onMouseDown={(e) => handleMouseDown(e, 'resize')}
                    style={{
                        position: 'absolute',
                        right: 0,
                        bottom: 0,
                        width: '20px',
                        height: '20px',
                        cursor: 'nwse-resize',
                        zIndex: 10,
                        background: 'linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.15) 50%)',
                        borderRadius: '0 0 16px 0'
                    }}
                />
            </div>

            {/* Channel Selection Strip (Box Rectangle) */}
            <div 
                ref={stripRef}
                onMouseDown={handleStripMouseDown}
                onMouseMove={handleStripMouseMove}
                onMouseLeave={handleStripMouseUp}
                onMouseUp={handleStripMouseUp}
                style={{
                    padding: '8px',
                    background: 'rgba(5, 5, 10, 0.95)',
                    display: 'flex',
                    gap: '6px',
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    whiteSpace: 'nowrap',
                    cursor: isScrolling ? 'grabbing' : 'grab',
                    userSelect: 'none'
                }} className="no-scrollbar"
            >
                {CHANNELS.map(ch => (
                    <button
                        key={ch.id}
                        onClick={() => {
                            if (!isScrolling) setActiveStream(ch);
                        }}
                        style={{
                            flex: '0 0 auto',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: `1px solid ${activeStream.id === ch.id ? ch.color : 'rgba(255,255,255,0.05)'}`,
                            background: activeStream.id === ch.id ? `${ch.color}25` : 'rgba(255,255,255,0.02)',
                            color: activeStream.id === ch.id ? ch.color : 'rgba(255,255,255,0.6)',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s',
                            pointerEvents: isScrolling ? 'none' : 'auto'
                        }}
                    >
                        <img src={ch.logo} alt="" style={{ width: '14px', height: '14px', borderRadius: '3px', background: 'white', padding: '1px' }} />
                        {ch.shortName}
                    </button>
                ))}
            </div>

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .pip-mini-btn {
                    background: transparent;
                    border: none;
                    color: rgba(255,255,255,0.6);
                    padding: 4px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    border-radius: 4px;
                    transition: all 0.2s;
                }
                .pip-mini-btn:hover {
                    background: rgba(255,255,255,0.1);
                    color: white;
                }
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default FloatingStream;
