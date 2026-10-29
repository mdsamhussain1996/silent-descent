// src/scenes/Briefing.js
// Tactical Mission Briefing Dossier & Parameters

import Phaser from 'phaser';
import { audioSystem } from '../systems/Audio.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { CAMPAIGN_MISSIONS } from './CampaignMap.js';

export class BriefingScene extends Phaser.Scene {
  constructor() {
    super('BriefingScene');
  }

  init(data) {
    this.mission = data.mission || CAMPAIGN_MISSIONS[0];
  }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    const saveData = SaveSystem.load();

    // Dark classified dossier backdrop
    const bg = this.add.graphics();
    bg.fillStyle(0x040810, 1);
    bg.fillRect(0, 0, w, h);

    // Frame
    bg.lineStyle(1.5, 0x0284c7, 0.7);
    bg.strokeRect(10, 10, w - 20, h - 20);

    // Header Strip
    bg.fillStyle(0x0c1726, 1);
    bg.fillRect(11, 11, w - 22, 28);

    this.add.text(22, 16, `OPERATION DOSSIER // MISSION ${this.mission.num}: ${this.mission.title}`, {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#38bdf8',
      letterSpacing: 2
    });

    this.add.text(w - 200, 18, 'CLASSIFIED // TOP SECRET // EYES ONLY', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '9px',
      color: '#ef4444'
    });

    // Left Column: Classified Story & Evidence Photo
    const photoKey = this.mission.num === 1 ? 'evidence_manifest' : 'mission_dossiers';
    if (this.textures.exists(photoKey)) {
      const photo = this.add.image(120, 120, photoKey);
      photo.setDisplaySize(200, 130);
      this.add.rectangle(120, 120, 200, 130).setStrokeStyle(1.5, 0x00f0ff, 0.6);
    }

    this.add.text(22, 195, `LOCATION: ${this.mission.location}`, {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '10px',
      color: '#f59e0b'
    });

    this.add.text(22, 210, `HVT / TARGET: ${this.mission.target}`, {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '10px',
      color: '#38bdf8'
    });

    // Story narrative text
    const storyBox = this.add.text(22, 230, this.mission.desc, {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '9px',
      color: '#94a3b8',
      wordWrap: { width: 230 }
    });

    // Middle Column: Primary & Secondary Objectives
    this.add.text(270, 48, 'PRIMARY OBJECTIVES (REQUIRED):', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#f59e0b'
    });

    const m1Primaries = [
      '1. Infiltrate yard via helicopter rappel',
      '2. Hack security terminal for vault code',
      '3. Photograph manifest on manager desk',
      '4. Rescue Dr. Meera Sen from interrogation',
      '5. Plant tracker beacon on naval container',
      '6. Extract with Meera by helicopter at dock'
    ];

    const displayPrimaries = this.mission.num === 1 ? m1Primaries : this.mission.objectives;
    displayPrimaries.forEach((obj, idx) => {
      this.add.text(270, 70 + idx * 16, `• ${obj}`, {
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: '9px',
        color: '#f8fafc'
      });
    });

    // Secondary & Fail Conditions
    this.add.text(270, 185, 'SECONDARY OBJECTIVES (RANK BONUS):', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#10b981'
    });

    const secondaries = [
      '• NO ALARMS (Clean Ghost)',
      '• NO KILLS (Non-lethal takedowns only)',
      '• COLLECT 3 CLASSIFIED INTEL FILES',
      '• DISABLE 4 SURVEILLANCE CAMERAS',
      '• COMPLETE UNDER 12 MINUTES'
    ];

    secondaries.forEach((sec, idx) => {
      this.add.text(270, 205 + idx * 13, sec, {
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: '8.5px',
        color: '#94a3b8'
      });
    });

    // Right Column: Loadout Preview
    this.add.text(490, 48, 'EQUIPPED LOADOUT:', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#00f0ff'
    });

    const loadout = saveData.loadout;
    const loadoutLines = [
      `PRI: ${loadout.primaryWeapon.toUpperCase()}`,
      `SEC: ${loadout.secondaryWeapon.toUpperCase()}`,
      `GAD 1: ${loadout.gadget1.toUpperCase()}`,
      `GAD 2: ${loadout.gadget2.toUpperCase()}`
    ];

    loadoutLines.forEach((line, idx) => {
      this.add.text(490, 70 + idx * 16, line, {
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: '9px',
        color: '#38bdf8'
      });
    });

    // Informant Portrait preview for M1
    if (this.mission.num === 1 && this.textures.exists('portrait_meera')) {
      this.add.text(490, 150, 'ASSET: DR. MEERA SEN', {
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#f59e0b'
      });
      const meeraPic = this.add.image(530, 205, 'portrait_meera');
      meeraPic.setDisplaySize(80, 80);
      this.add.rectangle(530, 205, 80, 80).setStrokeStyle(1, 0x10b981, 0.6);
    }

    // Bottom Action Bar
    const bottomBar = this.add.graphics();
    bottomBar.fillStyle(0x0c1726, 0.95);
    bottomBar.fillRect(11, h - 38, w - 22, 27);
    bottomBar.lineStyle(1, 0x0284c7, 0.5);
    bottomBar.strokeLineShape(new Phaser.Geom.Line(11, h - 38, w - 11, h - 38));

    // Launch Button
    const launchBtn = this.add.rectangle(w - 110, h - 25, 170, 22, 0x0284c7, 0.95)
      .setStrokeStyle(1, 0x38bdf8)
      .setInteractive({ useHandCursor: true });

    this.add.text(w - 110, h - 25, 'LAUNCH INFILTRATION ►', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    const startMission = () => {
      audioSystem.playTerminalBeep(1000);
      if (this.mission.num === 1) {
        this.scene.start('IntroScene', { mission: this.mission });
      } else {
        // Greybox mission launch
        this.scene.start('GameScene', { mission: this.mission });
      }
    };

    launchBtn.on('pointerdown', startMission);

    // Armory / Customize Loadout button
    const loadoutBtn = this.add.rectangle(w - 240, h - 25, 120, 22, 0x1e293b, 0.9)
      .setStrokeStyle(1, 0x38bdf8)
      .setInteractive({ useHandCursor: true });

    this.add.text(w - 240, h - 25, 'ARMORY [L]', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '10px',
      color: '#38bdf8'
    }).setOrigin(0.5);

    loadoutBtn.on('pointerdown', () => {
      audioSystem.playTerminalBeep(850);
      this.scene.start('LoadoutScene', { returnTo: 'BriefingScene', mission: this.mission });
    });

    // Return to Map button
    const backBtn = this.add.text(25, h - 25, '◄ CAMPAIGN MAP [ESC]', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '10px',
      color: '#64748b'
    }).setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => this.scene.start('CampaignMapScene'));

    // Keyboard Hotkeys
    this.input.keyboard.on('keydown-SPACE', startMission);
    this.input.keyboard.on('keydown-ENTER', startMission);
    this.input.keyboard.on('keydown-L', () => {
      this.scene.start('LoadoutScene', { returnTo: 'BriefingScene', mission: this.mission });
    });
    this.input.keyboard.on('keydown-ESC', () => {
      this.scene.start('CampaignMapScene');
    });
  }
}
