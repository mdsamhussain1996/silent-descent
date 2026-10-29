import Phaser from 'phaser';
import { audioSystem } from '../systems/Audio.js';

export class CollectibleItem extends Phaser.GameObjects.Container {
  constructor(scene, x, y, itemType = 'intel') {
    super(scene, x, y);
    scene.add.existing(this);

    this.type = 'item';
    this.itemType = itemType; // 'intel', 'drive', 'ammo'
    this.isCollected = false;

    let texture = 'intel_file';
    if (itemType === 'drive') texture = 'data_drive';
    if (itemType === 'ammo') texture = 'ammo_clip';

    this.sprite = scene.add.image(0, 0, texture);
    this.add(this.sprite);

    // Subtle bobbing animation
    scene.tweens.add({
      targets: this.sprite,
      y: -3,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.setSize(16, 16);
    this.setDepth(60);

    // Prompt
    const label = itemType === 'drive' ? 'SECURE DATA DRIVE' : (itemType === 'ammo' ? 'AMMO' : 'INTEL DOSSIER');
    this.promptText = scene.add.text(x, y - 16, `[J] ${label}`, {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '8px',
      color: itemType === 'drive' ? '#22d3ee' : '#f59e0b',
      backgroundColor: '#070b14'
    }).setOrigin(0.5).setDepth(200).setVisible(false);
  }

  showPrompt(visible) {
    if (this.isCollected) {
      this.promptText.setVisible(false);
      return;
    }
    this.promptText.setVisible(visible);
  }

  collect(player) {
    if (this.isCollected) return;
    this.isCollected = true;
    audioSystem.playTerminalBeep(itemTypeBeep(this.itemType));

    if (this.itemType === 'drive') {
      player.hasDataDrive = true;
      this.scene.onDataDriveCollected();
    } else if (this.itemType === 'intel') {
      player.intelCount++;
      if (this.scene.hud) {
        this.scene.hud.setObjective(`INTEL RETRIEVED (${player.intelCount}/3)`);
      }
    } else if (this.itemType === 'ammo') {
      player.ammo = Math.min(player.maxAmmo, player.ammo + 6);
      if (this.scene.hud) {
        this.scene.hud.updateAmmo(player.ammo);
      }
    }

    this.promptText.destroy();
    this.destroy();
  }
}

function itemTypeBeep(type) {
  if (type === 'drive') return 1200;
  if (type === 'intel') return 950;
  return 800;
}
