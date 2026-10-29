import Phaser from 'phaser';
import { Player } from '../entities/Player.js';
import { Guard } from '../entities/Guard.js';
import { SecurityCamera } from '../entities/Camera.js';
import { LaserTripwire } from '../entities/Laser.js';
import { LightSource } from '../entities/Light.js';
import { Door } from '../entities/Door.js';
import { Terminal } from '../entities/Terminal.js';
import { ZipLine } from '../entities/ZipLine.js';
import { VentEntrance } from '../entities/Vent.js';
import { CollectibleItem } from '../entities/Collectibles.js';
import { StealthSystem } from '../systems/Stealth.js';
import { AlarmSystem } from '../systems/Alarm.js';
import { InputManager } from '../systems/Input.js';
import { DialogueSystem } from '../systems/Dialogue.js';
import { SaveSystem } from '../systems/Save.js';
import { audioSystem } from '../systems/Audio.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.startingAtRappel = data.startingAtRappel !== undefined ? data.startingAtRappel : false;
    this.fromCheckpoint = data.fromCheckpoint !== undefined ? data.fromCheckpoint : false;
  }

  create() {
    // Systems initialization
    this.stealth = new StealthSystem(this);
    this.alarm = new AlarmSystem(this);
    this.inputManager = new InputManager(this);
    this.dialogue = new DialogueSystem(this);

    this.missionTimer = 0;
    this.isLockdown = false;
    this.isQTEActive = false;
    this.qteSuccess = false;

    // Launch HUD Scene
    this.scene.launch('HUDScene');
    this.hud = this.scene.get('HUDScene');

    // Setup animations
    if (!this.anims.exists('ac_fan_spin')) {
      this.anims.create({
        key: 'ac_fan_spin',
        frames: [
          { key: 'ac_fan', frame: 0 },
          { key: 'ac_fan', frame: 1 },
          { key: 'ac_fan', frame: 2 }
        ],
        frameRate: 15,
        repeat: -1
      });
    }

    // Build the World & Level Geometry (Sections A - F)
    this.buildLevelWorld();

    // Spawn Player
    this.spawnPlayer();

    // Checkpoint restoration if needed
    if (this.fromCheckpoint) {
      this.restoreSavedCheckpoint();
    }

    // Camera setup
    this.cameras.main.setBounds(0, 0, 3840, 960);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(1);

    // Weather: Heavy Rain Layer
    this.createRainSystem();

    // Ambient Lighting & Thermal Overlay Graphics
    this.lightingOverlay = this.add.graphics().setDepth(150);
    this.thermalOverlay = this.add.rectangle(0, 0, 3840, 960, 0x021526, 0.65)
      .setOrigin(0, 0)
      .setDepth(140)
      .setVisible(false);

    // Debug noise graphics
    this.noiseGraphics = this.add.graphics().setDepth(120);

    // Periodic lightning flash (every 20 - 40s)
    this.scheduleLightning();
  }

  // ==========================================
  // LEVEL GEOMETRY & TILES (SECTIONS A - F)
  // ==========================================
  buildLevelWorld() {
    this.collisionGroup = this.physics.add.staticGroup();
    this.oneWayGroup = this.physics.add.staticGroup();
    this.waterGroup = this.physics.add.staticGroup();
    this.checkpointGroup = this.physics.add.staticGroup();
    this.guards = this.physics.add.group();
    this.interactiveItems = [];
    this.sectionDCameras = [];
    this.lightsList = [];
    this.coverObjects = [];
    this.destructibleCrates = [];
    this.pipeRects = [];
    this.dockAmbushSpawned = false;

    // Background Parallax
    this.bgSky = this.add.graphics().setScrollFactor(0.1);
    this.bgSky.fillGradientStyle(0x05070c, 0x070b14, 0x0c1726, 0x0f1c30, 1);
    this.bgSky.fillRect(0, 0, 4800, 1000);

    // Distant crane & harbour silhouettes
    this.bgCranes = this.add.graphics().setScrollFactor(0.25);
    this.bgCranes.fillStyle(0x0a101a, 0.9);
    for (let x = 100; x < 4000; x += 350) {
      this.bgCranes.fillRect(x, 120, 8, 200);
      this.bgCranes.fillRect(x - 30, 120, 80, 5);
      this.bgCranes.fillRect(x + 40, 125, 2, 80);
    }

    // Near structures parallax
    this.bgStructures = this.add.graphics().setScrollFactor(0.5);
    this.bgStructures.fillStyle(0x111827, 0.95);
    this.bgStructures.fillRect(0, 240, 800, 700);
    this.bgStructures.fillRect(1100, 200, 1400, 750);
    this.bgStructures.fillRect(2700, 320, 1140, 640);

    // =======================================================
    // SECTION A & B: OFFICE ROOFTOP (x: 0 to 800, y: 300)
    // =======================================================
    // Roof slab
    this.createSolidBlock(40, 300, 760, 32, 1);
    // Left boundary wall
    this.createSolidBlock(20, 100, 20, 300, 1);

    // Rooftop Props: Water Tank (shadow zone behind it)
    this.add.image(280, 260, 'water_tank').setDepth(45);
    this.stealth.addShadowZone(255, 240, 50, 60);

    // AC Unit with spinning fan
    this.add.image(420, 288, 'ac_unit').setDepth(45);
    this.add.sprite(420, 288, 'ac_fan', 0).play('ac_fan_spin').setDepth(46);

    // Rooftop Sodium Lamps
    const lamp1 = new LightSource(this, 190, 270, { radius: 90, isShootable: true });
    // Lamp 2 above the stair hatch
    const lamp2 = new LightSource(this, 620, 270, { radius: 85, isShootable: true });

    // Rooftop Security Camera above the hatch
    const camB = new SecurityCamera(this, 660, 240, { baseAngle: 120, sweepRange: 35 });

    // Section B Guard patrolling rooftop (Dock/poncho guard with SMG)
    const guardB = new Guard(this, 500, 284, { type: 'dock', patrolLeftX: 380, patrolRightX: 580 });
    this.guards.add(guardB);

    // Tutorial World Floating Prompts (Section A / B)
    this.addWorldPrompt(120, 270, 'MOVE: ← / →  •  SNEAK: SHIFT  •  JUMP: SPACE');
    this.addWorldPrompt(280, 230, 'SHADOW ZONE: WATCH LIGHT METER DROP BEHIND TANK');
    this.addWorldPrompt(580, 230, 'SHOOT LAMP [K] TO CREATE DARK PATH PAST CAMERA');
    this.addWorldPrompt(680, 280, 'SNEAK UP BEHIND GUARD [J] TAKEDOWN');

    // Roof Hatch (Ladder down to Section C) -> CHECKPOINT 1
    this.createLadder(720, 300, 14); // ladder down 14 tiles (224px)
    this.addCheckpointBeacon(720, 290, 1);

    // EXTRA MECHANIC 1: ZIP LINE from Office Roof to Cargo Warehouse Roof!
    // Start at (480, 280), cable spans to (1200, 280)
    this.zipLineA = new ZipLine(this, 480, 280, 1200, 280);

    // =======================================================
    // SECTION C: INDOORS OFFICE FLOOR (x: 600 to 1400, y: 520)
    // =======================================================
    // Floor
    this.createSolidBlock(640, 520, 760, 32, 10);
    // Ceiling
    this.createSolidBlock(640, 420, 760, 20, 1);

    // Moonlight windows shafts
    const winLight1 = new LightSource(this, 840, 440, { radius: 70, isShootable: false, intensity: 0.6 });
    const winLight2 = new LightSource(this, 1140, 440, { radius: 70, isShootable: false, intensity: 0.6 });

    // Overhead PIPE above laser tripwire for pipe-hang
    this.createPipeRun(880, 440, 120);
    this.addWorldPrompt(940, 425, 'JUMP TO PIPE [↑] HANG & MOVE HAND-OVER-HAND');

    // Pulsing Laser Tripwire across corridor
    this.laserC = new LaserTripwire(this, 940, 460, 940, 520, { isPulsing: true, pulseCycle: 1.5 });

    // Hidden Laser revealed by Thermal Visor
    this.laserHiddenC = new LaserTripwire(this, 1050, 460, 1050, 520, { isHidden: true });

    // Office Desk & Sleeping Guard (wakes up on noise)
    const officeDeskGuard = new Guard(this, 1100, 504, { type: 'office', isOffice: true, isSleeping: true });
    this.guards.add(officeDeskGuard);

    // Patrolling Office Guard
    const officePatrolGuard = new Guard(this, 800, 504, { type: 'office', isOffice: true, patrolLeftX: 740, patrolRightX: 860 });
    this.guards.add(officePatrolGuard);

    // Biometric Hand-Scanner Door to Warehouse
    this.doorC = new Door(this, 1260, 504, {
      requiresHandScanner: true,
      peekRoomDescription: 'Cargo Warehouse - Catwalks & moving crane searchlight'
    });
    this.interactiveItems.push(this.doorC);

    // Security Terminal in Office -> HACK MINIGAME -> CHECKPOINT 2
    this.terminalC = new Terminal(this, 1200, 504);
    this.interactiveItems.push(this.terminalC);
    this.addCheckpointBeacon(1200, 504, 2);

    // EXTRA MECHANIC 2: VENT CRAWL SHORTCUT (Section C)
    // Floor vent at 860 leads into tight crawlspace running above office to 1240
    this.floorVentC = new VentEntrance(this, 860, 514, 880, 390);
    this.interactiveItems.push(this.floorVentC);
    this.createSolidBlock(860, 400, 380, 16, 12); // Vent duct ceiling/floor
    // Vent exit back down to office corridor past the lasers
    this.ventExit = {
      type: 'vent_exit',
      exitX: 1240,
      exitY: 504
    };

    // =======================================================
    // SECTION D: CARGO WAREHOUSE (x: 1400 to 2600, y: 720)
    // =======================================================
    // Main warehouse ground floor
    this.createSolidBlock(1400, 720, 1200, 32, 1);
    // Catwalks (one-way platforms)
    this.createOneWayPlatform(1450, 600, 320);
    this.createOneWayPlatform(1850, 520, 300);
    this.createOneWayPlatform(2200, 600, 360);

    // Crate stacks (ledge-grab climbing route)
    this.createCrateStack(1500, 696, 3, 2);
    this.createCrateStack(1700, 696, 4, 3);
    this.createCrateStack(2100, 696, 3, 2);

    // Catwalk ladders
    this.createLadder(1770, 600, 8);
    this.createLadder(2150, 520, 12);

    // Moving Ceiling SEARCHLIGHT across Warehouse
    this.warehouseSearchlight = new LightSource(this, 1950, 450, {
      isSearchlight: true,
      radius: 130,
      sweepRange: 80,
      sweepDuration: 3500
    });

    // 3 Warehouse Guards (including Heavy guard with shotgun)
    const guardD1 = new Guard(this, 1550, 584, { type: 'dock', patrolLeftX: 1480, patrolRightX: 1720 });
    const guardD2 = new Guard(this, 1800, 704, { type: 'heavy', patrolLeftX: 1650, patrolRightX: 2050 });
    const guardD3 = new Guard(this, 2300, 704, { type: 'dock', patrolLeftX: 2150, patrolRightX: 2450 });
    this.guards.add(guardD1);
    this.guards.add(guardD2);
    this.guards.add(guardD3);

    // Suppressed SMG weapon pickup on warehouse catwalk
    const smgPickup = new CollectibleItem(this, 1600, 584, 'smg');
    this.interactiveItems.push(smgPickup);

    // Section D Cameras (can be disabled permanently at Terminal C)
    const camD1 = new SecurityCamera(this, 1600, 480, { baseAngle: 75, sweepRange: 30 });
    const camD2 = new SecurityCamera(this, 2300, 480, { baseAngle: 105, sweepRange: 30 });
    this.sectionDCameras.push(camD1, camD2);

    // Optional Collectible Intel Folders (3 Intel Files)
    const intel1 = new CollectibleItem(this, 300, 275, 'intel'); // Section B behind AC
    const intel2 = new CollectibleItem(this, 1020, 385, 'intel'); // Section C inside vent
    const intel3 = new CollectibleItem(this, 1720, 620, 'intel'); // Section D atop crate stack
    this.interactiveItems.push(intel1, intel2, intel3);

    // Ammo pickups
    const ammo1 = new CollectibleItem(this, 750, 504, 'ammo');
    const ammo2 = new CollectibleItem(this, 2050, 704, 'ammo');
    this.interactiveItems.push(ammo1, ammo2);

    // PRIMARY OBJECTIVE: DATA DRIVE in locked cage atop Catwalk -> CHECKPOINT 3
    this.dataDriveItem = new CollectibleItem(this, 2000, 504, 'drive');
    this.interactiveItems.push(this.dataDriveItem);
    this.addCheckpointBeacon(2000, 504, 3);

    // =======================================================
    // SECTION E: ESCAPE TO THE DOCK (x: 2600 to 3500, y: 720)
    // =======================================================
    // Exterior pier concrete blocks
    this.createSolidBlock(2600, 720, 350, 32, 8);
    // Gap over water (pit danger: falls into water -> respawn at checkpoint)
    this.createWaterHazard(2950, 740, 160, 40);
    // Continuing pier
    this.createSolidBlock(3110, 720, 400, 32, 8);

    // Overhead dock beams for pipe hanging under chatting guards
    this.createPipeRun(2800, 710, 220);

    // Shipping Containers in different colours with corrugation and rust
    this.createContainer(2680, 704, 'container_teal');
    this.createContainer(2744, 704, 'container_rust');
    this.createContainer(3200, 704, 'container_navy');

    // 2 Dock Guards talking on the pier (poncho, helmet, SMG)
    const guardE1 = new Guard(this, 2860, 704, { type: 'dock', patrolLeftX: 2850, patrolRightX: 2870 });
    const guardE2 = new Guard(this, 2910, 704, { type: 'dock', patrolLeftX: 2900, patrolRightX: 2920, facing: -1 });
    this.guards.add(guardE1);
    this.guards.add(guardE2);

    // Overheard dialogue trigger on pier
    this.pierDialogueTrigger = this.add.zone(2750, 680, 60, 80);
    this.physics.add.existing(this.pierDialogueTrigger, true);

    // Checkpoint 4 before final stretch
    this.addCheckpointBeacon(3140, 704, 4);

    // =======================================================
    // SECTION F: EXTRACTION HELICOPTER & SKID HANG QTE (x: 3450, y: 640)
    // =======================================================
    this.extractionZone = this.add.zone(3420, 680, 80, 80);
    this.physics.add.existing(this.extractionZone, true);

    this.extractionHeli = this.add.image(3460, 600, 'helicopter').setScale(1.2).setDepth(110);
    // Black rope ladder hanging from helicopter
    this.ropeLadder = this.add.rectangle(3460, 645, 4, 60, 0x1e293b).setDepth(105);

    this.extractionPrompt = this.add.text(3460, 690, '[J] GRAB EXTRACTION ROPE', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '9px',
      color: '#38bdf8',
      backgroundColor: '#070b14'
    }).setOrigin(0.5).setDepth(200);

    // QTE prompt text (Helicopter Skid Hang)
    this.qteText = this.add.text(240, 80, 'PRESS [SPACE / JUMP] TO PULL UP ONTO SKID!', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#fbbf24',
      backgroundColor: 'rgba(5, 7, 11, 0.9)',
      padding: { x: 10, y: 6 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(3000).setVisible(false);
  }

  // Helper block builders
  createSolidBlock(x, y, w, h, tileIdx = 1) {
    const block = this.add.tileSprite(x + w / 2, y + h / 2, w, h, 'tiles', tileIdx);
    this.physics.add.existing(block, true);
    this.collisionGroup.add(block);
    return block;
  }

  createOneWayPlatform(x, y, w) {
    const plat = this.add.tileSprite(x + w / 2, y + 8, w, 16, 'tiles', 3);
    this.physics.add.existing(plat, true);
    plat.body.checkCollision.down = false;
    plat.body.checkCollision.left = false;
    plat.body.checkCollision.right = false;
    this.oneWayGroup.add(plat);
    return plat;
  }

  createWaterHazard(x, y, w, h) {
    const water = this.add.tileSprite(x + w / 2, y + h / 2, w, h, 'tiles', 9);
    this.physics.add.existing(water, true);
    this.waterGroup.add(water);
  }

  createLadder(x, y, rungs = 10) {
    if (!this.ladderTiles) {
      this.ladderTiles = {
        getTileAtWorldXY: (wx, wy) => {
          if (this.ladderRects) {
            for (const r of this.ladderRects) {
              if (r.contains(wx, wy)) return { index: 4, pixelX: r.x, pixelY: r.y };
            }
          }
          return null;
        }
      };
      this.ladderRects = [];
    }

    const h = rungs * 16;
    this.add.tileSprite(x, y + h / 2, 16, h, 'tiles', 4).setDepth(30);
    this.ladderRects.push(new Phaser.Geom.Rectangle(x - 8, y, 16, h));
  }

  createPipeRun(x, y, w) {
    if (!this.pipeTiles) {
      this.pipeTiles = {
        getTileAtWorldXY: (wx, wy) => {
          if (this.pipeRects) {
            for (const r of this.pipeRects) {
              if (r.contains(wx, wy)) return { index: 5, pixelX: r.x, pixelY: r.y };
            }
          }
          return null;
        }
      };
      this.pipeRects = [];
    }

    this.add.tileSprite(x + w / 2, y, w, 16, 'tiles', 5).setDepth(35);
    this.pipeRects.push(new Phaser.Geom.Rectangle(x, y - 8, w, 16));
  }

  createCrateStack(x, y, widthCrates, heightCrates) {
    const cs = 24;
    for (let r = 0; r < heightCrates; r++) {
      for (let c = 0; c < widthCrates; c++) {
        const crateX = x + c * cs;
        const crateY = y - r * cs;
        const sprite = this.add.image(crateX, crateY, 'crate').setDepth(35);
        const col = this.add.rectangle(crateX, crateY, cs, cs);
        this.physics.add.existing(col, true);
        this.collisionGroup.add(col);
        this.coverObjects.push(col);
        this.destructibleCrates.push({
          sprite,
          collider: col,
          x: crateX,
          y: crateY,
          hp: 40,
          bounds: new Phaser.Geom.Rectangle(crateX - cs / 2, crateY - cs / 2, cs, cs)
        });
      }
    }
  }

  createContainer(x, y, textureKey) {
    const img = this.add.image(x, y, textureKey).setDepth(34);
    const col = this.add.rectangle(x, y, 64, 32);
    this.physics.add.existing(col, true);
    this.collisionGroup.add(col);
    this.coverObjects.push(col);
    return img;
  }

  addWorldPrompt(x, y, text) {
    this.add.text(x, y, text, {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '7px',
      color: '#94a3b8',
      backgroundColor: 'rgba(7, 11, 18, 0.85)',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(160);
  }

  addCheckpointBeacon(x, y, cpIndex) {
    const beacon = this.add.circle(x, y, 4, 0x0ea5e9, 0.8).setDepth(60);
    this.tweens.add({
      targets: beacon,
      scale: 1.5,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    const zone = this.add.zone(x, y, 32, 40);
    zone.cpIndex = cpIndex;
    this.physics.add.existing(zone, true);
    this.checkpointGroup.add(zone);
  }

  // ==========================================
  // PLAYER SPAWN & COLLIDERS
  // ==========================================
  spawnPlayer() {
    // Default start position on office roof rope or ledge
    const startX = 260;
    const startY = 180;

    this.player = new Player(this, startX, startY);

    if (this.startingAtRappel) {
      this.player.startRappel(260, 100, 280);
    }

    // Physics Colliders
    this.physics.add.collider(this.player, this.collisionGroup);
    this.physics.add.collider(this.player, this.oneWayGroup);
    this.physics.add.collider(this.guards, this.collisionGroup);

    // Checkpoint beacons overlap
    this.physics.add.overlap(this.player, this.checkpointGroup, (player, zone) => {
      SaveSystem.saveCheckpoint(zone.cpIndex, this.player);
      if (this.hud) {
        this.hud.setObjective(`CHECKPOINT ${zone.cpIndex} SECURED`);
      }
      if (zone.body) zone.body.enable = false;
    });

    // Water pit trigger: falling in water respawns at checkpoint
    this.physics.add.overlap(this.player, this.waterGroup, () => {
      audioSystem.playFootstep(false);
      this.triggerMissionFailed('Fell into harbour waters');
    });

    // Pier overheard dialogue trigger
    let pierCol;
    pierCol = this.physics.add.overlap(this.player, this.pierDialogueTrigger, () => {
      if (this.pierDialogueTrigger.body) this.pierDialogueTrigger.body.enable = false;
      if (pierCol) this.physics.world.removeCollider(pierCol);
      this.playPierOverheardDialogue();
    });

    // Extraction rope grab
    this.physics.add.overlap(this.player, this.extractionZone, () => {
      if (this.inputManager.state.actionJustPressed) {
        this.startExtractionSequence();
      }
    });
  }

  // ==========================================
  // RAIN & WEATHER SYSTEM
  // ==========================================
  createRainSystem() {
    this.rainDrops = [];
    for (let i = 0; i < 70; i++) {
      const drop = this.add.rectangle(
        Phaser.Math.Between(0, 480),
        Phaser.Math.Between(-20, 270),
        1,
        Phaser.Math.Between(8, 16),
        0x38bdf8,
        0.35
      ).setScrollFactor(0).setDepth(200);

      this.tweens.add({
        targets: drop,
        y: 280,
        x: drop.x + 35,
        duration: Phaser.Math.Between(260, 420),
        repeat: -1,
        delay: Phaser.Math.Between(0, 300)
      });
      this.rainDrops.push(drop);
    }
  }

  scheduleLightning() {
    const delay = Phaser.Math.Between(20000, 40000); // 20 - 40s
    this.time.delayedCall(delay, () => {
      audioSystem.playThunder();
      // Flash screen white-blue
      this.cameras.main.flash(180, 200, 230, 255);
      this.scheduleLightning();
    });
  }

  // ==========================================
  // THERMAL VISOR MODE TOGGLE
  // ==========================================
  onThermalToggle(active) {
    this.thermalOverlay.setVisible(active);

    if (active) {
      // Guards glow bright orange in thermal
      this.guards.getChildren().forEach(g => {
        g.setTint(0xff7700);
      });
    } else {
      this.guards.getChildren().forEach(g => {
        g.clearTint();
      });
    }
  }

  // ==========================================
  // WEAPON RAYCAST & COMBAT IMPACT SYSTEM
  // ==========================================
  handleBulletHit(startX, startY, targetX, targetY) {
    this.handleComprehensiveBulletHit(startX, startY, targetX, targetY, null, 0);
  }

  handleComprehensiveBulletHit(startX, startY, targetX, targetY, cfg, angle) {
    const line = new Phaser.Geom.Line(startX, startY, targetX, targetY);

    // 1. Check shootable lights
    if (this.lightsList) {
      for (const light of this.lightsList) {
        if (light.isActive && light.isShootable) {
          const bounds = new Phaser.Geom.Rectangle(light.x - 8, light.y - 16, 16, 32);
          if (Phaser.Geom.Intersects.LineToRectangle(line, bounds)) {
            light.shootOut();
            this.spawnImpactParticles(light.x, light.y, 'spark');
            return;
          }
        }
      }
    }

    // 2. Check security cameras
    for (const child of this.children.getChildren()) {
      if (child instanceof SecurityCamera && !child.isDisabled) {
        const bounds = new Phaser.Geom.Rectangle(child.x - 12, child.y - 8, 24, 16);
        if (Phaser.Geom.Intersects.LineToRectangle(line, bounds)) {
          child.shootDisable();
          this.spawnImpactParticles(child.x, child.y, 'spark');
          return;
        }
      }
    }

    // 3. Check destructible crates
    if (this.destructibleCrates) {
      for (let i = this.destructibleCrates.length - 1; i >= 0; i--) {
        const crate = this.destructibleCrates[i];
        if (crate.bounds && Phaser.Geom.Intersects.LineToRectangle(line, crate.bounds)) {
          const dmg = cfg ? cfg.damage : 35;
          crate.hp -= dmg;
          this.spawnImpactParticles(crate.x, crate.y, 'splinter');
          if (crate.hp <= 0 || (cfg && cfg.key === 'shotgun')) {
            this.destroyCrate(crate, i);
          }
          return;
        }
      }
    }

    // 4. Check guards
    for (const guard of this.guards.getChildren()) {
      if (!guard.isKnockedOut && !guard.isDead) {
        const bounds = guard.getBounds();
        if (Phaser.Geom.Intersects.LineToRectangle(line, bounds)) {
          // Upper 30% calculation for headshot
          const headshotYThreshold = bounds.y + (bounds.height * 0.30);
          const t = Math.max(0, Math.min(1, (guard.x - startX) / (targetX - startX || 1)));
          const hitY = startY + t * (targetY - startY);
          const isHeadshot = hitY <= headshotYThreshold;

          const dmg = cfg ? cfg.damage : 35;
          const isPistol = !cfg || cfg.key === 'pistol';
          guard.takeDamage(dmg, isHeadshot, isPistol);

          if (guard.isDead) {
            this.player.guardsKilled++;
            this.alarm.raise(isHeadshot ? 'Guard eliminated with headshot' : 'Guard eliminated with firearm');
          }
          this.spawnImpactParticles(guard.x, hitY, 'spark');
          return;
        }
      }
    }

    // 5. Environmental wall / concrete impact
    this.spawnImpactParticles(targetX, targetY, 'concrete');
  }

  spawnImpactParticles(x, y, type) {
    if (type === 'spark') {
      for (let i = 0; i < 5; i++) {
        const s = this.add.circle(x, y, Phaser.Math.Between(1, 2), 0xfef08a, 1).setDepth(210);
        this.physics.add.existing(s);
        s.body.setVelocity(Phaser.Math.Between(-80, 80), Phaser.Math.Between(-90, 50));
        this.tweens.add({ targets: s, alpha: 0, duration: 250, onComplete: () => s.destroy() });
      }
    } else if (type === 'splinter') {
      for (let i = 0; i < 5; i++) {
        const s = this.add.rectangle(x, y, 3, 2, 0xa16207).setDepth(210);
        this.physics.add.existing(s);
        s.body.setVelocity(Phaser.Math.Between(-60, 60), Phaser.Math.Between(-100, -20));
        this.tweens.add({ targets: s, alpha: 0, duration: 350, onComplete: () => s.destroy() });
      }
    } else if (type === 'concrete') {
      const puff = this.add.circle(x, y, 3, 0x94a3b8, 0.7).setDepth(205);
      this.tweens.add({
        targets: puff,
        scale: 2,
        alpha: 0,
        duration: 250,
        onComplete: () => puff.destroy()
      });
      // Bullet hole decal that fades after 3s
      const decal = this.add.circle(x, y, 1.5, 0x111827, 0.85).setDepth(40);
      this.tweens.add({
        targets: decal,
        alpha: 0,
        duration: 3000,
        delay: 2000,
        onComplete: () => decal.destroy()
      });
    }
  }

  destroyCrate(crate, index) {
    for (let i = 0; i < 8; i++) {
      const p = this.add.rectangle(
        crate.x + Phaser.Math.Between(-8, 8),
        crate.y + Phaser.Math.Between(-8, 8),
        Phaser.Math.Between(3, 5),
        Phaser.Math.Between(2, 4),
        0xa16207
      ).setDepth(45);
      this.physics.add.existing(p);
      p.body.setVelocity(Phaser.Math.Between(-100, 100), Phaser.Math.Between(-140, -30));
      this.tweens.add({ targets: p, alpha: 0, duration: 500, onComplete: () => p.destroy() });
    }
    crate.sprite.destroy();
    crate.collider.body.enable = false;
    crate.collider.destroy();
    this.destructibleCrates.splice(index, 1);
  }

  // ==========================================
  // SCRIPTED BEATS & DATA DRIVE LOCKDOWN
  // ==========================================
  onDataDriveCollected() {
    this.isLockdown = true;
    audioSystem.playAlarmSiren();

    if (this.hud) {
      this.hud.setObjective('LOCKDOWN ACTIVE! ESCAPE TO DOCK FOR EXTRACTION');
    }

    // Warehouse lockdown with 3 response guards (1 heavy with shotgun, 2 dock SMG)
    const lockGuard1 = new Guard(this, 2350, 704, { type: 'dock', patrolLeftX: 2200, patrolRightX: 2450 });
    const lockGuard2 = new Guard(this, 2500, 704, { type: 'heavy', patrolLeftX: 2400, patrolRightX: 2580 });
    const lockGuard3 = new Guard(this, 2700, 704, { type: 'dock', patrolLeftX: 2620, patrolRightX: 2780 });
    this.guards.add(lockGuard1);
    this.guards.add(lockGuard2);
    this.guards.add(lockGuard3);

    // Red rotating lights effect during lockdown
    this.tweens.add({
      targets: this.lightingOverlay,
      alpha: 0.25,
      duration: 600,
      yoyo: true,
      repeat: -1
    });
  }

  checkDockAmbush() {
    if (this.alarm.level >= 2 && !this.dockAmbushSpawned) {
      this.dockAmbushSpawned = true;
      const ambushGuard1 = new Guard(this, 3050, 704, { type: 'dock', patrolLeftX: 3000, patrolRightX: 3150, facing: -1 });
      const ambushGuard2 = new Guard(this, 3180, 704, { type: 'heavy', patrolLeftX: 3120, patrolRightX: 3250, facing: -1 });
      this.guards.add(ambushGuard1);
      this.guards.add(ambushGuard2);
      if (this.hud) {
        this.hud.setObjective('AMBUSH! WEAPONS FREE OR SLIP PAST CRATES');
      }
    }
  }

  playPierOverheardDialogue() {
    const script = [
      {
        speaker: 'Kestrel Guard 1',
        text: 'Shipment is scheduled for 0300 hours. The prototype guidance chip is in container four.'
      },
      {
        speaker: 'Kestrel Guard 2',
        text: 'Security command says an intruder slipped onto the roof. Keep flashlights sweeping the pier.'
      }
    ];

    this.dialogue.showSequence(script);
  }

  // ==========================================
  // EXTRA MECHANIC 6: HELICOPTER SKID HANG QTE (FINALE)
  // ==========================================
  startExtractionSequence() {
    this.player.state = 'dead'; // disable normal controls
    this.player.body.setVelocity(0, 0);

    // Letterbox cinematic outro
    this.cameras.main.stopFollow();

    // Ghost hangs from helicopter skid
    this.player.x = this.extractionHeli.x - 10;
    this.player.y = this.extractionHeli.y + 40;
    this.player.play('ghost_zipline', true);

    // Sweeping searchlight misses them
    const finaleSearchlight = this.add.graphics().setDepth(115);
    finaleSearchlight.fillStyle(0x38bdf8, 0.45);
    finaleSearchlight.beginPath();
    finaleSearchlight.moveTo(3300, 720);
    finaleSearchlight.arc(3300, 720, 260, -Math.PI * 0.45, -Math.PI * 0.25);
    finaleSearchlight.closePath();
    finaleSearchlight.fill();

    // Trigger QTE: Press Jump at right moment to pull up!
    this.isQTEActive = true;
    this.qteText.setVisible(true);

    const qteDuration = 1800; // 1.8s window

    const qteListener = (e) => {
      if (e.code === 'Space' && this.isQTEActive) {
        this.qteSuccess = true;
        this.qteText.setText('PERFECT PULL-UP!').setColor('#22c55e');
      }
    };

    window.addEventListener('keydown', qteListener);

    this.time.delayedCall(qteDuration, () => {
      this.isQTEActive = false;
      window.removeEventListener('keydown', qteListener);
      this.qteText.setVisible(false);

      // Lift off animation
      this.tweens.add({
        targets: [this.extractionHeli, this.player, this.ropeLadder],
        y: '-=200',
        x: '+=300',
        duration: 3000,
        ease: 'Power2.easeIn',
        onComplete: () => {
          // Play final control dialogue then complete mission
          const outroScript = [
            {
              speaker: 'Control',
              text: 'Clean exit, Ghost. Stolen guidance chip secured. Nobody even knows you were there.'
            }
          ];
          this.dialogue.showSequence(outroScript, () => {
            this.triggerMissionComplete();
          });
        }
      });
    });
  }

  // ==========================================
  // MODALS & CHECKS
  // ==========================================
  openHackMinigame(terminal) {
    this.scene.pause();
    this.scene.launch('HackModalScene', { terminal });
  }

  openDoorPeek(door) {
    this.scene.pause();
    this.scene.launch('DoorPeekScene', { door });
  }

  // ==========================================
  // SCENE UPDATE LOOP
  // ==========================================
  update(time, delta) {
    this.missionTimer += delta / 1000;
    this.inputManager.update();

    // Check pause [P / Esc]
    if (this.inputManager.state.pause) {
      this.scene.pause();
      this.scene.launch('PauseScene');
      return;
    }

    // Update Player & Systems
    this.player.update(time, delta, this.inputManager.state);
    this.stealth.update(time, delta);
    this.alarm.update(delta);

    // Update Interactive Entities proximity
    this.updateInteractiveProximity();

    // Update Guards & Cameras & Lasers
    this.guards.getChildren().forEach(g => g.update(time, delta));
    for (const child of this.children.getChildren()) {
      if (child instanceof SecurityCamera || child instanceof LaserTripwire) {
        child.update(time, delta);
      }
    }

    // Check Zipline proximity trigger
    if (this.zipLineA && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.zipLineA.startX, this.zipLineA.startY) < 24) {
      this.zipLineA.showPrompt(true);
      if (this.inputManager.state.actionJustPressed) {
        this.player.startZipLine(this.zipLineA);
      }
    } else if (this.zipLineA) {
      this.zipLineA.showPrompt(false);
    }

    // Check dock ambush if player reaches dock zone
    if (this.player && this.player.x > 2800) {
      this.checkDockAmbush();
    }

    // Update HUD meters & weapon system UI
    if (this.hud) {
      this.hud.updateTimer(this.missionTimer);
      this.hud.updateLight(this.stealth.playerVisibility);
      this.hud.updateThermal(this.player.thermalActive, this.player.thermalTimer, this.player.thermalCooldown);
      if (this.player && this.player.weapons) {
        this.hud.updateWeaponUI(this.player.weapons.getHUDData());
      }
    }

    // Render lighting darkness overlay
    this.renderDarknessOverlay();
  }

  updateInteractiveProximity() {
    let nearest = null;
    let minDist = 32;

    for (const item of this.interactiveItems) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, item.x, item.y);
      if (dist < minDist) {
        nearest = item;
        minDist = dist;
      }
      if (item.showPrompt) {
        item.showPrompt(dist < minDist);
      }
    }

    // Vent exit check inside vent
    if (this.player.inVent && Math.abs(this.player.x - this.ventExit.exitX) < 24) {
      nearest = this.ventExit;
    }

    this.player.currentInteractive = nearest;
  }

  renderDarknessOverlay() {
    this.lightingOverlay.clear();
    // Night darkness layer
    const darknessColor = this.isLockdown ? 0x220505 : 0x05070c;
    const darknessAlpha = 0.55;

    this.lightingOverlay.fillStyle(darknessColor, darknessAlpha);
    this.lightingOverlay.fillRect(
      this.cameras.main.scrollX,
      this.cameras.main.scrollY,
      480,
      270
    );
  }

  // ==========================================
  // CHECKPOINT & END CONDITIONS
  // ==========================================
  restoreSavedCheckpoint() {
    const cp = SaveSystem.getCheckpoint();
    if (!cp) return;

    if (cp.checkpoint === 1) {
      this.player.setPosition(720, 280);
    } else if (cp.checkpoint === 2) {
      this.player.setPosition(1200, 500);
    } else if (cp.checkpoint === 3) {
      this.player.setPosition(2000, 500);
    } else if (cp.checkpoint === 4) {
      this.player.setPosition(3140, 700);
    }

    this.player.hp = cp.hp;
    this.player.ammo = cp.ammo;
    this.player.intelCount = cp.intelFound;
    this.player.hasDataDrive = cp.hasDataDrive;

    if (this.hud) {
      this.hud.updateHP(this.player.hp);
      this.hud.updateAmmo(this.player.ammo);
      this.hud.setObjective(`RESTORED CHECKPOINT ${cp.checkpoint}`);
    }
  }

  triggerMissionComplete() {
    this.scene.stop('HUDScene');
    this.scene.start('MissionCompleteScene', {
      stats: {
        timeSec: Math.round(this.missionTimer),
        alarmsTriggered: this.alarm.totalAlarmsTriggered,
        guardsKnocked: this.player.guardsKnocked,
        guardsKilled: this.player.guardsKilled,
        intelFound: this.player.intelCount,
        lightsShot: this.player.lightsShot
      }
    });
  }

  triggerMissionFailed(reason) {
    this.scene.stop('HUDScene');
    this.scene.start('MissionFailedScene', { reason });
  }
}
