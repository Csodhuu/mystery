"use client";

/** Tiny Web Audio synth – no audio files needed. */
class Sfx {
  private ctx: AudioContext | null = null;
  private lastTick = 0;
  muted = false;

  constructor() {
    if (typeof window !== "undefined") {
      try {
        this.muted = localStorage.getItem("muted") === "1";
      } catch {}
    }
  }

  setMuted(m: boolean) {
    this.muted = m;
    try {
      localStorage.setItem("muted", m ? "1" : "0");
    } catch {}
  }

  /** Must be called from a user gesture (click) to unlock audio on mobile. */
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    void this.ctx?.resume();
  }

  private tone(freq: number, start: number, dur: number, type: OscillatorType, vol: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol, start + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g).connect(ctx.destination);
    o.start(start);
    o.stop(start + dur + 0.02);
  }

  tick() {
    if (this.muted || !this.ctx) return;
    const now = performance.now();
    if (now - this.lastTick < 22) return;
    this.lastTick = now;
    this.tone(1650 + Math.random() * 150, this.ctx.currentTime, 0.035, "square", 0.04);
  }

  whoosh() {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime;
    [220, 330, 440].forEach((f, i) => this.tone(f, t + i * 0.06, 0.25, "triangle", 0.06));
  }

  win(rank: number) {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const base = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    const notes = base.slice(0, 2 + Math.min(rank, 3));
    notes.forEach((f, i) => this.tone(f, t + i * 0.09, 0.5 + rank * 0.1, "sine", 0.12));
    if (rank >= 3) notes.forEach((f, i) => this.tone(f * 2, t + 0.45 + i * 0.07, 0.6, "triangle", 0.05));
  }
}

let instance: Sfx | null = null;
export function sfx(): Sfx {
  if (!instance) instance = new Sfx();
  return instance;
}
