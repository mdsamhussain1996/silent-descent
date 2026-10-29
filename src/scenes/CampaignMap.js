// src/scenes/CampaignMap.js
// Interactive Tactical Operations World Map for Campaign Missions

import Phaser from 'phaser';
import { SaveSystem } from '../systems/SaveSystem.js';
import { audioSystem } from '../systems/Audio.js';

export const CAMPAIGN_MISSIONS = [
  {
    id: 'm1',
    num: 1,
    title: 'IRON TIDE',
    location: 'Kestrel Naval Yard — Sector 4',
    coords: { x: 450, y: 155 },
    threat: 'MEDIUM',
    target: 'Dr. Meera Sen & Guidance Chip Manifest',
    desc: 'Infiltrate Kestrel naval docks via helicopter rappel. Steal guidance manifest, rescue inside informant Dr. Meera Sen, plant tracker on cargo, and extract under cover of rain.',
    objectives: [
      'Infiltrate naval yard via rooftop rappel',
      'Hack security terminal for vault code',
      'Photograph cargo shipment manifest',
      'Rescue Dr. Meera Sen from interrogation',
      'Plant tracker on naval container',
      'Extract with Meera at docks'
    ]
  },
  {
    id: 'm2',
    num: 2,
    title: 'GLASS TOWER',
    location: 'Vanguard Penthouse — Metro Sector',
    coords: { x: 385, y: 195 },
    threat: 'HIGH',
    target: 'Executive VP Viktor Vance',
    desc: 'Infiltrate luxury corporate penthouse at night. Photograph illegal arms deal, plant 3 covert transmitters, bypass laser security grids, and exfiltrate via exterior zip line.',
    objectives: [
      'Infiltrate tower elevator shaft',
      'Photograph Vance arms transaction',
      'Plant 3 audio bugs in executive suites',
      'Zip line across towers to extraction'
    ]
  },
  {
    id: 'm3',
    num: 3,
    title: 'MONSOON RUN',
    location: 'Trans-Siberian Freight Line 9',
    coords: { x: 195, y: 165 },
    threat: 'VERY HIGH',
    target: 'Stolen Dirty Bomb Warhead',
    desc: 'Board moving freight train during heavy monsoon rainfall. Sneak across carriage rooftops, eliminate snipers, locate the bomb compartment, and defuse timer before bridge crossing.',
    objectives: [
      'Board locomotive from speed interceptor',
      'Infiltrate 5 guarded rail carriages',
      'Defuse wire puzzle warhead timer',
      'Extract via low-altitude chopper pickup'
    ]
  },
  {
    id: 'm4',
    num: 4,
    title: 'DEEP SIGNAL',
    location: 'Hydros Trench Sub-Aquatic Facility',
    coords: { x: 280, y: 220 },
    threat: 'EXTREME',
    target: 'Quantum AI Core & Captured Scientists',
    desc: 'Infiltrate deep ocean laboratory. Navigate power blackout sections using night vision, restore reactor containment, download encrypted quantum AI core, and rescue 2 captive researchers.',
    objectives: [
      'Enter airlock via submersible drydock',
      'Restore emergency reactor power grid',
      'Download classified quantum telemetry',
      'Escort 2 scientists through flooding sector'
    ]
  },
  {
    id: 'm5',
    num: 5,
    title: 'ZERO HOUR',
    location: 'Kestrel Omega HQ Fortress',
    coords: { x: 470, y: 250 },
    threat: 'CRITICAL',
    target: 'CEO Arthur Kestrel & Merc Leader Rex',
    desc: 'Final showdown inside fortified headquarters compound. Infiltrate secure bunker, defeat mercenary commander Rex in combat encounter, capture CEO Kestrel alive, and escape under fire.',
    objectives: [
      'Breach perimeter security perimeter',
      'Defeat mercenary commander Rex',
      'Capture CEO Arthur Kestrel alive',
      'Extract under heavy gunship cover'
    ]
  }
];

export class CampaignMapScene extends Phaser.Scene {
  constructor() {
    super('CampaignMapScene');
  }

  create() {
    const saveData = SaveSystem.load();
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // Background satellite map
    if (this.textures.exists('campaign_map')) {
      const mapBg = this.add.image(w / 2, h / 2, 'campaign_map');
      mapBg.setDisplaySize(w, h);
    } else {
      const bg = this.add.graphics();
      bg.fillGradientStyle(0x050d18, 0x050d18, 0x0a1626, 0x0a1626, 1);
      bg.fillRect(0, 0, w, h);
    }

    // Scanline & tactical grid overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x00f0ff, 0.03);
    for (let y = 0; y < h; y += 4) {
      overlay.fillRect(0, y, w, 1);
    }

    // Top Header Bar
    const topBar = this.add.graphics();
    topBar.fillStyle(0x040810, 0.88);
    topBar.fillRect(0, 0, w, 32);
    topBar.lineStyle(1, 0x00f0ff, 0.4);
    topBar.strokeLineShape(new Phaser.Geom.Line(0, 32, w, 32));

    this.add.text(16, 8, 'COVERT OPS COMMAND CENTER // GLOBAL THEATRE', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#00f0ff'
    });

    // Credits Display
    this.add.text(w - 220, 8, `CREDITS: ${saveData.credits.toLocaleString()} CR`, {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '13px',
      color: '#f59e0b'
    });

    // Armory Button
    const armoryBtn = this.add.rectangle(w - 75, 16, 100, 22, 0x1e293b, 0.9)
      .setStrokeStyle(1, 0x38bdf8)
      .setInteractive({ useHandCursor: true });
    this.add.text(w - 75, 16, 'ARMORY [L]', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '11px',
      color: '#38bdf8'
    }).setOrigin(0.5);

    armoryBtn.on('pointerdown', () => {
      audioSystem.playTerminalBeep(880);
      this.scene.start('LoadoutScene', { returnTo: 'CampaignMapScene' });
    });

    // Info Dossier Box at bottom-left
    this.infoBox = this.add.graphics();
    this.dossierContainer = this.add.container(20, h - 110);
    this.createDossierPreview(CAMPAIGN_MISSIONS[0], saveData);

    // Render Mission Pins on Map
    this.pins = [];
    CAMPAIGN_MISSIONS.forEach((m, idx) => {
      const isUnlocked = saveData.missions[m.id]?.unlocked ?? (idx === 0);
      const isCompleted = saveData.missions[m.id]?.completed ?? false;
      const bestRank = saveData.missions[m.id]?.bestRank;

      const pinContainer = this.add.container(m.coords.x, m.coords.y);

      // Radar pulse ring if unlocked
      if (isUnlocked && !isCompleted) {
        const pulse = this.add.circle(0, 0, 16, 0xf59e0b, 0.25);
        this.tweens.add({
          targets: pulse,
          scale: 1.8,
          alpha: 0,
          duration: 1600,
          repeat: -1
        });
        pinContainer.add(pulse);
      }

      // Pin icon
      const pinColor = isCompleted ? 0x10b981 : (isUnlocked ? 0xf59e0b : 0x475569);
      const pinBg = this.add.circle(0, 0, 10, pinColor, 0.9).setStrokeStyle(1.5, 0xffffff);
      const pinLabel = this.add.text(0, 0, `M${m.num}`, {
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: '9px',
        fontStyle: 'bold',
        color: '#000000'
      }).setOrigin(0.5);

      // Mission title label below pin
      const titleLabel = this.add.text(0, 14, m.title, {
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: isUnlocked ? '#ffffff' : '#64748b'
      }).setOrigin(0.5);

      pinContainer.add([pinBg, pinLabel, titleLabel]);

      if (isCompleted && bestRank) {
        const rankBadge = this.add.text(0, -14, `[${bestRank}]`, {
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: '8px',
          color: '#10b981'
        }).setOrigin(0.5);
        pinContainer.add(rankBadge);
      }

      pinBg.setInteractive({ useHandCursor: isUnlocked });

      pinBg.on('pointerover', () => {
        this.createDossierPreview(m, saveData);
        audioSystem.playTerminalBeep(700);
      });

      pinBg.on('pointerdown', () => {
        if (!isUnlocked) {
          audioSystem.playTerminalBeep(300);
          return;
        }
        audioSystem.playTerminalBeep(980);
        this.scene.start('BriefingScene', { mission: m });
      });

      this.pins.push(pinContainer);
    });

    // Keyboard Hotkeys
    this.input.keyboard.on('keydown-L', () => {
      audioSystem.playTerminalBeep(880);
      this.scene.start('LoadoutScene', { returnTo: 'CampaignMapScene' });
    });
    this.input.keyboard.on('keydown-ESC', () => {
      this.scene.start('TitleScene');
    });

    // Back to Title button
    const backBtn = this.add.text(20, h - 20, '◄ TITLE SCREEN [ESC]', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '10px',
      color: '#64748b'
    }).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.scene.start('TitleScene'));
  }

  createDossierPreview(mission, saveData) {
    this.dossierContainer.removeAll(true);
    const mData = saveData.missions[mission.id] || {};
    const isUnlocked = mData.unlocked ?? (mission.num === 1);
    const isCompleted = mData.completed ?? false;

    // Background card
    const card = this.add.graphics();
    card.fillStyle(0x060c16, 0.92);
    card.fillRect(0, 0, 310, 85);
    card.lineStyle(1, isUnlocked ? 0x00f0ff : 0x475569, 0.6);
    card.strokeRect(0, 0, 310, 85);

    const title = this.add.text(10, 8, `MISSION ${mission.num}: ${mission.title}`, {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: isUnlocked ? '#f59e0b' : '#64748b'
    });

    const statusStr = isCompleted ? `COMPLETED (${mData.bestRank || 'AGENT'})` : (isUnlocked ? 'READY FOR INFILTRATION' : 'LOCKED — COMPLETE PREVIOUS MISSION');
    const status = this.add.text(10, 26, `STATUS: ${statusStr}`, {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '9px',
      color: isCompleted ? '#10b981' : (isUnlocked ? '#00f0ff' : '#ef4444')
    });

    const target = this.add.text(10, 40, `TARGET: ${mission.target}`, {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '9px',
      color: '#94a3b8'
    });

    const actionText = isUnlocked ? 'CLICK PIN TO OPEN MISSION DOSSIER ►' : 'CLASSIFIED SECURITY CLEARANCE REQUIRED';
    const action = this.add.text(10, 62, actionText, {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '10px',
      fontStyle: 'bold',
      color: isUnlocked ? '#38bdf8' : '#475569'
    });

    this.dossierContainer.add([card, title, status, target, action]);
  }
}
