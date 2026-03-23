import React, { useState, useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { X, Maximize2, Volume2, VolumeX, GripHorizontal, ChevronRight, Activity } from 'lucide-react';
import { usePiPStore } from '../services/usePiPStore';
import { useNavigate } from 'react-router-dom';
import { CHANNELS } from './LiveIntelligenceStreams';

interface PiPStream {
    id: string;
    name: string;
    shortName: string;
    category: string;
    region: string;
    logo: string;
    videoId?: string;
    youtubeId?: string;
    color: string;
}

const FloatingStream: React.FC = () => {
    const { activeStream, setActiveStream, isPiPActive, setPiPActive, isMuted, setMuted } = usePiPStore();
    const navigate = useNavigate();
    
    // Default position at bottom-right with more padding
    const [position, setPosition] = useState({ x: window.innerWidth - 380, y: window.innerHeight - 440 });
    const [size, setSize] = useState({ width: 360, height: 202 });
    const [dragMode, setDragMode] = useState<'move' | 'resize' | null>(null);
    const [initialDrag, setInitialDrag] = useState({ x: 0, y: 0, w: 0, h: 0, px: 0, py: 0 });

    const stripRef = useRef<HTMLDivElement>(null);
    const [isScrolling, setIsScrolling] = useState(false);
    const [scrollStartX, setScrollStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    if (!isPiPActive || !activeStream) return null;

    const handleMouseDown = (e: React.MouseEvent, mode: 'move' | 'resize') => {
        e.preventDefault();
        setDragMode(mode);
        setInitialDrag({ 
            x: e.clientX, 
            y: e.clientY, 
            w: size.width, 
            h: size.height,
            px: position.x,
            py: position.y
        });
    };

    const handleStripMouseDown = (e: React.MouseEvent) => {
        setIsScrolling(true);
        setScrollStartX(e.pageX - (stripRef.current?.offsetLeft || 0));
        setScrollLeft(stripRef.current?.scrollLeft || 0);
    };

    const handleStripMouseMove = (e: React.MouseEvent) => {
        if (!isScrolling) return;
        e.preventDefault();
        const x = e.pageX - (stripRef.current?.offsetLeft || 0);
        const walk = (x - scrollStartX) * 1.5;
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
                setPosition({ 
                    x: initialDrag.px + dx, 
                    y: initialDrag.py + dy 
                });
            } else if (dragMode === 'resize') {
                const dw = e.clientX - initialDrag.x;
                const newWidth = Math.max(240, Math.min(800, initialDrag.w + dw));
                const newHeight = newWidth * (9/16);
                setSize({ width: newWidth, height: newHeight });
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
    }, [dragMode, isScrolling, initialDrag]);

    const handleRestore = () => {
        setPiPActive(false);
        navigate('/pulse');
    };

    // Safe clamped position
    const clampedX = Math.max(0, Math.min(window.innerWidth - size.width, position.x));
    const clampedY = Math.max(0, Math.min(window.innerHeight - size.height - 140, position.y));

    return (
        <div 
            style={{
                position: 'fixed',
                left: `${clampedX}px`,
                top: `${clampedY}px`,
                width: `${size.width}px`,
                zIndex: 9999,
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 40px 100px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.1), 0 0 40px rgba(99,102,241,0.2)',
                background: '#04040a',
                border: '1px solid rgba(255,255,255,0.08)',
                animation: 'pipFadeInCustom 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                flexDirection: 'column',
                userSelect: 'none',
                backdropFilter: 'blur(30px)'
            }}
        >
            {/* Header / Move Area */}
            <div 
                onMouseDown={(e) => handleMouseDown(e, 'move')}
                style={{
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.02)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: dragMode === 'move' ? 'grabbing' : 'grab',
                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                        width: '24px', height: '24px', borderRadius: '6px', 
                        background: 'white', display: 'flex', alignItems: 'center', 
                        justifyContent: 'center', padding: '4px'
                    }}>
                        <img src={activeStream.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1 }}>
                            {activeStream.shortName}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <div className="pip-live-pulse" />
                            <span style={{ fontSize: '0.5rem', color: '#10b981', fontWeight: 800 }}>LIVE PRO</span>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setMuted(!isMuted)} className="p-action">
                        {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    </button>
                    <button onClick={handleRestore} className="p-action">
                        <Maximize2 size={14} />
                    </button>
                    <button onClick={() => setPiPActive(false)} className="p-action p-close">
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Content Area */}
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
                
                {/* Visual Resize Handle */}
                <div 
                    onMouseDown={(e) => handleMouseDown(e, 'resize')}
                    style={{
                        position: 'absolute',
                        right: '6px',
                        bottom: '6px',
                        width: '28px',
                        height: '28px',
                        cursor: 'nwse-resize',
                        zIndex: 10,
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'flex-end',
                        color: 'rgba(255,255,255,0.4)',
                        background: 'linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.1) 50%)',
                        borderRadius: '0 0 12px 0'
                    }}
                >
                    <GripHorizontal size={16} style={{ transform: 'rotate(-45deg)' }} />
                </div>
            </div>

            {/* Channels Rectangle Box */}
            <div style={{ 
                padding: '12px', 
                background: 'rgba(0,0,0,0.92)', 
                borderTop: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div 
                    ref={stripRef}
                    onMouseDown={handleStripMouseDown}
                    onMouseMove={handleStripMouseMove}
                    onMouseLeave={handleStripMouseUp}
                    onMouseUp={handleStripMouseUp}
                    style={{
                        display: 'flex',
                        gap: '10px',
                        overflowX: 'auto',
                        cursor: isScrolling ? 'grabbing' : 'grab',
                        userSelect: 'none',
                        paddingBottom: '2px'
                    }}
                    className="no-scrollbar"
                >
                    {CHANNELS.map(ch => (
                        <button
                            key={ch.id}
                            onClick={() => {
                                if (!isScrolling) setActiveStream(ch);
                            }}
                            className={`tile ${activeStream.id === ch.id ? 'active' : ''}`}
                            style={{ '--c': ch.color } as CSSProperties}
                        >
                            <img src={ch.logo} alt="" className="l" />
                            <span className="n">{ch.shortName}</span>
                            {activeStream.id === ch.id && <div className="d" style={{ background: ch.color }} />}
                        </button>
                    ))}
                </div>
            </div>

            <style>{`
                .p-action {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: rgba(255,255,255,0.7);
                    width: 28px;
                    height: 28px;
                    border-radius: 8px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                .p-action:hover {
                    background: rgba(255,255,255,0.15);
                    color: white;
                    transform: translateY(-1px);
                }
                .p-close:hover {
                    background: rgba(239, 68, 68, 0.25);
                    color: #ff5555;
                    border-color: rgba(239, 68, 68, 0.3);
                }

                .tile {
                    flex: 0 0 76px;
                    height: 84px; /* More rectangular box */
                    background: rgba(255,255,255,0.02);
                    border: 1.5px solid rgba(255,255,255,0.05);
                    border-radius: 14px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    position: relative;
                }
                .tile:hover {
                    background: rgba(255,255,255,0.06);
                    border-color: rgba(255,255,255,0.2);
                    transform: translateY(-3px);
                }
                .tile.active {
                    background: color-mix(in srgb, var(--c) 15%, #12121e);
                    border-color: var(--c);
                    box-shadow: 0 0 20px color-mix(in srgb, var(--c) 25%, transparent);
                }
                .l {
                    width: 28px;
                    height: 28px;
                    border-radius: 6px;
                    background: white;
                    padding: 3px;
                    object-fit: contain;
                }
                .n {
                    font-size: 0.6rem;
                    font-weight: 900;
                    color: rgba(255,255,255,0.6);
                    text-transform: uppercase;
                    letter-spacing: 0.02em;
                }
                .tile.active .n { color: white; }

                .d {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    box-shadow: 0 0 10px currentColor;
                }

                .pip-live-pulse {
                    width: 6px;
                    height: 6px;
                    background: #10b981;
                    border-radius: 50%;
                    animation: pulseLive 1.5s infinite;
                }

                @keyframes pulseLive {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.5); opacity: 0.5; }
                    100% { transform: scale(1); opacity: 1; }
                }

                .no-scrollbar::-webkit-scrollbar { display: none; }
                
                @keyframes pipFadeInCustom {
                    from { opacity: 0; transform: translateY(40px) scale(0.92); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
};

export default FloatingStream;
