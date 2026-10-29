import Phaser from 'phaser';
import { audioSystem } from '../systems/Audio.js';

export class Guard extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, config = {}) {
    super(scene, x, y, 'guard', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setSize(12, 28);
    this.body.setOffset(6, 4);
    this.body.setGravityY(900);
    this.setDepth(90);

    // Configuration
    this.isOffice = config.isOffice || false;
    this.isSleeping = config.isSleeping || false;
    this.patrolLeftX = config.patrolLeftX !== undefined ? config.patrolLeftX : x - 60;
    this.patrolRightX = config.patrolRightX !== undefined ? config.patrolRightX : x + 60;
    this.facing = config.facing || 1; // 1: right, -1: left
    this.setFlipX(this.facing === -1);

    // States: 'patrol', 'wait', 'suspicious', 'alert', 'search', 'knocked', 'grabbed', 'dead'
    this.state = this.isSleeping ? 'sleeping' : 'patrol';
    this.isKnockedOut = false;
    this.isDead = false;
    this.isAlert = false;
    this.bodyDiscovered = false;

    // Speeds
    this.patrolSpeed = 35;
    this.alertSpeed = 70;

    // Timers
    this.waitTimer = 0;
    this.suspiciousTimer = 0;
    this.searchTimer = 0;
    this.shootCooldown = 0;

    // Vision cone & detection
    this.visionAngle = 70;
    this.visionRange = 120;
    this.detectionLevel = 0; // 0 to 1.0
    this.flashlightActive = !this.isOffice;

    // Suspicious target position
    this.investigateX = x;
    this.investigateY = y;

    // Visual indicators ("?", "!")
    this.statusBubble = scene.add.text(x, y - 22, '', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#f59e0b'
    }).setOrigin(0.5).setDepth(200);

    // Vision cone visual representation
    this.coneGraphics = scene.add.graphics().setDepth(50);

    this.createAnimations();
    if (this.isSleeping) {
      this.play(this.isOffice ? 'guard_office_sleep' : 'guard_idle', true);
    } else {
      this.play(this.isOffice ? 'guard_office_walk' : 'guard_walk', true);
    }
  }

  createAnimations() {
    const anims = this.scene.anims;
    if (anims.exists('guard_idle')) return;

    anims.create({
      key: 'guard_idle',
      frames: anims.generateFrameNumbers('guard', { start: 0, end: 3 }),
      frameRate: 4,
      repeat: -1
    });

    anims.create({
      key: 'guard_walk',
      frames: anims.generateFrameNumbers('guard', { start: 6, end: 11 }),
      frameRate: 6,
      repeat: -1
    });

    anims.create({
      key: 'guard_alert',
      frames: anims.generateFrameNumbers('guard', { start: 12, end: 15 }),
      frameRate: 8,
      repeat: -1
    });

    anims.create({
      key: 'guard_office_walk',
      frames: anims.generateFrameNumbers('guard', { start: 18, end: 21 }),
      frameRate: 6,
      repeat: -1
    });

    anims.create({
      key: 'guard_office_sleep',
      frames: [{ key: 'guard', frame: 24 }],
      frameRate: 1
    });

    anims.create({
      key: 'guard_knocked',
      frames: [{ key: 'guard', frame: 30 }],
      frameRate: 1
    });
  }

  update(time, delta) {
    const dt = delta / 1000;

    // Follow status bubble position
    this.statusBubble.setPosition(this.x, this.y - 20);

    if (this.isKnockedOut || this.isDead || this.state === 'grabbed') {
      this.coneGraphics.clear();
      return;
    }

    if (this.isSleeping) {
      this.coneGraphics.clear();
      return;
    }

    // Vision Cone Raycast & Player Detection
    this.updateVision(dt);

    // State machine updates
    switch (this.state) {
      case 'patrol':
        this.updatePatrol(dt);
        break;
      case 'wait':
        this.updateWait(dt);
        break;
      case 'suspicious':
        this.updateSuspicious(dt);
        break;
      case 'alert':
        this.updateAlert(dt);
        break;
      case 'search':
        this.updateSearch(dt);
        break;
    }
  }

  // ==========================================
  // VISION & DETECTION
  // ==========================================
  updateVision(dt) {
    const player = this.scene.player;
    if (!player || player.state === 'dead') {
      this.drawVisionCone(false);
      return;
    }

    // If Ghost is hanging from overhead pipe and guard is NOT in alert, Ghost is INVISIBLE!
    if (player.state === 'pipe_hang' && this.state !== 'alert') {
      this.detectionLevel = Math.max(0, this.detectionLevel - dt);
      this.drawVisionCone(false);
      return;
    }

    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const facingDir = this.flipX ? -1 : 1;
    const dx = player.x - this.x;
    const dy = player.y - this.y;

    // Range is halved if player's visibility is < 30%
    const effectiveRange = this.scene.stealth.playerVisibility < 30 ? (this.visionRange * 0.5) : this.visionRange;

    // In-cone check: distance, forward direction, vertical angle tolerance
    const inCone = (dist <= effectiveRange) && (dx * facingDir > 0) && (Math.abs(dy) <= 36);

    if (inCone) {
      // Detection rate depends on visibility (0.8s - 1.5s)
      const visRatio = Math.max(0.1, this.scene.stealth.playerVisibility / 100);
      const fillRate = (visRatio * 1.4); // fills in ~0.8s when fully visible
      this.detectionLevel = Math.min(1.0, this.detectionLevel + fillRate * dt);

      if (this.detectionLevel >= 1.0) {
        this.setAlertState();
      } else if (this.detectionLevel >= 0.35 && this.state !== 'alert') {
        this.setSuspiciousState(player.x, player.y);
      }
    } else {
      this.detectionLevel = Math.max(0, this.detectionLevel - dt * 0.5);
    }

    // Check for knocked out bodies in vision range
    this.checkBodiesInVision();

    this.drawVisionCone(inCone || this.state === 'alert');
  }

  drawVisionCone(hasTarget) {
    this.coneGraphics.clear();
    const facingDir = this.flipX ? -1 : 1;
    const startX = this.x + facingDir * 8;
    const startY = this.y - 2;
    const range = this.scene.stealth.playerVisibility < 30 ? (this.visionRange * 0.5) : this.visionRange;

    // Cone color
    let coneColor = 0xfef08a; // yellow patrol
    let alpha = 0.18;
    if (this.state === 'alert') {
      coneColor = 0xef4444; // red
      alpha = 0.35;
    } else if (this.state === 'suspicious') {
      coneColor = 0xf59e0b; // amber
      alpha = 0.28;
    }

    this.coneGraphics.fillStyle(coneColor, alpha);
    this.coneGraphics.beginPath();
    this.coneGraphics.moveTo(startX, startY);

    const baseAngle = facingDir === 1 ? 0 : Math.PI;
    const spread = (this.visionAngle * Math.PI) / 180 / 2;

    this.coneGraphics.arc(startX, startY, range, baseAngle - spread, baseAngle + spread);
    this.coneGraphics.closePath();
    this.coneGraphics.fill();
  }

  checkBodiesInVision() {
    if (!this.scene.guards) return;
    this.scene.guards.getChildren().forEach(other => {
      if (other !== this && other.isKnockedOut && !other.bodyDiscovered) {
        const dist = Phaser.Math.Distance.Between(this.x, this.y, other.x, other.y);
        const facingDir = this.flipX ? -1 : 1;
        const dx = other.x - this.x;
        if (dist < 100 && dx * facingDir > 0) {
          other.bodyDiscovered = true;
          this.statusBubble.setText('!').setColor('#ef4444');
          this.scene.alarm.raise('Body discovered');
          this.setAlertState();
        }
      }
    });
  }

  // ==========================================
  // PATROL & AI BEHAVIORS
  // ==========================================
  updatePatrol(dt) {
    const facingDir = this.flipX ? -1 : 1;
    this.body.setVelocityX(facingDir * this.patrolSpeed);
    this.play(this.isOffice ? 'guard_office_walk' : 'guard_walk', true);

    if (this.flipX && this.x <= this.patrolLeftX) {
      this.state = 'wait';
      this.waitTimer = 1.5;
      this.body.setVelocityX(0);
      this.play('guard_idle', true);
    } else if (!this.flipX && this.x >= this.patrolRightX) {
      this.state = 'wait';
      this.waitTimer = 1.5;
      this.body.setVelocityX(0);
      this.play('guard_idle', true);
    }
  }

  updateWait(dt) {
    this.waitTimer -= dt;
    if (this.waitTimer <= 0) {
      this.setFlipX(!this.flipX);
      this.state = 'patrol';
    }
  }

  hearNoise(nx, ny) {
    if (this.isSleeping) {
      this.isSleeping = false; // wakes up on noise
      this.statusBubble.setText('?').setColor('#f59e0b');
    }
    this.setSuspiciousState(nx, ny);
  }

  setSuspiciousState(targetX, targetY) {
    if (this.state === 'alert') return;

    this.state = 'suspicious';
    this.investigateX = targetX;
    this.investigateY = targetY;
    this.suspiciousTimer = 4.0;
    this.statusBubble.setText('?').setColor('#f59e0b');
    audioSystem.setSuspicionState(1);

    // Turn toward sound/sight
    this.setFlipX(targetX < this.x);
  }

  updateSuspicious(dt) {
    this.suspiciousTimer -= dt;
    const dx = this.investigateX - this.x;

    if (Math.abs(dx) > 10) {
      this.body.setVelocityX(Math.sign(dx) * (this.patrolSpeed * 1.1));
      this.setFlipX(dx < 0);
      this.play(this.isOffice ? 'guard_office_walk' : 'guard_walk', true);
    } else {
      this.body.setVelocityX(0);
      this.play('guard_idle', true);
    }

    if (this.suspiciousTimer <= 0) {
      this.statusBubble.setText('');
      this.state = 'search';
      this.searchTimer = 15.0; // 15 s search sweep
    }
  }

  setAlertState() {
    this.state = 'alert';
    this.isAlert = true;
    this.statusBubble.setText('!').setColor('#ef4444');
    audioSystem.setSuspicionState(2);
    audioSystem.playRadioBlip();

    this.scene.alarm.raise('Guard spotted Ghost');
    this.play('guard_alert', true);
  }

  updateAlert(dt) {
    const player = this.scene.player;
    if (!player || player.state === 'dead') return;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    this.setFlipX(dx < 0);

    // Pursuit and shoot
    if (dist > 70) {
      this.body.setVelocityX(Math.sign(dx) * this.alertSpeed);
      this.play('guard_alert', true);
    } else {
      this.body.setVelocityX(0);
      this.play('guard_alert', true);
    }

    // Shoot weapon
    this.shootCooldown -= dt;
    if (this.shootCooldown <= 0 && Math.abs(dy) < 32 && dist < 140) {
      this.shootCooldown = 1.2;
      this.fireRifleAtPlayer(player);
    }
  }

  fireRifleAtPlayer(player) {
    // Muzzle flash sound and bullet
    audioSystem.playFootstep(true);
    const facing = this.flipX ? -1 : 1;

    // Bullet tracer
    const line = this.scene.add.line(0, 0, this.x + facing * 12, this.y - 2, player.x, player.y, 0xfde047, 0.9)
      .setLineWidth(1.5)
      .setDepth(150);

    this.scene.tweens.add({
      targets: line,
      alpha: 0,
      duration: 100,
      onComplete: () => line.destroy()
    });

    // 20 damage per bullet
    player.takeDamage(20, 'guard rifle');
  }

  updateSearch(dt) {
    this.searchTimer -= dt;
    // Walk back and forth looking for player
    if (Math.floor(this.searchTimer) % 3 === 0) {
      this.setFlipX(!this.flipX);
    }

    if (this.searchTimer <= 0) {
      this.state = 'patrol';
      this.statusBubble.setText('');
      audioSystem.setSuspicionState(0);
    }
  }

  // ==========================================
  // TAKEDOWN & INTERACTION
  // ==========================================
  knockout() {
    this.isKnockedOut = true;
    this.state = 'knocked';
    this.body.setVelocity(0, 0);
    this.statusBubble.setText('zZ').setColor('#94a3b8');
    this.play('guard_knocked', true);
    this.coneGraphics.clear();
  }

  getGrabbed(player) {
    this.state = 'grabbed';
    this.body.setVelocity(0, 0);
    this.statusBubble.setText('!').setColor('#ef4444');
    this.play('guard_alert', true);
    this.coneGraphics.clear();
  }

  kill() {
    this.isDead = true;
    this.isKnockedOut = true;
    this.state = 'dead';
    this.body.setVelocity(0, 0);
    this.statusBubble.setText('');
    this.play('guard_knocked', true);
    this.coneGraphics.clear();
  }
}
