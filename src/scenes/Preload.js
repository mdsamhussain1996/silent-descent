import Phaser from 'phaser';
import { AssetGenerator } from '../systems/AssetGenerator.js';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    this.load.image('campaign_map', 'assets/campaign_world_map.jpg');
    this.load.image('bg_harbor', 'assets/bg_harbor.jpg');
    this.load.image('bg_office', 'assets/bg_office.jpg');
    this.load.image('bg_warehouse', 'assets/bg_warehouse.jpg');
    this.load.image('bg_rooftop', 'assets/bg_rooftop.jpg');
    this.load.image('portrait_ghost', 'assets/portrait_ghost.jpg');
    this.load.image('portrait_control', 'assets/portrait_control.jpg');
    this.load.image('portrait_meera', 'assets/portrait_meera.jpg');
    this.load.image('evidence_manifest', 'assets/evidence_manifest.jpg');
    this.load.image('mission_dossiers', 'assets/mission_dossiers.jpg');
  }

  create() {
    // Generate all procedural pixel-art textures
    AssetGenerator.createAllTextures(this);

    // Proceed to Title
    this.scene.start('TitleScene');
  }
}
