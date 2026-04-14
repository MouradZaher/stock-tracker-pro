import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WindowId = 'heatmap' | 'screener' | 'portfolio' | 'watchlist' | 'tv' | 'calendar' | 'pulse' | 'advisor' | 'recommendations' | 'admin' | 'news';

interface WindowState {
    id: WindowId;
    title: string;
    description?: string;
    isOpen: boolean;
    isMinimized: boolean;
    isMaximized: boolean;
    prevLayout: { x: number, y: number, w: number, h: number } | null;
    x: number;
    y: number;
    w: number;
    h: number;
    zIndex: number;
    scale: number;
}

interface WindowStore {
    windows: Record<WindowId, WindowState>;
    activeWindow: WindowId | null;
    maxZIndex: number;
    isDraggingId: WindowId | null;
    snapTarget: 'TL' | 'TR' | 'BL' | 'BR' | 'SIDE' | null;
    setDraggingId: (id: WindowId | null) => void;
    setSnapTarget: (target: 'TL' | 'TR' | 'BL' | 'BR' | 'SIDE' | null) => void;
    openWindow: (id: WindowId, title: string, x?: number, y?: number, w?: number, h?: number) => void;
    closeWindow: (id: WindowId) => void;
    toggleMinimize: (id: WindowId) => void;
    toggleMaximize: (id: WindowId) => void;
    bringToFront: (id: WindowId) => void;
    updatePosition: (id: WindowId, x: number, y: number) => void;
    updateSize: (id: WindowId, w: number, h: number) => void;
    updateScale: (id: WindowId, scale: number) => void;
    snapToLayout: (id: WindowId, layout: 'TL' | 'TR' | 'BL' | 'BR' | 'SIDE' | 'FULL') => void;
    resetToInstitutionalLayout: () => void;
    isWindowOpen: (id: WindowId) => boolean;
    isWindowMinimized: (id: WindowId) => boolean;
}

const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 600;

export const useWindowStore = create<WindowStore>()(
    persist(
        (set, get) => ({
            windows: {} as Record<WindowId, WindowState>,
            activeWindow: null,
            maxZIndex: 100,
            isDraggingId: null,
            snapTarget: null,
            
            setSnapTarget: (target) => set({ snapTarget: target }),
            setDraggingId: (id) => set({ isDraggingId: id }),

            openWindow: (id, title, x = 20, y = 20, w = DEFAULT_WIDTH, h = DEFAULT_HEIGHT) => {
                const { windows, maxZIndex } = get();
                const nextZ = maxZIndex + 1;
                
                const isMobile = window.innerWidth <= 768;
                const finalW = isMobile ? (window.innerWidth - 60) / 2 : w;
                const finalH = isMobile ? 300 : h;
                const finalX = isMobile ? 10 : x;
                const finalY = isMobile ? 10 : y;

                set({
                    windows: {
                        ...windows,
                        [id]: {
                            ...(windows[id] || { id, x: finalX, y: finalY, w: finalW, h: finalH }),
                            title,
                            isOpen: true,
                            isMinimized: false,
                            isMaximized: false,
                            prevLayout: null,
                            zIndex: nextZ,
                            scale: 1.0
                        }
                    },
                    activeWindow: id,
                    maxZIndex: nextZ
                });
            },

            closeWindow: (id) => {
                const { windows } = get();
                if (!windows[id]) return;
                set({
                    windows: {
                        ...windows,
                        [id]: { ...windows[id], isOpen: false }
                    }
                });
            },

            toggleMinimize: (id) => {
                const { windows } = get();
                if (!windows[id]) return;
                set({
                    windows: {
                        ...windows,
                        [id]: { ...windows[id], isMinimized: !windows[id].isMinimized }
                    }
                });
            },

            toggleMaximize: (id) => {
                const { windows } = get();
                const win = windows[id];
                if (!win) return;

                if (win.isMaximized) {
                    // Restore
                    const { x, y, w, h } = win.prevLayout || { x: 100, y: 100, w: DEFAULT_WIDTH, h: DEFAULT_HEIGHT };
                    set({
                        windows: {
                            ...windows,
                            [id]: { ...win, isMaximized: false, x, y, w, h, prevLayout: null }
                        }
                    });
                } else {
                    // Maximize
                    set({
                        windows: {
                            ...windows,
                            [id]: { 
                                ...win, 
                                isMaximized: true, 
                                prevLayout: { x: win.x, y: win.y, w: win.w, h: win.h } 
                            }
                        }
                    });
                }
            },

            bringToFront: (id) => {
                const { windows, maxZIndex, activeWindow } = get();
                if (!windows[id] || activeWindow === id) return;
                
                const nextZ = maxZIndex + 1;
                set({
                    windows: {
                        ...windows,
                        [id]: { ...windows[id], zIndex: nextZ, isMinimized: false }
                    },
                    activeWindow: id,
                    maxZIndex: nextZ
                });
            },

            updatePosition: (id, x, y) => {
                set((state) => {
                    const win = state.windows[id];
                    if (!win) return state;

                    // NUCLEAR POSITION GUARD: Force coordinates to stay within logical bounds
                    const sidebarWidth = (window.innerWidth <= 768) ? 50 : 48;
                    const SIDE_WIDTH = 350;
                    const isMobile = window.innerWidth <= 768;
                    const availW = window.innerWidth - sidebarWidth - (isMobile ? 0 : SIDE_WIDTH);

                    const clampedX = Math.max(0, Math.min(availW - 50, x));
                    const clampedY = Math.max(0, Math.min(window.innerHeight - 50, y));

                    return {
                        windows: {
                            ...state.windows,
                            [id]: { ...win, x: clampedX, y: clampedY, isOpen: true, isMinimized: false }
                        }
                    };
                });
            },

            updateSize: (id, w, h) => {
                const { windows } = get();
                if (!windows[id]) return;
                set({
                    windows: {
                        ...windows,
                        [id]: { ...windows[id], w, h }
                    }
                });
            },

            updateScale: (id, scale) => {
                const { windows } = get();
                if (!windows[id]) return;
                set({
                    windows: {
                        ...windows,
                        [id]: { ...windows[id], scale: Math.max(0.5, Math.min(2.0, scale)) }
                    }
                });
            },

            snapToLayout: (id, layout) => {
                const { windows } = get();
                const win = windows[id];
                if (!win) return;

                const isMobile = window.innerWidth <= 768;
                const sidebarWidth = isMobile ? 50 : 48;
                const SIDE_WIDTH = 350;
                
                // SAFETY CLAMP: Ensure availArea is never negative even if resolution is messed up
                const baseAvailW = window.innerWidth - sidebarWidth - (isMobile ? 0 : SIDE_WIDTH);
                const availW = Math.max(170, baseAvailW); 
                const availH = Math.max(200, window.innerHeight);
                
                const halfW = availW / 2;
                const halfH = availH / 2;

                let next = { x: win.x, y: win.y, w: win.w, h: win.h };

                if (isMobile) {
                    const contentW = window.innerWidth - sidebarWidth;
                    const hW = contentW / 2;
                    
                    const dockH = availH * 0.35;
                    const gridH = availH - dockH;
                    const hH = gridH / 2;

                    switch (layout) {
                        case 'TL': next = { x: 0, y: 0, w: hW, h: hH }; break;
                        case 'TR': next = { x: hW, y: 0, w: hW, h: hH }; break;
                        case 'BL': next = { x: 0, y: hH, w: hW, h: hH }; break;
                        case 'BR': next = { x: hW, y: hH, w: hW, h: hH }; break;
                        case 'SIDE': next = { x: 0, y: gridH, w: contentW, h: dockH }; break;
                        case 'FULL': next = { x: 0, y: 0, w: contentW, h: availH }; break;
                    }
                } else {


                    switch (layout) {
                        case 'TL': next = { x: 0, y: 0, w: halfW, h: halfH }; break;
                        case 'TR': next = { x: halfW, y: 0, w: halfW, h: halfH }; break;
                        case 'BL': next = { x: 0, y: halfH, w: halfW, h: halfH }; break;
                        case 'BR': next = { x: halfW, y: halfH, w: halfW, h: halfH }; break;
                        case 'SIDE': next = { x: availW, y: 0, w: SIDE_WIDTH, h: availH }; break;
                        case 'FULL': next = { x: 0, y: 0, w: availW + SIDE_WIDTH, h: availH }; break;
                    }
                }

                set({
                    windows: {
                        ...windows,
                        [id]: { ...win, ...next, isMaximized: false }
                    }
                });
            },
            resetToInstitutionalLayout: () => {
                const { openWindow, snapToLayout } = get();
                
                // 1. Force state reset for the core operational hub
                // This ensures we bypass any stale localStorage data for positions/sizes
                const targetWindows: { id: WindowId, title: string }[] = [
                    { id: 'heatmap', title: 'Heatmap' },
                    { id: 'screener', title: 'Screener' },
                    { id: 'news', title: 'Market News' },
                    { id: 'tv', title: 'Live News' },
                    { id: 'portfolio', title: 'Portfolio' },
                    { id: 'advisor', title: 'Oracle Portfolio Audit' }
                ];
                
                targetWindows.forEach(w => openWindow(w.id, w.title));

                
                // 2. Snap them into the high-density grid
                // Delay slightly to ensure the windows are registered in the state for the next tick
                setTimeout(() => {
                    snapToLayout('heatmap', 'TL');
                    snapToLayout('screener', 'TR');
                    snapToLayout('news', 'BL');
                    snapToLayout('portfolio', 'BR');
                    snapToLayout('tv', 'SIDE');
                    snapToLayout('advisor', 'SIDE');

                    
                    // Force a z-index synchronization
                    set(state => ({
                        activeWindow: 'heatmap'
                    }));
                }, 50);
            },
            isWindowOpen: (id) => {
                const win = get().windows[id];
                return !!(win?.isOpen && !win?.isMinimized);
            },
            isWindowMinimized: (id) => {
                return !!get().windows[id]?.isMinimized;
            }
        }),
        {
            name: 'terminal-layout-cache',
            partialize: (state) => ({ windows: state.windows })
        }
    )
);
