// src/scenes/Loadout.js
// Tactical Armory & Loadout Customization

import Phaser from 'phaser';
import { SaveSystem } from '../systems/SaveSystem.js';
import { audioSystem } from '../systems/Audio.js';

export const WEAPON_REGISTRY = [
  {
    id: 'pistol',
    name: 'SILENCED 9MM PISTOL',
    cost: 0,
    mag: '8 / 32',
    noise: '40 px (QUIET)',
    damage: '35 (INSTANT HEADSHOT)',
    notes: 'Shoots out ceiling lights. Disables surveillance cameras for 8s.'
  },
  {
    id: 'smg',
    name: 'SUPPRESSED SMG',
    cost: 500,
    mag: '24 / 96',
    noise: '90 px (MODERATE)',
    damage: '18 (FULL AUTO 9/S)',
    notes: 'Rapid burst weapon. Spread bloom expands during sustained fire.'
  },
  {
    id: 'shotgun',
    name: 'TACTICAL PUMP SHOTGUN',
    cost: 800,
    mag: '5 / 20',
    noise: '220 px (LOUD - RAISES ALARM)',
    damage: '15 × 6 PELLETS',
    notes: 'Heavy stopping power. Destroys wooden crates and doors instantly.'
  },
  {
    id: 'sniper',
    name: 'COVERT BOLT SNIPER',
    cost: 1200,
    mag: '5 / 15',
    noise: '120 px',
    damage: '100 (HIGH IMPACT)',
    notes: 'Long-range suppressed rifle with extended laser targeting.'
  }
];

export const GADGET_REGISTRY = [
  {
    id: 'taser',
    name: 'PNEUMATIC STUN TASER',
    cost: 0,
    charges: '3 CHARGES',
    range: '60 px',
    effect: 'NON-LETHAL STUN 6s',
    notes: 'Silent electronic incapacitation. Leaves target unconscious.'
  },
  {
    id: 'camera',
    name: 'RECON EVIDENCE CAMERA',
    cost: 0,
    charges: 'UNLIMITED',
    range: '120 px',
    effect: 'CLASSIFIED INTEL CAPTURE',
    notes: 'Essential for photographing manifests, blueprints, and VIPs.'
  },
  {
    id: 'noisemaker',
    name: 'STICKY NOISE MAKER',
    cost: 300,
    charges: '2 CHARGES',
    range: 'THROWABLE',
    effect: 'ACOUSTIC LURE 10s',
    notes: 'Distracts and redirects guard patrols to a targeted position.'
  },
  {
    id: 'emp',
    name: 'EMP PULSE CHARGE',
    cost: 600,
    charges: '2 CHARGES',
    range: '200 px RADIUS',
    effect: 'ELECTRONIC SHUTDOWN 15s',
    notes: 'Knocks out all surveillance cameras, laser grids, and lights in radius.'
  },
  {
    id: 'nvg',
    name: 'TACTICAL NIGHT VISION',
    cost: 700,
    charges: 'TOGGLEABLE',
    range: 'FULL SCREEN',
    effect: 'HIGH-CONTRAST THERMAL/NVG',
    notes: 'Reveals laser tripwires and hidden guards through shadows.'
  }
];

export class LoadoutScene extends Phaser.Scene {
  constructor() {
    super('LoadoutScene');
  }

  init(data) {
    this.returnTo = data.returnTo || 'CampaignMapScene';
    this.mission = data.mission || null;
  }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    this.saveData = SaveSystem.load();

    // Dark high-tech armory background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x060a12, 0x060a12, 0x0a1220, 0x0a1220, 1);
    bg.fillRect(0, 0, w, h);

    // Subtle tactical grid
    bg.lineStyle(1, 0x1e293b, 0.4);
    for (let x = 0; x < w; x += 32) bg.strokeLineShape(new Phaser.Geom.Line(x, 0, x, h));
    for (let y = 0; y < h; y += 32) bg.strokeLineShape(new Phaser.Geom.Line(0, y, w, y));

    // Header
    const topBar = this.add.graphics();
    topBar.fillStyle(0x040810, 0.95);
    topBar.fillRect(0, 0, w, 32);
    topBar.lineStyle(1, 0x00f0ff, 0.4);
    topBar.strokeLineShape(new Phaser.Geom.Line(0, 32, w, 32));

    this.add.text(16, 8, 'TACTICAL ARMORY // WEAPONS & GADGET LOADOUT', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#00f0ff'
    });

    this.creditsText = this.add.text(w - 180, 8, `CREDITS: ${this.saveData.credits.toLocaleString()} CR`, {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '13px',
      color: '#f59e0b'
    });

    // Left Column: Weapons Selection
    this.add.text(24, 42, 'PRIMARY & SECONDARY WEAPONS', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#38bdf8'
    });

    WEAPON_REGISTRY.forEach((wep, idx) => {
      this.createWeaponCard(24, 62 + idx * 62, wep);
    });

    // Right Column: Gadgets Selection
    this.add.text(330, 42, 'TACTICAL GADGETS (SELECT 2)', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#38bdf8'
    });

    GADGET_REGISTRY.forEach((gad, idx) => {
      this.createGadgetCard(330, 62 + idx * 52, gad);
    });

    // Bottom Bar with Confirm
    const bottomBar = this.add.graphics();
    bottomBar.fillStyle(0x040810, 0.95);
    bottomBar.fillRect(0, h - 32, w, 32);
    bottomBar.lineStyle(1, 0x38bdf8, 0.3);
    bottomBar.strokeLineShape(new Phaser.Geom.Line(0, h - 32, w, h - 32));

    const confirmBtn = this.add.rectangle(w - 90, h - 16, 140, 22, 0x0284c7, 0.9)
      .setStrokeStyle(1, 0x38bdf8)
      .setInteractive({ useHandCursor: true });

    this.add.text(w - 90, h - 16, 'CONFIRM LOADOUT ►', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    confirmBtn.on('pointerdown', () => {
      audioSystem.playTerminalBeep(980);
      SaveSystem.setLoadout(this.saveData.loadout);
      this.scene.start(this.returnTo, { mission: this.mission });
    });

    const backBtn = this.add.text(20, h - 22, '◄ RETURN [ESC]', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '11px',
      color: '#64748b'
    }).setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => {
      this.scene.start(this.returnTo, { mission: this.mission });
    });

    this.input.keyboard.on('keydown-ESC', () => {
      this.scene.start(this.returnTo, { mission: this.mission });
    });
  }

  createWeaponCard(x, y, wep) {
    const isUnlocked = this.saveData.unlockedWeapons.includes(wep.id);
    const isPrimary = this.saveData.loadout.primaryWeapon === wep.id;
    const isSecondary = this.saveData.loadout.secondaryWeapon === wep.id;

    const card = this.add.graphics();
    const bgCol = (isPrimary || isSecondary) ? 0x0f2942 : 0x090f1a;
    card.fillStyle(bgCol, 0.9);
    card.fillRect(x, y, 280, 56);
    card.lineStyle(1, (isPrimary || isSecondary) ? 0x00f0ff : (isUnlocked ? 0x334155 : 0x1e293b));
    card.strokeRect(x, y, 280, 56);

    const titleColor = (isPrimary || isSecondary) ? '#00f0ff' : (isUnlocked ? '#ffffff' : '#64748b');
    this.add.text(x + 10, y + 6, wep.name, {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: titleColor
    });

    let statusBadge = '';
    if (isPrimary) statusBadge = '[PRIMARY]';
    else if (isSecondary) statusBadge = '[SECONDARY]';
    else if (!isUnlocked) statusBadge = `[UNLOCK: ${wep.cost} CR]`;

    this.add.text(x + 270, y + 6, statusBadge, {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '9px',
      color: isPrimary || isSecondary ? '#10b981' : (isUnlocked ? '#64748b' : '#f59e0b')
    }).setOrigin(1, 0);

    this.add.text(x + 10, y + 22, `MAG: ${wep.mag}  |  NOISE: ${wep.noise}`, {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '9px',
      color: '#94a3b8'
    });

    this.add.text(x + 10, y + 36, wep.notes, {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '8px',
      color: '#64748b'
    });

    // Interaction zone
    const hit = this.add.rectangle(x + 140, y + 28, 280, 56, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    hit.on('pointerdown', () => {
      if (!isUnlocked) {
        if (SaveSystem.unlockItem('weapon', wep.id, wep.cost)) {
          audioSystem.playTerminalBeep(990);
          this.scene.restart({ returnTo: this.returnTo, mission: this.mission });
        } else {
          audioSystem.playTerminalBeep(250);
        }
      } else {
        audioSystem.playTerminalBeep(780);
        if (this.saveData.loadout.primaryWeapon !== wep.id) {
          this.saveData.loadout.secondaryWeapon = this.saveData.loadout.primaryWeapon;
          this.saveData.loadout.primaryWeapon = wep.id;
        }
        SaveSystem.setLoadout(this.saveData.loadout);
        this.scene.restart({ returnTo: this.returnTo, mission: this.mission });
      }
    });
  }

  createGadgetCard(x, y, gad) {
    const isUnlocked = this.saveData.unlockedGadgets.includes(gad.id);
    const isG1 = this.saveData.loadout.gadget1 === gad.id;
    const isG2 = this.saveData.loadout.gadget2 === gad.id;

    const card = this.add.graphics();
    const bgCol = (isG1 || isG2) ? 0x11273b : 0x090f1a;
    card.fillStyle(bgCol, 0.9);
    card.fillRect(x, y, 280, 46);
    card.lineStyle(1, (isG1 || isG2) ? 0x10b981 : (isUnlocked ? 0x334155 : 0x1e293b));
    card.strokeRect(x, y, 280, 46);

    const titleColor = (isG1 || isG2) ? '#10b981' : (isUnlocked ? '#ffffff' : '#64748b');
    this.add.text(x + 10, y + 5, gad.name, {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: titleColor
    });

    let badge = '';
    if (isG1) badge = '[SLOT 1]';
    else if (isG2) badge = '[SLOT 2]';
    else if (!isUnlocked) badge = `[UNLOCK: ${gad.cost} CR]`;

    this.add.text(x + 270, y + 5, badge, {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '9px',
      color: (isG1 || isG2) ? '#10b981' : '#f59e0b'
    }).setOrigin(1, 0);

    this.add.text(x + 10, y + 20, `${gad.charges}  |  ${gad.effect}`, {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '9px',
      color: '#94a3b8'
    });

    this.add.text(x + 10, y + 32, gad.notes, {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '8px',
      color: '#64748b'
    });

    const hit = this.add.rectangle(x + 140, y + 23, 280, 46, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    hit.on('pointerdown', () => {
      if (!isUnlocked) {
        if (SaveSystem.unlockItem('gadget', gad.id, gad.cost)) {
          audioSystem.playTerminalBeep(990);
          this.scene.restart({ returnTo: this.returnTo, mission: this.mission });
        } else {
          audioSystem.playTerminalBeep(250);
        }
      } else {
        audioSystem.playTerminalBeep(780);
        if (this.saveData.loadout.gadget1 !== gad.id && this.saveData.loadout.gadget2 !== gad.id) {
          this.saveData.loadout.gadget2 = this.saveData.loadout.gadget1;
          this.saveData.loadout.gadget1 = gad.id;
        } else if (this.saveData.loadout.gadget2 === gad.id) {
          const temp = this.saveData.loadout.gadget1;
          this.saveData.loadout.gadget1 = gad.id;
          this.saveData.loadout.gadget2 = temp;
        }
        SaveSystem.setLoadout(this.saveData.loadout);
        this.scene.restart({ returnTo: this.returnTo, mission: this.mission });
      }
    });
  }
}
