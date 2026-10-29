import Phaser from 'phaser';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('PauseScene');
  }

  create() {
    const cx = 240;
    const cy = 135;

    // Dim overlay
    this.add.rectangle(cx, cy, 480, 270, 0x05070c, 0.75).setInteractive();

    // Box
    this.add.rectangle(cx, cy, 240, 120, 0x090d16)
      .setStrokeStyle(1.5, 0x0284c7);

    this.add.text(cx, cy - 35, 'TACTICAL PAUSE', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#38bdf8',
      letterSpacing: 2
    }).setOrigin(0.5);

    const resumeBtn = this.add.rectangle(cx, cy, 180, 20, 0x0284c7)
      .setStrokeStyle(1, 0x38bdf8)
      .setInteractive({ useHandCursor: true });
    this.add.text(cx, cy, 'RESUME OPERATION [P / ESC]', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    const menuBtn = this.add.rectangle(cx, cy + 28, 180, 20, 0x1e293b)
      .setStrokeStyle(1, 0x475569)
      .setInteractive({ useHandCursor: true });
    this.add.text(cx, cy + 28, 'ABORT MISSION [M]', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#94a3b8'
    }).setOrigin(0.5);

    const unpause = () => {
      this.scene.stop();
      this.scene.resume('GameScene');
    };

    resumeBtn.on('pointerdown', unpause);
    menuBtn.on('pointerdown', () => {
      this.scene.stop('GameScene');
      this.scene.stop('HUDScene');
      this.scene.start('TitleScene');
    });

    this.input.keyboard.on('keydown-P', unpause);
    this.input.keyboard.on('keydown-ESC', unpause);
    this.input.keyboard.on('keydown-M', () => {
      this.scene.stop('GameScene');
      this.scene.stop('HUDScene');
      this.scene.start('TitleScene');
    });
  }
}
