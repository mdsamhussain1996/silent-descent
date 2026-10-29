/**
 * Save.js
 * Manages checkpoints, mission statistics, and persistent high scores in localStorage.
 */

const STORAGE_KEY = 'silent_descent_save_v1';

export class SaveSystem {
  static getSaveData() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : this.getDefaultData();
    } catch (e) {
      return this.getDefaultData();
    }
  }

  static getDefaultData() {
    return {
      bestRank: null,
      bestTime: null,
      bestAlarms: null,
      checkpointsUnlocked: 0,
      soundMuted: false
    };
  }

  static saveMissionClear(stats) {
    try {
      const current = this.getSaveData();
      const isBetterTime = !current.bestTime || stats.timeSec < current.bestTime;
      const ranks = { 'GHOST': 3, 'AGENT': 2, 'ROOKIE': 1 };
      const currentRankVal = ranks[current.bestRank] || 0;
      const newRankVal = ranks[stats.rank] || 0;

      if (newRankVal >= currentRankVal) {
        current.bestRank = stats.rank;
      }
      if (isBetterTime) {
        current.bestTime = stats.timeSec;
      }
      if (current.bestAlarms === null || stats.alarmsTriggered < current.bestAlarms) {
        current.bestAlarms = stats.alarmsTriggered;
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }
  }

  static saveCheckpoint(cpIndex, playerState) {
    sessionStorage.setItem('silent_descent_cp', JSON.stringify({
      checkpoint: cpIndex,
      hp: playerState.hp,
      ammo: playerState.ammo,
      intelFound: playerState.intelFound,
      hasDataDrive: playerState.hasDataDrive,
      lightsShot: playerState.lightsShot || 0,
      alarmsTriggered: playerState.alarmsTriggered || 0,
      guardsKnocked: playerState.guardsKnocked || 0,
      guardsKilled: playerState.guardsKilled || 0
    }));
  }

  static getCheckpoint() {
    try {
      const cp = sessionStorage.getItem('silent_descent_cp');
      return cp ? JSON.parse(cp) : null;
    } catch (e) {
      return null;
    }
  }

  static clearCheckpoint() {
    sessionStorage.removeItem('silent_descent_cp');
  }
}
