// src/systems/SaveSystem.js
// Persistent Campaign & Loadout Storage for NO TRACE

const STORAGE_KEY = 'NO_TRACE_SAVE_DATA_V1';

export const DEFAULT_SAVE_DATA = {
  credits: 1500,
  currentMissionId: 'm1',
  missions: {
    m1: {
      id: 'm1',
      title: 'Iron Tide',
      location: 'Kestrel Naval Yard',
      unlocked: true,
      completed: false,
      bestRank: null,
      bestScore: 0,
      intelFound: 0,
      maxIntel: 3
    },
    m2: {
      id: 'm2',
      title: 'Glass Tower',
      location: 'Vanguard Penthouse',
      unlocked: false,
      completed: false,
      bestRank: null,
      bestScore: 0,
      intelFound: 0,
      maxIntel: 3
    },
    m3: {
      id: 'm3',
      title: 'Monsoon Run',
      location: 'Trans-Siberian Freight',
      unlocked: false,
      completed: false,
      bestRank: null,
      bestScore: 0,
      intelFound: 0,
      maxIntel: 3
    },
    m4: {
      id: 'm4',
      title: 'Deep Signal',
      location: 'Hydros Trench Facility',
      unlocked: false,
      completed: false,
      bestRank: null,
      bestScore: 0,
      intelFound: 0,
      maxIntel: 3
    },
    m5: {
      id: 'm5',
      title: 'Zero Hour',
      location: 'Kestrel Omega HQ',
      unlocked: false,
      completed: false,
      bestRank: null,
      bestScore: 0,
      intelFound: 0,
      maxIntel: 3
    }
  },
  unlockedWeapons: ['pistol', 'smg'],
  unlockedGadgets: ['taser', 'noisemaker', 'camera'],
  loadout: {
    primaryWeapon: 'pistol',
    secondaryWeapon: 'smg',
    gadget1: 'taser',
    gadget2: 'camera'
  },
  settings: {
    hardcoreMarkers: false,
    sfxVolume: 1.0,
    musicVolume: 0.8
  }
};

export class SaveSystem {
  static load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_SAVE_DATA };
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SAVE_DATA,
        ...parsed,
        missions: {
          ...DEFAULT_SAVE_DATA.missions,
          ...(parsed.missions || {})
        },
        loadout: {
          ...DEFAULT_SAVE_DATA.loadout,
          ...(parsed.loadout || {})
        }
      };
    } catch (e) {
      console.warn('[SaveSystem] Failed to parse save data, falling back to default:', e);
      return { ...DEFAULT_SAVE_DATA };
    }
  }

  static save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('[SaveSystem] Failed to save game data:', e);
    }
  }

  static completeMission(missionId, rank, score, intelCount, creditsEarned) {
    const data = this.load();
    if (!data.missions[missionId]) return;

    data.missions[missionId].completed = true;
    if (!data.missions[missionId].bestRank || this.isBetterRank(rank, data.missions[missionId].bestRank)) {
      data.missions[missionId].bestRank = rank;
    }
    data.missions[missionId].bestScore = Math.max(data.missions[missionId].bestScore, score);
    data.missions[missionId].intelFound = Math.max(data.missions[missionId].intelFound, intelCount);
    data.credits = (data.credits || 0) + creditsEarned;

    // Unlock subsequent mission
    const sequence = ['m1', 'm2', 'm3', 'm4', 'm5'];
    const idx = sequence.indexOf(missionId);
    if (idx !== -1 && idx + 1 < sequence.length) {
      const nextId = sequence[idx + 1];
      if (data.missions[nextId]) {
        data.missions[nextId].unlocked = true;
      }
    }

    this.save(data);
    return data;
  }

  static isBetterRank(newRank, oldRank) {
    const ranks = ['ROOKIE', 'AGENT', 'GHOST', 'NO TRACE'];
    return ranks.indexOf(newRank) > ranks.indexOf(oldRank);
  }

  static setLoadout(loadout) {
    const data = this.load();
    data.loadout = { ...data.loadout, ...loadout };
    this.save(data);
  }

  static unlockItem(type, itemId, cost) {
    const data = this.load();
    if (data.credits < cost) return false;

    data.credits -= cost;
    if (type === 'weapon' && !data.unlockedWeapons.includes(itemId)) {
      data.unlockedWeapons.push(itemId);
    } else if (type === 'gadget' && !data.unlockedGadgets.includes(itemId)) {
      data.unlockedGadgets.push(itemId);
    }
    this.save(data);
    return true;
  }
}
