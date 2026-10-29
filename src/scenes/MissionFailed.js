// src/scenes/MissionFailed.js
// Tactical Mission Failure Screen

import Phaser from 'phaser';

export class MissionFailedScene extends Phaser.Scene {
  constructor() {
    super('MissionFailedScene');
  }

  init(data) {
    this.reason = data.reason || 'Agent compromised in the field.';
    this.missionId = data.missionId || 'm1';
  }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    const cx = w / 2;
    const cy = h / 2;

    // Dark red alarm failure screen
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1e0606, 0x120303, 0x090202, 0x050101, 1);
    bg.fillRect(0, 0, w, h);

    // Frame
    bg.lineStyle(1.5, 0xef4444, 0.8);
    bg.strokeRect(20, 15, w - 40, h - 30);

    // Header
    this.add.text(cx, cy - 80, 'MISSION COMPROMISED', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#ef4444',
      letterSpacing: 4
    }).setOrigin(0.5);

    this.add.text(cx, cy - 44, 'OPERATION ABORTED // TACTICAL FAILURE', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '11px',
      color: '#f87171'
    }).setOrigin(0.5);

    // Reason
    const reasonBox = this.add.graphics();
    reasonBox.fillStyle(0x0a0303, 0.8);
    reasonBox.fillRect(cx - 200, cy - 25, 400, 40);
    reasonBox.lineStyle(1, 0xef4444, 0.5);
    reasonBox.strokeRect(cx - 200, cy - 25, 400, 40);

    this.add.text(cx, cy - 5, this.reason.toUpperCase(), {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '11px',
      color: '#ffffff',
      wordWrap: { width: 380 },
      align: 'center'
    }).setOrigin(0.5);

    // Retry Mission button
    const retryBtn = this.add.rectangle(cx, cy + 45, 240, 26, 0x0284c7, 0.95)
      .setStrokeStyle(1, 0x38bdf8)
      .setInteractive({ useHandCursor: true });

    this.add.text(cx, cy + 45, 'RESTART INFILTRATION [SPACE]', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Abort to Campaign Map button
    const abortBtn = this.add.rectangle(cx, cy + 85, 240, 24, 0x1e293b, 0.9)
      .setStrokeStyle(1, 0xef4444)
      .setInteractive({ useHandCursor: true });

    this.add.text(cx, cy + 85, 'ABORT TO CAMPAIGN MAP [ESC]', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '11px',
      color: '#ef4444'
    }).setOrigin(0.5);

    const restart = () => {
      this.scene.start('GameScene', { mission: { id: this.missionId, num: 1 } });
    };

    const abort = () => {
      this.scene.start('CampaignMapScene');
    };

    retryBtn.on('pointerdown', restart);
    abortBtn.on('pointerdown', abort);

    this.input.keyboard.on('keydown-SPACE', restart);
    this.input.keyboard.on('keydown-ENTER', restart);
    this.input.keyboard.on('keydown-ESC', abort);
  }
}
