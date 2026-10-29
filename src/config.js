import Phaser from 'phaser';
import { BootScene } from './scenes/Boot.js';
import { PreloadScene } from './scenes/Preload.js';
import { TitleScene } from './scenes/Title.js';
import { BriefingScene } from './scenes/Briefing.js';
import { IntroScene } from './scenes/Intro.js';
import { GameScene } from './scenes/Game.js';
import { HUDScene } from './scenes/HUD.js';
import { HackModalScene } from './scenes/HackModal.js';
import { DoorPeekScene } from './scenes/DoorPeek.js';
import { PauseScene } from './scenes/Pause.js';
import { MissionCompleteScene } from './scenes/MissionComplete.js';
import { MissionFailedScene } from './scenes/MissionFailed.js';

export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 270;
export const TILE_SIZE = 16;

export const PALETTE = {
  bgDark: 0x05070c,
  nightSky1: 0x070b14,
  nightSky2: 0x0c1726,
  metalDark: 0x181f2b,
  metalMid: 0x2b384a,
  metalLight: 0x475a73,
  steelHighlight: 0x738ba8,
  sodiumOrange: 0xf59e0b,
  amberGlow: 0xd97706,
  alertRed: 0xef4444,
  laserRed: 0xff2222,
  cyanMonitor: 0x06b6d4,
  cyanBright: 0x38bdf8,
  rainBlue: 0x3b82f6,
  guardOlive: 0x365314,
  guardCap: 0x1f2937,
  ghostSuit: 0x1e2430,
  ghostVisor: 0xfbbf24,
  hudBg: 0x090d14,
  hudBorder: 0x1f2e45,
  textWhite: 0xf8fafc,
  textMuted: 0x94a3b8,
};

export const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 900 },
      debug: false
    }
  },
  scene: [
    BootScene,
    PreloadScene,
    TitleScene,
    BriefingScene,
    IntroScene,
    GameScene,
    HUDScene,
    HackModalScene,
    DoorPeekScene,
    PauseScene,
    MissionCompleteScene,
    MissionFailedScene
  ]
};
