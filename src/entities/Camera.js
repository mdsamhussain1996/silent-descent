import Phaser from 'phaser';
import { audioSystem } from '../systems/Audio.js';

export class SecurityCamera extends Phaser.GameObjects.Container {
  constructor(scene, x, y, config = {}) {
    super(scene, x, y);
    scene.add.existing(this);

    this.baseAngle = config.baseAngle || 90; // pointing down/right
    this.sweepRange = config.sweepRange || 35; // +-35 degrees
    this.sweepDuration = config.sweepDuration || 3000; // 3s cycle
    this.range = config.range || 120;
    this.isDisabled = false;
    this.disableTimer = 0;
    this.detectionTimer = 0; // 1s to trigger alarm

    // Camera mount sprite
    this.camSprite = scene.add.image(0, 0, 'camera').setOrigin(0.2, 0.5);
    this.add(this.camSprite);

    // Vision cone graphics
    this.coneGraphics = scene.add.graphics();
    this.scene.add.existing(this.coneGraphics);
    this.coneGraphics.setDepth(45);

    // Start sweep tween
    this.startSweep();
  }

  startSweep() {
    this.sweepTween = this.scene.tweens.add({
      targets: this.camSprite,
      angle: { from: this.baseAngle - this.sweepRange, to: this.baseAngle + this.sweepRange },
      duration: this.sweepDuration,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  update(time, delta) {
    const dt = delta / 1000;

    if (this.isDisabled) {
      this.coneGraphics.clear();
      this.disableTimer -= dt;
      if (this.disableTimer <= 0) {
        this.isDisabled = false;
        this.camSprite.clearTint();
        if (this.sweepTween) this.sweepTween.resume();
      }
      return;
    }

    this.checkPlayerDetection(dt);
    this.drawCone();
  }

  checkPlayerDetection(dt) {
    const player = this.scene.player;
    if (!player || player.state === 'dead') {
      this.detectionTimer = 0;
      return;
    }

    const rad = Phaser.Math.DegToRad(this.camSprite.angle);
    const facingX = Math.cos(rad);
    const facingY = Math.sin(rad);

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= this.range) {
      // Dot product to check angle
      const normX = dx / dist;
      const normY = dy / dist;
      const dot = facingX * normX + facingY * normY;
      const cosHalfFov = Math.cos(Phaser.Math.DegToRad(25)); // 50 deg total FOV

      if (dot > cosHalfFov) {
        // Player spotted by camera!
        this.detectionTimer += dt;
        if (this.detectionTimer >= 1.0) {
          this.detectionTimer = 0;
          this.scene.alarm.raise('Security camera spotted Ghost');
        }
        return;
      }
    }

    this.detectionTimer = Math.max(0, this.detectionTimer - dt * 1.5);
  }

  drawCone() {
    this.coneGraphics.clear();
    const rad = Phaser.Math.DegToRad(this.camSprite.angle);
    const startX = this.x;
    const startY = this.y;
    const spread = Phaser.Math.DegToRad(25);

    const isDetecting = this.detectionTimer > 0.3;
    const color = isDetecting ? 0xff0033 : 0xef4444;
    const alpha = isDetecting ? 0.45 : 0.22;

    this.coneGraphics.fillStyle(color, alpha);
    this.coneGraphics.beginPath();
    this.coneGraphics.moveTo(startX, startY);
    this.coneGraphics.arc(startX, startY, this.range, rad - spread, rad + spread);
    this.coneGraphics.closePath();
    this.coneGraphics.fill();
  }

  // Shot by silenced pistol: spark + static, disabled for 8s
  shootDisable() {
    if (!this.wasCountedDisabled && this.scene.objectives) {
      this.wasCountedDisabled = true;
      this.scene.objectives.onCameraDisabled();
    }
    this.isDisabled = true;
    this.disableTimer = 8.0;
    this.camSprite.setTint(0x64748b);
    if (this.sweepTween) this.sweepTween.pause();
    this.coneGraphics.clear();

    // Sparks
    for (let i = 0; i < 6; i++) {
      const spark = this.scene.add.circle(this.x, this.y, 1.5, 0x38bdf8);
      this.scene.tweens.add({
        targets: spark,
        x: this.x + Phaser.Math.Between(-15, 15),
        y: this.y + Phaser.Math.Between(-15, 15),
        alpha: 0,
        duration: 300,
        onComplete: () => spark.destroy()
      });
    }
  }

  // Permanently disabled by security terminal hack
  permanentlyDisable() {
    if (!this.wasCountedDisabled && this.scene.objectives) {
      this.wasCountedDisabled = true;
      this.scene.objectives.onCameraDisabled();
    }
    this.isDisabled = true;
    this.disableTimer = 999999;
    this.camSprite.setTint(0x334155);
    if (this.sweepTween) this.sweepTween.stop();
    this.coneGraphics.clear();
  }
}
