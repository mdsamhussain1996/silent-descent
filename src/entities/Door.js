import Phaser from 'phaser';
import { audioSystem } from '../systems/Audio.js';

export class Door extends Phaser.GameObjects.Container {
  constructor(scene, x, y, config = {}) {
    super(scene, x, y);
    scene.add.existing(this);

    this.type = 'door';
    this.requiresHandScanner = config.requiresHandScanner || false;
    this.isOpen = config.isOpen || false;
    this.peekRoomDescription = config.peekRoomDescription || 'Office Corridor - 1 guard patrolling';
    this.peekGuardsCount = config.peekGuardsCount || 1;
    this.targetX = config.targetX || x + 40; // teleport position on pass through
    this.targetY = config.targetY || y;

    this.doorSprite = scene.add.image(0, 0, this.isOpen ? 'door_unlocked' : 'door_locked');
    this.add(this.doorSprite);

    this.setSize(16, 32);
    scene.physics.add.existing(this, true); // static body
    this.setDepth(60);

    // Interactive prompt
    this.promptText = scene.add.text(x, y - 22, '[↑] PEEK  [J] OPEN', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '8px',
      color: '#38bdf8',
      backgroundColor: '#070b14'
    }).setOrigin(0.5).setDepth(200).setVisible(false);
  }

  showPrompt(visible) {
    if (this.isOpen) {
      this.promptText.setVisible(false);
      return;
    }
    this.promptText.setVisible(visible);
  }

  tryOpen(player) {
    if (this.isOpen) return;

    if (this.requiresHandScanner) {
      // Must have captive guard grabbed!
      if (player.grabbedGuard) {
        this.open();
        audioSystem.playTerminalBeep(980);
        // Release guard
        player.grabbedGuard.knockout();
        player.grabbedGuard = null;
        player.state = 'normal';
      } else {
        // Hand scanner denied
        audioSystem.playRadioBlip();
        this.promptText.setText('SCANNER: GUARD REQUIRED').setColor('#ef4444');
        this.scene.time.delayedCall(1500, () => {
          this.promptText.setText('[↑] PEEK  [J] OPEN').setColor('#38bdf8');
        });
      }
    } else {
      this.open();
    }
  }

  open() {
    this.isOpen = true;
    this.doorSprite.setTexture('door_unlocked');
    audioSystem.playTerminalBeep(660);
    this.showPrompt(false);
  }
}
