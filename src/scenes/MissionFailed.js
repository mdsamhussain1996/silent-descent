import Phaser from 'phaser';
import { SaveSystem } from '../systems/Save.js';

export class MissionFailedScene extends Phaser.Scene {
  constructor() {
    super('MissionFailedScene');
  }

  init(data) {
    this.reason = data.reason || 'Agent compromised.';
  }

  create() {
    const cx = 240;
    const cy = 135;

    // Dark red alarm failure screen
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0505, 0x0f0404, 0x080202, 0x050101, 1);
    bg.fillRect(0, 0, 480, 270);

    // Frame
    bg.lineStyle(1.5, 0xef4444, 0.8);
    bg.strokeRect(20, 15, 440, 240);

    // Header
    this.add.text(cx, 55, 'MISSION FAILED', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#ef4444',
      letterSpacing: 4
    }).setOrigin(0.5);

    this.add.text(cx, 85, 'OPERATION ABORTED // CRITICAL COMPROMISE', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '9px',
      color: '#f87171'
    }).setOrigin(0.5);

    // Reason
    this.add.text(cx, 120, this.reason.toUpperCase(), {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '10px',
      color: '#cbd5e1'
    }).setOrigin(0.5);

    const cp = SaveSystem.getCheckpoint();

    // Checkpoint button
    const btnStartY = 160;
    if (cp) {
      const cpBtn = this.add.rectangle(cx, btnStartY, 220, 22, 0x0284c7)
        .setStrokeStyle(1, 0x38bdf8)
        .setInteractive({ useHandCursor: true });
      this.add.text(cx, btnStartY, `RESTORE CHECKPOINT ${cp.checkpoint} [SPACE]`, {
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5);

      cpBtn.on('pointerdown', () => this.restoreCheckpoint());
      this.input.keyboard.on('keydown-SPACE', () => this.restoreCheckpoint());
    }

    // Restart Mission button
    const restartY = cp ? btnStartY + 30 : btnStartY;
    const restartBtn = this.add.rectangle(cx, restartY, 220, 22, 0x1e293b)
      .setStrokeStyle(1, 0x475569)
      .setInteractive({ useHandCursor: true });
    this.add.text(cx, restartY, 'RESTART FULL MISSION [R]', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#cbd5e1'
    }).setOrigin(0.5);

    restartBtn.on('pointerdown', () => this.restartMission());
    this.input.keyboard.on('keydown-R', () => this.restartMission());

    // Main Menu button
    const menuY = restartY + 30;
    const menuBtn = this.add.rectangle(cx, menuY, 220, 20, 0x0f172a)
      .setStrokeStyle(1, 0x334155)
      .setInteractive({ useHandCursor: true });
    this.add.text(cx, menuY, 'ABORT TO MAIN MENU [ESC]', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#94a3b8'
    }).setOrigin(0.5);

    menuBtn.on('pointerdown', () => this.scene.start('TitleScene'));
    this.input.keyboard.on('keydown-ESC', () => this.scene.start('TitleScene'));
  }

  restoreCheckpoint() {
    this.scene.start('GameScene', { fromCheckpoint: true });
  }

  restartMission() {
    SaveSystem.clearCheckpoint();
    this.scene.start('IntroScene');
  }
}
