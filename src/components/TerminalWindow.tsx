import React, { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { X, Minus, Square, Minimize2 } from 'lucide-react';
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
        toggleMinimize, toggleMaximize, updatePosition, updateSize 
    } = useWindowStore();
    
    const windowState = windows[id];
    const isFocused = activeWindow === id;
    const isMaximized = windowState?.isMaximized;
    
    const windowRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging && !isMaximized && windowState) {
                const nx = e.clientX - dragOffset.x;
                const ny = e.clientY - dragOffset.y;
                updatePosition(id, Math.max(0, nx), Math.max(0, ny));
            }
            if (isResizing && !isMaximized && windowState) {
                const nw = e.clientX - windowState.x;
                const nh = e.clientY - windowState.y;
                updateSize(id, Math.max(minW, nw), Math.max(minH, nh));
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizing(false);
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
    };

    const handleResizeStart = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        bringToFront(id);
        if (isMaximized) return;
        setIsResizing(true);
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
            }}
        >
            {/* Header / Draggable Area - STRICT WINDOWS STYLE */}
            <div
                onMouseDown={handleMouseDown}
                style={{
                    height: '28px',
                    background: isFocused ? '#111' : '#0a0a0a',
                    borderBottom: '1px solid #1a1a1a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: isMaximized ? 'default' : 'grab',
                    userSelect: 'none',
                    padding: '0 0 0 10px'
                }}
            >
                {/* TITLE LEFT */}
                <span style={{ 
                    fontSize: '0.62rem', 
                    fontWeight: 900, 
                    color: isFocused ? '#fff' : '#555', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.1em',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    pointerEvents: 'none'
                }}>
                    {title}
                </span>
                
                {/* CONTROLS RIGHT */}
                <div style={{ display: 'flex', height: '100%', alignItems: 'stretch' }}>
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
                        className="window-control-btn close"
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

            {/* Resize Handle (Bottom Right) */}
            {!isMaximized && (
                <div
                    onMouseDown={handleResizeStart}
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: '10px',
                        height: '10px',
                        cursor: 'nwse-resize',
                        zIndex: 10,
                        background: 'linear-gradient(135deg, transparent 6px, #333 6px)'
                    }}
                />
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
