import { create } from 'zustand';

interface PiPStream {
    id: string;
    name: string;
    shortName: string;
    category: string;
    region: string;
    logo: string;
    videoId?: string;
    youtubeId?: string;
    color: string;
}

interface PiPState {
    activeStream: PiPStream | null;
    isPiPActive: boolean;
    isMuted: boolean;
    setActiveStream: (stream: PiPStream | null) => void;
    setPiPActive: (active: boolean) => void;
    setMuted: (muted: boolean) => void;
}

export const usePiPStore = create<PiPState>((set) => ({
    activeStream: null,
    isPiPActive: false,
    isMuted: true,
    setActiveStream: (stream) => set({ activeStream: stream }),
    setPiPActive: (active) => set({ isPiPActive: active }),
    setMuted: (muted) => set({ isMuted: muted }),
}));
