import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WindowId = 'heatmap' | 'screener' | 'portfolio' | 'watchlist' | 'tv' | 'calendar' | 'pulse';

interface WindowState {
    id: WindowId;
    title: string;
    description?: string;
    isOpen: boolean;
    isMinimized: boolean;
    x: number;
    y: number;
    w: number;
    h: number;
    zIndex: number;
}

interface WindowStore {
    windows: Record<WindowId, WindowState>;
    activeWindow: WindowId | null;
    maxZIndex: number;
    
    openWindow: (id: WindowId, title: string, x?: number, y?: number, w?: number, h?: number) => void;
    closeWindow: (id: WindowId) => void;
    toggleMinimize: (id: WindowId) => void;
    bringToFront: (id: WindowId) => void;
    updatePosition: (id: WindowId, x: number, y: number) => void;
    updateSize: (id: WindowId, w: number, h: number) => void;
}

const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 600;

export const useWindowStore = create<WindowStore>()(
    persist(
        (set, get) => ({
            windows: {} as Record<WindowId, WindowState>,
            activeWindow: null,
            maxZIndex: 100,

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
                            zIndex: nextZ
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
            }
        }),
        {
            name: 'terminal-layout-cache',
            partialize: (state) => ({ windows: state.windows })
        }
    )
);
