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
    if (itemType === 'smg') texture = 'icon_smg';
    if (itemType === 'shotgun') texture = 'icon_shotgun';

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
    let label = 'INTEL DOSSIER';
    if (itemType === 'drive') label = 'SECURE DATA DRIVE';
    else if (itemType === 'ammo') label = 'AMMO PACK';
    else if (itemType === 'smg') label = 'SUPPRESSED SMG';
    else if (itemType === 'shotgun') label = 'TACTICAL SHOTGUN';

    this.promptText = scene.add.text(x, y - 16, `[J] ${label}`, {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '8px',
      color: itemType === 'drive' ? '#22d3ee' : (itemType === 'smg' ? '#38bdf8' : '#f59e0b'),
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
        this.scene.hud.updateIntel(player.intelCount, 3);
      }
    } else if (this.itemType === 'smg') {
      if (player.weapons) {
        player.weapons.unlockWeapon('smg');
        player.weapons.ammo.smg.reserve = Math.min(96, player.weapons.ammo.smg.reserve + 48);
      }
      if (this.scene.hud) {
        this.scene.hud.setObjective('SUPPRESSED SMG ACQUIRED [Q/E TO SWITCH]');
      }
    } else if (this.itemType === 'shotgun') {
      if (player.weapons) {
        player.weapons.unlockWeapon('shotgun');
        player.weapons.ammo.shotgun.reserve = Math.min(20, player.weapons.ammo.shotgun.reserve + 10);
      }
      if (this.scene.hud) {
        this.scene.hud.setObjective('PUMP SHOTGUN ACQUIRED [Q/E TO SWITCH]');
      }
    } else if (this.itemType === 'ammo') {
      if (player.weapons) {
        player.weapons.ammo.pistol.reserve = Math.min(32, player.weapons.ammo.pistol.reserve + 8);
        if (player.weapons.ammo.smg) player.weapons.ammo.smg.reserve = Math.min(96, player.weapons.ammo.smg.reserve + 24);
        if (player.weapons.ammo.shotgun) player.weapons.ammo.shotgun.reserve = Math.min(20, player.weapons.ammo.shotgun.reserve + 5);
      }
      if (this.scene.hud) {
        this.scene.hud.setObjective('AMMO RESTOCKED');
      }
    }

    this.promptText.destroy();
    this.destroy();
  }
}

function itemTypeBeep(type) {
  if (type === 'drive') return 1200;
  if (type === 'intel') return 950;
  if (type === 'smg' || type === 'shotgun') return 1100;
  return 800;
}
