import Phaser from 'phaser';
import { audioSystem } from '../systems/Audio.js';

export class LaserTripwire extends Phaser.GameObjects.Container {
  constructor(scene, startX, startY, endX, endY, config = {}) {
    super(scene, 0, 0);
    scene.add.existing(this);

    this.startX = startX;
    this.startY = startY;
    this.endX = endX;
    this.endY = endY;
    this.isPulsing = config.isPulsing || false;
    this.isHidden = config.isHidden || false; // invisible unless thermal visor is ON
    this.pulseCycle = config.pulseCycle || 1.5; // 1.5s on, 1.5s off
    this.pulseTimer = 0;
    this.isActive = true;

    // Emitters at both ends
    this.emitter1 = scene.add.image(startX, startY, 'laser_emitter').setDepth(48);
    this.emitter2 = scene.add.image(endX, endY, 'laser_emitter').setDepth(48).setFlipX(true);

    // Laser beam graphics
    this.beamGraphics = scene.add.graphics().setDepth(49);
    this.add(this.beamGraphics);

    this.lineGeom = new Phaser.Geom.Line(startX, startY, endX, endY);
  }

  update(time, delta) {
    const dt = delta / 1000;

    if (this.isPulsing) {
      this.pulseTimer += dt;
      if (this.pulseTimer >= this.pulseCycle) {
        this.pulseTimer = 0;
        this.isActive = !this.isActive;
      }
    }

    this.drawBeam();
    this.checkCollision();
  }

  drawBeam() {
    this.beamGraphics.clear();

    const isThermal = this.scene.player && this.scene.player.thermalActive;

    // If hidden and thermal is not active, do not render beam
    if (this.isHidden && !isThermal) {
      return;
    }

    if (!this.isActive) return;

    // Outer glow line
    const color = isThermal ? 0x38bdf8 : 0xff2222;
    this.beamGraphics.lineStyle(2.5, color, isThermal ? 0.9 : 0.45);
    this.beamGraphics.strokeLineShape(this.lineGeom);

    // Core bright beam
    this.beamGraphics.lineStyle(1.0, 0xffffff, 0.95);
    this.beamGraphics.strokeLineShape(this.lineGeom);
  }

  checkCollision() {
    if (!this.isActive) return;

    const player = this.scene.player;
    if (!player || player.state === 'dead') return;

    // If player is hanging from overhead pipe above the beam, they pass over safely!
    if (player.state === 'pipe_hang') {
      const playerY = player.y - 12; // top of body
      if (playerY < Math.min(this.startY, this.endY)) {
        return; // safely above beam
      }
    }

    // Check intersection with player hitbox bounds
    const playerBounds = player.getBounds();
    if (Phaser.Geom.Intersects.LineToRectangle(this.lineGeom, playerBounds)) {
      audioSystem.playLaserHum();
      this.scene.alarm.raise('Laser tripwire tripped');
      // Spark effect
      for (let i = 0; i < 4; i++) {
        const p = this.scene.add.circle(player.x, player.y, 2, 0xff2222);
        this.scene.tweens.add({
          targets: p,
          x: player.x + Phaser.Math.Between(-10, 10),
          y: player.y + Phaser.Math.Between(-10, 10),
          alpha: 0,
          duration: 200,
          onComplete: () => p.destroy()
        });
      }
    }
  }

  disable() {
    this.isActive = false;
    this.beamGraphics.clear();
  }
}
