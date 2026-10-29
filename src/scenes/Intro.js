import Phaser from 'phaser';
import { audioSystem } from '../systems/Audio.js';
import { DialogueSystem } from '../systems/Dialogue.js';

export class IntroScene extends Phaser.Scene {
  constructor() {
    super('IntroScene');
  }

  create() {
    audioSystem.init();
    audioSystem.resume();
    audioSystem.startHelicopterLoop();
    audioSystem.setHelicopterVolume(0.18);

    // Letterbox bars (cinematic 16:9 spy cutscene)
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x05070c, 0x070b14, 0x0a121e, 0x0f192b, 1);
    bg.fillRect(0, 0, 480, 270);

    // Distant harbour skyline & clouds
    const skyline = this.add.graphics();
    skyline.fillStyle(0x0d141f, 0.8);
    skyline.fillRect(0, 180, 480, 90);
    // Rooftop target visible below
    skyline.fillStyle(0x18202c, 1);
    skyline.fillRect(200, 220, 280, 50);

    // Rain streaks
    for (let i = 0; i < 35; i++) {
      const drop = this.add.rectangle(
        Phaser.Math.Between(0, 480),
        Phaser.Math.Between(-20, 270),
        1,
        Phaser.Math.Between(8, 16),
        0x38bdf8,
        0.35
      );
      this.tweens.add({
        targets: drop,
        y: 280,
        x: drop.x + 40,
        duration: Phaser.Math.Between(300, 500),
        repeat: -1,
        delay: Phaser.Math.Between(0, 400)
      });
    }

    // Sweeping searchlight in clouds
    const cloudSearchlight = this.add.graphics();
    cloudSearchlight.fillStyle(0x38bdf8, 0.1);
    cloudSearchlight.beginPath();
    cloudSearchlight.moveTo(100, 270);
    cloudSearchlight.arc(100, 270, 280, -Math.PI * 0.8, -Math.PI * 0.4);
    cloudSearchlight.closePath();
    cloudSearchlight.fill();

    this.tweens.add({
      targets: cloudSearchlight,
      alpha: 0.03,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Stealth Helicopter NIGHTFALL "Kite" flies in from left
    this.heli = this.add.image(-100, 80, 'helicopter').setScale(1.2).setDepth(100);

    // Dialogue system
    this.dialogue = new DialogueSystem(this);

    // Sequence:
    // 1. Heli flies in and hovers above roof
    this.tweens.add({
      targets: this.heli,
      x: 270,
      duration: 2500,
      ease: 'Power2.easeOut',
      onComplete: () => {
        // Subtle hover bob
        this.tweens.add({
          targets: this.heli,
          y: 84,
          duration: 800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });

        // 2. Radio dialogue plays
        this.playIntroDialogue();
      }
    });

    // Skip / Advance button
    this.input.keyboard.on('keydown-SPACE', () => this.dialogue.advance());
    this.input.keyboard.on('keydown-J', () => this.dialogue.advance());
    this.input.on('pointerdown', () => this.dialogue.advance());
  }

  playIntroDialogue() {
    const script = [
      {
        speaker: 'Control',
        text: 'Ghost, you are over the Kestrel yard. Power is on, cameras are live. Nobody sees you.'
      },
      {
        speaker: 'Ghost',
        text: 'Copy that. Going quiet.'
      }
    ];

    this.dialogue.showSequence(script, () => {
      // 3. Drop rappel rope and transition to GameScene
      const rope = this.add.rectangle(260, 95, 2, 0, 0x475569).setOrigin(0.5, 0).setDepth(90);
      this.tweens.add({
        targets: rope,
        height: 125,
        duration: 800,
        ease: 'Power1.easeIn',
        onComplete: () => {
          this.scene.start('GameScene', { startingAtRappel: true });
        }
      });
    });
  }
}
