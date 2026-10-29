// src/core/Settings.js
// Quality presets, audio, control configuration & benchmarks

export const QUALITY_PRESETS = {
  LOW: {
    name: 'Low',
    pixelRatioMax: 1.0,
    shadows: false,
    bloom: false,
    rainParticles: 80,
    lightShafts: false,
    dpr: 1.0,
    antialias: false
  },
  MEDIUM: {
    name: 'Medium',
    pixelRatioMax: 1.25,
    shadows: true,
    shadowMapSize: 1024,
    bloom: true,
    rainParticles: 200,
    lightShafts: true,
    dpr: 1.25,
    antialias: true
  },
  HIGH: {
    name: 'High',
    pixelRatioMax: 1.5,
    shadows: true,
    shadowMapSize: 2048,
    bloom: true,
    rainParticles: 400,
    lightShafts: true,
    dpr: 1.5,
    antialias: true
  }
};

class SettingsManager {
  constructor() {
    this.STORAGE_KEY = 'notrace_settings_v1';
    this.data = this.loadDefaults();
    this.load();
  }

  loadDefaults() {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    return {
      quality: isMobile ? 'MEDIUM' : 'HIGH',
      difficulty: 'Agent', // 'Story', 'Agent', 'Hardcore'
      volumeMaster: 0.8,
      volumeSFX: 0.9,
      volumeMusic: 0.6,
      showF3: false,
      subtitles: true,
      colorBlindMode: false,
      hintsEnabled: true
    };
  }

  load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        this.data = { ...this.data, ...JSON.parse(raw) };
      }
    } catch (e) {
      console.warn('[Settings] Failed to load from storage:', e);
    }
  }

  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('[Settings] Failed to save settings:', e);
    }
  }

  getPreset() {
    return QUALITY_PRESETS[this.data.quality] || QUALITY_PRESETS.MEDIUM;
  }

  setQuality(presetKey) {
    if (QUALITY_PRESETS[presetKey]) {
      this.data.quality = presetKey;
      this.save();
    }
  }
}

export const settings = new SettingsManager();
