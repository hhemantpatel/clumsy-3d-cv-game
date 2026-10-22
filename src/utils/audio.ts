// Zero-asset Web Audio API procedural sound engine & calming ambient music synthesizer
// Features:
// 1. Procedural SFX (Footsteps, bumps, interactions, harvests, level up)
// 2. Dynamic organic wind breeze with swelling gust cycles (non-looping)
// 3. Procedural birdsong and meadow humming with randomized intervals, species, and stereo panning
// 4. Generative Studio Ghibli-inspired calming acoustic piano tune (continuous, peaceful, non-repetitive)

interface Chord {
  name: string;
  bassFreq: number;       // Deep root note (Hz)
  fifthFreq: number;      // Perfect fifth body (Hz)
  padFreq: number;        // Warm chord body (Hz)
  palette: number[];      // Relaxing pentatonic melody tones (Hz)
}

// 4-Bar Meditative Ghibli-style progression in D Major / B Minor (~52 BPM)
const CALM_CHORDS: Chord[] = [
  {
    name: 'Dmaj9',
    bassFreq: 73.42,      // D2
    fifthFreq: 110.00,    // A2
    padFreq: 146.83,      // D3
    palette: [220.00, 277.18, 293.66, 329.63, 369.99, 440.00, 554.37, 587.33], // A3, C#4, D4, E4, F#4, A4, C#5, D5
  },
  {
    name: 'Bm9',
    bassFreq: 61.74,      // B1
    fifthFreq: 92.50,     // F#2
    padFreq: 123.47,      // B2
    palette: [220.00, 246.94, 293.66, 329.63, 369.99, 440.00, 493.88, 587.33], // A3, B3, D4, E4, F#4, A4, B4, D5
  },
  {
    name: 'Gmaj9',
    bassFreq: 49.00,      // G1
    fifthFreq: 73.42,     // D2
    padFreq: 98.00,       // G2
    palette: [196.00, 246.94, 293.66, 329.63, 369.99, 440.00, 493.88, 587.33], // G3, B3, D4, E4, F#4, A4, B4, D5
  },
  {
    name: 'A7sus4',
    bassFreq: 55.00,      // A1
    fifthFreq: 82.41,     // E2
    padFreq: 110.00,      // A2
    palette: [220.00, 277.18, 293.66, 329.63, 440.00, 554.37, 659.25],         // A3, C#4, D4, E4, A4, C#5, E5
  },
];

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isAudioUnlocked: boolean = false;

  // Master Gain Node (routes to ctx.destination)
  private masterGain: GainNode | null = null;

  // Sub-buses
  private sfxGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  // Real 3-minute Calm Acoustic BGM track
  private bgmAudio: HTMLAudioElement | null = null;
  private bgmSource: MediaElementAudioSourceNode | null = null;

  // Ethereal Space / Delay Bus for gentle Ghibli room acoustics
  private spaceBus: GainNode | null = null;

  // Dynamic Wind state
  private windFilter: BiquadFilterNode | null = null;
  private windGain: GainNode | null = null;
  private windTimer: number | null = null;

  // Procedural Birdsong state
  private birdTimer: number | null = null;

  // Generative Calming Music state (fallback)
  private musicTimer: number | null = null;
  private musicStep: number = 0;
  private lastMelodyPaletteIdx: number = 3;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // SFX Sub-bus
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Ambient Sub-bus (Wind + Birds)
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      // Music Sub-bus (Calm Piano BGM)
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.38, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      // Initialize Real 3-minute Calm Acoustic Piano BGM
      this.initBGM();

      // Ethereal Delay Space Bus
      this.initSpaceBus();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // 3-Minute Calm Acoustic Piano Track (/audio/bgm.mp3)
  private initBGM() {
    if (typeof Audio === 'undefined' || this.bgmAudio || !this.ctx || !this.musicGain) return;
    try {
      this.bgmAudio = new Audio('/audio/bgm.mp3');
      this.bgmAudio.loop = true;
      this.bgmAudio.preload = 'auto';

      try {
        this.bgmSource = this.ctx.createMediaElementSource(this.bgmAudio);
        this.bgmSource.connect(this.musicGain);
      } catch {
        // Fallback volume if media element source routing is restricted
        this.bgmAudio.volume = this.isMuted ? 0 : 0.35;
      }

      this.bgmAudio.addEventListener('error', () => {
        // Fallback to generative procedural tune if file is not found
        this.startCalmingMusic();
      });
    } catch {
      // Ignore audio init restrictions
    }
  }

  // Soft ping-pong feedback delay for warm acoustic resonance
  private initSpaceBus() {
    if (!this.ctx || !this.musicGain) return;
    try {
      this.spaceBus = this.ctx.createGain();
      this.spaceBus.gain.setValueAtTime(0.65, this.ctx.currentTime);

      const delay = this.ctx.createDelay();
      delay.delayTime.value = 0.42;

      const delayFeedback = this.ctx.createGain();
      delayFeedback.gain.value = 0.22;

      const delayFilter = this.ctx.createBiquadFilter();
      delayFilter.type = 'lowpass';
      delayFilter.frequency.value = 850;

      // Loop: spaceBus -> delay -> delayFilter -> delayFeedback -> delay
      this.spaceBus.connect(delay);
      delay.connect(delayFilter);
      delayFilter.connect(delayFeedback);
      delayFeedback.connect(delay);

      // Delay output connects to musicGain
      delay.connect(this.musicGain);
    } catch {
      // Ignore if delay routing encounters browser restrictions
    }
  }

  public unlock() {
    this.initContext();
    this.isAudioUnlocked = true;

    // Start 3-minute Calming BGM (or procedural fallback)
    this.startBGM();

    // Start procedural atmospheric layers
    this.startDynamicWind();
    this.startProceduralBirds();
  }

  private startBGM() {
    if (!this.bgmAudio) {
      this.startCalmingMusic();
      return;
    }
    const playPromise = this.bgmAudio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Fallback if browser requires click
      });
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1.0, this.ctx.currentTime);
    }
    if (this.bgmAudio) {
      this.bgmAudio.muted = this.isMuted;
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // =========================================================================
  // 1. PROCEDURAL SOUND EFFECTS
  // =========================================================================

  // Comical clumsy footstep pop
  public playStep(isLeft: boolean) {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;

      osc.type = 'triangle';
      const freq = isLeft ? 140 : 160;
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.08);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.08);
    } catch {
      // Audio context might be restricted
    }
  }

  // Comedic bump / stumble boing sound
  public playBump() {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.25);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.25);
    } catch {
      // Audio context might be restricted
    }
  }

  // Crisp modern interaction chime (chord)
  public playInteract() {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    try {
      const t = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio

      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const noteTime = t + idx * 0.04;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.06, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.4);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(noteTime);
        osc.stop(noteTime + 0.4);
      });
    } catch {
      // Audio context might be restricted
    }
  }

  // Cheerful harvesting chime
  public playHarvest() {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    try {
      const t = this.ctx.currentTime;
      const notes = [659.25, 880.0, 1174.66]; // E5, A5, D6
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const noteTime = t + idx * 0.05;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.09, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.25);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(noteTime);
        osc.stop(noteTime + 0.25);
      });
    } catch {
      // Audio context might be restricted
    }
  }

  // Soft earthy seed planting pop
  public playPlant() {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(240, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.1);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.1);
    } catch {
      // Audio context might be restricted
    }
  }

  // Celebratory level-up / quest completion fanfare
  public playLevelUp() {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    try {
      const t = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const noteTime = t + idx * 0.08;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.12, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.4);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(noteTime);
        osc.stop(noteTime + 0.4);
      });
    } catch {
      // Audio context might be restricted
    }
  }

  // =========================================================================
  // 2. DYNAMIC ORGANIC WIND GUSTS (Non-looping, Natural Swells)
  // =========================================================================

  private startDynamicWind() {
    if (this.windFilter || !this.ctx || !this.ambientGain) return;
    try {
      // Generate 3 seconds of warm pink/brown noise
      const bufferSize = this.ctx.sampleRate * 3;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99 * b0 + white * 0.05;
        b1 = 0.96 * b1 + white * 0.11;
        b2 = 0.86 * b2 + white * 0.25;
        output[i] = (b0 + b1 + b2) * 0.18;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Bandpass filter for breathy, natural air turbulence
      this.windFilter = this.ctx.createBiquadFilter();
      this.windFilter.type = 'bandpass';
      this.windFilter.Q.setValueAtTime(0.85, this.ctx.currentTime);
      this.windFilter.frequency.setValueAtTime(260, this.ctx.currentTime);

      this.windGain = this.ctx.createGain();
      this.windGain.gain.setValueAtTime(0.025, this.ctx.currentTime);

      whiteNoise.connect(this.windFilter);
      this.windFilter.connect(this.windGain);
      this.windGain.connect(this.ambientGain);

      whiteNoise.start();

      // Begin dynamic gust modulation loop
      this.scheduleNextWindGust();
    } catch {
      // Ignore if browser restricts autoplay
    }
  }

  // Randomly swells and recedes wind filter frequency & gain (natural irregular gusts)
  private scheduleNextWindGust() {
    if (!this.ctx || !this.windFilter || !this.windGain) return;

    const t = this.ctx.currentTime;
    const gustDuration = 4.0 + Math.random() * 5.0; // 4 to 9 seconds gust length
    const targetFreq = 180 + Math.random() * 320;   // 180 Hz (calm lull) to 500 Hz (swelling gust)
    const targetGain = 0.015 + Math.random() * 0.035;

    try {
      this.windFilter.frequency.linearRampToValueAtTime(targetFreq, t + gustDuration);
      this.windGain.gain.linearRampToValueAtTime(targetGain, t + gustDuration);
    } catch {
      // AudioParam ramp safety
    }

    // Schedule next gust change slightly before current ends for continuous smooth flow
    this.windTimer = window.setTimeout(() => {
      this.scheduleNextWindGust();
    }, (gustDuration - 0.5) * 1000);
  }

  // =========================================================================
  // 3. PROCEDURAL BIRDSONG & HUMMING (Organic, Non-looping, Stereo Panning)
  // =========================================================================

  private startProceduralBirds() {
    if (this.birdTimer !== null) return;
    this.scheduleNextBirdCall();
  }

  private scheduleNextBirdCall() {
    // Randomized interval between birds: 3.5 to 11 seconds (organic forest pacing)
    const delayMs = 3500 + Math.random() * 7500;
    this.birdTimer = window.setTimeout(() => {
      this.triggerRandomBirdCall();
      this.scheduleNextBirdCall();
    }, delayMs);
  }

  private triggerRandomBirdCall() {
    if (this.isMuted || !this.ctx || !this.ambientGain) return;
    try {
      const t = this.ctx.currentTime;
      const species = Math.floor(Math.random() * 4); // 4 distinct natural bird patterns
      const pitchFactor = 0.88 + Math.random() * 0.24; // Subtle natural pitch transposition
      const baseGain = 0.025 + Math.random() * 0.02;  // Gentle distant volume

      // Create stereo panner for spatial birds in trees
      let pannerNode: AudioNode = this.ambientGain;
      if (this.ctx.createStereoPanner) {
        const panner = this.ctx.createStereoPanner();
        panner.pan.setValueAtTime((Math.random() - 0.5) * 1.5, t); // Panned -0.75 (left trees) to +0.75 (right trees)
        panner.connect(this.ambientGain);
        pannerNode = panner;
      }

      if (species === 0) {
        // Pattern 1: Sweet Robin Two-Tone Whistle (rising call)
        this.synthChirp(2700 * pitchFactor, 2950 * pitchFactor, 0.12, t, baseGain, pannerNode);
        this.synthChirp(3300 * pitchFactor, 3100 * pitchFactor, 0.16, t + 0.18, baseGain * 1.1, pannerNode);
      } else if (species === 1) {
        // Pattern 2: Playful Meadow Warbler (3 rapid micro-chirps)
        this.synthChirp(3500 * pitchFactor, 2900 * pitchFactor, 0.05, t, baseGain * 0.85, pannerNode);
        this.synthChirp(3900 * pitchFactor, 3200 * pitchFactor, 0.05, t + 0.08, baseGain, pannerNode);
        this.synthChirp(3600 * pitchFactor, 2800 * pitchFactor, 0.06, t + 0.16, baseGain * 0.8, pannerNode);
      } else if (species === 2) {
        // Pattern 3: Gentle Meadow Dove / Humming Coo (soft warm slide)
        this.synthHummingCoo(860 * pitchFactor, 1080 * pitchFactor, 820 * pitchFactor, 0.38, t, baseGain * 1.4, pannerNode);
      } else {
        // Pattern 4: Bright Canary Sweet Chirp (high arching trill)
        this.synthChirp(2800 * pitchFactor, 4200 * pitchFactor, 0.08, t, baseGain * 0.9, pannerNode);
        this.synthChirp(4100 * pitchFactor, 3600 * pitchFactor, 0.09, t + 0.10, baseGain * 0.8, pannerNode);
      }
    } catch {
      // Audio context safety
    }
  }

  // Quick frequency-swept bird chirp
  private synthChirp(startFreq: number, endFreq: number, dur: number, startTime: number, vol: number, dest: AudioNode) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(100, endFreq), startTime + dur);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + dur * 0.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(startTime);
    osc.stop(startTime + dur);
  }

  // Soft low warm humming coo
  private synthHummingCoo(f1: number, f2: number, f3: number, dur: number, startTime: number, vol: number, dest: AudioNode) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(f1, startTime);
    osc.frequency.linearRampToValueAtTime(f2, startTime + dur * 0.45);
    osc.frequency.linearRampToValueAtTime(f3, startTime + dur);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + dur * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(startTime);
    osc.stop(startTime + dur);
  }

  // =========================================================================
  // 4. GENERATIVE CALMING PIANO TUNE (Continuous, Peaceful, Studio Ghibli Tone)
  // =========================================================================

  private startCalmingMusic() {
    if (this.musicTimer !== null) return;
    this.scheduleNextMusicBeat();
  }

  private scheduleNextMusicBeat() {
    // 52 BPM meditative pacing (~1.15 seconds per beat)
    const beatDurationMs = 1150;

    this.musicTimer = window.setTimeout(() => {
      this.playGenerativeBeat();
      this.scheduleNextMusicBeat();
    }, beatDurationMs);
  }

  private playGenerativeBeat() {
    if (this.isMuted || !this.ctx || !this.musicGain) return;

    try {
      const t = this.ctx.currentTime;
      // 8 beats per chord, 4 chords in progression = 32 beats per full harmonic cycle
      const chordIdx = Math.floor((this.musicStep % 32) / 8);
      const beatInChord = this.musicStep % 8;
      const chord = CALM_CHORDS[chordIdx];

      // On Beat 0: Play deep warm bass drone & gentle harmonic pad
      if (beatInChord === 0) {
        this.synthBassDrone(chord.bassFreq, t);
        this.synthWarmPad(chord.fifthFreq, chord.padFreq, t);
      }

      // On beats, with 55% probability, play a delicate felt piano note
      // (Rests are intentional: they allow wind & birds to breathe peacefully)
      const shouldPlayNote = beatInChord === 0 || beatInChord === 3 || beatInChord === 6 || Math.random() < 0.45;

      if (shouldPlayNote) {
        // Choose melody note with smooth voice leading (nearby in palette)
        const stepDelta = (Math.random() > 0.5 ? 1 : -1) * (Math.random() < 0.7 ? 1 : 2);
        let nextIdx = this.lastMelodyPaletteIdx + stepDelta;
        if (nextIdx < 0) nextIdx = 0;
        if (nextIdx >= chord.palette.length) nextIdx = chord.palette.length - 1;
        this.lastMelodyPaletteIdx = nextIdx;

        const noteFreq = chord.palette[nextIdx];
        const noteVol = 0.08 + Math.random() * 0.04;
        this.synthFeltPiano(noteFreq, t, noteVol);
      }

      this.musicStep = (this.musicStep + 1) % 32;
    } catch {
      // Audio safety
    }
  }

  // Deep warm acoustic bass drone with slow swell
  private synthBassDrone(freq: number, startTime: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220, startTime);

    const dur = 7.8;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(0.14, startTime + 1.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(startTime);
    osc.stop(startTime + dur);
  }

  // Gentle warm fifth pad chord body
  private synthWarmPad(f1: number, f2: number, startTime: number) {
    if (!this.ctx || !this.musicGain) return;
    [f1, f2].forEach((freq) => {
      if (!this.ctx || !this.musicGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, startTime);

      const dur = 7.0;
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(0.045, startTime + 1.5);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start(startTime);
      osc.stop(startTime + dur);
    });
  }

  // Soft felt acoustic piano / music box timbre (dual-sine with soft triangle body)
  private synthFeltPiano(freq: number, startTime: number, vol: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc1 = this.ctx.createOscillator(); // Pure bell fundamental
    const osc2 = this.ctx.createOscillator(); // Warm woody body
    const gain1 = this.ctx.createGain();
    const gain2 = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, startTime);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, startTime);

    const dur = 2.2;
    gain1.gain.setValueAtTime(0.0001, startTime);
    gain1.gain.linearRampToValueAtTime(vol, startTime + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

    gain2.gain.setValueAtTime(0.0001, startTime);
    gain2.gain.linearRampToValueAtTime(vol * 0.35, startTime + 0.03);
    gain2.gain.exponentialRampToValueAtTime(0.0001, startTime + dur * 0.8);

    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(filter);
    gain2.connect(filter);

    // Route direct sound to musicGain
    filter.connect(this.musicGain);

    // Route subtle portion to ethereal delay space bus for dreamy Ghibli acoustic ambience
    if (this.spaceBus) {
      filter.connect(this.spaceBus);
    }

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + dur);
    osc2.stop(startTime + dur);
  }
}

export const soundManager = new SoundManager();
if (typeof window !== 'undefined') {
  (window as any).__soundManager = soundManager;
}
