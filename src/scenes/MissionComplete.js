import Phaser from 'phaser';
import { SaveSystem } from '../systems/Save.js';
import { audioSystem } from '../systems/Audio.js';

export class MissionCompleteScene extends Phaser.Scene {
  constructor() {
    super('MissionCompleteScene');
  }

  init(data) {
    this.stats = data.stats || {
      timeSec: 145,
      alarmsTriggered: 0,
      guardsKnocked: 2,
      guardsKilled: 0,
      intelFound: 3,
      lightsShot: 2
    };

    // Calculate Rank:
    // GHOST: 0 alarms, 0 kills, under target time (240s)
    // AGENT: <= 2 alarms, <= 2 kills
    // ROOKIE: otherwise
    if (this.stats.alarmsTriggered === 0 && this.stats.guardsKilled === 0 && this.stats.timeSec <= 240) {
      this.rank = 'GHOST';
    } else if (this.stats.alarmsTriggered <= 2 && this.stats.guardsKilled <= 2) {
      this.rank = 'AGENT';
    } else {
      this.rank = 'ROOKIE';
    }

    this.stats.rank = this.rank;
    SaveSystem.saveMissionClear(this.stats);
  }

  create() {
    const cx = 240;
    const cy = 135;

    // Dark high-tech debrief backdrop
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x05070c, 0x070b14, 0x0b1320, 0x0f1c30, 1);
    bg.fillRect(0, 0, 480, 270);

    // Frame
    bg.lineStyle(1.5, 0x0284c7, 0.8);
    bg.strokeRect(15, 12, 450, 246);

    // Header banner
    bg.fillStyle(0x0f172a, 1);
    bg.fillRect(16, 13, 448, 22);

    this.add.text(cx, 24, 'MISSION DEBRIEFING // OPERATION IRON TIDE : SUCCESS', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#38bdf8',
      letterSpacing: 2
    }).setOrigin(0.5);

    // Large Rank Display
    const rankColors = {
      'GHOST': '#f59e0b',
      'AGENT': '#38bdf8',
      'ROOKIE': '#94a3b8'
    };

    this.add.text(120, 75, 'OPERATIVE RANK', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '9px',
      color: '#64748b'
    }).setOrigin(0.5);

    const rankText = this.add.text(120, 105, this.rank, {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '36px',
      fontStyle: 'bold',
      color: rankColors[this.rank],
      letterSpacing: 3
    }).setOrigin(0.5);

    this.tweens.add({
      targets: rankText,
      scale: 1.05,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Rating criteria list
    this.add.text(120, 140, this.rank === 'GHOST' ? 'PERFECT STEALTH INFILTRATION' : (this.rank === 'AGENT' ? 'TACTICAL MISSION ACCOMPLISHED' : 'FACILITY ALERTED - OBJECTIVE EXTRACTED'), {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '7px',
      color: '#cbd5e1'
    }).setOrigin(0.5);

    // Stats Table on Right Side
    const startX = 260;
    const startY = 55;
    const m = Math.floor(this.stats.timeSec / 60);
    const s = Math.floor(this.stats.timeSec % 60);
    const timeFormatted = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    const statRows = [
      { label: 'MISSION TIME:', val: timeFormatted },
      { label: 'ALARMS TRIGGERED:', val: this.stats.alarmsTriggered.toString() },
      { label: 'GUARDS KNOCKED OUT:', val: this.stats.guardsKnocked.toString() },
      { label: 'GUARDS KILLED:', val: this.stats.guardsKilled.toString() },
      { label: 'INTEL FILES FOUND:', val: `${this.stats.intelFound}/3` },
      { label: 'LIGHTS SHOT OUT:', val: this.stats.lightsShot.toString() },
      { label: 'DATA DRIVE RETRIEVED:', val: 'YES (SECURED)' }
    ];

    statRows.forEach((row, i) => {
      this.add.text(startX, startY + i * 16, row.label, {
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: '9px',
        color: '#94a3b8'
      });
      this.add.text(startX + 180, startY + i * 16, row.val, {
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: '9px',
        color: row.label.includes('ALARMS') && this.stats.alarmsTriggered === 0 ? '#22c55e' : '#f8fafc'
      }).setOrigin(1, 0);
    });

    // Replay & Menu buttons
    const replayBtn = this.add.rectangle(150, 230, 140, 20, 0x0284c7)
      .setStrokeStyle(1, 0x38bdf8)
      .setInteractive({ useHandCursor: true });
    this.add.text(150, 230, 'REPLAY MISSION [SPACE]', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    const menuBtn = this.add.rectangle(330, 230, 140, 20, 0x0f172a)
      .setStrokeStyle(1, 0x334155)
      .setInteractive({ useHandCursor: true });
    this.add.text(330, 230, 'MAIN MENU [ESC]', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#94a3b8'
    }).setOrigin(0.5);

    replayBtn.on('pointerdown', () => {
      SaveSystem.clearCheckpoint();
      this.scene.start('IntroScene');
    });

    menuBtn.on('pointerdown', () => {
      SaveSystem.clearCheckpoint();
      this.scene.start('TitleScene');
    });

    this.input.keyboard.on('keydown-SPACE', () => {
      SaveSystem.clearCheckpoint();
      this.scene.start('IntroScene');
    });
    this.input.keyboard.on('keydown-ESC', () => {
      SaveSystem.clearCheckpoint();
      this.scene.start('TitleScene');
    });
  }
}
