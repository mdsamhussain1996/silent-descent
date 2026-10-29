import Phaser from 'phaser';

export class HUDScene extends Phaser.Scene {
  constructor() {
    super('HUDScene');
  }

  create() {
    this.mainScene = this.scene.get('GameScene');

    // Bottom bar background (480x40, centred at y = 250, covers y 230..270)
    this.barBg = this.add.image(240, 250, 'hud_bar').setDepth(1000);

    // ==========================================
    // LEFT SECTION: PORTRAIT, HP, LIGHT METER
    // ==========================================
    this.portrait = this.add.image(20, 250, 'portrait_ghost').setDepth(1001);

    // HP Bar
    this.add.text(42, 237, 'LIFE', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '7px',
      color: '#38bdf8'
    }).setDepth(1001);

    this.hpBarBg = this.add.rectangle(66, 241, 56, 5, 0x0a101d).setOrigin(0, 0.5).setDepth(1001);
    this.hpBarFill = this.add.rectangle(66, 241, 56, 4, 0x22c55e).setOrigin(0, 0.5).setDepth(1002);

    // Light / Visibility Meter
    this.lightLabel = this.add.text(42, 252, 'LIGHT', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '7px',
      color: '#94a3b8'
    }).setDepth(1001);

    this.lightMeterBg = this.add.rectangle(66, 256, 56, 5, 0x0a101d).setOrigin(0, 0.5).setDepth(1001);
    this.lightMeterFill = this.add.rectangle(66, 256, 0, 4, 0x10b981).setOrigin(0, 0.5).setDepth(1002);

    this.stealthBadge = this.add.text(128, 253, 'HIDDEN', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '6px',
      color: '#34d399'
    }).setDepth(1001);

    // ==========================================
    // CENTRE SECTION: ALARM METER (3 SEGMENTS)
    // ==========================================
    this.alarmTitle = this.add.text(240, 238, 'SECURITY STATUS', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '8px',
      fontStyle: 'bold',
      color: '#64748b',
      letterSpacing: 2
    }).setOrigin(0.5).setDepth(1001);

    // 3 segments
    this.alarmSegments = [];
    const segW = 26;
    const segH = 8;
    const segStartX = 240 - ((3 * segW + 2 * 6) / 2);

    for (let i = 0; i < 3; i++) {
      const seg = this.add.rectangle(segStartX + i * (segW + 6), 254, segW, segH, 0x0f172a)
        .setOrigin(0, 0.5)
        .setStrokeStyle(1, 0x334155)
        .setDepth(1001);
      this.alarmSegments.push(seg);
    }

    // ==========================================
    // RIGHT SECTION: WEAPON, AMMO & GADGET
    // ==========================================
    // Weapon panel
    this.weaponContainer = this.add.container(340, 250).setDepth(1001);
    this.weaponBg = this.add.rectangle(0, 0, 48, 26, 0x090d16, 0.7).setStrokeStyle(1, 0x1e293b);
    this.gunIcon = this.add.image(-10, 0, 'icon_pistol');
    this.ammoText = this.add.text(12, 0, '8/32', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '8px',
      fontStyle: 'bold',
      color: '#f8fafc'
    }).setOrigin(0.5);
    this.weaponKeyTip = this.add.text(18, -10, '[Q/E]', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '6px',
      color: '#64748b'
    }).setOrigin(0.5);
    this.weaponContainer.add([this.weaponBg, this.gunIcon, this.ammoText, this.weaponKeyTip]);

    // Gadget panel
    this.gadgetContainer = this.add.container(405, 250).setDepth(1001);
    this.gadgetBg = this.add.rectangle(0, 0, 40, 26, 0x090d16, 0.7).setStrokeStyle(1, 0x1e293b);
    this.gadgetIcon = this.add.image(-8, 0, 'icon_taser');
    this.gadgetCount = this.add.text(10, 0, 'x3', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '8px',
      color: '#38bdf8'
    }).setOrigin(0.5);
    this.gadgetKeyTip = this.add.text(12, -10, '[G]', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '6px',
      color: '#64748b'
    }).setOrigin(0.5);
    this.gadgetContainer.add([this.gadgetBg, this.gadgetIcon, this.gadgetCount, this.gadgetKeyTip]);

    // Thermal Visor Mini-icon
    this.thermalContainer = this.add.container(455, 250).setDepth(1001);
    this.thermalIcon = this.add.image(-8, 0, 'icon_thermal');
    this.thermalStatus = this.add.text(10, 0, '[V]', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '7px',
      color: '#fbbf24'
    }).setOrigin(0.5);
    this.thermalContainer.add([this.thermalIcon, this.thermalStatus]);

    // ==========================================
    // TOP BAR: TIMER, OBJECTIVE & INTEL
    // ==========================================
    this.add.rectangle(240, 7, 480, 14, 0x040711, 0.9).setDepth(1000);

    this.timerText = this.add.text(10, 2, 'TIME 00:00', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '8px',
      color: '#38bdf8'
    }).setDepth(1001);

    this.intelText = this.add.text(90, 2, 'INTEL: 0/2', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '8px',
      color: '#a78bfa'
    }).setDepth(1001);

    this.objectiveText = this.add.text(470, 2, 'OBJECTIVE: INFILTRATE KESTREL YARD', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '8px',
      color: '#f59e0b'
    }).setOrigin(1, 0).setDepth(1001);

    // Initialize Mobile Touch Controls
    this.createMobileControls();
  }

  updateHP(hp) {
    const pct = Math.max(0, Math.min(1, hp / 100));
    this.hpBarFill.width = 56 * pct;
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
    this.lightMeterFill.width = 56 * pct;
    if (pct < 0.3) {
      this.lightMeterFill.setFillStyle(0x10b981);
      this.stealthBadge.setText('HIDDEN').setColor('#34d399');
    } else if (pct < 0.65) {
      this.lightMeterFill.setFillStyle(0xf59e0b);
      this.stealthBadge.setText('SHADOW').setColor('#fbbf24');
    } else {
      this.lightMeterFill.setFillStyle(0xef4444);
      this.stealthBadge.setText('ALERT').setColor('#f87171');
    }
  }

  onAlarmChange(level, reason) {
    for (let i = 0; i < 3; i++) {
      if (i < level) {
        this.alarmSegments[i].setFillStyle(0xef4444);
        this.alarmSegments[i].setStrokeStyle(1, 0xfca5a5);
      } else {
        this.alarmSegments[i].setFillStyle(0x0f172a);
        this.alarmSegments[i].setStrokeStyle(1, 0x334155);
      }
    }

    if (level > 0) {
      this.alarmTitle.setColor('#ef4444');
      this.tweens.add({
        targets: this.alarmTitle,
        alpha: { from: 0.3, to: 1 },
        duration: 300,
        repeat: 3,
        yoyo: true
      });
    } else {
      this.alarmTitle.setColor('#64748b');
    }
  }

  updateWeaponUI(weaponData) {
    if (!weaponData) return;
    const { key, mag, reserve, isReloading, reloadProgress, selectedGadget, gadgetAmmo } = weaponData;

    // Update gun icon
    if (key === 'pistol') this.gunIcon.setTexture('icon_pistol');
    else if (key === 'smg') this.gunIcon.setTexture('icon_smg');
    else if (key === 'shotgun') this.gunIcon.setTexture('icon_shotgun');

    if (isReloading) {
      this.ammoText.setText('RELOAD').setColor('#f59e0b');
    } else {
      this.ammoText.setText(`${mag}/${reserve}`).setColor(mag === 0 ? '#ef4444' : '#f8fafc');
    }

    // Update gadget
    if (selectedGadget === 'taser') {
      this.gadgetIcon.setTexture('icon_taser');
      const cnt = gadgetAmmo?.taser ?? 0;
      this.gadgetCount.setText(`x${cnt}`).setColor(cnt > 0 ? '#38bdf8' : '#64748b');
    } else {
      this.gadgetIcon.setTexture('icon_noisemaker');
      const cnt = gadgetAmmo?.noiseMaker ?? 0;
      this.gadgetCount.setText(`x${cnt}`).setColor(cnt > 0 ? '#38bdf8' : '#64748b');
    }
  }

  updateIntel(count, total = 2) {
    this.intelText.setText(`INTEL: ${count}/${total}`);
  }

  updateThermal(active, timer, cooldown) {
    if (active) {
      this.thermalStatus.setText(`${timer.toFixed(1)}s`).setColor('#ef4444');
      this.thermalIcon.setTint(0xef4444);
    } else if (cooldown > 0) {
      this.thermalStatus.setText(`${Math.ceil(cooldown)}s`).setColor('#64748b');
      this.thermalIcon.setTint(0x475569);
    } else {
      this.thermalStatus.setText('[V]').setColor('#fbbf24');
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
      const bg = this.add.rectangle(0, 0, w, h, 0x0b1329, 0.6)
        .setStrokeStyle(1.5, 0x38bdf8)
        .setInteractive({ useHandCursor: true });

      const text = this.add.text(0, 0, label, {
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#f8fafc'
      }).setOrigin(0.5);

      container.add([bg, text]);

      bg.on('pointerdown', () => {
        bg.setFillStyle(0x0284c7, 0.85);
        onDown();
      });
      bg.on('pointerup', () => {
        bg.setFillStyle(0x0b1329, 0.6);
        onUp();
      });
      bg.on('pointerout', () => {
        bg.setFillStyle(0x0b1329, 0.6);
        onUp();
      });

      return container;
    };

    // Left D-Pad
    makeBtn(32, 195, 26, 26, '◄', () => inputSystem.touchStates.left = true, () => inputSystem.touchStates.left = false);
    makeBtn(80, 195, 26, 26, '►', () => inputSystem.touchStates.right = true, () => inputSystem.touchStates.right = false);
    makeBtn(56, 170, 26, 24, '▲', () => inputSystem.touchStates.up = true, () => inputSystem.touchStates.up = false);
    makeBtn(56, 220, 26, 24, '▼', () => inputSystem.touchStates.down = true, () => inputSystem.touchStates.down = false);

    // Right Action Buttons
    makeBtn(450, 202, 28, 24, 'JUMP', () => inputSystem.touchStates.jump = true, () => inputSystem.touchStates.jump = false);
    makeBtn(416, 202, 28, 24, 'ACT', () => inputSystem.touchStates.action = true, () => inputSystem.touchStates.action = false);
    makeBtn(450, 172, 28, 24, 'FIRE', () => inputSystem.touchStates.shoot = true, () => inputSystem.touchStates.shoot = false);
    makeBtn(416, 172, 28, 24, 'RELOAD', () => inputSystem.touchStates.reload = true, () => inputSystem.touchStates.reload = false);
    makeBtn(382, 172, 28, 24, 'SWAP', () => inputSystem.touchStates.cycle = true, () => inputSystem.touchStates.cycle = false);
    makeBtn(382, 202, 28, 24, 'GADGET', () => inputSystem.touchStates.gadget = true, () => inputSystem.touchStates.gadget = false);
    makeBtn(348, 187, 28, 24, 'VISOR', () => inputSystem.touchStates.visor = true, () => inputSystem.touchStates.visor = false);
  }
}

