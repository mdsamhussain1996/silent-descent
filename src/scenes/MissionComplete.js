// src/scenes/MissionComplete.js
// Tactical Mission Debriefing & Campaign Progression

import Phaser from 'phaser';
import { SaveSystem } from '../systems/SaveSystem.js';
import { audioSystem } from '../systems/Audio.js';

export class MissionCompleteScene extends Phaser.Scene {
  constructor() {
    super('MissionCompleteScene');
  }

  init(data) {
    this.missionId = data.missionId || 'm1';
    this.stats = data.stats || {
      missionTime: 210,
      alarmsRaised: 0,
      kills: 0,
      nonLethalTakedowns: 3,
      camerasDisabled: 4,
      intelFound: 3,
      totalIntel: 3
    };

    this.rank = data.rank || 'GHOST';
    this.credits = data.credits || 1800;

    // Save to persistent storage
    SaveSystem.completeMission(this.missionId, this.rank, 10000, this.stats.intelFound, this.credits);
  }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    const cx = w / 2;

    // Dark classified debrief backdrop
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x040810, 0x070c18, 0x0a1426, 0x0f1f38, 1);
    bg.fillRect(0, 0, w, h);

    // Frame
    bg.lineStyle(1.5, 0x0284c7, 0.8);
    bg.strokeRect(15, 12, w - 30, h - 24);

    // Header banner
    bg.fillStyle(0x0c1726, 1);
    bg.fillRect(16, 13, w - 32, 28);

    this.add.text(cx, 27, 'MISSION DEBRIEFING // OPERATION STATUS: SUCCESS', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#38bdf8',
      letterSpacing: 2
    }).setOrigin(0.5);

    // Rank Badge Display
    const rankColors = {
      'NO TRACE': '#10b981',
      'GHOST': '#00f0ff',
      'AGENT': '#f59e0b',
      'ROOKIE': '#ef4444'
    };
    const rankCol = rankColors[this.rank] || '#10b981';

    const rankBox = this.add.graphics();
    rankBox.fillStyle(0x060f1c, 0.9);
    rankBox.fillRect(cx - 140, 52, 280, 58);
    rankBox.lineStyle(2, Phaser.Display.Color.HexStringToColor(rankCol).color, 0.8);
    rankBox.strokeRect(cx - 140, 52, 280, 58);

    this.add.text(cx, 66, 'PERFORMANCE RATING', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '11px',
      color: '#94a3b8',
      letterSpacing: 2
    }).setOrigin(0.5);

    this.add.text(cx, 88, this.rank, {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '24px',
      fontStyle: 'bold',
      color: rankCol,
      letterSpacing: 4
    }).setOrigin(0.5);

    // Statistics Table
    const sec = Math.floor(this.stats.missionTime);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    const timeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    const statRows = [
      ['INFILTRATION TIME', timeStr, '#f8fafc'],
      ['SECURITY ALARMS RAISED', `${this.stats.alarmsRaised}`, this.stats.alarmsRaised === 0 ? '#10b981' : '#ef4444'],
      ['LETHAL CASUALTIES', `${this.stats.kills}`, this.stats.kills === 0 ? '#10b981' : '#f59e0b'],
      ['NON-LETHAL TAKEDOWNS', `${this.stats.nonLethalTakedowns}`, '#38bdf8'],
      ['CAMERAS DISABLED', `${this.stats.camerasDisabled}`, '#38bdf8'],
      ['CLASSIFIED INTEL SECURED', `${this.stats.intelFound} / ${this.stats.totalIntel}`, '#f59e0b'],
      ['CREDITS AWARDED', `+${this.credits.toLocaleString()} CR`, '#10b981']
    ];

    const startY = 125;
    statRows.forEach(([label, val, col], idx) => {
      const y = startY + idx * 22;
      this.add.text(120, y, label, {
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: '11px',
        color: '#94a3b8'
      });

      this.add.text(w - 120, y, val, {
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: '11px',
        fontStyle: 'bold',
        color: col
      }).setOrigin(1, 0);

      // Dotted line separator
      this.add.line(0, 0, 120, y + 16, w - 120, y + 16, 0x1e293b, 0.4).setOrigin(0);
    });

    // Action Buttons
    const btnCampaign = this.add.rectangle(cx - 100, h - 35, 180, 24, 0x0284c7, 0.95)
      .setStrokeStyle(1, 0x38bdf8)
      .setInteractive({ useHandCursor: true });

    this.add.text(cx - 100, h - 35, 'CAMPAIGN OPERATIONS [SPACE]', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    const btnArmory = this.add.rectangle(cx + 100, h - 35, 150, 24, 0x1e293b, 0.9)
      .setStrokeStyle(1, 0x38bdf8)
      .setInteractive({ useHandCursor: true });

    this.add.text(cx + 100, h - 35, 'TACTICAL ARMORY [L]', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '11px',
      color: '#38bdf8'
    }).setOrigin(0.5);

    const toMap = () => {
      audioSystem.playTerminalBeep(980);
      this.scene.start('CampaignMapScene');
    };

    btnCampaign.on('pointerdown', toMap);
    btnArmory.on('pointerdown', () => {
      audioSystem.playTerminalBeep(850);
      this.scene.start('LoadoutScene', { returnTo: 'CampaignMapScene' });
    });

    this.input.keyboard.on('keydown-SPACE', toMap);
    this.input.keyboard.on('keydown-ENTER', toMap);
    this.input.keyboard.on('keydown-L', () => {
      this.scene.start('LoadoutScene', { returnTo: 'CampaignMapScene' });
    });
  }
}
