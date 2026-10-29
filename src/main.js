import Phaser from 'phaser';
import { config } from './config.js';

window.addEventListener('DOMContentLoaded', () => {
  const game = new Phaser.Game(config);
  window.__GAME_INSTANCE__ = game;
});
