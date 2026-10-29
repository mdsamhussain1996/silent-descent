import Phaser from 'phaser';

export class VentEntrance extends Phaser.GameObjects.Container {
  constructor(scene, x, y, exitX, exitY, config = {}) {
    super(scene, x, y);
    scene.add.existing(this);

    this.type = 'vent';
    this.exitX = exitX;
    this.exitY = exitY;
    this.isOpen = false;
    this.isFloorVent = config.isFloorVent !== undefined ? config.isFloorVent : true;

    this.ventSprite = scene.add.image(0, 0, 'floor_vent');
    this.add(this.ventSprite);

    this.setSize(16, 16);
    this.setDepth(60);

    // Interactive prompt
    this.promptText = scene.add.text(x, y - 16, '[J] OPEN VENT CRAWL', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '8px',
      color: '#38bdf8',
      backgroundColor: '#070b14'
    }).setOrigin(0.5).setDepth(200).setVisible(false);
  }

  showPrompt(visible) {
    this.promptText.setVisible(visible);
  }

  interact(player) {
    if (!this.isOpen) {
      this.isOpen = true;
      this.promptText.setText('[J] ENTER CRAWLSPACE');
      this.ventSprite.setAngle(-45); // open grate angle
    } else {
      player.enterVent(this.exitX, this.exitY);
    }
  }
}
