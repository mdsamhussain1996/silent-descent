import Phaser from 'phaser';
import { audioSystem } from '../systems/Audio.js';
import { WeaponManager, WEAPON_TYPES, GADGET_TYPES } from '../systems/Weapons.js';

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'ghost', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Physics Hitbox: 12x32 centered in 28x40 frame
    this.body.setSize(12, 32);
    this.body.setOffset(8, 8);
    this.body.setGravityY(900);
    this.setDepth(100);

    // Stats
    this.hp = 100;
    this.maxHp = 100;
    this.intelCount = 0;
    this.hasDataDrive = false;
    this.lightsShot = 0;
    this.guardsKnocked = 0;
    this.guardsKilled = 0;

    // Movement Speeds (px/s)
    this.SPEED_WALK = 60;
    this.SPEED_SNEAK = 35;
    this.SPEED_RUN = 110;
    this.SPEED_PIPE = 40;
    this.JUMP_VELOCITY = -318;

    // Timers
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.fallStartY = y;
    this.isFalling = false;
    this.footstepTimer = 0;

    // State machine
    this.state = 'normal'; // 'normal', 'sneak', 'cover', 'ledge_grab', 'ledge_climb', 'pipe_hang', 'rope_slide', 'ladder', 'wall_press', 'zipline', 'vent_crawl', 'knockout', 'grab_guard', 'drag_body', 'dead'
    this.inCover = false;

    // Weapons & Arsenal System
    this.weapons = new WeaponManager(this);

    // Aiming
    this.aimAngle = 0; // angle in radians
    this.aimMode = 'straight'; // 'up', 'straight', 'down', 'free'
    this.isAiming = false;
    this.laserSightGraphics = scene.add.graphics().setDepth(149);

    // Grabbing / Carrying
    this.grabbedGuard = null;
    this.draggedBody = null;

    // Thermal Visor
    this.thermalActive = false;
    this.thermalTimer = 0;
    this.thermalCooldown = 0;

    // Interactive target
    this.currentInteractive = null;

    // Zipline state
    this.currentZipline = null;
    this.ziplineProgress = 0;
    this.inVent = false;

    this.createAnimations();
  }

  createAnimations() {
    const anims = this.scene.anims;
    if (anims.exists('ghost_idle')) return;

    anims.create({
      key: 'ghost_idle',
      frames: anims.generateFrameNumbers('ghost', { start: 0, end: 7 }),
      frameRate: 6,
      repeat: -1
    });

    anims.create({
      key: 'ghost_walk',
      frames: anims.generateFrameNumbers('ghost', { start: 8, end: 15 }),
      frameRate: 8,
      repeat: -1
    });

    anims.create({
      key: 'ghost_sneak',
      frames: anims.generateFrameNumbers('ghost', { start: 16, end: 23 }),
      frameRate: 7,
      repeat: -1
    });

    anims.create({
      key: 'ghost_run',
      frames: anims.generateFrameNumbers('ghost', { start: 24, end: 31 }),
      frameRate: 11,
      repeat: -1
    });

    anims.create({
      key: 'ghost_jump',
      frames: [{ key: 'ghost', frame: 32 }],
      frameRate: 1
    });

    anims.create({
      key: 'ghost_fall',
      frames: [{ key: 'ghost', frame: 36 }],
      frameRate: 1
    });

    anims.create({
      key: 'ghost_ledge',
      frames: anims.generateFrameNumbers('ghost', { start: 40, end: 43 }),
      frameRate: 5,
      repeat: -1
    });

    anims.create({
      key: 'ghost_pipe',
      frames: anims.generateFrameNumbers('ghost', { start: 48, end: 55 }),
      frameRate: 7,
      repeat: -1
    });

    anims.create({
      key: 'ghost_aim_straight',
      frames: [{ key: 'ghost', frame: 56 }],
      frameRate: 1
    });

    anims.create({
      key: 'ghost_aim_up',
      frames: [{ key: 'ghost', frame: 59 }],
      frameRate: 1
    });

    anims.create({
      key: 'ghost_aim_down',
      frames: [{ key: 'ghost', frame: 61 }],
      frameRate: 1
    });

    anims.create({
      key: 'ghost_cover',
      frames: [{ key: 'ghost', frame: 63 }],
      frameRate: 1
    });

    anims.create({
      key: 'ghost_wall',
      frames: [{ key: 'ghost', frame: 64 }],
      frameRate: 1
    });

    anims.create({
      key: 'ghost_knockout',
      frames: anims.generateFrameNumbers('ghost', { start: 72, end: 75 }),
      frameRate: 10,
      repeat: 0
    });

    anims.create({
      key: 'ghost_vent',
      frames: anims.generateFrameNumbers('ghost', { start: 80, end: 87 }),
      frameRate: 6,
      repeat: -1
    });

    anims.create({
      key: 'ghost_ladder',
      frames: anims.generateFrameNumbers('ghost', { start: 88, end: 95 }),
      frameRate: 7,
      repeat: -1
    });

    anims.create({
      key: 'ghost_zipline',
      frames: anims.generateFrameNumbers('ghost', { start: 96, end: 99 }),
      frameRate: 6,
      repeat: -1
    });

    anims.create({
      key: 'ghost_rope',
      frames: anims.generateFrameNumbers('ghost', { start: 100, end: 103 }),
      frameRate: 6,
      repeat: -1
    });

    anims.create({
      key: 'ghost_hurt',
      frames: [{ key: 'ghost', frame: 104 }],
      frameRate: 1
    });

    anims.create({
      key: 'ghost_dead',
      frames: [{ key: 'ghost', frame: 107 }],
      frameRate: 1
    });
  }

  update(time, delta, input) {
    if (this.state === 'dead') {
      this.laserSightGraphics.clear();
      return;
    }

    const dt = delta / 1000;

    // Update weapons and gadgets
    this.weapons.update(dt, input);

    // Update Thermal Visor
    this.updateThermal(dt, input);

    // Fall height tracker for damage (>6 tiles = 96px => 30 dmg)
    if (!this.body.blocked.down && !this.isFalling) {
      this.isFalling = true;
      this.fallStartY = this.y;
    } else if (this.body.blocked.down && this.isFalling) {
      this.isFalling = false;
      const fallDistance = this.y - this.fallStartY;
      if (fallDistance > 96) {
        this.takeDamage(30, 'fall');
      }
      if (fallDistance > 32) {
        this.scene.stealth?.emitNoise(this.x, this.y, 80);
      }
    }

    // Coyote time and jump buffer
    if (this.body.blocked.down) {
      this.coyoteTimer = 0.08;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    }

    if (input.jumpJustPressed) {
      this.jumpBufferTimer = 0.1;
    } else {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
    }

    // State machine updates
    switch (this.state) {
      case 'zipline':
        this.updateZipline(dt, input);
        break;
      case 'rope_slide':
        this.updateRopeSlide(dt, input);
        break;
      case 'ledge_grab':
        this.updateLedgeGrab(dt, input);
        break;
      case 'pipe_hang':
        this.updatePipeHang(dt, input);
        break;
      case 'ladder':
        this.updateLadder(dt, input);
        break;
      case 'wall_press':
        this.updateWallPress(dt, input);
        break;
      case 'vent_crawl':
        this.updateVentCrawl(dt, input);
        break;
      case 'grab_guard':
        this.updateGrabGuard(dt, input);
        break;
      case 'drag_body':
        this.updateDragBody(dt, input);
        break;
      case 'knockout':
        break;
      case 'cover':
        this.updateCover(dt, input);
        break;
      case 'normal':
      case 'sneak':
      default:
        this.updateGroundAndAir(dt, input);
        break;
    }

    // Draw Laser Sight while aiming
    this.updateLaserSight(input);

    // Interactive checks
    this.checkInteractions(input);
  }

  // ==========================================
  // NORMAL MOVEMENT, SNEAK & COVER SYSTEM
  // ==========================================
  updateGroundAndAir(dt, input) {
    const onGround = this.body.blocked.down;

    // Check Wall-press trigger in shadows
    if (onGround && input.down && (this.body.blocked.left || this.body.blocked.right)) {
      if (this.scene.stealth?.playerVisibility < 35) {
        this.state = 'wall_press';
        this.body.setVelocityX(0);
        this.play('ghost_wall', true);
        return;
      }
    }

    // Check Cover trigger: crouch near crate or railing
    if (onGround && input.down && this.checkNearCoverObject()) {
      this.state = 'cover';
      this.inCover = true;
      this.body.setVelocityX(0);
      this.play('ghost_cover', true);
      return;
    }

    // Aiming mode
    if (input.shoot) {
      this.handleAiming(input);
      return;
    }

    // Movement speeds
    let targetSpeed = this.SPEED_WALK;
    let isSneaking = input.sneak;
    let isRunning = false;

    if (isSneaking) {
      targetSpeed = this.SPEED_SNEAK;
      this.state = 'sneak';
    } else if ((input.left || input.right) && !isSneaking && !input.down) {
      targetSpeed = this.SPEED_RUN;
      isRunning = true;
      this.state = 'normal';
    } else {
      this.state = 'normal';
    }

    if (input.left) {
      this.body.setVelocityX(-targetSpeed);
      this.setFlipX(true);
    } else if (input.right) {
      this.body.setVelocityX(targetSpeed);
      this.setFlipX(false);
    } else {
      this.body.setVelocityX(0);
    }

    // Footsteps & Noise
    if (onGround && (input.left || input.right)) {
      this.footstepTimer += dt;
      const interval = isRunning ? 0.28 : (isSneaking ? 0.5 : 0.38);
      if (this.footstepTimer >= interval) {
        this.footstepTimer = 0;
        audioSystem.playFootstep(isRunning);
        if (isRunning) {
          this.scene.stealth?.emitNoise(this.x, this.y, 80);
        }
      }
    }

    // Jump
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.body.setVelocityY(this.JUMP_VELOCITY);
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
      this.play('ghost_jump', true);
    }

    // Animation state
    if (onGround) {
      if (Math.abs(this.body.velocity.x) > 5) {
        if (isSneaking) {
          this.play('ghost_sneak', true);
        } else if (isRunning) {
          this.play('ghost_run', true);
        } else {
          this.play('ghost_walk', true);
        }
      } else {
        if (input.down) {
          this.play('ghost_sneak', true);
        } else {
          this.play('ghost_idle', true);
        }
      }
    } else {
      if (this.body.velocity.y < 0) {
        this.play('ghost_jump', true);
      } else {
        this.play('ghost_fall', true);
      }
    }

    // Takedown / Interact [J]
    if (input.actionJustPressed) {
      this.tryTakedown();
    }

    // Grab Guard [L]
    if (input.grabJustPressed) {
      this.tryGrabGuard();
    }

    // Overhead pipe grab check
    if (!onGround && input.up) {
      this.checkOverheadPipe();
    }

    // Ladder check
    if (input.up || input.down) {
      this.checkLadder();
    }
  }

  checkNearCoverObject() {
    // Check if player is adjacent to a crate or railing
    const bounds = this.getBounds();
    return this.scene.collisionGroup.getChildren().some(b => {
      const bBounds = b.getBounds();
      return Math.abs(bBounds.centerY - bounds.centerY) < 24 &&
             (Math.abs(bBounds.left - bounds.right) < 16 || Math.abs(bBounds.right - bounds.left) < 16);
    });
  }

  updateCover(dt, input) {
    this.body.setVelocityX(0);

    // Pop out to aim/shoot
    if (input.shoot) {
      this.handleAiming(input);
      return;
    }

    // Exit cover on movement or jump
    if (input.left || input.right || input.jumpJustPressed || !input.down) {
      this.inCover = false;
      this.state = 'normal';
    }
  }

  // ==========================================
  // AIMING & WEAPONS HANDLING
  // ==========================================
  handleAiming(input) {
    this.body.setVelocityX(0);
    this.isAiming = true;

    const facing = this.flipX ? -1 : 1;

    // Aim angles:
    // Keyboard: Up = -35 deg, Down = +35 deg, default = 0 deg
    let angleRad = 0;
    if (input.up) {
      this.aimMode = 'up';
      this.play('ghost_aim_up', true);
      angleRad = -0.6;
    } else if (input.down) {
      this.aimMode = 'down';
      this.play('ghost_aim_down', true);
      angleRad = 0.6;
    } else {
      this.aimMode = 'straight';
      this.play('ghost_aim_straight', true);
      angleRad = 0;
    }

    // Mouse aiming overrides on desktop
    if (input.mouseActive && input.mouseWorldX !== undefined) {
      const dx = input.mouseWorldX - this.x;
      const dy = input.mouseWorldY - this.y;
      angleRad = Math.atan2(dy, Math.abs(dx));
      this.setFlipX(dx < 0);
    }

    // Final world angle
    this.aimAngle = facing === -1 ? (Math.PI - angleRad) : angleRad;

    // Fire weapon
    const isAuto = this.weapons.getCurrentConfig().auto;
    if (isAuto ? input.shoot : input.shootJustPressed) {
      const originX = this.x + facing * 12;
      const originY = this.y - 2;
      this.weapons.fire(this.aimAngle, originX, originY);
    }
  }

  updateLaserSight(input) {
    this.laserSightGraphics.clear();

    if (!input.shoot || this.state === 'dead') {
      this.isAiming = false;
      return;
    }

    const facing = this.flipX ? -1 : 1;
    const startX = this.x + facing * 12;
    const startY = this.y - 2;
    const sightRange = 160;

    const endX = startX + Math.cos(this.aimAngle) * sightRange;
    const endY = startY + Math.sin(this.aimAngle) * sightRange;

    // Tactical green laser sight
    this.laserSightGraphics.lineStyle(1.0, 0x22c55e, 0.7);
    this.laserSightGraphics.lineBetween(startX, startY, endX, endY);

    // Laser dot at end
    this.laserSightGraphics.fillStyle(0x86efac, 0.9);
    this.laserSightGraphics.fillCircle(endX, endY, 1.5);
  }

  // ==========================================
  // TAKEDOWN & INTERACTION
  // ==========================================
  tryTakedown() {
    if (!this.scene.guards) return;
    const unawareGuard = this.scene.guards.getChildren().find(g => {
      if (g.isKnockedOut || g.isDead) return false;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, g.x, g.y);
      return dist <= 24 && !g.isAlert;
    });

    if (unawareGuard) {
      this.state = 'knockout';
      this.body.setVelocityX(0);
      this.play('ghost_knockout', true);
      audioSystem.playTakedown();

      unawareGuard.knockout();
      this.guardsKnocked++;

      this.scene.time.delayedCall(400, () => {
        this.state = 'normal';
      });
    }
  }

  tryGrabGuard() {
    if (!this.scene.guards) return;

    if (this.grabbedGuard) {
      this.grabbedGuard.knockout();
      this.grabbedGuard = null;
      this.state = 'normal';
      return;
    }

    const unawareGuard = this.scene.guards.getChildren().find(g => {
      if (g.isKnockedOut || g.isDead) return false;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, g.x, g.y);
      return dist <= 26 && !g.isAlert;
    });

    if (unawareGuard) {
      this.grabbedGuard = unawareGuard;
      unawareGuard.getGrabbed(this);
      this.state = 'grab_guard';
    }
  }

  updateGrabGuard(dt, input) {
    const moveSpeed = 35;
    if (input.left) {
      this.body.setVelocityX(-moveSpeed);
      this.setFlipX(true);
    } else if (input.right) {
      this.body.setVelocityX(moveSpeed);
      this.setFlipX(false);
    } else {
      this.body.setVelocityX(0);
    }

    if (this.grabbedGuard) {
      this.grabbedGuard.x = this.x + (this.flipX ? -8 : 8);
      this.grabbedGuard.y = this.y;
    }

    if (input.actionJustPressed || input.grabJustPressed) {
      if (this.grabbedGuard) {
        this.grabbedGuard.knockout();
        this.grabbedGuard = null;
      }
      this.state = 'normal';
    }
  }

  updateDragBody(dt, input) {
    if (!this.draggedBody) {
      this.state = 'normal';
      return;
    }

    const dragSpeed = 30;
    if (input.left) {
      this.body.setVelocityX(-dragSpeed);
    } else if (input.right) {
      this.body.setVelocityX(dragSpeed);
    } else {
      this.body.setVelocityX(0);
    }

    this.draggedBody.x = this.x + (this.flipX ? 12 : -12);
    this.draggedBody.y = this.y + 4;

    if (input.actionJustPressed || input.grabJustPressed) {
      this.draggedBody = null;
      this.state = 'normal';
    }
  }

  // ==========================================
  // LEDGE, PIPE & LADDER
  // ==========================================
  grabLedge(ledgeX, ledgeY, facingLeft) {
    if (this.state === 'ledge_grab' || this.state === 'ledge_climb') return;

    this.state = 'ledge_grab';
    this.body.setAllowGravity(false);
    this.body.setVelocity(0, 0);
    this.x = ledgeX;
    this.y = ledgeY;
    this.setFlipX(facingLeft);
    this.play('ghost_ledge', true);
  }

  updateLedgeGrab(dt, input) {
    if (input.up) {
      this.state = 'ledge_climb';
      this.scene.tweens.add({
        targets: this,
        y: this.y - 20,
        x: this.x + (this.flipX ? -12 : 12),
        duration: 250,
        onComplete: () => {
          this.body.setAllowGravity(true);
          this.state = 'normal';
        }
      });
    } else if (input.down) {
      this.body.setAllowGravity(true);
      this.state = 'normal';
    }
  }

  checkOverheadPipe() {
    if (!this.scene.pipeTiles) return;
    const tile = this.scene.pipeTiles.getTileAtWorldXY(this.x, this.y - 22);
    if (tile && tile.index === 5) {
      this.state = 'pipe_hang';
      this.body.setAllowGravity(false);
      this.body.setVelocity(0, 0);
      this.y = tile.pixelY + 28;
      this.play('ghost_pipe', true);
    }
  }

  updatePipeHang(dt, input) {
    if (input.left) {
      this.body.setVelocityX(-this.SPEED_PIPE);
      this.play('ghost_pipe', true);
    } else if (input.right) {
      this.body.setVelocityX(this.SPEED_PIPE);
      this.play('ghost_pipe', true);
    } else {
      this.body.setVelocityX(0);
      this.stop();
      this.setFrame(48);
    }

    const tile = this.scene.pipeTiles.getTileAtWorldXY(this.x, this.y - 28);
    if (!tile || tile.index !== 5 || input.down) {
      this.body.setAllowGravity(true);
      this.state = 'normal';
    }
  }

  checkLadder() {
    if (!this.scene.ladderTiles) return;
    const tile = this.scene.ladderTiles.getTileAtWorldXY(this.x, this.y);
    if (tile && tile.index === 4) {
      this.state = 'ladder';
      this.body.setAllowGravity(false);
      this.body.setVelocity(0, 0);
      this.x = tile.pixelX + 8;
      this.play('ghost_ladder', true);
    }
  }

  updateLadder(dt, input) {
    const climbSpeed = 55;
    if (input.up) {
      this.body.setVelocityY(-climbSpeed);
      this.play('ghost_ladder', true);
    } else if (input.down) {
      this.body.setVelocityY(climbSpeed);
      this.play('ghost_ladder', true);
    } else {
      this.body.setVelocityY(0);
      this.stop();
    }

    if (input.jumpJustPressed) {
      this.body.setAllowGravity(true);
      this.body.setVelocityY(this.JUMP_VELOCITY * 0.8);
      this.state = 'normal';
      return;
    }

    const tile = this.scene.ladderTiles.getTileAtWorldXY(this.x, this.y);
    if (!tile || tile.index !== 4) {
      this.body.setAllowGravity(true);
      this.state = 'normal';
    }
  }

  startRappel(ropeX, startY, endY) {
    this.state = 'rope_slide';
    this.x = ropeX;
    this.y = startY;
    this.rappelEndY = endY;
    this.body.setAllowGravity(false);
    this.body.setVelocity(0, 0);
    this.play('ghost_rope', true);
  }

  updateRopeSlide(dt, input) {
    let speed = 65;
    if (input.up) speed = 25; // brake
    if (input.down) speed = 110; // fast slide

    this.y += speed * dt;

    if (this.y >= this.rappelEndY || input.jumpJustPressed) {
      this.body.setAllowGravity(true);
      this.state = 'normal';
    }
  }

  updateWallPress(dt, input) {
    this.body.setVelocityX(0);
    if (input.left || input.right || input.jumpJustPressed || !input.down) {
      this.state = 'normal';
    }
  }

  // ==========================================
  // ZIPLINE & VENT SHORTCUT
  // ==========================================
  startZipLine(zipline) {
    this.state = 'zipline';
    this.currentZipline = zipline;
    this.ziplineProgress = 0;
    this.body.setAllowGravity(false);
    this.body.setVelocity(0, 0);
    this.play('ghost_zipline', true);
    audioSystem.playZipWhir();
  }

  updateZipline(dt, input) {
    if (!this.currentZipline) {
      this.state = 'normal';
      return;
    }

    const speed = input.up ? 0.35 : 0.85;
    this.ziplineProgress += speed * dt;

    const currentX = Phaser.Math.Linear(this.currentZipline.startX, this.currentZipline.endX, this.ziplineProgress);
    const currentY = Phaser.Math.Linear(this.currentZipline.startY, this.currentZipline.endY, this.ziplineProgress);

    this.x = currentX;
    this.y = currentY;

    if (this.scene.stealth?.playerVisibility > 50) {
      this.scene.guards.getChildren().forEach(g => {
        if (!g.isKnockedOut && Math.abs(g.x - this.x) < 80) {
          g.setSuspiciousState(this.x, this.y);
        }
      });
    }

    if (this.ziplineProgress >= 1.0) {
      this.body.setAllowGravity(true);
      this.body.setVelocityY(50);
      this.state = 'normal';
      this.currentZipline = null;
    }
  }

  enterVent(ventX, ventY) {
    this.state = 'vent_crawl';
    this.inVent = true;
    this.x = ventX;
    this.y = ventY;
    this.body.setSize(18, 14);
    this.body.setOffset(5, 24);
    this.play('ghost_vent', true);
  }

  updateVentCrawl(dt, input) {
    const ventSpeed = 28;
    if (input.left) {
      this.body.setVelocityX(-ventSpeed);
      this.setFlipX(true);
      this.play('ghost_vent', true);
    } else if (input.right) {
      this.body.setVelocityX(ventSpeed);
      this.setFlipX(false);
      this.play('ghost_vent', true);
    } else {
      this.body.setVelocityX(0);
      this.stop();
    }

    if (input.left || input.right) {
      this.footstepTimer += dt;
      if (this.footstepTimer >= 0.45) {
        this.footstepTimer = 0;
        audioSystem.playFootstep(false, true);
      }
    }

    if (input.actionJustPressed && this.currentInteractive && this.currentInteractive.type === 'vent_exit') {
      this.exitVent(this.currentInteractive.exitX, this.currentInteractive.exitY);
    }
  }

  exitVent(exitX, exitY) {
    this.state = 'normal';
    this.inVent = false;
    this.x = exitX;
    this.y = exitY;
    this.body.setSize(12, 32);
    this.body.setOffset(8, 8);
    this.play('ghost_idle', true);
  }

  // ==========================================
  // THERMAL VISOR
  // ==========================================
  updateThermal(dt, input) {
    if (this.thermalCooldown > 0) {
      this.thermalCooldown = Math.max(0, this.thermalCooldown - dt);
    }

    if (this.thermalActive) {
      this.thermalTimer -= dt;
      if (this.thermalTimer <= 0) {
        this.toggleThermal(false);
      }
    }

    if (input.thermalJustPressed && this.thermalCooldown <= 0 && !this.thermalActive) {
      this.toggleThermal(true);
    }
  }

  toggleThermal(enable) {
    this.thermalActive = enable;
    if (enable) {
      this.thermalTimer = 6.0;
      this.thermalCooldown = 10.0;
      audioSystem.playThermalToggle(true);
    } else {
      audioSystem.playThermalToggle(false);
    }
    this.scene.onThermalToggle(enable);
  }

  // ==========================================
  // DAMAGE & HEALTH (WITH COVER REDUCTION)
  // ==========================================
  takeDamage(amount, source = 'bullet') {
    if (this.state === 'dead') return;

    let finalDmg = amount;
    // Cover system: 60% damage reduction while in cover or wall-press
    if (this.inCover || this.state === 'wall_press') {
      finalDmg = Math.round(amount * 0.4);
    }

    this.hp = Math.max(0, this.hp - finalDmg);

    this.setTint(0xff3333);
    this.scene.time.delayedCall(120, () => this.clearTint());

    if (this.scene.hud) {
      this.scene.hud.updateHP(this.hp);
    }

    if (this.hp <= 0) {
      this.die(source);
    }
  }

  die(cause = 'bullet') {
    this.state = 'dead';
    this.body.setVelocity(0, 0);
    this.play('ghost_dead', true);
    this.scene.time.delayedCall(1200, () => {
      this.scene.triggerMissionFailed(`Agent killed in action (${cause}).`);
    });
  }

  // Check interactions
  checkInteractions(input) {
    if (!this.currentInteractive) return;
    const ci = this.currentInteractive;

    if (ci.type === 'door' && !ci.isOpen) {
      if (input.up) {
        this.scene.openDoorPeek(ci);
      } else if (input.actionJustPressed) {
        ci.tryOpen(this);
      }
    }

    if (ci.type === 'terminal' && !ci.isHacked) {
      if (input.actionJustPressed) {
        this.scene.openHackMinigame(ci);
      }
    }

    if (ci.type === 'item') {
      if (input.actionJustPressed || Phaser.Math.Distance.Between(this.x, this.y, ci.x, ci.y) < 18) {
        ci.collect(this);
      }
    }

    // Scavenge ammo/weapons from knocked-out guards
    if (input.actionJustPressed && this.scene.guards) {
      const body = this.scene.guards.getChildren().find(g => {
        return (g.isKnockedOut || g.isDead) && !g.looted &&
               Phaser.Math.Distance.Between(this.x, this.y, g.x, g.y) < 28;
      });

      if (body) {
        body.looted = true;
        this.scavengeFromGuard(body);
      }
    }
  }

  scavengeFromGuard(guard) {
    if (guard.guardType === 'heavy') {
      this.weapons.unlockWeapon(WEAPON_TYPES.SHOTGUN);
      this.weapons.ammo[WEAPON_TYPES.SHOTGUN].reserve = Math.min(20, this.weapons.ammo[WEAPON_TYPES.SHOTGUN].reserve + 5);
      if (this.scene.hud) this.scene.hud.setObjective('SCAVENGED: SHOTGUN & 12GA SHELLS');
    } else {
      this.weapons.ammo[WEAPON_TYPES.PISTOL].reserve = Math.min(32, this.weapons.ammo[WEAPON_TYPES.PISTOL].reserve + 8);
      if (this.scene.hud) this.scene.hud.setObjective('SCAVENGED: PISTOL 9MM AMMO');
    }
    audioSystem.playFootstep(true);
  }
}
