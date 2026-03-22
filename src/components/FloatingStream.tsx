import React, { useState, useEffect, useRef } from 'react';
import { X, Maximize2, Move, Volume2, VolumeX, GripHorizontal, ChevronLeft, ChevronRight, Activity, Search, ExternalLink } from 'lucide-react';
import { usePiPStore } from '../services/usePiPStore';
import { useNavigate } from 'react-router-dom';
import { CHANNELS } from './LiveIntelligenceStreams';

const FloatingStream: React.FC = () => {
    const { activeStream, setActiveStream, isPiPActive, setPiPActive, isMuted, setMuted } = usePiPStore();
    const navigate = useNavigate();
    
    // Default position at bottom-right
    const [position, setPosition] = useState({ x: window.innerWidth - 380, y: window.innerHeight - 360 });
    const [size, setSize] = useState({ width: 360, height: 202 });
    const [dragMode, setDragMode] = useState<'move' | 'resize' | null>(null);
    const [initialDrag, setInitialDrag] = useState({ x: 0, y: 0, w: 0, h: 0, px: 0, py: 0 });

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
        const walk = (x - scrollStartX) * 2;
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
                const newWidth = Math.max(200, Math.min(800, initialDrag.w + dw));
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

    return (
        <div 
            ref={containerRef}
            style={{
                position: 'fixed',
                left: `${Math.max(0, Math.min(window.innerWidth - size.width, position.x))}px`,
                top: `${Math.max(0, Math.min(window.innerHeight - size.height - 120, position.y))}px`,
                width: `${size.width}px`,
                zIndex: 9999,
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 2px rgba(255,255,255,0.1)',
                background: '#050508',
                border: '1px solid var(--color-accent-light)',
                animation: 'pipFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                flexDirection: 'column',
                userSelect: 'none',
                backdropFilter: 'blur(20px)'
            }}
        >
            {/* Header / Drag Bar */}
            <div 
                onMouseDown={(e) => handleMouseDown(e, 'move')}
                style={{
                    padding: '10px 14px',
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: dragMode === 'move' ? 'grabbing' : 'grab',
                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ 
                        width: '24px', height: '24px', borderRadius: '6px', 
                        background: 'white', display: 'flex', alignItems: 'center', 
                        justifyContent: 'center', padding: '3px', boxShadow: '0 0 10px rgba(255,255,255,0.2)' 
                    }}>
                        <img src={activeStream.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1 }}>
                            {activeStream.shortName}
                        </span>
                        <span style={{ fontSize: '0.55rem', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>LIVE PRO PIP</span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                        onClick={() => setMuted(!isMuted)}
                        className="pip-action-btn"
                        title={isMuted ? 'Unmute' : 'Mute'}
                    >
                        {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    </button>
                    <button 
                        onClick={handleRestore}
                        className="pip-action-btn"
                        title="Expand back to Pulse"
                    >
                        <Maximize2 size={14} />
                    </button>
                    <button 
                        onClick={() => setPiPActive(false)}
                        className="pip-action-btn close-btn"
                        title="Close Stream"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Video Player */}
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
                
                {/* Visual Resize Indicator (Corner) */}
                <div 
                    onMouseDown={(e) => handleMouseDown(e, 'resize')}
                    style={{
                        position: 'absolute',
                        right: '4px',
                        bottom: '4px',
                        width: '24px',
                        height: '24px',
                        cursor: 'nwse-resize',
                        zIndex: 10,
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'flex-end',
                        padding: '2px',
                        color: 'rgba(255,255,255,0.3)'
                    }}
                >
                    <GripHorizontal size={14} style={{ transform: 'rotate(-45deg)' }} />
                </div>
            </div>

            {/* Channels Box (Rectangle Strip) */}
            <div style={{ padding: '4px', background: 'rgba(0,0,0,0.8)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div 
                    ref={stripRef}
                    onMouseDown={handleStripMouseDown}
                    onMouseMove={handleStripMouseMove}
                    onMouseLeave={handleStripMouseUp}
                    onMouseUp={handleStripMouseUp}
                    className="pip-channel-strip no-scrollbar"
                >
                    {CHANNELS.map(ch => (
                        <button
                            key={ch.id}
                            onClick={() => {
                                if (!isScrolling) setActiveStream(ch);
                            }}
                            className={`pip-channel-tile ${activeStream.id === ch.id ? 'active' : ''}`}
                            style={{ '--accent-color': ch.color } as any}
                        >
                            <img src={ch.logo} alt="" className="tile-logo" />
                            <span className="tile-name">{ch.shortName}</span>
                            {activeStream.id === ch.id && <div className="active-dot" style={{ background: ch.color }} />}
                        </button>
                    ))}
                </div>
            </div>

            <style>{`
                .pip-channel-strip {
                    display: flex;
                    gap: 8px;
                    padding: 8px;
                    overflow-x: auto;
                    cursor: grab;
                    user-select: none;
                }
                .pip-channel-strip:active { cursor: grabbing; }

                .pip-channel-tile {
                    flex: 0 0 70px;
                    height: 70px;
                    background: rgba(255,255,255,0.03);
                    border: 1.5px solid rgba(255,255,255,0.05);
                    border-radius: 12px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    cursor: pointer;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                }
                .pip-channel-tile:hover {
                    background: rgba(255,255,255,0.08);
                    border-color: rgba(255,255,255,0.2);
                    transform: translateY(-2px);
                }
                .pip-channel-tile.active {
                    background: color-mix(in srgb, var(--accent-color) 15%, transparent);
                    border-color: var(--accent-color);
                    box-shadow: 0 0 15px color-mix(in srgb, var(--accent-color) 30%, transparent);
                }
                .tile-logo {
                    width: 24px;
                    height: 24px;
                    border-radius: 6px;
                    background: white;
                    padding: 2px;
                    object-fit: contain;
                }
                .tile-name {
                    font-size: 0.55rem;
                    font-weight: 800;
                    color: rgba(255,255,255,0.7);
                    text-transform: uppercase;
                }
                .pip-channel-tile.active .tile-name { color: white; }

                .active-dot {
                    position: absolute;
                    top: 6px;
                    right: 6px;
                    width: 5px;
                    height: 5px;
                    border-radius: 50%;
                    box-shadow: 0 0 8px currentColor;
                }

                .pip-action-btn {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: rgba(255,255,255,0.6);
                    padding: 6px;
                    border-radius: 8px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    transition: all 0.2s;
                }
                .pip-action-btn:hover {
                    background: rgba(255,255,255,0.15);
                    color: white;
                }
                .pip-action-btn.close-btn:hover {
                    background: rgba(239, 68, 68, 0.2);
                    color: #ff4444;
                    border-color: rgba(239, 68, 68, 0.3);
                }

                .no-scrollbar::-webkit-scrollbar { display: none; }
                
                @keyframes pipFadeIn {
                    from { opacity: 0; transform: translateY(30px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
};

export default FloatingStream;
