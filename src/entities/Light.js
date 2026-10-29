import Phaser from 'phaser';
import { audioSystem } from '../systems/Audio.js';

export class LightSource extends Phaser.GameObjects.Container {
  constructor(scene, x, y, config = {}) {
    super(scene, x, y);
    scene.add.existing(this);

    this.radius = config.radius || 90;
    this.intensity = config.intensity || 1.0;
    this.isShootable = config.isShootable !== undefined ? config.isShootable : true;
    this.isSearchlight = config.isSearchlight || false;
    this.isActive = true;

    // Sprite representation (lamp post on roof or ceiling mount in office)
    if (this.isSearchlight) {
      this.lightSprite = scene.add.image(0, 0, 'camera').setScale(1.4).setTint(0x38bdf8);
      this.add(this.lightSprite);
      this.startSearchlightSweep(config.sweepRange || 45, config.sweepDuration || 4000);
    } else {
      this.lightSprite = scene.add.image(0, 0, 'lamp_post');
      this.add(this.lightSprite);
    }

    // Light overlay glow sprite using additive blending
    this.glow = scene.add.image(x, y + 10, 'light_radial')
      .setScale(this.radius / 64)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.7)
      .setDepth(40);

    // Register with scene's lights list
    if (!scene.lightsList) scene.lightsList = [];
    scene.lightsList.push(this);
  }

  startSearchlightSweep(sweepRange, duration) {
    this.sweepTween = this.scene.tweens.add({
      targets: this,
      x: { from: this.x - 70, to: this.x + 70 },
      duration: duration,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        if (this.glow) {
          this.glow.setPosition(this.x, this.y + 40);
        }
      }
    });
  }

  shootOut() {
    if (!this.isShootable || !this.isActive) return;

    this.isActive = false;
    audioSystem.playLightPop();
    this.scene.player.lightsShot++;

    if (this.lightSprite) {
      this.lightSprite.setTexture('lamp_post_broken');
    }
    if (this.glow) {
      this.glow.destroy();
      this.glow = null;
    }

    // Spark / glass particles
    for (let i = 0; i < 8; i++) {
      const spark = this.scene.add.circle(this.x, this.y + 4, 1.5, 0xfef08a);
      this.scene.tweens.add({
        targets: spark,
        x: this.x + Phaser.Math.Between(-14, 14),
        y: this.y + Phaser.Math.Between(10, 24),
        alpha: 0,
        duration: 350,
        onComplete: () => spark.destroy()
      });
    }

    // Creating this dark path may alert nearby guards to the sound
    this.scene.stealth.emitNoise(this.x, this.y, 60);
  }
}
