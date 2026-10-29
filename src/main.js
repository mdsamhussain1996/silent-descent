// src/main.js
// NO TRACE — 2.5D Stealth-Action Engine Bootstrap

import { Game } from './core/Game.js';

window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('game-container') || document.body;
  const game = new Game(container);
  game.start();

  // Expose global instance for console & test automation
  window.game = game;
  window.__NO_TRACE_GAME__ = game;
  console.log('[NO TRACE] 2.5D Engine & Vertical Slice Initialized at 60 FPS');
});
