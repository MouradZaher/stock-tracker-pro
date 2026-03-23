import React, { useState, useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { X, Maximize2, Volume2, VolumeX, GripHorizontal } from 'lucide-react';
import { usePiPStore } from '../services/usePiPStore';
import { useNavigate } from 'react-router-dom';
import { CHANNELS } from './LiveIntelligenceStreams';

const FloatingStream: React.FC = () => {
    const { activeStream, setActiveStream, isPiPActive, setPiPActive, isMuted, setMuted } = usePiPStore();
    const navigate = useNavigate();

    const [position, setPosition] = useState({ x: window.innerWidth - 420, y: window.innerHeight - 460 });
    const [size, setSize] = useState({ width: 380, height: 213 });
    const [dragMode, setDragMode] = useState<'move' | 'resize' | null>(null);
    const [initialDrag, setInitialDrag] = useState({ x: 0, y: 0, w: 0, h: 0, px: 0, py: 0 });

    const stripRef = useRef<HTMLDivElement>(null);
    const isDragScrolling = useRef(false);
    const scrollStartX = useRef(0);
    const scrollLeft = useRef(0);

    // ALL hooks must be called before any conditional return
    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (dragMode === 'move') {
                const dx = e.clientX - initialDrag.x;
                const dy = e.clientY - initialDrag.y;
                setPosition({ x: initialDrag.px + dx, y: initialDrag.py + dy });
            } else if (dragMode === 'resize') {
                const dw = e.clientX - initialDrag.x;
                const newWidth = Math.max(240, Math.min(900, initialDrag.w + dw));
                setSize({ width: newWidth, height: Math.round(newWidth * 9 / 16) });
            }
        };
        const onMouseUp = () => {
            setDragMode(null);
            isDragScrolling.current = false;
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [dragMode, initialDrag]);

    // Conditional render AFTER all hooks
    if (!isPiPActive || !activeStream) return null;

    const startDrag = (e: React.MouseEvent, mode: 'move' | 'resize') => {
        e.preventDefault();
        setDragMode(mode);
        setInitialDrag({ x: e.clientX, y: e.clientY, w: size.width, h: size.height, px: position.x, py: position.y });
    };

    const onStripMouseDown = (e: React.MouseEvent) => {
        isDragScrolling.current = true;
        scrollStartX.current = e.pageX;
        scrollLeft.current = stripRef.current?.scrollLeft ?? 0;
    };
    const onStripMouseMove = (e: React.MouseEvent) => {
        if (!isDragScrolling.current || !stripRef.current) return;
        e.preventDefault();
        const walk = (e.pageX - scrollStartX.current) * 1.5;
        stripRef.current.scrollLeft = scrollLeft.current - walk;
    };
    const onStripMouseUp = () => { isDragScrolling.current = false; };

    const clampedX = Math.max(0, Math.min(window.innerWidth - size.width, position.x));
    const clampedY = Math.max(0, Math.min(window.innerHeight - size.height - 150, position.y));

    return (
        <div
            style={{
                position: 'fixed',
                left: clampedX,
                top: clampedY,
                width: size.width,
                zIndex: 9999,
                borderRadius: 20,
                overflow: 'hidden',
                boxShadow: '0 32px 80px rgba(0,0,0,0.85), 0 0 0 1.5px rgba(255,255,255,0.1)',
                background: '#04040a',
                display: 'flex',
                flexDirection: 'column',
                userSelect: 'none',
                animation: 'pipIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
        >
            {/* Drag Header */}
            <div
                onMouseDown={(e) => startDrag(e, 'move')}
                style={{
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.03)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: dragMode === 'move' ? 'grabbing' : 'grab',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 22, height: 22, background: 'white', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 3 }}>
                        <img src={activeStream.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'white', textTransform: 'uppercase' }}>{activeStream.shortName}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <div className="pip-dot" />
                            <span style={{ fontSize: '0.5rem', color: '#10b981', fontWeight: 800 }}>LIVE</span>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setMuted(!isMuted)} className="pip-btn">{isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}</button>
                    <button onClick={() => { setPiPActive(false); navigate('/pulse'); }} className="pip-btn"><Maximize2 size={13} /></button>
                    <button onClick={() => setPiPActive(false)} className="pip-btn pip-close"><X size={13} /></button>
                </div>
            </div>

            {/* Video */}
            <div style={{ width: '100%', height: size.height, position: 'relative', background: '#000' }}>
                <iframe
                    src={activeStream.videoId
                        ? `https://www.youtube.com/embed/${activeStream.videoId}?autoplay=1&mute=${isMuted ? 1 : 0}&rel=0&modestbranding=1&playsinline=1`
                        : `https://www.youtube.com/embed/live_stream?channel=${activeStream.youtubeId}&autoplay=1&mute=${isMuted ? 1 : 0}&rel=0&modestbranding=1&playsinline=1`
                    }
                    style={{ width: '100%', height: '100%', border: 'none', pointerEvents: dragMode ? 'none' : 'auto' }}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    title={activeStream.name}
                />

                {/* Resize handle — bottom-right corner */}
                <div
                    onMouseDown={(e) => { e.stopPropagation(); startDrag(e, 'resize'); }}
                    title="Drag to resize"
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: 32,
                        height: 32,
                        cursor: 'nwse-resize',
                        zIndex: 20,
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'flex-end',
                        padding: 5,
                        color: 'rgba(255,255,255,0.5)',
                        background: 'linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.12) 50%)',
                        borderRadius: '0 0 12px 0',
                    }}
                >
                    <GripHorizontal size={14} style={{ transform: 'rotate(-45deg)' }} />
                </div>
            </div>

            {/* Channel Rectangle Box */}
            <div style={{ padding: '10px 12px', background: 'rgba(2,2,8,0.96)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <div
                    ref={stripRef}
                    onMouseDown={onStripMouseDown}
                    onMouseMove={onStripMouseMove}
                    onMouseLeave={onStripMouseUp}
                    onMouseUp={onStripMouseUp}
                    style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}
                    className="pip-strip"
                >
                    {CHANNELS.map(ch => (
                        <button
                            key={ch.id}
                            onClick={() => { if (!isDragScrolling.current) setActiveStream(ch); }}
                            className={`pip-tile ${activeStream.id === ch.id ? 'pip-active' : ''}`}
                            style={{ '--c': ch.color } as CSSProperties}
                        >
                            <img src={ch.logo} alt="" className="pip-logo" />
                            <span className="pip-name">{ch.shortName}</span>
                            {activeStream.id === ch.id && <div className="pip-ind" style={{ background: ch.color }} />}
                        </button>
                    ))}
                </div>
            </div>

            <style>{`
                .pip-btn {
                    background: rgba(255,255,255,0.06);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: rgba(255,255,255,0.7);
                    width: 26px; height: 26px;
                    border-radius: 7px;
                    cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    transition: all 0.2s;
                }
                .pip-btn:hover { background: rgba(255,255,255,0.15); color: #fff; }
                .pip-close:hover { background: rgba(239,68,68,0.2); color: #ff5555; border-color: rgba(239,68,68,0.3); }

                .pip-strip { cursor: grab; user-select: none; }
                .pip-strip:active { cursor: grabbing; }
                .pip-strip::-webkit-scrollbar { display: none; }

                .pip-tile {
                    flex: 0 0 72px;
                    height: 80px;
                    background: rgba(255,255,255,0.02);
                    border: 1.5px solid rgba(255,255,255,0.05);
                    border-radius: 12px;
                    display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                    gap: 7px;
                    cursor: pointer;
                    transition: all 0.25s cubic-bezier(0.16,1,0.3,1);
                    position: relative;
                }
                .pip-tile:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.18); transform: translateY(-2px); }
                .pip-active {
                    background: color-mix(in srgb, var(--c) 14%, #0d0d18);
                    border-color: var(--c);
                    box-shadow: 0 0 18px color-mix(in srgb, var(--c) 22%, transparent);
                }
                .pip-logo { width: 26px; height: 26px; border-radius: 5px; background: white; padding: 2px; object-fit: contain; }
                .pip-name { font-size: 0.58rem; font-weight: 900; color: rgba(255,255,255,0.55); text-transform: uppercase; letter-spacing: 0.02em; }
                .pip-active .pip-name { color: white; }
                .pip-ind { position: absolute; top: 7px; right: 7px; width: 5px; height: 5px; border-radius: 50%; box-shadow: 0 0 8px currentColor; }

                .pip-dot { width: 5px; height: 5px; background: #10b981; border-radius: 50%; animation: pipPulse 1.5s infinite; }

                @keyframes pipPulse { 0%,100% { transform: scale(1); opacity:1; } 50% { transform: scale(1.6); opacity:0.4; } }
                @keyframes pipIn { from { opacity:0; transform: translateY(30px) scale(0.93); } to { opacity:1; transform: translateY(0) scale(1); } }
            `}</style>
        </div>
    );
};

export default FloatingStream;
