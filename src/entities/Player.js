import Phaser from 'phaser';
import { audioSystem } from '../systems/Audio.js';

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'ghost', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Physics Hitbox: 10x28 centered in 24x32
    this.body.setSize(10, 28);
    this.body.setOffset(7, 4);
    this.body.setGravityY(900);
    this.setDepth(100);

    // Stats
    this.hp = 100;
    this.maxHp = 100;
    this.ammo = 6;
    this.maxAmmo = 12;
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
    this.JUMP_VELOCITY = -318; // ~3.5 tiles (56px) at 900 gravity

    // Timers
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.fallStartY = y;
    this.isFalling = false;
    this.footstepTimer = 0;

    // State machine:
    // 'normal', 'sneak', 'ledge_grab', 'ledge_climb', 'pipe_hang',
    // 'rope_slide', 'ladder', 'wall_press', 'zipline', 'vent_crawl',
    // 'grab_guard', 'drag_body', 'hurt', 'dead'
    this.state = 'normal';

    // Grabbing / Carrying
    this.grabbedGuard = null;
    this.draggedBody = null;

    // Thermal Visor
    this.thermalActive = false;
    this.thermalTimer = 0; // 6s duration
    this.thermalCooldown = 0; // 10s cooldown

    // Interactive target within proximity
    this.currentInteractive = null;

    // Shooting
    this.aimAngle = 0; // -1: up, 0: straight, 1: down
    this.isAiming = false;

    // Zipline state
    this.currentZipline = null;
    this.ziplineProgress = 0;

    // Vent state
    this.inVent = false;

    this.createAnimations();
  }

  createAnimations() {
    const anims = this.scene.anims;
    if (anims.exists('ghost_idle')) return;

    anims.create({
      key: 'ghost_idle',
      frames: anims.generateFrameNumbers('ghost', { start: 0, end: 3 }),
      frameRate: 4,
      repeat: -1
    });

    anims.create({
      key: 'ghost_walk',
      frames: anims.generateFrameNumbers('ghost', { start: 4, end: 9 }),
      frameRate: 8,
      repeat: -1
    });

    anims.create({
      key: 'ghost_sneak',
      frames: anims.generateFrameNumbers('ghost', { start: 10, end: 13 }),
      frameRate: 6,
      repeat: -1
    });

    anims.create({
      key: 'ghost_run',
      frames: anims.generateFrameNumbers('ghost', { start: 14, end: 19 }),
      frameRate: 11,
      repeat: -1
    });

    anims.create({
      key: 'ghost_jump',
      frames: [{ key: 'ghost', frame: 20 }],
      frameRate: 1
    });

    anims.create({
      key: 'ghost_fall',
      frames: [{ key: 'ghost', frame: 22 }],
      frameRate: 1
    });

    anims.create({
      key: 'ghost_ledge',
      frames: anims.generateFrameNumbers('ghost', { start: 24, end: 25 }),
      frameRate: 4,
      repeat: -1
    });

    anims.create({
      key: 'ghost_pipe',
      frames: anims.generateFrameNumbers('ghost', { start: 30, end: 33 }),
      frameRate: 6,
      repeat: -1
    });

    anims.create({
      key: 'ghost_rope',
      frames: anims.generateFrameNumbers('ghost', { start: 34, end: 36 }),
      frameRate: 6,
      repeat: -1
    });

    anims.create({
      key: 'ghost_ladder',
      frames: anims.generateFrameNumbers('ghost', { start: 37, end: 40 }),
      frameRate: 7,
      repeat: -1
    });

    anims.create({
      key: 'ghost_wall',
      frames: [{ key: 'ghost', frame: 41 }],
      frameRate: 1
    });

    anims.create({
      key: 'ghost_shoot',
      frames: anims.generateFrameNumbers('ghost', { start: 43, end: 45 }),
      frameRate: 10,
      repeat: 0
    });

    anims.create({
      key: 'ghost_knockout',
      frames: anims.generateFrameNumbers('ghost', { start: 46, end: 49 }),
      frameRate: 10,
      repeat: 0
    });

    anims.create({
      key: 'ghost_zipline',
      frames: anims.generateFrameNumbers('ghost', { start: 56, end: 57 }),
      frameRate: 6,
      repeat: -1
    });

    anims.create({
      key: 'ghost_vent',
      frames: anims.generateFrameNumbers('ghost', { start: 58, end: 61 }),
      frameRate: 5,
      repeat: -1
    });

    anims.create({
      key: 'ghost_hurt',
      frames: [{ key: 'ghost', frame: 62 }],
      frameRate: 1
    });

    anims.create({
      key: 'ghost_dead',
      frames: [{ key: 'ghost', frame: 63 }],
      frameRate: 1
    });
  }

  update(time, delta, input) {
    if (this.state === 'dead') return;

    const dt = delta / 1000;

    // Thermal Visor Management
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
      // Landing noise ring
      if (fallDistance > 32) {
        this.scene.stealth.emitNoise(this.x, this.y, 80);
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

    // State specific updates
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
      case 'shoot':
      case 'knockout':
        // Locked during animation
        break;
      case 'normal':
      case 'sneak':
      default:
        this.updateGroundAndAir(dt, input);
        break;
    }

    // Interactive object triggers (e.g. hack terminal, door peek, open vent, zipline start)
    this.checkInteractions(input);
  }

  // ==========================================
  // NORMAL MOVEMENT & SNEAK
  // ==========================================
  updateGroundAndAir(dt, input) {
    const onGround = this.body.blocked.down;

    // Check Wall-press trigger: press Down next to a wall in shadow
    if (onGround && input.down && (this.body.blocked.left || this.body.blocked.right)) {
      if (this.scene.stealth.playerVisibility < 35) {
        this.state = 'wall_press';
        this.body.setVelocityX(0);
        this.play('ghost_wall', true);
        return;
      }
    }

    // Aiming / Shooting mode
    if (input.shoot) {
      this.handleAiming(input);
      return;
    }

    // Determine speed mode
    let targetSpeed = this.SPEED_WALK;
    let isSneaking = input.sneak;
    let isRunning = false;

    if (isSneaking) {
      targetSpeed = this.SPEED_SNEAK;
      this.state = 'sneak';
    } else if ((input.left || input.right) && !isSneaking && !input.down) {
      // Double tap or normal run
      targetSpeed = this.SPEED_RUN;
      isRunning = true;
      this.state = 'normal';
    } else {
      this.state = 'normal';
    }

    // Left / Right velocity
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
          // Running emits 80px noise ring!
          this.scene.stealth.emitNoise(this.x, this.y, 80);
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

    // Animation selection
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
          this.play('ghost_sneak', true); // crouch idle
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

    // Takedown / Knockout trigger [J]
    if (input.actionJustPressed) {
      this.tryTakedown();
    }

    // Grab Guard trigger [L]
    if (input.grabJustPressed) {
      this.tryGrabGuard();
    }

    // Check overhead pipe grab
    if (!onGround && input.up) {
      this.checkOverheadPipe();
    }

    // Check ladder grab
    if (input.up || input.down) {
      this.checkLadder();
    }
  }

  // ==========================================
  // AIMING & SILENCED PISTOL
  // ==========================================
  handleAiming(input) {
    this.body.setVelocityX(0);
    this.play('ghost_shoot', true);

    // Aim angle
    if (input.up) {
      this.aimAngle = -0.5; // up angle
    } else if (input.down) {
      this.aimAngle = 0.5; // down angle
    } else {
      this.aimAngle = 0; // straight
    }

    if (input.shootJustPressed) {
      this.fireSilencedPistol();
    }
  }

  fireSilencedPistol() {
    if (this.ammo <= 0) {
      audioSystem.playRadioBlip(); // dry fire click
      return;
    }

    this.ammo--;
    audioSystem.playSuppressedShot();

    const facing = this.flipX ? -1 : 1;
    const startX = this.x + facing * 12;
    const startY = this.y - 2;

    const angle = this.aimAngle;
    const targetX = startX + facing * 320;
    const targetY = startY + angle * 160;

    // Bullet Raycast check
    this.scene.handleBulletHit(startX, startY, targetX, targetY);
  }

  // ==========================================
  // TAKEDOWN & GUARD INTERACTION
  // ==========================================
  tryTakedown() {
    if (!this.scene.guards) return;
    const unawareGuard = this.scene.guards.getChildren().find(g => {
      if (g.isKnockedOut || g.isDead) return false;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, g.x, g.y);
      // Unaware guard within 22 px
      return dist <= 22 && !g.isAlert;
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
      // Release or knockout grabbed guard
      this.grabbedGuard.knockout();
      this.grabbedGuard = null;
      this.state = 'normal';
      return;
    }

    const unawareGuard = this.scene.guards.getChildren().find(g => {
      if (g.isKnockedOut || g.isDead) return false;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, g.x, g.y);
      return dist <= 24 && !g.isAlert;
    });

    if (unawareGuard) {
      this.grabbedGuard = unawareGuard;
      unawareGuard.getGrabbed(this);
      this.state = 'grab_guard';
    }
  }

  updateGrabGuard(dt, input) {
    // Ghost holds guard hostage (useful for hand scanners)
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

    // Knock out on J or release on L
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
  // LEDGE GRAB & CLIMB
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
    // Up to climb up, Down to drop
    if (input.up) {
      this.state = 'ledge_climb';
      this.play('ghost_ledge', false);
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

  // ==========================================
  // OVERHEAD PIPE HANG & HAND-OVER-HAND
  // ==========================================
  checkOverheadPipe() {
    if (!this.scene.pipeTiles) return;
    const tile = this.scene.pipeTiles.getTileAtWorldXY(this.x, this.y - 18);
    if (tile && tile.index === 5) {
      this.state = 'pipe_hang';
      this.body.setAllowGravity(false);
      this.body.setVelocity(0, 0);
      this.y = tile.pixelY + 24;
      this.play('ghost_pipe', true);
    }
  }

  updatePipeHang(dt, input) {
    // Move hand over hand: 40 px/s
    if (input.left) {
      this.body.setVelocityX(-this.SPEED_PIPE);
      this.play('ghost_pipe', true);
    } else if (input.right) {
      this.body.setVelocityX(this.SPEED_PIPE);
      this.play('ghost_pipe', true);
    } else {
      this.body.setVelocityX(0);
      this.stop();
      this.setFrame(30);
    }

    // Check if still under pipe
    const tile = this.scene.pipeTiles.getTileAtWorldXY(this.x, this.y - 24);
    if (!tile || tile.index !== 5 || input.down) {
      // Drop
      this.body.setAllowGravity(true);
      this.state = 'normal';
    }
  }

  // ==========================================
  // LADDER & ROPE SLIDE
  // ==========================================
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
    const climbSpeed = 50;
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
    let speed = 60;
    if (input.up) speed = 25; // brake
    if (input.down) speed = 100; // fast slide

    this.y += speed * dt;

    if (this.y >= this.rappelEndY || input.jumpJustPressed) {
      this.body.setAllowGravity(true);
      this.state = 'normal';
    }
  }

  // ==========================================
  // WALL PRESS
  // ==========================================
  updateWallPress(dt, input) {
    this.body.setVelocityX(0);
    // Exit wall press if moving away or jumping
    if (input.left || input.right || input.jumpJustPressed || !input.down) {
      this.state = 'normal';
    }
  }

  // ==========================================
  // EXTRA MECHANIC 1: ZIP LINE (Section A)
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

    // Slide down cable from start to end; hold Up to brake
    const speed = input.up ? 0.35 : 0.85; // progress per second
    this.ziplineProgress += speed * dt;

    const currentX = Phaser.Math.Linear(this.currentZipline.startX, this.currentZipline.endX, this.ziplineProgress);
    const currentY = Phaser.Math.Linear(this.currentZipline.startY, this.currentZipline.endY, this.ziplineProgress);

    this.x = currentX;
    this.y = currentY;

    // Guards below only notice if he passes through a light
    if (this.scene.stealth.playerVisibility > 50) {
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

  // ==========================================
  // EXTRA MECHANIC 2: VENT CRAWL (Section C)
  // ==========================================
  enterVent(ventX, ventY) {
    this.state = 'vent_crawl';
    this.inVent = true;
    this.x = ventX;
    this.y = ventY;
    this.body.setSize(16, 12);
    this.body.setOffset(4, 20);
    this.play('ghost_vent', true);
  }

  updateVentCrawl(dt, input) {
    const ventSpeed = 28; // slow & silent
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

    // Silent footsteps
    if (input.left || input.right) {
      this.footstepTimer += dt;
      if (this.footstepTimer >= 0.45) {
        this.footstepTimer = 0;
        audioSystem.playFootstep(false, true);
      }
    }

    // Check exit vent
    if (input.actionJustPressed && this.currentInteractive && this.currentInteractive.type === 'vent_exit') {
      this.exitVent(this.currentInteractive.exitX, this.currentInteractive.exitY);
    }
  }

  exitVent(exitX, exitY) {
    this.state = 'normal';
    this.inVent = false;
    this.x = exitX;
    this.y = exitY;
    this.body.setSize(10, 28);
    this.body.setOffset(7, 4);
    this.play('ghost_idle', true);
  }

  // ==========================================
  // EXTRA MECHANIC 3: THERMAL VISOR
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
      this.thermalTimer = 6.0; // 6 seconds duration
      this.thermalCooldown = 10.0; // 10 seconds cooldown
      audioSystem.playThermalToggle(true);
    } else {
      audioSystem.playThermalToggle(false);
    }
    this.scene.onThermalToggle(enable);
  }

  // ==========================================
  // INTERACTIONS CHECK (Peek, Hack, Terminal, Doors, Items)
  // ==========================================
  checkInteractions(input) {
    if (!this.currentInteractive) return;

    const ci = this.currentInteractive;

    // Door Peek: at closed doors press Up to peek through gap
    if (ci.type === 'door' && !ci.isOpen) {
      if (input.up) {
        this.scene.openDoorPeek(ci);
      } else if (input.actionJustPressed) {
        // Try opening with keycard or captive guard
        ci.tryOpen(this);
      }
    }

    // Security Terminal: opens 10s pattern puzzle
    if (ci.type === 'terminal' && !ci.isHacked) {
      if (input.actionJustPressed) {
        this.scene.openHackMinigame(ci);
      }
    }

    // Data Drive / Intel pickup
    if (ci.type === 'item') {
      if (input.actionJustPressed || Phaser.Math.Distance.Between(this.x, this.y, ci.x, ci.y) < 16) {
        ci.collect(this);
      }
    }
  }

  // ==========================================
  // DAMAGE & HEALTH
  // ==========================================
  takeDamage(amount, source = 'bullet') {
    if (this.state === 'dead') return;

    this.hp = Math.max(0, this.hp - amount);

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
}
