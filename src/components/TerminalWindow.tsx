import React, { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { X, Minus, Square, Minimize2, Maximize2, Move } from 'lucide-react';
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

    if (!windowState?.isOpen) return null;
    if (windowState.isMinimized) return null; // Handled by bottom bar

    const handleMouseDown = (e: React.MouseEvent) => {
        bringToFront(id);
        if (e.button !== 0 || isMaximized) return; // Left click only, no drag if maximized
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

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging && !isMaximized) {
                const nx = e.clientX - dragOffset.x;
                const ny = e.clientY - dragOffset.y;
                updatePosition(id, Math.max(0, nx), Math.max(0, ny));
            }
            if (isResizing && !isMaximized) {
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
    }, [isDragging, isResizing, dragOffset, id, updatePosition, updateSize, windowState.x, windowState.y, minW, minH, isMaximized]);

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
                border: isMaximized ? 'none' : `1px solid ${isFocused ? '#222' : '#111'}`,
                borderRadius: isMaximized ? '0' : '8px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: isFocused && !isMaximized ? '0 10px 40px rgba(0,0,0,0.8)' : '0 4px 15px rgba(0,0,0,0.4)',
                transition: isDragging || isResizing ? 'none' : 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
        >
            {/* Header / Draggable Area */}
            <div
                onMouseDown={handleMouseDown}
                style={{
                    height: '32px',
                    background: isFocused ? '#0f0f0f' : '#050505',
                    borderBottom: '1px solid #111',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 4px 0 12px',
                    cursor: isMaximized ? 'default' : 'grab',
                    userSelect: 'none',
                    justifyContent: 'space-between'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <span style={{ 
                        fontSize: '0.65rem', 
                        fontWeight: 900, 
                        color: isFocused ? '#fff' : '#444', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden'
                    }}>
                        {title}
                    </span>
                </div>
                
                <div style={{ display: 'flex', height: '100%' }}>
                    <button 
                        onClick={(e) => { e.stopPropagation(); toggleMinimize(id); }}
                        className="window-control-btn"
                        style={controlButtonStyle}
                        title="Minimize"
                    >
                        <Minus size={14} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); toggleMaximize(id); }}
                        className="window-control-btn"
                        style={controlButtonStyle}
                        title={isMaximized ? "Restore" : "Maximize"}
                    >
                        {isMaximized ? <Minimize2 size={12} /> : <Square size={12} />}
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); closeWindow(id); }}
                        className="window-control-btn close"
                        style={{ ...controlButtonStyle, ...closeButtonStyle }}
                        title="Close"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Window Content */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
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
                        width: '12px',
                        height: '12px',
                        cursor: 'nwse-resize',
                        zIndex: 10,
                        background: 'linear-gradient(135deg, transparent 50%, #222 50%)'
                    }}
                />
            )}
        </div>
    );
};

const controlButtonStyle: React.CSSProperties = {
    width: '40px',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: 'none',
    color: '#666',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
};

const closeButtonStyle: React.CSSProperties = {
    // Standard Windows close button style
    // Hover is handled by .style or pure CSS in index.css
};

export default TerminalWindow;
