import React, { useState } from 'react';
import { X, Maximize2, Move, Volume2, VolumeX } from 'lucide-react';
import { usePiPStore } from '../services/usePiPStore';
import { useNavigate } from 'react-router-dom';

const FloatingStream: React.FC = () => {
    const { activeStream, isPiPActive, setPiPActive, isMuted, setMuted } = usePiPStore();
    const navigate = useNavigate();
    const [position, setPosition] = useState({ x: 20, y: 20 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    if (!isPiPActive || !activeStream) return null;

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleRestore = () => {
        setPiPActive(false);
        navigate('/pulse');
    };

    return (
        <div 
            style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                width: '320px',
                aspectRatio: '16/9',
                zIndex: 9999,
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
                background: '#000',
                border: '1px solid var(--glass-border-bright)',
                animation: 'slideUp 0.3s ease-out'
            }}
        >
            {/* Control Overlay */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                padding: '8px',
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
                zIndex: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                opacity: 0,
                transition: 'opacity 0.2s',
                pointerEvents: 'auto'
            }} className="pip-controls">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img 
                        src={activeStream.logo} 
                        alt="" 
                        style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'white', padding: '1px' }} 
                    />
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'white', textTransform: 'uppercase' }}>
                        {activeStream.name}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <button 
                        onClick={() => setMuted(!isMuted)}
                        style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '4px', color: 'white', padding: '4px', cursor: 'pointer' }}
                    >
                        {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    </button>
                    <button 
                        onClick={handleRestore}
                        style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '4px', color: 'white', padding: '4px', cursor: 'pointer' }}
                        title="Restore to Main View"
                    >
                        <Maximize2 size={14} />
                    </button>
                    <button 
                        onClick={() => setPiPActive(false)}
                        style={{ background: 'rgba(239, 68, 68, 0.4)', border: 'none', borderRadius: '4px', color: 'white', padding: '4px', cursor: 'pointer' }}
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Video Iframe */}
            <iframe
                src={activeStream.videoId 
                    ? `https://www.youtube.com/embed/${activeStream.videoId}?autoplay=1&mute=${isMuted ? 1 : 0}&rel=0&modestbranding=1&playsinline=1`
                    : `https://www.youtube.com/embed/live_stream?channel=${activeStream.youtubeId}&autoplay=1&mute=${isMuted ? 1 : 0}&rel=0&modestbranding=1&playsinline=1`
                }
                style={{ width: '100%', height: '100%', border: 'none' }}
                allow="autoplay; encrypted-media; picture-in-picture"
                title={activeStream.name}
            />

            <style>{`
                div:hover .pip-controls {
                    opacity: 1 !important;
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
