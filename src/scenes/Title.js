// src/scenes/Title.js
// NO TRACE — Tactical Stealth-Action Title Screen

import Phaser from 'phaser';
import { audioSystem } from '../systems/Audio.js';
import { SaveSystem } from '../systems/SaveSystem.js';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
    this.selectedIdx = 0;
  }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    const cx = w / 2;
    const cy = h / 2;

    // Atmospheric night backdrop
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x04070e, 0x070c18, 0x0a1424, 0x0f1d33, 1);
    bg.fillRect(0, 0, w, h);

    // Harbor silhouette skyline
    bg.fillStyle(0x08101a, 0.95);
    bg.fillRect(0, h - 80, w, 80);
    // Cranes & rooftops
    bg.fillStyle(0x0e1724, 0.8);
    bg.fillRect(40, h - 160, 8, 80);
    bg.fillRect(20, h - 160, 70, 6);
    bg.fillRect(80, h - 154, 4, 74);

    bg.fillRect(w - 120, h - 140, 10, 60);
    bg.fillRect(w - 150, h - 140, 70, 6);

    // Animated sweeping searchlight
    const searchCone = this.add.graphics();
    searchCone.fillStyle(0x38bdf8, 0.12);
    searchCone.beginPath();
    searchCone.moveTo(w - 80, h - 60);
    searchCone.arc(w - 80, h - 60, 420, -Math.PI * 0.88, -Math.PI * 0.42);
    searchCone.closePath();
    searchCone.fill();

    this.tweens.add({
      targets: searchCone,
      alpha: 0.03,
      duration: 3800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Rain particles
    for (let i = 0; i < 50; i++) {
      const drop = this.add.rectangle(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(-50, h),
        1,
        Phaser.Math.Between(8, 16),
        0x38bdf8,
        0.25
      );
      this.tweens.add({
        targets: drop,
        y: h + 20,
        x: drop.x - 25,
        duration: Phaser.Math.Between(700, 1100),
        repeat: -1,
        ease: 'Linear',
        delay: Phaser.Math.Between(0, 800)
      });
    }

    // Ghost Operative Silhouette & Monocular Visor
    if (this.textures.exists('portrait_ghost')) {
      const ghostPic = this.add.image(w - 130, cy + 10, 'portrait_ghost');
      ghostPic.setDisplaySize(180, 180);
      ghostPic.setAlpha(0.85);
      this.add.rectangle(w - 130, cy + 10, 180, 180).setStrokeStyle(1.5, 0x00f0ff, 0.4);
    }

    // Logo & Title
    this.add.text(80, 52, 'NO TRACE', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '44px',
      fontStyle: 'bold',
      color: '#f8fafc',
      letterSpacing: 6
    });

    this.add.text(82, 98, 'TACTICAL ESPIONAGE & COVERT STEALTH CAMPAIGN', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '11px',
      color: '#f59e0b',
      letterSpacing: 2
    });

    // Save Data Summary
    const saveData = SaveSystem.load();
    const completedCount = Object.values(saveData.missions).filter(m => m.completed).length;
    this.add.text(82, 122, `CAMPAIGN: ${completedCount}/5 MISSIONS  |  CREDITS: ${saveData.credits.toLocaleString()} CR`, {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '10px',
      color: '#10b981'
    });

    // Menu options
    this.menuItems = [
      { text: 'CAMPAIGN OPERATIONS MAP', scene: 'CampaignMapScene' },
      { text: 'TACTICAL ARMORY & LOADOUT', scene: 'LoadoutScene' },
      { text: 'MISSION 1: "IRON TIDE"', scene: 'BriefingScene' }
    ];

    this.menuTexts = [];
    const menuStartY = 160;

    this.menuItems.forEach((item, idx) => {
      const y = menuStartY + idx * 32;
      const text = this.add.text(100, y, item.text, {
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        color: idx === 0 ? '#f59e0b' : '#94a3b8'
      }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

      text.on('pointerdown', () => {
        audioSystem.init();
        audioSystem.resume();
        this.selectOption(idx);
      });

      text.on('pointerover', () => {
        this.selectedIdx = idx;
        this.updateMenuHighlight();
      });

      this.menuTexts.push(text);
    });

    // Cursor indicator
    this.cursorIndicator = this.add.text(80, menuStartY, '►', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '14px',
      color: '#f59e0b'
    }).setOrigin(0.5);

    // Footer info
    this.add.text(80, h - 28, 'ORIGINAL 2000s COVERT STEALTH ACTION • CONTROLS: [W/S] SELECT  [ENTER/SPACE] CONFIRM', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '9px',
      color: '#475569'
    });

    // Keyboard inputs
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.sKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.updateMenuHighlight();
  }

  updateMenuHighlight() {
    this.menuTexts.forEach((txt, idx) => {
      const isSel = idx === this.selectedIdx;
      txt.setColor(isSel ? '#f59e0b' : '#94a3b8');
      txt.setFontSize(isSel ? '18px' : '16px');
    });
    this.cursorIndicator.setY(160 + this.selectedIdx * 32);
  }

  selectOption(idx) {
    audioSystem.playTerminalBeep(920);
    const targetScene = this.menuItems[idx].scene;
    this.scene.start(targetScene);
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.wKey)) {
      audioSystem.init();
      audioSystem.resume();
      this.selectedIdx = (this.selectedIdx - 1 + this.menuItems.length) % this.menuItems.length;
      this.updateMenuHighlight();
      audioSystem.playTerminalBeep(600);
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down) || Phaser.Input.Keyboard.JustDown(this.sKey)) {
      audioSystem.init();
      audioSystem.resume();
      this.selectedIdx = (this.selectedIdx + 1) % this.menuItems.length;
      this.updateMenuHighlight();
      audioSystem.playTerminalBeep(600);
    } else if (
      Phaser.Input.Keyboard.JustDown(this.enterKey) ||
      Phaser.Input.Keyboard.JustDown(this.spaceKey)
    ) {
      audioSystem.init();
      audioSystem.resume();
      this.selectOption(this.selectedIdx);
    }
  }
}
