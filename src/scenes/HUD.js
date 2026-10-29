// src/scenes/HUD.js
// Slim Tactical HUD (28px) with Edge-Screen Compass & Radio Comms

import Phaser from 'phaser';

export class HUDScene extends Phaser.Scene {
  constructor() {
    super('HUDScene');
  }

  create() {
    this.mainScene = this.scene.get('GameScene');
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // Bottom Bar (28px height, from y = 332 to 360)
    const barY = h - 14;
    this.barBg = this.add.graphics().setDepth(1000);
    this.barBg.fillStyle(0x040810, 0.95);
    this.barBg.fillRect(0, h - 28, w, 28);
    this.barBg.lineStyle(1, 0x1e293b, 0.8);
    this.barBg.strokeLineShape(new Phaser.Geom.Line(0, h - 28, w, h - 28));

    // ==========================================
    // 1. LEFT: GHOST PORTRAIT, HP & LIGHT METER
    // ==========================================
    if (this.textures.exists('portrait_ghost')) {
      this.portrait = this.add.image(18, barY, 'portrait_ghost')
        .setDisplaySize(24, 24)
        .setDepth(1001);
      this.add.rectangle(18, barY, 24, 24).setStrokeStyle(1, 0x38bdf8, 0.6).setDepth(1002);
    }

    // LIFE Bar
    this.add.text(36, barY - 10, 'LIFE', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '8px',
      color: '#38bdf8'
    }).setDepth(1001);

    this.hpBarBg = this.add.rectangle(60, barY - 6, 70, 5, 0x0a101d).setOrigin(0, 0.5).setDepth(1001);
    this.hpBarFill = this.add.rectangle(60, barY - 6, 70, 4, 0x22c55e).setOrigin(0, 0.5).setDepth(1002);

    // LIGHT Meter
    this.add.text(36, barY + 2, 'LIGHT', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '8px',
      color: '#94a3b8'
    }).setDepth(1001);

    this.lightMeterBg = this.add.rectangle(60, barY + 6, 70, 5, 0x0a101d).setOrigin(0, 0.5).setDepth(1001);
    this.lightMeterFill = this.add.rectangle(60, barY + 6, 0, 4, 0x10b981).setOrigin(0, 0.5).setDepth(1002);

    this.stealthBadge = this.add.text(136, barY + 2, 'HIDDEN', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '8px',
      fontStyle: 'bold',
      color: '#34d399'
    }).setDepth(1001);

    // ==========================================
    // 2. CENTRE: ALARM THREAT LEVEL
    // ==========================================
    const cx = w / 2;
    this.add.text(cx, barY - 8, 'SECURITY THREAT', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#64748b',
      letterSpacing: 2
    }).setOrigin(0.5).setDepth(1001);

    this.alarmSegments = [];
    const segW = 34;
    const segH = 8;
    const segStartX = cx - ((3 * segW + 2 * 6) / 2);

    for (let i = 0; i < 3; i++) {
      const seg = this.add.rectangle(segStartX + i * (segW + 6), barY + 4, segW, segH, 0x0a121e)
        .setOrigin(0, 0.5)
        .setStrokeStyle(1, 0x334155)
        .setDepth(1001);
      this.alarmSegments.push(seg);
    }

    this.alarmText = this.add.text(cx + 68, barY + 4, 'LEVEL 0', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '8px',
      color: '#64748b'
    }).setOrigin(0, 0.5).setDepth(1001);

    // ==========================================
    // 3. RIGHT: ACTIVE WEAPON, AMMO & GADGET
    // ==========================================
    const rightX = w - 170;

    // Weapon Box
    this.weaponBox = this.add.rectangle(rightX + 40, barY, 78, 22, 0x08101a, 0.9)
      .setStrokeStyle(1, 0x1e293b)
      .setDepth(1001);

    this.gunIcon = this.add.image(rightX + 16, barY, 'icon_pistol').setDisplaySize(20, 12).setDepth(1002);
    this.ammoText = this.add.text(rightX + 34, barY, '8 / 32', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#f8fafc'
    }).setOrigin(0, 0.5).setDepth(1002);

    // Gadget Box
    this.gadgetBox = this.add.rectangle(w - 40, barY, 68, 22, 0x08101a, 0.9)
      .setStrokeStyle(1, 0x1e293b)
      .setDepth(1001);

    this.gadgetIcon = this.add.image(w - 62, barY, 'icon_taser').setDisplaySize(16, 16).setDepth(1002);
    this.gadgetText = this.add.text(w - 48, barY, '3x [G]', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '9px',
      color: '#38bdf8'
    }).setOrigin(0, 0.5).setDepth(1002);

    // ==========================================
    // 4. TOP-LEFT: TIMER & INTEL
    // ==========================================
    const topBg = this.add.graphics().setDepth(1000);
    topBg.fillStyle(0x040810, 0.85);
    topBg.fillRect(10, 8, 150, 24);
    topBg.lineStyle(1, 0x1e293b, 0.7);
    topBg.strokeRect(10, 8, 150, 24);

    this.timerText = this.add.text(18, 14, 'TIME: 00:00', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '10px',
      color: '#f8fafc'
    }).setDepth(1001);

    this.intelText = this.add.text(95, 14, 'INTEL: 0/3', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '10px',
      color: '#f59e0b'
    }).setDepth(1001);

    // ==========================================
    // 5. TOP-RIGHT: OBJECTIVES CHECKLIST
    // ==========================================
    this.objectiveContainer = this.add.container(w - 220, 8).setDepth(1000);
    this.refreshObjectives();

    // ==========================================
    // 6. EDGE COMPASS OBJECTIVE MARKER
    // ==========================================
    this.edgeMarker = this.add.container(0, 0).setDepth(999);
    this.edgeMarkerBg = this.add.circle(0, 0, 11, 0x040810, 0.85).setStrokeStyle(1.5, 0xf59e0b);
    this.edgeMarkerArrow = this.add.triangle(0, 0, 0, -6, 5, 4, -5, 4, 0xf59e0b);
    this.edgeMarker.add([this.edgeMarkerBg, this.edgeMarkerArrow]);
    this.edgeMarker.setVisible(false);

    // ==========================================
    // 7. RADIO BOX (HQ CONTROL COMMS)
    // ==========================================
    this.radioBox = this.add.container(cx, 75).setDepth(1100);
    this.radioBox.setVisible(false);

    const rBg = this.add.graphics();
    rBg.fillStyle(0x040812, 0.94);
    rBg.fillRect(-170, -28, 340, 56);
    rBg.lineStyle(1.5, 0x00f0ff, 0.8);
    rBg.strokeRect(-170, -28, 340, 56);

    if (this.textures.exists('portrait_control')) {
      this.radioPortrait = this.add.image(-140, 0, 'portrait_control').setDisplaySize(42, 42);
      const border = this.add.rectangle(-140, 0, 42, 42).setStrokeStyle(1, 0x00f0ff, 0.6);
      this.radioBox.add([rBg, this.radioPortrait, border]);
    } else {
      this.radioBox.add(rBg);
    }

    this.radioHeader = this.add.text(-110, -22, 'CONTROL // TACTICAL COMMS FEED', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#00f0ff'
    });

    this.radioText = this.add.text(-110, -8, '', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '9.5px',
      color: '#f8fafc',
      wordWrap: { width: 270 }
    });

    this.radioBox.add([this.radioHeader, this.radioText]);

    // ==========================================
    // 8. CONTEXTUAL KEY-ICON POPUP
    // ==========================================
    this.promptContainer = this.add.container(0, 0).setDepth(1050);
    this.promptBg = this.add.rectangle(0, 0, 70, 18, 0x040810, 0.9).setStrokeStyle(1, 0xf59e0b);
    this.promptText = this.add.text(0, 0, '', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#f59e0b'
    }).setOrigin(0.5);
    this.promptContainer.add([this.promptBg, this.promptText]);
    this.promptContainer.setVisible(false);

    // Mobile Tactical Touch Controls if touch device
    if (this.sys.game.device.input.touch) {
      this.createTouchControls();
    }
  }

  showPrompt(worldX, worldY, text) {
    if (!this.mainScene || !this.mainScene.cameras.main) return;
    const cam = this.mainScene.cameras.main;
    const screenX = (worldX - cam.scrollX) * cam.zoom;
    const screenY = (worldY - cam.scrollY) * cam.zoom;

    this.promptContainer.setPosition(screenX, screenY);
    this.promptText.setText(text);
    this.promptBg.setSize(this.promptText.width + 14, 18);
    this.promptContainer.setVisible(true);
  }

  hidePrompt() {
    if (this.promptContainer) {
      this.promptContainer.setVisible(false);
    }
  }

  showRadioBox(transmission) {
    this.radioText.setText(transmission.text);
    const speaker = transmission.speaker || 'CONTROL // HQ COMMS';
    this.radioHeader.setText(speaker);

    if (this.radioPortrait) {
      if (speaker.toUpperCase().includes('MEERA') && this.textures.exists('portrait_meera')) {
        this.radioPortrait.setTexture('portrait_meera');
      } else if (speaker.toUpperCase().includes('GHOST') && this.textures.exists('portrait_ghost')) {
        this.radioPortrait.setTexture('portrait_ghost');
      } else if (this.textures.exists('portrait_control')) {
        this.radioPortrait.setTexture('portrait_control');
      }
    }

    this.radioBox.setVisible(true);
    this.radioBox.setAlpha(0);
    this.tweens.add({
      targets: this.radioBox,
      alpha: 1,
      duration: 250
    });
  }

  hideRadioBox() {
    this.tweens.add({
      targets: this.radioBox,
      alpha: 0,
      duration: 300,
      onComplete: () => this.radioBox.setVisible(false)
    });
  }

  refreshObjectives() {
    if (!this.objectiveContainer) return;
    this.objectiveContainer.removeAll(true);

    const objs = this.mainScene?.objectives?.primary || [
      { text: 'Infiltrate Kestrel naval yard', completed: true, visible: true },
      { text: 'Hack security terminal', completed: false, visible: true },
      { text: 'Photograph guidance manifest', completed: false, visible: true },
      { text: 'Rescue Dr. Meera Sen', completed: false, visible: true },
      { text: 'Plant tracker on cargo', completed: false, visible: true },
      { text: 'Extract with Meera at docks', completed: false, visible: true }
    ];

    const activeList = objs.filter(o => o.visible !== false).slice(0, 4);
    const boxH = 14 + activeList.length * 14;

    const bg = this.add.graphics();
    bg.fillStyle(0x040810, 0.88);
    bg.fillRect(0, 0, 210, boxH);
    bg.lineStyle(1, 0x1e293b, 0.8);
    bg.strokeRect(0, 0, 210, boxH);
    this.objectiveContainer.add(bg);

    const title = this.add.text(8, 4, 'PRIMARY OBJECTIVES', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#f59e0b'
    });
    this.objectiveContainer.add(title);

    activeList.forEach((obj, idx) => {
      const check = obj.completed ? '✓' : '○';
      const col = obj.completed ? '#10b981' : '#f8fafc';
      const itemText = this.add.text(8, 16 + idx * 14, `${check} ${obj.text}`, {
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: '8px',
        color: col
      });
      this.objectiveContainer.add(itemText);
    });
  }

  onAlarmChange(level, reason) {
    this.alarmSegments.forEach((seg, idx) => {
      if (idx < level) {
        const col = level === 1 ? 0xf59e0b : (level === 2 ? 0xf97316 : 0xef4444);
        seg.setFillStyle(col);
      } else {
        seg.setFillStyle(0x0a121e);
      }
    });

    const levelNames = ['LEVEL 0 (SECURE)', 'LEVEL 1 (SEARCH)', 'LEVEL 2 (ALERT)', 'LEVEL 3 (CRITICAL)'];
    this.alarmText.setText(levelNames[level] || 'ALERT');
    this.alarmText.setColor(level === 0 ? '#64748b' : (level >= 3 ? '#ef4444' : '#f59e0b'));
  }

  update(time, delta) {
    const main = this.mainScene;
    if (!main || !main.player) return;

    // Update HP
    const hpRatio = Phaser.Math.Clamp(main.player.hp / main.player.maxHp, 0, 1);
    this.hpBarFill.width = 70 * hpRatio;
    this.hpBarFill.setFillStyle(hpRatio > 0.5 ? 0x22c55e : (hpRatio > 0.25 ? 0xf59e0b : 0xef4444));

    // Update Light Meter
    const lightVal = main.stealth?.playerVisibility ?? 100;
    this.lightMeterFill.width = 70 * (lightVal / 100);
    this.lightMeterFill.setFillStyle(lightVal < 30 ? 0x10b981 : (lightVal < 70 ? 0xf59e0b : 0xef4444));

    if (lightVal < 30) {
      this.stealthBadge.setText('HIDDEN').setColor('#10b981');
    } else if (lightVal < 70) {
      this.stealthBadge.setText('SHADOWED').setColor('#f59e0b');
    } else {
      this.stealthBadge.setText('EXPOSED').setColor('#ef4444');
    }

    // Update Timer
    if (main.objectives) {
      const sec = Math.floor(main.objectives.stats.missionTime);
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      this.timerText.setText(`TIME: ${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      this.intelText.setText(`INTEL: ${main.objectives.stats.intelFound}/${main.objectives.stats.totalIntel}`);
    }

    // Update Active Weapon & Ammo
    if (main.player.weapons) {
      const data = main.player.weapons.getHUDData();
      if (data) {
        this.ammoText.setText(data.isReloading ? 'RELOAD...' : `${data.mag} / ${data.reserve}`);
        this.gunIcon.setTexture(`icon_${data.key}`);
        if (data.selectedGadget && this.textures.exists(`icon_${data.selectedGadget}`)) {
          this.gadgetIcon.setTexture(`icon_${data.selectedGadget}`);
        }
        this.gadgetText.setText(`${data.gadgetAmmo}x [G]`);
      }
    }

    // Update Edge Compass Marker
    this.updateEdgeMarker();
  }

  updateEdgeMarker() {
    const main = this.mainScene;
    if (!main || !main.objectives || !main.cameras.main) {
      this.edgeMarker.setVisible(false);
      return;
    }

    const activeObj = main.objectives.getActivePrimary();
    if (!activeObj || !activeObj.targetX || !activeObj.targetY) {
      this.edgeMarker.setVisible(false);
      return;
    }

    const cam = main.cameras.main;
    const targetScreenX = (activeObj.targetX - cam.scrollX) * cam.zoom;
    const targetScreenY = (activeObj.targetY - cam.scrollY) * cam.zoom;

    const w = this.cameras.main.width;
    const h = this.cameras.main.height - 30; // above bottom HUD

    // If target is already comfortably on-screen, hide edge arrow
    if (targetScreenX > 40 && targetScreenX < w - 40 && targetScreenY > 40 && targetScreenY < h - 40) {
      this.edgeMarker.setVisible(false);
      return;
    }

    this.edgeMarker.setVisible(true);

    const centerX = w / 2;
    const centerY = h / 2;
    const angle = Math.atan2(targetScreenY - centerY, targetScreenX - centerX);

    // Clamp marker to screen border with margin
    const margin = 24;
    const edgeX = Phaser.Math.Clamp(centerX + Math.cos(angle) * (w / 2 - margin), margin, w - margin);
    const edgeY = Phaser.Math.Clamp(centerY + Math.sin(angle) * (h / 2 - margin), margin, h - margin);

    this.edgeMarker.setPosition(edgeX, edgeY);
    this.edgeMarkerArrow.setRotation(angle - Math.PI / 2);
  }

  createTouchControls() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // D-Pad Left / Right
    const btnLeft = this.add.circle(40, h - 60, 24, 0x1e293b, 0.7).setInteractive().setDepth(1050);
    this.add.text(40, h - 60, '◄', { fontSize: '14px', color: '#ffffff' }).setOrigin(0.5).setDepth(1051);
    btnLeft.on('pointerdown', () => { if (this.mainScene.inputSystem) this.mainScene.inputSystem.touchMoveLeft = true; });
    btnLeft.on('pointerup', () => { if (this.mainScene.inputSystem) this.mainScene.inputSystem.touchMoveLeft = false; });
    btnLeft.on('pointerout', () => { if (this.mainScene.inputSystem) this.mainScene.inputSystem.touchMoveLeft = false; });

    const btnRight = this.add.circle(96, h - 60, 24, 0x1e293b, 0.7).setInteractive().setDepth(1050);
    this.add.text(96, h - 60, '►', { fontSize: '14px', color: '#ffffff' }).setOrigin(0.5).setDepth(1051);
    btnRight.on('pointerdown', () => { if (this.mainScene.inputSystem) this.mainScene.inputSystem.touchMoveRight = true; });
    btnRight.on('pointerup', () => { if (this.mainScene.inputSystem) this.mainScene.inputSystem.touchMoveRight = false; });
    btnRight.on('pointerout', () => { if (this.mainScene.inputSystem) this.mainScene.inputSystem.touchMoveRight = false; });

    // Action Buttons: Shoot, Jump, Interact
    const btnShoot = this.add.circle(w - 45, h - 60, 24, 0xef4444, 0.7).setInteractive().setDepth(1050);
    this.add.text(w - 45, h - 60, 'FIRE', { fontSize: '10px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5).setDepth(1051);
    btnShoot.on('pointerdown', () => { if (this.mainScene.player) this.mainScene.player.fireCurrentWeapon(); });

    const btnJump = this.add.circle(w - 100, h - 60, 22, 0x0284c7, 0.7).setInteractive().setDepth(1050);
    this.add.text(w - 100, h - 60, 'JUMP', { fontSize: '9px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5).setDepth(1051);
    btnJump.on('pointerdown', () => { if (this.mainScene.player) this.mainScene.player.jump(); });
  }
}
