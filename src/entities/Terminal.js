import Phaser from 'phaser';

export class Terminal extends Phaser.GameObjects.Container {
  constructor(scene, x, y, config = {}) {
    super(scene, x, y);
    scene.add.existing(this);

    this.type = 'terminal';
    this.isHacked = false;
    this.failCount = 0;

    this.terminalSprite = scene.add.image(0, 0, 'terminal');
    this.add(this.terminalSprite);

    this.setSize(24, 24);
    this.setDepth(60);

    // Interactive prompt
    this.promptText = scene.add.text(x, y - 20, '[J] HACK TERMINAL', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '8px',
      color: '#22d3ee',
      backgroundColor: '#070b14'
    }).setOrigin(0.5).setDepth(200).setVisible(false);
  }

  showPrompt(visible) {
    if (this.isHacked) {
      this.promptText.setVisible(false);
      return;
    }
    this.promptText.setVisible(visible);
  }

  onHackSuccess() {
    this.isHacked = true;
    this.promptText.setText('TERMINAL: ACCESS GRANTED').setColor('#22c55e').setVisible(true);
    this.terminalSprite.setTint(0x22c55e);

    // Disables Section D cameras & reveals Data Drive location
    if (this.scene.sectionDCameras) {
      this.scene.sectionDCameras.forEach(cam => cam.permanentlyDisable());
    }

    if (this.scene.hud) {
      this.scene.hud.setObjective('DATA DRIVE LOCATED IN CARGO WAREHOUSE CAGE');
    }

    this.scene.time.delayedCall(2000, () => {
      this.promptText.setVisible(false);
    });
  }

  onHackFail() {
    this.failCount++;
    if (this.failCount >= 2) {
      this.failCount = 0;
      this.scene.alarm.raise('Security terminal breach attempt failed');
    }
  }
}
