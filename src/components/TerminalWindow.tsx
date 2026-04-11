import React, { useState, useRef, useEffect, ReactNode } from 'react';
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
        toggleMinimize, updatePosition, updateSize 
    } = useWindowStore();
    
    const windowState = windows[id];
    const isFocused = activeWindow === id;
    
    const windowRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    if (!windowState?.isOpen) return null;
    if (windowState.isMinimized) return null; // Handled by bottom bar

    const handleMouseDown = (e: React.MouseEvent) => {
        bringToFront(id);
        if (e.button !== 0) return; // Left click only
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
        setIsResizing(true);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                const nx = e.clientX - dragOffset.x;
                const ny = e.clientY - dragOffset.y;
                updatePosition(id, Math.max(0, nx), Math.max(0, ny));
            }
            if (isResizing) {
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
    }, [isDragging, isResizing, dragOffset, id, updatePosition, updateSize, windowState.x, windowState.y, minW, minH]);

    return (
        <div
            ref={windowRef}
            onMouseDown={() => bringToFront(id)}
            style={{
                position: 'absolute',
                left: `${windowState.x}px`,
                top: `${windowState.y}px`,
                width: `${windowState.w}px`,
                height: `${windowState.h}px`,
                zIndex: windowState.zIndex,
                background: '#000',
                border: `1px solid ${isFocused ? '#222' : '#111'}`,
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: isFocused ? '0 10px 40px rgba(0,0,0,0.8)' : '0 4px 15px rgba(0,0,0,0.4)',
                transition: isDragging || isResizing ? 'none' : 'box-shadow 0.2s, border-color 0.2s',
            }}
        >
            {/* Header / Draggable Area */}
            <div
                onMouseDown={handleMouseDown}
                style={{
                    height: '28px',
                    background: '#0a0a0a',
                    borderBottom: '1px solid #111',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 8px',
                    cursor: 'grab',
                    userSelect: 'none',
                    justifyContent: 'space-between'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <div 
                            onClick={(e) => { e.stopPropagation(); closeWindow(id); }}
                            style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', cursor: 'pointer', opacity: 0.8 }} 
                        />
                        <div 
                            onClick={(e) => { e.stopPropagation(); toggleMinimize(id); }}
                            style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', cursor: 'pointer', opacity: 0.8 }} 
                        />
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', cursor: 'pointer', opacity: 0.8 }} />
                    </div>
                    <span style={{ fontSize: '0.45rem', fontWeight: 900, color: isFocused ? '#888' : '#444', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        {title}
                    </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.2 }}>
                    <Move size={10} />
                </div>
            </div>

            {/* Window Content */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                {children}
            </div>

            {/* Resize Handle (Bottom Right) */}
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
        </div>
    );
};

export default TerminalWindow;
