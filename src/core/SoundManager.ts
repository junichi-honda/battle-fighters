// =============================================================
// サウンド(BGM 4曲 + 効果音)
// 外部音源ファイルを使わず WebAudio で「宇宙テクノ/ロック調」を生成する
// =============================================================

type BgmName = 'title' | 'stage' | 'boss' | 'ending';

interface Song {
  bpm: number;
  // MIDIノート番号(0 = 休符)。bass と lead は同じ長さのループ
  bass: number[];
  lead: number[];
  leadWave: OscillatorType;
  bassWave: OscillatorType;
  drums: boolean;
}

const SONGS: Record<BgmName, Song> = {
  // タイトル: かっこいいヒーロー風
  title: {
    bpm: 128,
    bass: [36, 0, 36, 36, 41, 0, 41, 41, 43, 0, 43, 43, 41, 41, 39, 39],
    lead: [60, 0, 64, 67, 72, 0, 67, 64, 65, 0, 69, 72, 71, 69, 67, 64],
    leadWave: 'square',
    bassWave: 'sawtooth',
    drums: true
  },
  // 通常ステージ: 疾走感のある宇宙テクノ
  stage: {
    bpm: 140,
    bass: [33, 33, 0, 33, 36, 36, 0, 36, 31, 31, 0, 31, 38, 38, 36, 33],
    lead: [57, 60, 64, 60, 57, 60, 64, 67, 55, 58, 62, 58, 62, 65, 64, 60],
    leadWave: 'square',
    bassWave: 'square',
    drums: true
  },
  // ボス戦: 緊張感のあるロック調マイナー
  boss: {
    bpm: 168,
    bass: [31, 31, 31, 34, 31, 31, 30, 30, 31, 31, 31, 34, 36, 36, 37, 37],
    lead: [67, 0, 66, 67, 70, 67, 66, 63, 67, 0, 70, 72, 73, 72, 70, 66],
    leadWave: 'sawtooth',
    bassWave: 'sawtooth',
    drums: true
  },
  // エンディング: あたたかくゆったり
  ending: {
    bpm: 88,
    bass: [36, 0, 0, 0, 33, 0, 0, 0, 38, 0, 0, 0, 43, 0, 41, 0],
    lead: [64, 67, 72, 71, 69, 0, 64, 0, 62, 65, 69, 67, 71, 0, 72, 0],
    leadWave: 'triangle',
    bassWave: 'triangle',
    drums: false
  }
};

class SoundManagerImpl {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private currentBgm: BgmName | null = null;
  private step = 0;
  private nextStepTime = 0;
  private timer: number | null = null;

  private ensureCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AC = window.AudioContext ?? (window as any).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      this.master.connect(this.ctx.destination);
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = 0.35;
      this.bgmGain.connect(this.master);
    }
    return this.ctx;
  }

  /** ユーザー操作をきっかけに呼ぶ(ブラウザの自動再生制限対策) */
  unlock(): void {
    const ctx = this.ensureCtx();
    if (ctx && ctx.state === 'suspended') {
      void ctx.resume();
    }
  }

  // ---------------- BGM ----------------

  playBgm(name: BgmName): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    if (this.currentBgm === name) return;
    this.stopBgm();
    this.currentBgm = name;
    this.step = 0;
    this.nextStepTime = ctx.currentTime + 0.05;
    this.timer = window.setInterval(() => this.scheduler(), 60);
  }

  stopBgm(): void {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    this.currentBgm = null;
  }

  private scheduler(): void {
    const ctx = this.ctx;
    if (!ctx || !this.currentBgm) return;
    const song = SONGS[this.currentBgm];
    const stepDur = 60 / song.bpm / 2; // 8分音符
    while (this.nextStepTime < ctx.currentTime + 0.2) {
      this.playStep(song, this.step % song.bass.length, this.nextStepTime, stepDur);
      this.nextStepTime += stepDur;
      this.step++;
    }
  }

  private playStep(song: Song, i: number, t: number, dur: number): void {
    const bass = song.bass[i];
    const lead = song.lead[i];
    if (bass > 0) this.note(bass, t, dur * 0.9, song.bassWave, 0.22, this.bgmGain!);
    if (lead > 0) this.note(lead, t, dur * 0.85, song.leadWave, 0.13, this.bgmGain!);
    if (song.drums) {
      if (i % 4 === 0) this.kick(t);
      if (i % 4 === 2) this.hat(t);
    }
  }

  private midiToFreq(n: number): number {
    return 440 * Math.pow(2, (n - 69) / 12);
  }

  private note(
    midi: number,
    t: number,
    dur: number,
    wave: OscillatorType,
    vol: number,
    dest: AudioNode
  ): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = wave;
    osc.frequency.value = this.midiToFreq(midi);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(dest);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private kick(t: number): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    g.gain.setValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
    osc.connect(g).connect(this.bgmGain!);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  private hat(t: number): void {
    const ctx = this.ctx!;
    const buf = this.noiseBuffer();
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 7000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.08, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    src.connect(hp).connect(g).connect(this.bgmGain!);
    src.start(t);
    src.stop(t + 0.06);
  }

  private noiseBuf: AudioBuffer | null = null;
  private noiseBuffer(): AudioBuffer {
    const ctx = this.ctx!;
    if (!this.noiseBuf) {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      this.noiseBuf = buf;
    }
    return this.noiseBuf;
  }

  // ---------------- 効果音 ----------------

  sfxAttack(): void {
    this.sweepNoise(0.08, 3000, 800, 0.18);
  }

  sfxJump(): void {
    this.sweepTone(300, 620, 0.12, 'square', 0.14);
  }

  sfxSpecial(): void {
    this.sweepTone(120, 900, 0.4, 'sawtooth', 0.28);
    this.sweepNoise(0.3, 6000, 1200, 0.15);
  }

  /** 時止めの「キーン」 */
  sfxTimeStop(): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    for (const f of [2400, 3600]) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      g.gain.setValueAtTime(0.16, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
      osc.connect(g).connect(this.master!);
      osc.start(t);
      osc.stop(t + 1.2);
    }
  }

  sfxEnemyDown(): void {
    this.sweepTone(500, 120, 0.22, 'square', 0.18);
  }

  sfxLevelUp(): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    [60, 64, 67, 72].forEach((n, i) => {
      this.note(n + 12, t + i * 0.09, 0.18, 'square', 0.16, this.master!);
    });
  }

  sfxItem(): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.note(84, t, 0.09, 'sine', 0.16, this.master!);
    this.note(91, t + 0.08, 0.14, 'sine', 0.16, this.master!);
  }

  sfxDamage(): void {
    this.sweepTone(220, 70, 0.18, 'sawtooth', 0.2);
  }

  sfxClear(): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    [60, 64, 67, 72, 76].forEach((n, i) => {
      this.note(n, t + i * 0.12, 0.3, 'square', 0.15, this.master!);
    });
  }

  private sweepTone(
    from: number,
    to: number,
    dur: number,
    wave: OscillatorType,
    vol: number
  ): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(to, 1), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(this.master!);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private sweepNoise(dur: number, from: number, to: number, vol: number): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer();
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(from, t);
    bp.frequency.exponentialRampToValueAtTime(Math.max(to, 1), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(bp).connect(g).connect(this.master!);
    src.start(t);
    src.stop(t + dur + 0.02);
  }
}

export const Sound = new SoundManagerImpl();
