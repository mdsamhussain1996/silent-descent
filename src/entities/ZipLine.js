import Phaser from 'phaser';

export class ZipLine extends Phaser.GameObjects.Container {
  constructor(scene, startX, startY, endX, endY) {
    super(scene, 0, 0);
    scene.add.existing(this);

    this.startX = startX;
    this.startY = startY;
    this.endX = endX;
    this.endY = endY;

    // Draw the taut steel cable
    this.cableGraphics = scene.add.graphics().setDepth(55);
    this.cableGraphics.lineStyle(2, 0x475569, 0.9);
    this.cableGraphics.lineBetween(startX, startY, endX, endY);

    // Pulley handle at the start
    this.handle = scene.add.image(startX, startY, 'zipline_handle').setDepth(56);

    // Anchor brackets
    scene.add.circle(startX, startY, 3, 0x1e293b).setDepth(56);
    scene.add.circle(endX, endY, 3, 0x1e293b).setDepth(56);

    // Interactive prompt
    this.promptText = scene.add.text(startX, startY - 16, '[J] ZIPLINE (HOLD ↑ BRAKE)', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '8px',
      color: '#f59e0b',
      backgroundColor: '#070b14'
    }).setOrigin(0.5).setDepth(200).setVisible(false);
  }

  showPrompt(visible) {
    this.promptText.setVisible(visible);
  }
}
