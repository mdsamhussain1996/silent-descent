import Phaser from 'phaser';
import { audioSystem } from '../systems/Audio.js';
import { SaveSystem } from '../systems/Save.js';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
    this.selectedIdx = 0;
  }

  create() {
    const cx = 240;
    const cy = 135;

    // Background: deep night gradient + harbour silhouettes
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x05070c, 0x070b14, 0x0a121e, 0x0f192b, 1);
    bg.fillRect(0, 0, 480, 270);

    // Distant harbour crane silhouettes
    bg.fillStyle(0x131a26, 0.7);
    bg.fillRect(30, 140, 6, 80);
    bg.fillRect(20, 140, 50, 4);
    bg.fillRect(55, 144, 2, 76);
    // Warehouse roofline
    bg.fillStyle(0x0b1019, 0.9);
    bg.beginPath();
    bg.moveTo(0, 220);
    bg.lineTo(120, 190);
    bg.lineTo(260, 220);
    bg.lineTo(480, 185);
    bg.lineTo(480, 270);
    bg.lineTo(0, 270);
    bg.closePath();
    bg.fill();

    // Sweeping Searchlight in background
    const searchCone = this.add.graphics();
    searchCone.fillStyle(0x38bdf8, 0.12);
    searchCone.beginPath();
    searchCone.moveTo(420, 260);
    searchCone.arc(420, 260, 300, -Math.PI * 0.85, -Math.PI * 0.45);
    searchCone.closePath();
    searchCone.fill();

    this.tweens.add({
      targets: searchCone,
      alpha: 0.04,
      duration: 3500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Rain effect on title screen
    for (let i = 0; i < 40; i++) {
      const drop = this.add.rectangle(
        Phaser.Math.Between(0, 480),
        Phaser.Math.Between(-50, 270),
        1,
        Phaser.Math.Between(6, 14),
        0x38bdf8,
        0.35
      );
      this.tweens.add({
        targets: drop,
        y: 280,
        x: drop.x + 30,
        duration: Phaser.Math.Between(350, 600),
        repeat: -1,
        delay: Phaser.Math.Between(0, 500)
      });
    }

    // Ghost Character visual stance
    const ghostGraphic = this.add.image(380, 180, 'ghost', 0).setScale(3.5);
    // Amber visor pulse
    const visorGlow = this.add.circle(380 + 16, 180 - 24, 4, 0xf59e0b, 0.8);
    this.tweens.add({
      targets: visorGlow,
      scale: 1.6,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    // Title text
    const titleText = this.add.text(cx - 60, 48, 'NO TRACE', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#f8fafc',
      letterSpacing: 4
    }).setOrigin(0.5);

    this.add.text(cx - 60, 74, 'LEVEL 1 : "IRON TIDE" // COVERT TACTICAL ACTION', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '9px',
      color: '#f59e0b',
      letterSpacing: 2
    }).setOrigin(0.5);

    // Save Data Record
    const saveData = SaveSystem.getSaveData();
    if (saveData.bestRank) {
      this.add.text(cx - 60, 92, `TOP RATING: ${saveData.bestRank}  |  BEST TIME: ${formatTime(saveData.bestTime)}`, {
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: '8px',
        color: '#22c55e'
      }).setOrigin(0.5);
    }

    // Menu options
    this.menuItems = [
      { text: 'START INFILTRATION', scene: 'IntroScene' },
      { text: 'TACTICAL DOSSIER', scene: 'BriefingScene' },
      { text: 'CONTROLS & INTEL', scene: 'BriefingScene' }
    ];

    this.menuTexts = [];
    const menuStartY = 125;

    this.menuItems.forEach((item, idx) => {
      const y = menuStartY + idx * 24;
      const text = this.add.text(cx - 60, y, item.text, {
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: '11px',
        color: idx === 0 ? '#f59e0b' : '#94a3b8'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

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
    this.cursorIndicator = this.add.text(cx - 150, menuStartY, '►', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '11px',
      color: '#f59e0b'
    }).setOrigin(0.5);

    // Bottom info
    this.add.text(cx - 60, 246, 'ORIGINAL MOBILE SPY STEALTH-ACTION • 2026', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '8px',
      color: '#475569'
    }).setOrigin(0.5);

    // Keyboard inputs
    this.cursors = this.input.keyboard.createCursorKeys();
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.jKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);

    this.updateMenuHighlight();
  }

  updateMenuHighlight() {
    this.menuTexts.forEach((txt, idx) => {
      const isSel = idx === this.selectedIdx;
      txt.setColor(isSel ? '#f59e0b' : '#94a3b8');
      txt.setFontSize(isSel ? '12px' : '11px');
    });
    this.cursorIndicator.setY(125 + this.selectedIdx * 24);
  }

  selectOption(idx) {
    audioSystem.playTerminalBeep(920);
    const targetScene = this.menuItems[idx].scene;
    this.scene.start(targetScene);
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      audioSystem.init();
      audioSystem.resume();
      this.selectedIdx = (this.selectedIdx - 1 + this.menuItems.length) % this.menuItems.length;
      this.updateMenuHighlight();
      audioSystem.playTerminalBeep(600);
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
      audioSystem.init();
      audioSystem.resume();
      this.selectedIdx = (this.selectedIdx + 1) % this.menuItems.length;
      this.updateMenuHighlight();
      audioSystem.playTerminalBeep(600);
    } else if (
      Phaser.Input.Keyboard.JustDown(this.enterKey) ||
      Phaser.Input.Keyboard.JustDown(this.spaceKey) ||
      Phaser.Input.Keyboard.JustDown(this.jKey)
    ) {
      audioSystem.init();
      audioSystem.resume();
      this.selectOption(this.selectedIdx);
    }
  }
}

function formatTime(sec) {
  if (!sec) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
