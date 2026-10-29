import Phaser from 'phaser';

export class HUDScene extends Phaser.Scene {
  constructor() {
    super('HUDScene');
  }

  create() {
    this.mainScene = this.scene.get('GameScene');

    // Bottom bar background (480x32, at y = 238)
    this.barBg = this.add.image(240, 254, 'hud_bar').setDepth(1000);

    // ==========================================
    // LEFT SECTION: PORTRAIT, HP, LIGHT METER
    // ==========================================
    this.portrait = this.add.image(18, 254, 'portrait_ghost').setScale(0.9).setDepth(1001);

    // HP Bar
    this.add.text(38, 242, 'LIFE', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '7px',
      color: '#38bdf8'
    }).setDepth(1001);

    this.hpBarBg = this.add.rectangle(60, 245, 54, 5, 0x0f172a).setOrigin(0, 0.5).setDepth(1001);
    this.hpBarFill = this.add.rectangle(60, 245, 54, 4, 0x22c55e).setOrigin(0, 0.5).setDepth(1002);

    // Light / Visibility Meter
    this.add.text(38, 256, 'LIGHT', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '7px',
      color: '#94a3b8'
    }).setDepth(1001);

    this.lightMeterBg = this.add.rectangle(60, 259, 54, 5, 0x0f172a).setOrigin(0, 0.5).setDepth(1001);
    this.lightMeterFill = this.add.rectangle(60, 259, 0, 4, 0xf59e0b).setOrigin(0, 0.5).setDepth(1002);

    // ==========================================
    // CENTRE SECTION: ALARM METER (3 SEGMENTS)
    // ==========================================
    this.add.text(240, 243, 'ALARM', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#94a3b8',
      letterSpacing: 2
    }).setOrigin(0.5).setDepth(1001);

    // 3 segments
    this.alarmSegments = [];
    const segW = 24;
    const segH = 8;
    const segStartX = 240 - ((3 * segW + 2 * 4) / 2);

    for (let i = 0; i < 3; i++) {
      const seg = this.add.rectangle(segStartX + i * (segW + 4), 258, segW, segH, 0x1e293b)
        .setOrigin(0, 0.5)
        .setStrokeStyle(1, 0x334155)
        .setDepth(1001);
      this.alarmSegments.push(seg);
    }

    // ==========================================
    // RIGHT SECTION: WEAPON, AMMO & THERMAL VISOR
    // ==========================================
    this.gunIcon = this.add.image(345, 254, 'icon_pistol').setDepth(1001);
    this.ammoText = this.add.text(364, 250, '6/12', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '9px',
      color: '#f8fafc'
    }).setDepth(1001);

    // Thermal Visor Gadget Icon
    this.thermalIcon = this.add.image(420, 254, 'icon_thermal').setDepth(1001);
    this.thermalStatus = this.add.text(435, 250, 'READY', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '8px',
      color: '#fbbf24'
    }).setDepth(1001);

    // ==========================================
    // TOP BAR: TIMER & OBJECTIVE
    // ==========================================
    const topBar = this.add.rectangle(240, 7, 480, 14, 0x05070c, 0.85).setDepth(1000);

    this.timerText = this.add.text(8, 2, 'TIME 00:00', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '9px',
      color: '#38bdf8'
    }).setDepth(1001);

    this.objectiveText = this.add.text(472, 2, 'OBJECTIVE: INFILTRATE KESTREL YARD', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '8px',
      color: '#f59e0b'
    }).setOrigin(1, 0).setDepth(1001);

    // Initialize Mobile Touch Controls
    this.createMobileControls();
  }

  updateHP(hp) {
    const pct = Math.max(0, Math.min(1, hp / 100));
    this.hpBarFill.width = 54 * pct;
    if (pct < 0.3) {
      this.hpBarFill.setFillStyle(0xef4444);
    } else if (pct < 0.6) {
      this.hpBarFill.setFillStyle(0xf59e0b);
    } else {
      this.hpBarFill.setFillStyle(0x22c55e);
    }
  }

  updateLight(visPercent) {
    const pct = Math.max(0, Math.min(1, visPercent / 100));
    this.lightMeterFill.width = 54 * pct;
    // Gradient coloring: green when hidden, yellow in medium, red in spotlight
    if (pct < 0.3) {
      this.lightMeterFill.setFillStyle(0x22c55e);
    } else if (pct < 0.65) {
      this.lightMeterFill.setFillStyle(0xf59e0b);
    } else {
      this.lightMeterFill.setFillStyle(0xef4444);
    }
  }

  onAlarmChange(level, reason) {
    for (let i = 0; i < 3; i++) {
      if (i < level) {
        this.alarmSegments[i].setFillStyle(0xef4444);
        this.alarmSegments[i].setStrokeStyle(1, 0xfca5a5);
      } else {
        this.alarmSegments[i].setFillStyle(0x1e293b);
        this.alarmSegments[i].setStrokeStyle(1, 0x334155);
      }
    }
  }

  updateAmmo(ammo) {
    this.ammoText.setText(`${ammo}/12`);
  }

  updateThermal(active, timer, cooldown) {
    if (active) {
      this.thermalStatus.setText(`${timer.toFixed(1)}s`).setColor('#ef4444');
      this.thermalIcon.setTint(0xef4444);
    } else if (cooldown > 0) {
      this.thermalStatus.setText(`${Math.ceil(cooldown)}s`).setColor('#64748b');
      this.thermalIcon.setTint(0x475569);
    } else {
      this.thermalStatus.setText('READY').setColor('#fbbf24');
      this.thermalIcon.clearTint();
    }
  }

  setObjective(text) {
    this.objectiveText.setText(text.toUpperCase());
    this.tweens.add({
      targets: this.objectiveText,
      alpha: { from: 0.2, to: 1 },
      duration: 250,
      repeat: 3,
      yoyo: true
    });
  }

  updateTimer(elapsedSec) {
    const m = Math.floor(elapsedSec / 60);
    const s = Math.floor(elapsedSec % 60);
    this.timerText.setText(`TIME ${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
  }

  // ==========================================
  // MOBILE TOUCH CONTROLS
  // ==========================================
  createMobileControls() {
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (!isTouch) return;

    const inputSystem = this.mainScene.inputManager;
    if (!inputSystem) return;

    const makeBtn = (x, y, w, h, label, onDown, onUp) => {
      const container = this.add.container(x, y).setDepth(2500);
      const bg = this.add.rectangle(0, 0, w, h, 0x0f172a, 0.5)
        .setStrokeStyle(1.5, 0x38bdf8)
        .setInteractive({ useHandCursor: true });

      const text = this.add.text(0, 0, label, {
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#f8fafc'
      }).setOrigin(0.5);

      container.add([bg, text]);

      bg.on('pointerdown', () => {
        bg.setFillStyle(0x0284c7, 0.8);
        onDown();
      });
      bg.on('pointerup', () => {
        bg.setFillStyle(0x0f172a, 0.5);
        onUp();
      });
      bg.on('pointerout', () => {
        bg.setFillStyle(0x0f172a, 0.5);
        onUp();
      });

      return container;
    };

    // Left D-Pad
    makeBtn(35, 195, 28, 28, '◄', () => inputSystem.touchStates.left = true, () => inputSystem.touchStates.left = false);
    makeBtn(85, 195, 28, 28, '►', () => inputSystem.touchStates.right = true, () => inputSystem.touchStates.right = false);
    makeBtn(60, 168, 28, 26, '▲', () => inputSystem.touchStates.up = true, () => inputSystem.touchStates.up = false);
    makeBtn(60, 218, 28, 26, '▼', () => inputSystem.touchStates.down = true, () => inputSystem.touchStates.down = false);

    // Right Action Buttons
    makeBtn(445, 195, 32, 28, 'JUMP', () => inputSystem.touchStates.jump = true, () => inputSystem.touchStates.jump = false);
    makeBtn(405, 195, 32, 28, 'ACT', () => inputSystem.touchStates.action = true, () => inputSystem.touchStates.action = false);
    makeBtn(445, 160, 32, 26, 'GUN', () => inputSystem.touchStates.shoot = true, () => inputSystem.touchStates.shoot = false);
    makeBtn(405, 160, 32, 26, 'SNEAK', () => inputSystem.touchStates.sneak = true, () => inputSystem.touchStates.sneak = false);
    makeBtn(365, 178, 30, 26, 'VISOR', () => inputSystem.touchStates.visor = true, () => inputSystem.touchStates.visor = false);
  }
}
