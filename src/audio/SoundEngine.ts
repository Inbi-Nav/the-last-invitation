type Ambience = "none" | "exterior" | "interior" | "lobby";

const MUTE_KEY = "tli-muted";
const VOL_KEY = "tli-volumes";

export interface Volumes { master: number; music: number; sfx: number }
const DEFAULT_VOLUMES: Volumes = { master: 1, music: 1, sfx: 1 };
const BASE = { master: 0.9, music: 0.55, sfx: 0.8 };

function loadVolumes(): Volumes {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(VOL_KEY) : null;
    if (!raw) return { ...DEFAULT_VOLUMES };
    const v = JSON.parse(raw) as Partial<Volumes>;
    const clamp = (n: unknown, d: number) => (typeof n === "number" && n >= 0 && n <= 1 ? n : d);
    return { master: clamp(v.master, 1), music: clamp(v.music, 1), sfx: clamp(v.sfx, 1) };
  } catch {
    return { ...DEFAULT_VOLUMES };
  }
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfx: GainNode | null = null;
  private amb: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private ambienceNodes: AudioNode[] = [];
  private timers: number[] = [];
  private current: Ambience = "none";
  private wanted: Ambience = "none";
  private listeners = new Set<(m: boolean) => void>();
  private volListeners = new Set<(v: Volumes) => void>();
  volumes: Volumes = loadVolumes();
  muted = typeof localStorage !== "undefined" && localStorage.getItem(MUTE_KEY) === "1";

  get unlocked() { return this.ctx !== null && this.ctx.state === "running"; }

  unlock() {
    if (!this.ctx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : BASE.master * this.volumes.master;
      const comp = this.ctx.createDynamicsCompressor();
      this.master.connect(comp).connect(this.ctx.destination);
      this.sfx = this.ctx.createGain();
      this.sfx.gain.value = BASE.sfx * this.volumes.sfx;
      this.sfx.connect(this.master);
      this.amb = this.ctx.createGain();
      this.amb.gain.value = BASE.music * this.volumes.music;
      this.amb.connect(this.master);
      const len = this.ctx.sampleRate * 3;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    if (this.wanted !== this.current) this.setAmbience(this.wanted);
  }

  setMuted(m: boolean) {
    this.muted = m;
    localStorage.setItem(MUTE_KEY, m ? "1" : "0");
    if (this.ctx && this.master) this.master.gain.setTargetAtTime(m ? 0 : BASE.master * this.volumes.master, this.ctx.currentTime, 0.1);
    this.listeners.forEach((l) => l(m));
  }
  onMute(l: (m: boolean) => void) { this.listeners.add(l); return () => { this.listeners.delete(l); }; }

  setVolume(kind: keyof Volumes, value: number) {
    this.volumes = { ...this.volumes, [kind]: Math.min(1, Math.max(0, value)) };
    try { localStorage.setItem(VOL_KEY, JSON.stringify(this.volumes)); } catch { }
    if (this.ctx && this.master && this.sfx && this.amb) {
      const t = this.ctx.currentTime;
      if (!this.muted) this.master.gain.setTargetAtTime(BASE.master * this.volumes.master, t, 0.05);
      this.sfx.gain.setTargetAtTime(BASE.sfx * this.volumes.sfx, t, 0.05);
      this.amb.gain.setTargetAtTime(BASE.music * this.volumes.music, t, 0.05);
    }
    this.volListeners.forEach((l) => l(this.volumes));
  }
  onVolumes(l: (v: Volumes) => void) { this.volListeners.add(l); return () => { this.volListeners.delete(l); }; }

  private noiseSrc(loop = false) {
    const s = this.ctx!.createBufferSource();
    s.buffer = this.noise;
    s.loop = loop;
    s.loopStart = Math.random() * 2;
    return s;
  }
  private env(g: GainNode, t: number, peak: number, attack: number, decay: number) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }
  private ready() { return this.ctx !== null && this.ctx.state === "running"; }

  hover() {
    if (!this.ready()) return;
    const c = this.ctx!, t = c.currentTime;
    const o = c.createOscillator(), g = c.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(1320, t);
    o.frequency.exponentialRampToValueAtTime(1760, t + 0.08);
    this.env(g, t, 0.05, 0.005, 0.18);
    o.connect(g).connect(this.sfx!);
    o.start(t); o.stop(t + 0.25);
  }

  click() {
    if (!this.ready()) return;
    const c = this.ctx!, t = c.currentTime;
    const n = this.noiseSrc(), bp = c.createBiquadFilter(), g = c.createGain();
    bp.type = "bandpass"; bp.frequency.value = 900; bp.Q.value = 3;
    this.env(g, t, 0.5, 0.002, 0.09);
    n.connect(bp).connect(g).connect(this.sfx!);
    n.start(t); n.stop(t + 0.15);
    [660, 990, 1485].forEach((f, i) => {
      const o = c.createOscillator(), og = c.createGain();
      o.frequency.value = f;
      this.env(og, t, 0.06 / (i + 1), 0.003, 0.5);
      o.connect(og).connect(this.sfx!);
      o.start(t); o.stop(t + 0.6);
    });
  }

  startSting() {
    if (!this.ready()) return;
    const c = this.ctx!, t = c.currentTime;
    const o = c.createOscillator(), g = c.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(90, t);
    o.frequency.exponentialRampToValueAtTime(32, t + 2.2);
    this.env(g, t, 0.9, 0.02, 2.4);
    o.connect(g).connect(this.sfx!);
    o.start(t); o.stop(t + 2.6);
    this.bell(t + 0.05, 196);
    this.creak(t + 0.6);
  }

  bell(t: number, base: number) {
    const c = this.ctx!;
    [1, 2.0, 2.4, 3.0, 4.2, 5.4].forEach((r, i) => {
      const o = c.createOscillator(), g = c.createGain();
      o.frequency.value = base * r;
      this.env(g, t, 0.18 / (i + 1), 0.004, 4 - i * 0.5);
      o.connect(g).connect(this.sfx!);
      o.start(t); o.stop(t + 4.2);
    });
  }

  stairsCreak(ascending: boolean) {
    if (!this.ready()) return;
  
    const ctx = this.ctx!;
    const t = ctx.currentTime;
  
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
  
    oscillator.type = "sawtooth";
  
    oscillator.frequency.setValueAtTime(
      ascending ? 115 : 90,
      t
    );
  
    oscillator.frequency.exponentialRampToValueAtTime(
      ascending ? 65 : 45,
      t + 0.35
    );
  
    filter.type = "lowpass";
    filter.frequency.value = 650;
  
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.12, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
  
    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfx!);
  
    oscillator.start(t);
    oscillator.stop(t + 0.42);
  }
  
  doorLocked() {
    if (!this.ready()) return;
  
    const ctx = this.ctx!;
    const t = ctx.currentTime;
  
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
  
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(170, t);
    oscillator.frequency.exponentialRampToValueAtTime(
      95,
      t + 0.12
    );
  
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.18, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  
    oscillator.connect(gain);
    gain.connect(this.sfx!);
  
    oscillator.start(t);
    oscillator.stop(t + 0.2);
  }

  doorCreak() { if (this.ready()) this.creak(this.ctx!.currentTime); }

  creak(t: number) {
    const c = this.ctx!;
    const o = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain();
    const bp = c.createBiquadFilter(), g = c.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(140, t);
    o.frequency.linearRampToValueAtTime(95, t + 1.4);
    lfo.frequency.value = 28; lg.gain.value = 40;
    lfo.connect(lg).connect(o.frequency);
    bp.type = "bandpass"; bp.frequency.value = 1100; bp.Q.value = 6;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.12, t + 0.3);
    g.gain.linearRampToValueAtTime(0.0001, t + 1.5);
    o.connect(bp).connect(g).connect(this.sfx!);
    o.start(t); lfo.start(t); o.stop(t + 1.6); lfo.stop(t + 1.6);
  }


  thunder(delay = 0.4) {
    if (!this.ready()) return;
    const c = this.ctx!, t = c.currentTime;
    const n1 = this.noiseSrc(), hp = c.createBiquadFilter(), g1 = c.createGain();
    hp.type = "highpass"; hp.frequency.value = 1800;
    this.env(g1, t, 0.35, 0.002, 0.25);
    n1.connect(hp).connect(g1).connect(this.sfx!);
    n1.start(t); n1.stop(t + 0.3);
    const s = t + delay;
    const n2 = this.noiseSrc(true), lp = c.createBiquadFilter(), g2 = c.createGain();
    lp.type = "lowpass"; lp.frequency.setValueAtTime(600, s); lp.frequency.exponentialRampToValueAtTime(90, s + 4);
    g2.gain.setValueAtTime(0.0001, s);
    g2.gain.exponentialRampToValueAtTime(1.0, s + 0.15);
    g2.gain.exponentialRampToValueAtTime(0.4, s + 0.9);
    g2.gain.exponentialRampToValueAtTime(0.7, s + 1.4);
    g2.gain.exponentialRampToValueAtTime(0.0001, s + 5);
    n2.connect(lp).connect(g2).connect(this.sfx!);
    n2.start(s); n2.stop(s + 5.2);
  }

  crow(t0?: number) {
    if (!this.ready()) return;
    const c = this.ctx!, t = t0 ?? c.currentTime;
    const pan = c.createStereoPanner(); pan.pan.value = Math.random() * 1.6 - 0.8;
    pan.connect(this.amb!);
    const caws = 2 + Math.floor(Math.random() * 2);
    for (let k = 0; k < caws; k++) {
      const s = t + k * 0.42;
      const o = c.createOscillator(), o2 = c.createOscillator();
      const bp = c.createBiquadFilter(), g = c.createGain();
      o.type = "sawtooth"; o2.type = "square";
      const f = 520 + Math.random() * 80;
      o.frequency.setValueAtTime(f, s); o.frequency.linearRampToValueAtTime(f * 0.7, s + 0.28);
      o2.frequency.setValueAtTime(f * 1.01, s); o2.frequency.linearRampToValueAtTime(f * 0.69, s + 0.28);
      bp.type = "bandpass"; bp.frequency.value = 1400; bp.Q.value = 2.5;
      g.gain.setValueAtTime(0.0001, s);
      g.gain.exponentialRampToValueAtTime(0.18, s + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, s + 0.3);
      o.connect(bp); o2.connect(bp); bp.connect(g).connect(pan);
      o.start(s); o2.start(s); o.stop(s + 0.32); o2.stop(s + 0.32);
    }
  }

  flutter() {
    if (!this.ready()) return;
    const c = this.ctx!, t = c.currentTime;
    for (let i = 0; i < 14; i++) {
      const s = t + i * 0.07 + Math.random() * 0.03;
      const n = this.noiseSrc(), bp = c.createBiquadFilter(), g = c.createGain();
      bp.type = "bandpass"; bp.frequency.value = 500 + Math.random() * 400; bp.Q.value = 1;
      this.env(g, s, 0.12 * (1 - i / 16), 0.01, 0.06);
      n.connect(bp).connect(g).connect(this.amb!);
      n.start(s); n.stop(s + 0.1);
    }
  }

  owl() {
    if (!this.ready()) return;
    const c = this.ctx!, t = c.currentTime;
    [0, 0.55, 0.8].forEach((d, i) => {
      const s = t + d, o = c.createOscillator(), g = c.createGain();
      o.frequency.setValueAtTime(i === 0 ? 400 : 370, s);
      o.frequency.linearRampToValueAtTime(i === 0 ? 360 : 330, s + 0.35);
      g.gain.setValueAtTime(0.0001, s);
      g.gain.exponentialRampToValueAtTime(0.09, s + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, s + (i === 0 ? 0.45 : 0.3));
      o.connect(g).connect(this.amb!);
      o.start(s); o.stop(s + 0.5);
    });
  }

  setAmbience(a: Ambience) {
    this.wanted = a;
    if (!this.ctx || a === this.current) return;
    this.stopAmbience();
    this.current = a;
    if (a === "exterior") this.startExterior();
    if (a === "interior") this.startInterior();
    if (a === "lobby") this.startLobby();
  }

  private keep(...n: AudioNode[]) { this.ambienceNodes.push(...n); }
  private every(min: number, max: number, fn: () => void) {
    const loop = () => {
      const id = window.setTimeout(() => { fn(); loop(); }, (min + Math.random() * (max - min)) * 1000);
      this.timers.push(id);
    };
    loop();
  }

  private fadeIn(g: GainNode, v: number) {
    const t = this.ctx!.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 2.5);
  }

  private drone(freqs: number[], vol: number) {
    const c = this.ctx!, g = c.createGain(), lp = c.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 500;
    g.connect(this.amb!); lp.connect(g);
    freqs.forEach((f) => {
      const o = c.createOscillator(); o.type = "triangle"; o.frequency.value = f;
      o.detune.value = Math.random() * 10 - 5;
      o.connect(lp); o.start(); this.keep(o);
    });
    this.fadeIn(g, vol);
    this.keep(g, lp);
  }

  private startExterior() {
    const c = this.ctx!;
    const n = this.noiseSrc(true), bp = c.createBiquadFilter(), g = c.createGain();
    const lfo = c.createOscillator(), lg = c.createGain();
    bp.type = "bandpass"; bp.frequency.value = 420; bp.Q.value = 4;
    lfo.frequency.value = 0.07; lg.gain.value = 260;
    lfo.connect(lg).connect(bp.frequency);
    n.connect(bp).connect(g).connect(this.amb!);
    n.start(); lfo.start();
    this.fadeIn(g, 0.5);
    const r = this.noiseSrc(true), hp = c.createBiquadFilter(), rg = c.createGain();
    hp.type = "highpass"; hp.frequency.value = 3500;
    r.connect(hp).connect(rg).connect(this.amb!); r.start();
    this.fadeIn(rg, 0.06);
    this.drone([55, 82.4, 110.3], 0.07); 
    this.keep(n, bp, g, lfo, lg, r, hp, rg);
    this.every(6, 14, () => this.crow());
    this.every(14, 30, () => this.owl());
    this.every(18, 35, () => this.flutter());
  }

  private startInterior(randomThunder = true) {
    const c = this.ctx!;
    const n = this.noiseSrc(true), lp = c.createBiquadFilter(), g = c.createGain();
    lp.type = "lowpass"; lp.frequency.value = 700;
    n.connect(lp).connect(g).connect(this.amb!); n.start();
    this.fadeIn(g, 0.05);
    this.keep(n, lp, g);
    this.every(0.05, 0.4, () => {
      const t = c.currentTime, s = this.noiseSrc(), hp = c.createBiquadFilter(), sg = c.createGain();
      hp.type = "highpass"; hp.frequency.value = 2000 + Math.random() * 3000;
      this.env(sg, t, 0.04 + Math.random() * 0.08, 0.001, 0.02 + Math.random() * 0.03);
      s.connect(hp).connect(sg).connect(this.amb!); s.start(t); s.stop(t + 0.08);
    });
    let tock = false;
    this.every(1, 1, () => {
      const t = c.currentTime, o = c.createOscillator(), og = c.createGain();
      o.frequency.value = tock ? 1800 : 2300; tock = !tock;
      this.env(og, t, 0.03, 0.001, 0.04);
      o.connect(og).connect(this.amb!); o.start(t); o.stop(t + 0.06);
    });
    this.drone([65.4, 98, 130.8, 155.6], 0.06); 
    if (randomThunder) this.every(25, 50, () => this.thunder(1.5));
    this.every(30, 60, () => this.creak(c.currentTime));
  }
  
  private startLobby() {
    this.startInterior(false);
    const c = this.ctx!;
    const rain = this.noiseSrc(true), hp = c.createBiquadFilter(), lp = c.createBiquadFilter(), rg = c.createGain();
    hp.type = "highpass"; hp.frequency.value = 2500;
    lp.type = "lowpass"; lp.frequency.value = 9000;
    rain.connect(hp).connect(lp).connect(rg).connect(this.amb!); rain.start();
    this.fadeIn(rg, 0.05);
    this.keep(rain, hp, lp, rg);
    this.drone([73.4, 110, 146.8, 174.6], 0.05);

    // A minor, music-box style. 0 = rest.
    const melody = [220, 261.6, 329.6, 0, 293.7, 261.6, 220, 0, 246.9, 293.7, 349.2, 0, 329.6, 293.7, 261.6, 0];
    let step = 0;
    this.every(1.25, 1.25, () => {
      const f = melody[step++ % melody.length];
      if (!f) return;
      const t = c.currentTime;
      [1, 2, 3.01].forEach((r, i) => {
        const o = c.createOscillator(), g = c.createGain();
        o.type = "sine"; o.frequency.value = f * 2 * r;
        this.env(g, t, 0.05 / (i + 1), 0.004, 1.6 / (i + 1));
        o.connect(g).connect(this.amb!);
        o.start(t); o.stop(t + 1.8);
      });
    });
  }

  private stopAmbience() {
    this.timers.forEach((t) => clearTimeout(t));
    this.timers = [];
    const c = this.ctx!;
    this.ambienceNodes.forEach((n) => {
      if (n instanceof GainNode) n.gain.setTargetAtTime(0.0001, c.currentTime, 0.4);
      if (n instanceof AudioScheduledSourceNode) { try { n.stop(c.currentTime + 2); } catch {} }
    });
    this.ambienceNodes = [];
    this.current = "none";
  }
}

export const sound = new SoundEngine();