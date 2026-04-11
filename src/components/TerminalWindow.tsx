import React, { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { X, Minus, Square, Minimize2, ZoomIn, ZoomOut, SearchX } from 'lucide-react';
import { useWindowStore, type WindowId } from '../hooks/useWindowStore';

interface TerminalWindowProps {
    id: WindowId;
    title: string;
    children: ReactNode;
    minW?: number;
    minH?: number;
}

const TerminalWindow: React.FC<TerminalWindowProps> = ({ 
    id, title, children, minW = 400, minH = 300 
}) => {
    const { 
        windows, activeWindow, bringToFront, closeWindow, 
        toggleMinimize, toggleMaximize, updatePosition, updateSize, updateScale,
        snapToLayout, setDraggingId 
    } = useWindowStore();
    
    const windowState = windows[id];
    const isFocused = activeWindow === id;
    const isMaximized = windowState?.isMaximized;
    const currentScale = windowState?.scale || 1.0;
    
    const windowRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState<false | 'both' | 'h' | 'v'>(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging && !isMaximized && windowState) {
                const nx = e.clientX - dragOffset.x;
                const ny = e.clientY - dragOffset.y;
                updatePosition(id, Math.max(0, nx), Math.max(0, ny));
            }
            if (isResizing && !isMaximized && windowState) {
                const nw = isResizing === 'v' ? windowState.w : e.clientX - windowState.x;
                const nh = isResizing === 'h' ? windowState.h : e.clientY - windowState.y;
                updateSize(id, Math.max(minW, nw), Math.max(minH, nh));
            }
        };

        const handleMouseUp = (e: MouseEvent) => {
            if (isDragging && windowState) {
                // Snap detection logic
                const PADDING = 100; // Snap threshold
                const rightBoundary = window.innerWidth - 350 - 64 - 100;
                
                if (e.clientX > rightBoundary) {
                    snapToLayout(id, 'SIDE');
                } else if (e.clientY < 150) {
                    if (e.clientX < (window.innerWidth / 2)) snapToLayout(id, 'TL');
                    else snapToLayout(id, 'TR');
                } else if (e.clientY > (window.innerHeight - 200)) {
                    if (e.clientX < (window.innerWidth / 2)) snapToLayout(id, 'BL');
                    else snapToLayout(id, 'BR');
                }
            }
            setIsDragging(false);
            setIsResizing(false);
            setDraggingId(null);
        };

        if (isDragging || isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, dragOffset, id, updatePosition, updateSize, windowState?.x, windowState?.y, minW, minH, isMaximized]);

    if (!windowState?.isOpen) return null;
    if (windowState.isMinimized) return null;

    const handleMouseDown = (e: React.MouseEvent) => {
        bringToFront(id);
        if (e.button !== 0 || isMaximized) return;
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - windowState.x,
            y: e.clientY - windowState.y
        });
        setDraggingId(id);
    };

    const handleResizeStart = (e: React.MouseEvent, mode: 'both' | 'h' | 'v' = 'both') => {
        e.stopPropagation();
        e.preventDefault();
        bringToFront(id);
        if (isMaximized) return;
        setIsResizing(mode);
    };

    return (
        <div
            ref={windowRef}
            onMouseDown={() => bringToFront(id)}
            style={{
                position: 'absolute',
                left: isMaximized ? '0' : `${windowState.x}px`,
                top: isMaximized ? '0' : `${windowState.y}px`,
                width: isMaximized ? '100%' : `${windowState.w}px`,
                height: isMaximized ? '100%' : `${windowState.h}px`,
                zIndex: isMaximized ? 10000 : windowState.zIndex,
                background: '#000',
                border: isMaximized ? 'none' : `1px solid ${isFocused ? '#333' : '#1a1a1a'}`,
                borderRadius: isMaximized ? '0' : '4px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: isFocused && !isMaximized ? '0 20px 50px rgba(0,0,0,0.9)' : '0 8px 30px rgba(0,0,0,0.6)',
                transition: isDragging || isResizing ? 'none' : 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                transformOrigin: 'top left',
                transform: isMaximized ? 'none' : `scale(${currentScale})`
            }}
        >
            {/* Header / Draggable Area - STRICT WINDOWS STYLE */}
            <div
                onMouseDown={handleMouseDown}
                onTouchStart={(e) => {
                    const touch = e.touches[0];
                    handleMouseDown({ 
                        button: 0, 
                        clientX: touch.clientX, 
                        clientY: touch.clientY,
                        stopPropagation: () => e.stopPropagation(),
                        preventDefault: () => e.preventDefault()
                    } as any);
                }}
                style={{
                    height: '28px',
                    background: isFocused ? '#111' : '#0a0a0a',
                    borderBottom: '1px solid #1a1a1a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: isMaximized ? 'default' : 'grab',
                    userSelect: 'none',
                    padding: '0 0 0 10px',
                    touchAction: 'none'
                }}
            >
                <span style={{ fontSize: '12px', color: '#888', fontWeight: 500 }}>
                    {title}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto', paddingRight: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', border: '1px solid #222' }}>
                        <button 
                            onClick={(e) => { e.stopPropagation(); updateScale(id, currentScale - 0.1); }}
                            className="window-control-btn zoom-out-btn"
                            style={{ ...controlButtonStyle, width: '28px' }}
                        >
                            <ZoomOut size={12} />
                        </button>
                        <span style={{ fontSize: '0.55rem', fontWeight: 900, color: '#666', width: '28px', textAlign: 'center' }}>
                            {Math.round(currentScale * 100)}%
                        </span>
                        <button 
                            onClick={(e) => { e.stopPropagation(); updateScale(id, currentScale + 0.1); }}
                            className="window-control-btn zoom-in-btn"
                            style={{ ...controlButtonStyle, width: '28px' }}
                        >
                            <ZoomIn size={12} />
                        </button>
                    </div>

                    <div style={{ width: '1px', background: '#222', height: '14px' }} />
                    <button 
                        onClick={(e) => { e.stopPropagation(); toggleMinimize(id); }}
                        className="window-control-btn"
                        style={controlButtonStyle}
                    >
                        <Minus size={13} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); toggleMaximize(id); }}
                        className="window-control-btn"
                        style={controlButtonStyle}
                    >
                        {isMaximized ? <Minimize2 size={12} /> : <Square size={11} />}
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); closeWindow(id); }}
                        className="window-control-btn close-btn"
                        style={closeButtonStyle}
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Window Content */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#000' }}>
                {children}
            </div>

            {/* Resize Handles */}
            {!isMaximized && (
                <>
                    {/* Corner */}
                    <div
                        onMouseDown={(e) => handleResizeStart(e, 'both')}
                        style={{
                            position: 'absolute', bottom: 0, right: 0,
                            width: '12px', height: '12px', cursor: 'nwse-resize',
                            zIndex: 10, background: 'linear-gradient(135deg, transparent 8px, #333 8px)'
                        }}
                    />
                    {/* Right Edge */}
                    <div
                        onMouseDown={(e) => handleResizeStart(e, 'h')}
                        style={{
                            position: 'absolute', right: 0, top: 0, bottom: 0,
                            width: '4px', cursor: 'ew-resize', zIndex: 9
                        }}
                    />
                    {/* Bottom Edge */}
                    <div
                        onMouseDown={(e) => handleResizeStart(e, 'v')}
                        style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            height: '4px', cursor: 'ns-resize', zIndex: 9
                        }}
                    />
                </>
            )}
        </div>
    );
};

const controlButtonStyle: React.CSSProperties = {
    width: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: 'none',
    color: '#666',
    cursor: 'pointer',
    transition: 'all 0.1s'
};

const closeButtonStyle: React.CSSProperties = {
    ...controlButtonStyle,
};

export default TerminalWindow;

// Global styles for window controls injected to head for simplicity and performance
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.innerHTML = `
        .window-control-btn:hover {
            background-color: rgba(255, 255, 255, 0.1) !important;
            color: #fff !important;
        }
        .window-control-btn.close-btn:hover {
            background-color: #e81123 !important;
            color: #fff !important;
        }
    `;
    document.head.appendChild(style);
}
