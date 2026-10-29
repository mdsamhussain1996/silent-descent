// src/core/Save.js
// 3 save slots, campaign progress, trust values, JSON import/export

export class SaveManager {
  constructor() {
    this.currentSlot = 1;
    this.STORAGE_PREFIX = 'notrace_save_slot_';
    this.state = this.loadSlot(1);
  }

  getDefaultState() {
    return {
      slot: this.currentSlot,
      createdAt: Date.now(),
      lastPlayed: Date.now(),
      campaignProgress: {
        currentMission: 'm1_iron_tide',
        completedMissions: [],
        missionRanks: {},
        missionHighScores: {}
      },
      trust: {
        nightfall: 75,
        kestrel: 50
      },
      credits: 1500,
      inventory: {
        weapons: ['pistol_silenced', 'smg_suppressed'],
        gadgets: ['taser', 'camera_recon', 'emp_grenade'],
        activePrimary: 'pistol_silenced',
        activeSecondary: 'smg_suppressed',
        activeGadgets: ['taser', 'camera_recon'],
        attachments: {
          pistol_silenced: ['extended_mag']
        }
      },
      storyChoices: {
        choice1: null,
        choice2: null,
        choice3: null
      },
      intelCollected: []
    };
  }

  loadSlot(slot = 1) {
    this.currentSlot = slot;
    try {
      const raw = localStorage.getItem(`${this.STORAGE_PREFIX}${slot}`);
      if (raw) {
        this.state = JSON.parse(raw);
        return this.state;
      }
    } catch (e) {
      console.warn('[SaveManager] Failed to load slot', slot, e);
    }
    this.state = this.getDefaultState();
    this.save();
    return this.state;
  }

  save() {
    try {
      this.state.lastPlayed = Date.now();
      localStorage.setItem(`${this.STORAGE_PREFIX}${this.currentSlot}`, JSON.stringify(this.state));
    } catch (e) {
      console.warn('[SaveManager] Failed to save slot', this.currentSlot, e);
    }
  }

  exportJSON() {
    return JSON.stringify(this.state, null, 2);
  }

  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && parsed.campaignProgress && parsed.trust) {
        this.state = parsed;
        this.save();
        return true;
      }
    } catch (e) {
      console.error('[SaveManager] Invalid JSON string provided for import', e);
    }
    return false;
  }
}

export const saveSystem = new SaveManager();
