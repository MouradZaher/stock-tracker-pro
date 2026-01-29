/**
 * Institutional-grade UI Sound Service
 * Uses Web Audio API to synthesize subtle, high-fidelity feedback
 */

class SoundService {
    private ctx: AudioContext | null = null;

    private init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
    }

    private createOscillator(freq: number, type: OscillatorType, duration: number, volume: number) {
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    // Subtle tap for navigation/clicks
    playTap() {
        this.createOscillator(800, 'sine', 0.1, 0.05);
    }

    // Gentle success beep
    playSuccess() {
        setTimeout(() => this.createOscillator(523.25, 'sine', 0.2, 0.05), 0); // C5
        setTimeout(() => this.createOscillator(659.25, 'sine', 0.3, 0.05), 100); // E5
    }

    // Low-frequency error thud
    playError() {
        this.createOscillator(150, 'triangle', 0.4, 0.1);
    }
}

export const soundService = new SoundService();
