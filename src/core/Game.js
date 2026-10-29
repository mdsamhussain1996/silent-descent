// src/core/Game.js
// Master Game Orchestrator for NO TRACE 2.5D Engine & Vertical Slice

import * as THREE from 'three';
import { GameRenderer } from '../render/Renderer.js';
import { CameraRig } from '../render/CameraRig.js';
import { LightingSystem } from '../render/Lighting.js';
import { ParticleSystem } from '../render/Particles.js';
import { FixedStepLoop } from './Loop.js';
import { input } from './Input.js';
import { audio } from './Audio.js';
import { events } from './Events.js';
import { LevelLoader } from '../world/LevelLoader.js';
import { Player } from '../entities/Player.js';
import { AlarmSystem } from '../systems/Alarm.js';
import { TacticalHUD } from '../ui/HUD.js';
import { PerformanceOverlay } from '../ui/OverlayF3.js';
import { TouchControls } from '../ui/TouchControls.js';

export class Game {
  constructor(container) {
    this.container = container;
    this.timeScale = 1.0;
    this.missionTime = 0;

    // 1. Core Render & Camera
    this.renderer = new GameRenderer(this.container);
    this.cameraRig = new CameraRig();
    this.lighting = new LightingSystem(this.renderer.scene);
    this.particles = new ParticleSystem(this.renderer.scene);

    // 2. Alarm & World Systems
    this.alarm = new AlarmSystem(this.lighting);
    this.loader = new LevelLoader(this.renderer.scene, this.lighting, this.alarm);
    this.levelData = this.loader.loadWarehouseSlice();

    // 3. Player entity
    this.player = new Player(this.renderer.scene, this.levelData.playerSpawn.x, this.levelData.playerSpawn.y);

    // 4. UI Overlays
    this.hud = new TacticalHUD();
    this.perfOverlay = new PerformanceOverlay();
    this.touchControls = new TouchControls();

    // Mark & Execute state
    this.executingQueue = [];
    this.executeTimer = 0;

    // Slow-mo detection window
    this.slowMoTimer = 0;

    // 5. Setup Loop
    this.loop = new FixedStepLoop(
      (dt) => this.update(dt),
      (alpha) => this.render(alpha)
    );

    // Expose for testing & CDP
    window.game = this;
    window.__NO_TRACE_GAME__ = this;
  }

  start() {
    audio.init();
    this.loop.start();
  }

  update(fixedDt) {
    const dt = fixedDt * this.timeScale;
    this.missionTime += fixedDt;

    // Toggle F3 overlay
    if (input.isF3Toggle()) {
      this.perfOverlay.toggle();
    }

    // Audio init on first input
    audio.init();

    // Update mouse world coordinates from 2.5D camera
    input.updateWorldMouse(this.cameraRig.camera, 0);

    // 1. Update Player
    this.player.update(dt, input);

    // 2. Update Guards
    for (let i = 0; i < this.levelData.guards.length; i++) {
      this.levelData.guards[i].update(dt, this.player);
    }

    // 3. Update Cameras & Lasers
    for (let i = 0; i < this.levelData.cameras.length; i++) {
      this.levelData.cameras[i].update(dt, this.player);
    }
    for (let i = 0; i < this.levelData.lasers.length; i++) {
      this.levelData.lasers[i].update(dt, this.player);
    }

    // 4. Update Alarm System
    this.alarm.update(dt);

    // 5. Update Lighting & Particles
    this.lighting.update(dt);
    this.particles.update(dt, this.cameraRig.camera.position);

    // 6. Handle Combat, Shooting & Interactions
    this.handleInteractions();
    this.handleShooting();
    this.handleMarkExecute(dt);

    // 7. Slow-Mo Detection Reaction Window
    if (this.slowMoTimer > 0) {
      this.slowMoTimer -= fixedDt;
      if (this.slowMoTimer <= 0) this.timeScale = 1.0;
    }

    // Clear input frame
    input.clearFrame();
  }

  handleInteractions() {
    let nearestPrompt = null;
    let promptWorldX = 0;
    let promptWorldY = 0;

    // Check Takedowns on Guards
    for (let i = 0; i < this.levelData.guards.length; i++) {
      const g = this.levelData.guards[i];
      if (g.state === 'knocked') continue;
      const dx = g.x - this.player.x;
      const dist = Math.hypot(dx, g.y - this.player.y);

      // Behind guard and within 1.4m
      const behind = (dx * g.facing) <= 0.2;
      if (dist < 1.4 && behind) {
        nearestPrompt = '[E] SILENT TAKEDOWN';
        promptWorldX = g.x;
        promptWorldY = g.y + 1.2;

        if (input.isInteract()) {
          g.knockout();
          this.cameraRig.addTrauma(0.2);
          this.player.markExecuteReady = true; // recharge Mark & Execute
          break;
        }
      }
    }

    // Check Terminals
    if (!nearestPrompt) {
      for (let i = 0; i < this.levelData.interactives.length; i++) {
        const item = this.levelData.interactives[i];
        if (item.check(this.player)) {
          nearestPrompt = item.promptText;
          promptWorldX = item.x;
          promptWorldY = item.y + 1.2;
          if (input.isInteract()) {
            item.interact();
          }
          break;
        }
      }
    }

    // Display / Hide prompt on HUD
    if (nearestPrompt) {
      const screenPos = this.worldToScreen(promptWorldX, promptWorldY);
      this.hud.showPrompt(screenPos.x, screenPos.y, nearestPrompt);
    } else {
      this.hud.hidePrompt();
    }
  }

  handleShooting() {
    if (input.isShooting()) {
      audio.playPistolShot();
      this.cameraRig.addTrauma(0.15);

      // Raycast bullet from player weapon toward mouse/aim angle
      const shootAngle = this.player.isAiming ? this.player.aimAngle : (this.player.facing > 0 ? 0 : Math.PI);
      const originX = this.player.x + this.player.facing * 0.2;
      const originY = this.player.y + 1.1;

      const targetX = originX + Math.cos(shootAngle) * 20;
      const targetY = originY + Math.sin(shootAngle) * 20;

      // Check shootable lamps
      for (let i = 0; i < this.levelData.lamps.length; i++) {
        const lamp = this.levelData.lamps[i];
        if (!lamp.alive) continue;
        const dist = Math.hypot(lamp.x - targetX, lamp.y - targetY);
        // Direct or proximate shot to lamp bulb
        const distToRay = Math.hypot(lamp.x - (originX + Math.cos(shootAngle) * Math.hypot(lamp.x - originX, lamp.y - originY)),
                                     lamp.y - (originY + Math.sin(shootAngle) * Math.hypot(lamp.x - originX, lamp.y - originY)));
        if (distToRay < 0.8) {
          this.lighting.shootLamp(lamp);
          this.particles.spawnImpactSparks(lamp.x, lamp.y, 0);
          break;
        }
      }

      // Check shooting guards
      for (let i = 0; i < this.levelData.guards.length; i++) {
        const g = this.levelData.guards[i];
        if (g.state === 'knocked') continue;
        const distToRay = Math.abs((targetY - originY) * g.x - (targetX - originX) * (g.y + 1.0) + targetX * originY - targetY * originX) /
                          Math.hypot(targetY - originY, targetX - originX);
        if (distToRay < 0.6) {
          g.knockout();
          this.particles.spawnImpactSparks(g.x, g.y + 1.0, 0);
          break;
        }
      }

      // Check shooting camera
      for (let i = 0; i < this.levelData.cameras.length; i++) {
        const cam = this.levelData.cameras[i];
        const dist = Math.hypot(cam.x - targetX, cam.y - targetY);
        if (dist < 1.0) {
          cam.disable(8.0);
          this.particles.spawnImpactSparks(cam.x, cam.y, 0);
          break;
        }
      }
    }
  }

  handleMarkExecute(dt) {
    if (input.isMarkExecute() && this.player.markExecuteReady && this.executingQueue.length === 0) {
      // Find visible guards to execute
      const visibleGuards = this.levelData.guards.filter(g => g.state !== 'knocked' && Math.hypot(g.x - this.player.x, g.y - this.player.y) < 14);
      if (visibleGuards.length > 0) {
        this.executingQueue = [...visibleGuards];
        this.executeTimer = 0.2;
        this.timeScale = 0.25; // Slow-mo cinematic execution
        audio.playMarkChime();
        this.player.markExecuteReady = false;
      }
    }

    if (this.executingQueue.length > 0) {
      this.executeTimer -= dt;
      if (this.executeTimer <= 0) {
        const target = this.executingQueue.shift();
        audio.playPistolShot();
        target.knockout();
        this.cameraRig.addTrauma(0.3);
        this.particles.spawnImpactSparks(target.x, target.y + 1.0, 0);
        this.executeTimer = 0.25;

        if (this.executingQueue.length === 0) {
          this.timeScale = 1.0; // Restore speed
        }
      }
    }
  }

  worldToScreen(wx, wy) {
    const v = new THREE.Vector3(wx, wy, 0);
    v.project(this.cameraRig.camera);
    return {
      x: ((v.x + 1) * window.innerWidth) / 2,
      y: ((-v.y + 1) * window.innerHeight) / 2
    };
  }

  render(alpha) {
    // 1. Update 2.5D Camera
    this.cameraRig.update(this.loop.fixedDt, { x: this.player.x, y: this.player.y }, this.player.facing, this.player.isAiming);

    // 2. Render Scene
    this.renderer.render(this.cameraRig.camera);

    // 3. Dynamic Resolution Scaling (DRS)
    this.renderer.updateDRS(this.loop.frameTime);

    // 4. Update UI
    this.hud.update(this.player, this.alarm, this.missionTime, this.cameraRig.camera);
    this.perfOverlay.update(this.loop, this.renderer);
  }
}
