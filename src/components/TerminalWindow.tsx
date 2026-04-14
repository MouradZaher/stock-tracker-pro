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
    id, title, children, minW: propMinW, minH: propMinH 
}) => {
    const isMobile = window.innerWidth <= 768;
    const minW = propMinW ?? (isMobile ? 150 : 400);
    const minH = propMinH ?? (isMobile ? 150 : 300);
    const { 
        windows, activeWindow, bringToFront, closeWindow, 
        toggleMinimize, toggleMaximize, updatePosition, updateSize, updateScale,
        snapToLayout, setDraggingId, setSnapTarget 
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
        const handlePointerMove = (e: PointerEvent) => {
            if (isDragging && !isMaximized && windowState) {
                const sidebarWidth = 48;
                
                const availW = window.innerWidth - sidebarWidth;
                const availH = window.innerHeight;

                const nx = e.clientX - dragOffset.x;
                const ny = e.clientY - dragOffset.y;
                
                // Live Snap Target Detection for Ghosting
                if (isMobile) {
                    const sidebarWidth = 50;
                    const availAreaWidth = window.innerWidth - sidebarWidth;
                    const availH = window.innerHeight;
                    const dockH = availH * 0.35;
                    const gridH = availH - dockH;
                    
                    const relativeX = e.clientX - sidebarWidth;
                    
                    if (e.clientY > gridH) {
                        setSnapTarget('SIDE');
                    } else {
                        const isLeft = relativeX < (availAreaWidth / 2);
                        const isTop = e.clientY < (gridH / 2);
                        setSnapTarget(isTop ? (isLeft ? 'TL' : 'TR') : (isLeft ? 'BL' : 'BR'));
                    }
                } else {
                    const SIDE_PANEL_WIDTH = 350;
                    const gridAreaWidth = availW - SIDE_PANEL_WIDTH;
                    const relativeX = e.clientX - sidebarWidth;

                    if (relativeX > gridAreaWidth) {
                        setSnapTarget('SIDE');
                    } else {
                        const isLeft = relativeX < (gridAreaWidth / 2);
                        const isTop = e.clientY < (window.innerHeight / 2);
                        setSnapTarget(isTop ? (isLeft ? 'TL' : 'TR') : (isLeft ? 'BL' : 'BR'));
                    }
                }

                // Strict Containment: Clamp within ModularWorkspace bounds
                const clampedX = Math.max(0, Math.min(availW - windowState.w, nx));
                const clampedY = Math.max(0, Math.min(availH - windowState.h, ny));
                
                updatePosition(id, clampedX, clampedY);
            }
            if (isResizing && !isMaximized && windowState) {
                const nw = isResizing === 'v' ? windowState.w : e.clientX - windowState.x;
                const nh = isResizing === 'h' ? windowState.h : e.clientY - windowState.y;
                updateSize(id, Math.max(minW, nw), Math.max(minH, nh));
            }
        };

        const handlePointerUp = (e: PointerEvent) => {
            if (isDragging && windowState) {
                // Aggressive Snap Logic: Full-screen quadrant detection
                const sidebarWidth = isMobile ? 50 : 48;
                const availAreaWidth = window.innerWidth - sidebarWidth;
                const availH = window.innerHeight;

                const relativeX = e.clientX - sidebarWidth;
                
                if (isMobile) {
                    const dockH = availH * 0.35;
                    const gridH = availH - dockH;
                    if (e.clientY > gridH) {
                        snapToLayout(id, 'SIDE');
                    } else {
                        const isLeft = relativeX < (availAreaWidth / 2);
                        const isTop = e.clientY < (gridH / 2);
                        if (isTop) {
                            snapToLayout(id, isLeft ? 'TL' : 'TR');
                        } else {
                            snapToLayout(id, isLeft ? 'BL' : 'BR');
                        }
                    }
                } else {
                    const SIDE_PANEL_WIDTH = 350;
                    const gridAreaWidth = availAreaWidth - SIDE_PANEL_WIDTH;
                    
                    if (relativeX > gridAreaWidth) {
                        snapToLayout(id, 'SIDE');
                    } else {
                        const isLeft = relativeX < (gridAreaWidth / 2);
                        const isTop = e.clientY < (window.innerHeight / 2);
                        
                        if (isTop) {
                            snapToLayout(id, isLeft ? 'TL' : 'TR');
                        } else {
                            snapToLayout(id, isLeft ? 'BL' : 'BR');
                        }
                    }
                }
            }
            setIsDragging(false);
            setIsResizing(false);
            setDraggingId(null);
            setSnapTarget(null);
        };

        if (isDragging || isResizing) {
            window.addEventListener('pointermove', handlePointerMove);
            window.addEventListener('pointerup', handlePointerUp);
        }

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [isDragging, isResizing, dragOffset, id, updatePosition, updateSize, windowState?.x, windowState?.y, minW, minH, isMaximized]);

    if (!windowState?.isOpen) return null;
    if (windowState.isMinimized) return null;

    const handleMouseDown = (e: React.PointerEvent | any) => {
        bringToFront(id);
        if ((e.button !== undefined && e.button !== 0) || isMaximized) return;
        
        const PORTABLE_W = 400;
        const PORTABLE_H = 300;
        
        // Detect if window is currently docked/large
        const isSnapped = windowState.w > 600 || windowState.h > 500;
        
        if (isSnapped) {
            // Un-dock and shrink to portable size for easy mobility
            updateSize(id, PORTABLE_W, PORTABLE_H);
            setDragOffset({
                x: PORTABLE_W / 2,
                y: 15 // Hold by the handle
            });
            // Approximate new position centered under mouse
            updatePosition(id, e.clientX - 48 - (PORTABLE_W / 2), e.clientY - 15);
        } else {
            setDragOffset({
                x: e.clientX - windowState.x,
                y: e.clientY - windowState.y
            });
        }
        
        setIsDragging(true);
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
                width: isMaximized ? '100%' : `${Math.max(minW, windowState.w)}px`,
                height: isMaximized ? '100%' : `${Math.max(minH, windowState.h)}px`,
                zIndex: isMaximized ? 10000 : windowState.zIndex,
                background: 'var(--color-bg-primary)',
                overscrollBehavior: 'none',
                border: isMaximized ? 'none' : `1px solid ${isFocused ? 'var(--color-border-light)' : 'var(--color-border)'}`,
                borderRadius: isMaximized ? '0' : '4px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: isFocused && !isMaximized ? 'var(--shadow-xl)' : 'var(--shadow-lg)',
                transition: isDragging || isResizing ? 'none' : 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                transformOrigin: 'top left',
                transform: isMaximized ? 'none' : `scale(${currentScale})`,
            }}
        >
            {/* Header / Draggable Area - STRICT WINDOWS STYLE */}
            <div
                style={{
                    height: '28px',
                    background: isFocused ? 'var(--color-bg-tertiary)' : 'var(--color-bg-elevated)',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    userSelect: 'none',
                    padding: '0',
                    touchAction: 'none',
                    overflow: 'hidden'
                }}
            >
                {/* 1. DRAGGABLE TITLE AREA (90% of header) */}
                <div 
                    onPointerDown={handleMouseDown}
                    style={{
                        flex: 1,
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: '10px',
                        cursor: isMaximized ? 'default' : 'grab',
                    }}
                >
                    <span style={{ fontSize: '11px', color: '#888', fontWeight: 600, letterSpacing: '0.02em' }}>
                        {title.toUpperCase()}
                    </span>
                </div>

                {/* 2. STATIC CONTROL AREA (Right-aligned, strictly non-draggable) */}
                <div 
                    onPointerDown={(e) => e.stopPropagation()}
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px', 
                        paddingRight: '6px',
                        height: '100%',
                        background: isFocused ? 'var(--color-bg-tertiary)' : 'var(--color-bg-elevated)', // Match refined header variables
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-bg-secondary)', borderRadius: '4px', border: '1px solid var(--color-border)', marginRight: '4px' }}>
                        <button 
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => { e.stopPropagation(); updateScale(id, currentScale - 0.1); }}
                            className="window-control-btn"
                            style={{ ...controlButtonStyle, width: '24px', height: '20px' }}
                            title="Zoom Out"
                        >
                            <ZoomOut size={11} />
                        </button>
                        <span style={{ fontSize: '0.55rem', fontWeight: 900, color: '#444', width: '26px', textAlign: 'center' }}>
                            {Math.round(currentScale * 100)}%
                        </span>
                        <button 
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => { e.stopPropagation(); updateScale(id, currentScale + 0.1); }}
                            className="window-control-btn"
                            style={{ ...controlButtonStyle, width: '24px', height: '20px' }}
                            title="Zoom In"
                        >
                            <ZoomIn size={11} />
                        </button>
                    </div>

                    <button 
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); toggleMinimize(id); }}
                        className="window-control-btn"
                        style={controlButtonStyle}
                        title="Minimize"
                    >
                        <Minus size={13} />
                    </button>
                    <button 
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); toggleMaximize(id); }}
                        className="window-control-btn"
                        style={controlButtonStyle}
                        title={isMaximized ? "Restore" : "Maximize"}
                    >
                        {isMaximized ? <Minimize2 size={12} /> : <Square size={11} />}
                    </button>
                    <button 
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); closeWindow(id); }}
                        className="window-control-btn close-btn"
                        style={closeButtonStyle}
                        title="Close"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Window Content */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: 'var(--color-bg-primary)' }}>
                {children}
            </div>

            {/* Resize Handles */}
            {!isMaximized && (
                <>
                    {/* Corner */}
                    <div
                        onPointerDown={(e) => handleResizeStart(e as any, 'both')}
                        style={{
                            position: 'absolute', bottom: 0, right: 0,
                            width: '16px', height: '16px', cursor: 'nwse-resize',
                            zIndex: 10, background: 'linear-gradient(135deg, transparent 12px, var(--color-border) 12px)',
                            touchAction: 'none'
                        }}
                    />
                    {/* Right Edge */}
                    <div
                        onPointerDown={(e) => handleResizeStart(e as any, 'h')}
                        style={{
                            position: 'absolute', right: 0, top: 0, bottom: 0,
                            width: '8px', cursor: 'ew-resize', zIndex: 9,
                            touchAction: 'none'
                        }}
                    />
                    {/* Bottom Edge */}
                    <div
                        onPointerDown={(e) => handleResizeStart(e as any, 'v')}
                        style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            height: '8px', cursor: 'ns-resize', zIndex: 9,
                            touchAction: 'none'
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
    color: 'var(--color-text-secondary)',
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
            background-color: var(--color-bg-elevated) !important;
            color: var(--color-text-primary) !important;
        }
        .window-control-btn.close-btn:hover {
            background-color: #e81123 !important;
            color: #fff !important;
        }
    `;
    document.head.appendChild(style);
}
