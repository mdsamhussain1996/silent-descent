/**
 * Audio.js
 * Procedural WebAudio sound synthesizer for Silent Descent.
 * Generates rain, thunder, helicopter rotors, footsteps, suppressed shots,
 * light pops, laser hums, alarm sirens, radio chatter, and dynamic stealth music.
 */

export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.rainGain = null;
    this.rotorGain = null;
    this.ambientMusicGain = null;
    this.suspicionLevel = 0; // 0: quiet, 1: suspicious, 2: alert/alarm
    this.musicTimer = null;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.initialized = true;
      this.startRainLoop();
      this.startAmbientMusic();
    } catch (e) {
      console.warn('WebAudio not available', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Continuous rain background
  startRainLoop() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Pink/brown filter for heavy rain
      data[i] = (lastOut + 0.03 * white) / 1.03;
      lastOut = data[i];
      data[i] *= 1.8;
    }

    const rainSource = this.ctx.createBufferSource();
    rainSource.buffer = buffer;
    rainSource.loop = true;

    // Filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1400;

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.value = 0.18;

    rainSource.connect(filter);
    filter.connect(this.rainGain);
    this.rainGain.connect(this.ctx.destination);
    rainSource.start(0);
  }

  // Thunder rumble
  playThunder() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(65, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(25, this.ctx.currentTime + 1.8);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 2.0);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 2.2);
  }

  // Helicopter rotor thrum (can adjust volume with distance)
  startHelicopterLoop() {
    if (!this.ctx || this.rotorSource) return;
    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.value = 75;

    // LFO to create chopper chop chop chop (8 Hz)
    lfo.type = 'square';
    lfo.frequency.value = 8;
    lfoGain.gain.value = 40;

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    this.rotorGain = gain;
    this.rotorGain.gain.value = 0.15;

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    lfo.start();
    this.rotorSource = { osc, lfo };
  }

  setHelicopterVolume(vol) {
    if (this.rotorGain) {
      this.rotorGain.gain.setValueAtTime(Math.max(0, Math.min(0.3, vol)), this.ctx.currentTime);
    }
  }

  stopHelicopterLoop() {
    if (this.rotorSource) {
      try {
        this.rotorSource.osc.stop();
        this.rotorSource.lfo.stop();
      } catch (e) {}
      this.rotorSource = null;
    }
  }

  // Footsteps: soft vs running loud click
  playFootstep(isRunning = false, isVent = false) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isVent ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(isRunning ? 180 : 120, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.06);

    gain.gain.setValueAtTime(isRunning ? 0.2 : 0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.07);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.07);
  }

  // Suppressed pistol shot ("thwip!")
  playSuppressedShot() {
    if (!this.ctx) return;
    // Fast pitch sweep down + quick burst of white noise
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  // Light bulb pop & shatter
  playLightPop() {
    if (!this.ctx) return;
    // Pop
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);

    // Glass tinkle
    setTimeout(() => {
      if (!this.ctx) return;
      const tOsc = this.ctx.createOscillator();
      const tGain = this.ctx.createGain();
      tOsc.type = 'sine';
      tOsc.frequency.setValueAtTime(3200, this.ctx.currentTime);
      tGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      tGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      tOsc.connect(tGain);
      tGain.connect(this.ctx.destination);
      tOsc.start();
      tOsc.stop(this.ctx.currentTime + 0.2);
    }, 40);
  }

  // Laser tripwire hum
  playLaserHum() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  // Alarm siren wail
  playAlarmSiren() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(700, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(950, this.ctx.currentTime + 0.25);
    osc.frequency.linearRampToValueAtTime(700, this.ctx.currentTime + 0.5);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.55);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.55);
  }

  // Radio chatter blips
  playRadioBlip() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1100, this.ctx.currentTime);
    osc.frequency.setValueAtTime(1600, this.ctx.currentTime + 0.04);
    osc.frequency.setValueAtTime(900, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.14);
  }

  // Takedown sound (elbow strike)
  playTakedown() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.28, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.16);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.16);
  }

  // Thermal Visor Activate sound
  playThermalToggle(active) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const startF = active ? 400 : 800;
    const endF = active ? 950 : 350;
    osc.frequency.setValueAtTime(startF, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endF, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.16);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.16);
  }

  // Zip Line whir
  playZipWhir() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(520, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(700, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.22);
  }

  // Terminal UI Beeps
  playTerminalBeep(pitch = 880) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(pitch, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  // Dynamic Tense Music Engine
  startAmbientMusic() {
    if (!this.ctx) return;
    let step = 0;
    const bassNotes = [55, 55, 65, 49]; // A1, A1, C2, G1 (tense low notes)

    this.musicTimer = setInterval(() => {
      if (!this.ctx || this.ctx.state !== 'running') return;

      // Play low sub bass drone note
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const note = bassNotes[step % bassNotes.length];

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(note, this.ctx.currentTime);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(this.suspicionLevel > 0 ? 300 : 120, this.ctx.currentTime);

      const volume = this.suspicionLevel === 2 ? 0.16 : (this.suspicionLevel === 1 ? 0.12 : 0.07);
      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.45);

      // Alert drums if suspicionLevel === 2 (Alarm)
      if (this.suspicionLevel === 2 && step % 2 === 0) {
        const drum = this.ctx.createOscillator();
        const dGain = this.ctx.createGain();
        drum.type = 'triangle';
        drum.frequency.setValueAtTime(110, this.ctx.currentTime);
        drum.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.15);
        dGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        dGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
        drum.connect(dGain);
        dGain.connect(this.ctx.destination);
        drum.start();
        drum.stop(this.ctx.currentTime + 0.15);
      }

      step++;
    }, 500); // 120 BPM half-steps
  }

  setSuspicionState(state) {
    // state: 0 = stealth, 1 = suspicious (?), 2 = alert (!)
    this.suspicionLevel = state;
  }

  destroy() {
    if (this.musicTimer) clearInterval(this.musicTimer);
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch (e) {}
    }
  }
}

export const audioSystem = new AudioSystem();
