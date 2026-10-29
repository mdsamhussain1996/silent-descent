// src/scenes/Intro.js
// Cinematic Insertion Cutscene (640x360)

import Phaser from 'phaser';
import { audioSystem } from '../systems/Audio.js';

export class IntroScene extends Phaser.Scene {
  constructor() {
    super('IntroScene');
  }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    audioSystem.init();
    audioSystem.resume();
    audioSystem.startHelicopterLoop();
    audioSystem.setHelicopterVolume(0.2);

    // Deep stormy night backdrop
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x04070e, 0x070c18, 0x0a1424, 0x0f1d33, 1);
    bg.fillRect(0, 0, w, h);

    // Distant harbour skyline & rooftop silhouettes
    const skyline = this.add.graphics();
    skyline.fillStyle(0x08101a, 0.85);
    skyline.fillRect(0, h - 110, w, 110);
    // Industrial target roof below
    skyline.fillStyle(0x111c2a, 1);
    skyline.fillRect(240, h - 80, 400, 80);

    // Heavy rain streaks
    for (let i = 0; i < 50; i++) {
      const drop = this.add.rectangle(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(-20, h),
        1,
        Phaser.Math.Between(10, 20),
        0x38bdf8,
        0.35
      );
      this.tweens.add({
        targets: drop,
        y: h + 20,
        x: drop.x + 40,
        duration: Phaser.Math.Between(350, 600),
        repeat: -1,
        delay: Phaser.Math.Between(0, 400)
      });
    }

    // Stealth Insertion Chopper
    const heli = this.add.image(-100, 100, 'heli_body');
    heli.setDisplaySize(120, 50);

    // Helicopter searchlight cone
    const searchlight = this.add.graphics();
    searchlight.fillStyle(0x38bdf8, 0.18);
    searchlight.beginPath();
    searchlight.moveTo(0, 20);
    searchlight.lineTo(-50, 180);
    searchlight.lineTo(50, 180);
    searchlight.closePath();
    searchlight.fill();
    heli.searchlight = searchlight;

    // Fast fly-in and hover over rooftop
    this.tweens.add({
      targets: heli,
      x: 340,
      y: 110,
      duration: 2200,
      ease: 'Power2.easeOut',
      onUpdate: () => {
        searchlight.setPosition(heli.x, heli.y);
      },
      onComplete: () => {
        // Deploy Rappel Cable
        const rope = this.add.line(0, 0, 340, 125, 340, h - 80, 0x78716c).setOrigin(0);
        rope.setLineWidth(2);

        // Ghost rappels down cable
        const ghostRappel = this.add.sprite(340, 130, 'ghost_sheet', 0);
        ghostRappel.setDisplaySize(32, 48);

        this.tweens.add({
          targets: ghostRappel,
          y: h - 94,
          duration: 1100,
          ease: 'Power1.easeIn',
          onComplete: () => {
            audioSystem.playFootstep();

            // Flash amber visor
            const visorFlash = this.add.circle(345, h - 105, 5, 0xf59e0b, 0.9);
            this.tweens.add({
              targets: visorFlash,
              scale: 2.5,
              alpha: 0,
              duration: 500
            });

            // Cut cable and chopper departs
            rope.destroy();
            this.tweens.add({
              targets: heli,
              x: w + 160,
              y: 60,
              duration: 1800,
              ease: 'Power2.easeIn',
              onUpdate: () => {
                searchlight.setPosition(heli.x, heli.y);
              }
            });

            // Status title
            const missionText = this.add.text(w / 2, h / 2 - 40, 'INSERTION SUCCESSFUL\nNO TRACE: COMMENCE RECON', {
              fontFamily: 'Rajdhani, sans-serif',
              fontSize: '18px',
              fontStyle: 'bold',
              color: '#38bdf8',
              align: 'center',
              letterSpacing: 3
            }).setOrigin(0.5);

            this.time.delayedCall(1600, () => {
              this.cameras.main.fade(500, 0, 0, 0);
              this.time.delayedCall(500, () => {
                this.scene.start('GameScene', { mission: { id: 'm1', num: 1 } });
              });
            });
          }
        });
      }
    });

    // Skip intro key
    const skip = () => {
      this.scene.start('GameScene', { mission: { id: 'm1', num: 1 } });
    };
    this.input.keyboard.on('keydown-SPACE', skip);
    this.input.keyboard.on('keydown-ENTER', skip);
    this.input.on('pointerdown', skip);
  }
}
