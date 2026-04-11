import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WindowId = 'heatmap' | 'screener' | 'portfolio' | 'watchlist' | 'tv' | 'calendar' | 'pulse' | 'advisor' | 'recommendations' | 'admin';

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
    
    setDraggingId: (id: WindowId | null) => void;
    openWindow: (id: WindowId, title: string, x?: number, y?: number, w?: number, h?: number) => void;
    closeWindow: (id: WindowId) => void;
    toggleMinimize: (id: WindowId) => void;
    toggleMaximize: (id: WindowId) => void;
    bringToFront: (id: WindowId) => void;
    updatePosition: (id: WindowId, x: number, y: number) => void;
    updateSize: (id: WindowId, w: number, h: number) => void;
    updateScale: (id: WindowId, scale: number) => void;
    snapToLayout: (id: WindowId, layout: 'TL' | 'TR' | 'BL' | 'BR' | 'SIDE' | 'FULL') => void;
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

            setDraggingId: (id) => set({ isDraggingId: id }),

            openWindow: (id, title, x = 100, y = 100, w = DEFAULT_WIDTH, h = DEFAULT_HEIGHT) => {
                const { windows, maxZIndex } = get();
                const nextZ = maxZIndex + 1;
                
                set({
                    windows: {
                        ...windows,
                        [id]: {
                            ...(windows[id] || { id, x, y, w, h }),
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
                const { windows } = get();
                if (!windows[id]) return;
                set({
                    windows: {
                        ...windows,
                        [id]: { ...windows[id], x, y }
                    }
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

                const SIDE_WIDTH = 350;
                const sidebarWidth = 48; // Matched to LeftToolstrip.tsx
                const topBarHeight = 0; // Content fills full vertical space
                const bottomNavHeight = 0;
                
                const availW = window.innerWidth - sidebarWidth - SIDE_WIDTH;
                const availH = window.innerHeight - topBarHeight - bottomNavHeight;
                
                const halfW = availW / 2;
                const halfH = availH / 2;

                let next = { x: win.x, y: win.y, w: win.w, h: win.h };

                switch (layout) {
                    case 'TL': next = { x: 0, y: 0, w: halfW, h: halfH }; break;
                    case 'TR': next = { x: halfW, y: 0, w: halfW, h: halfH }; break;
                    case 'BL': next = { x: 0, y: halfH, w: halfW, h: halfH }; break;
                    case 'BR': next = { x: halfW, y: halfH, w: halfW, h: halfH }; break;
                    case 'SIDE': next = { x: availW, y: 0, w: SIDE_WIDTH, h: availH }; break;
                    case 'FULL': next = { x: 0, y: 0, w: availW + SIDE_WIDTH, h: availH }; break;
                }

                set({
                    windows: {
                        ...windows,
                        [id]: { ...win, ...next, isMaximized: false }
                    }
                });
            }
        }),
        {
            name: 'terminal-layout-cache',
            partialize: (state) => ({ windows: state.windows })
        }
    )
);
