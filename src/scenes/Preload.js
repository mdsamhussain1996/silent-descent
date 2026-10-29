import Phaser from 'phaser';
import { AssetGenerator } from '../systems/AssetGenerator.js';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  create() {
    // Generate all procedural pixel-art textures
    AssetGenerator.createAllTextures(this);

    // Proceed to Title
    this.scene.start('TitleScene');
  }
}
