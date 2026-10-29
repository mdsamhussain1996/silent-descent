import Phaser from 'phaser';
import { audioSystem } from '../systems/Audio.js';

export class Guard extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, config = {}) {
    super(scene, x, y, 'guard', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Hitbox: 14x34 in 28x40 frame
    this.body.setSize(14, 34);
    this.body.setOffset(7, 6);
    this.body.setGravityY(900);
    this.setDepth(90);

    // Guard Type: 'dock', 'office', 'heavy'
    this.guardType = config.guardType || (config.isOffice ? 'office' : 'dock');
    this.isSleeping = config.isSleeping || false;
    this.patrolLeftX = config.patrolLeftX !== undefined ? config.patrolLeftX : x - 60;
    this.patrolRightX = config.patrolRightX !== undefined ? config.patrolRightX : x + 60;
    this.facing = config.facing || 1;
    this.setFlipX(this.facing === -1);

    // Stats
    this.hp = this.guardType === 'heavy' ? 80 : 40;
    this.maxHp = this.hp;

    // States: 'patrol', 'wait', 'suspicious', 'search', 'alert', 'stunned', 'knocked', 'grabbed', 'dead'
    this.state = this.isSleeping ? 'sleeping' : 'patrol';
    this.isKnockedOut = false;
    this.isDead = false;
    this.isAlert = false;
    this.bodyDiscovered = false;
    this.looted = false;

    // AI Speeds
    this.patrolSpeed = this.guardType === 'heavy' ? 28 : 36;
    this.alertSpeed = this.guardType === 'heavy' ? 55 : 72;

    // Timers
    this.waitTimer = 0;
    this.suspiciousTimer = 0;
    this.searchTimer = 0;
    this.stunTimer = 0;
    this.telegraphTimer = 0;
    this.shootCooldown = 0;
    this.isTelegraphing = false;

    // Vision cone
    this.visionAngle = 70;
    this.visionRange = 130;
    this.detectionLevel = 0;
    this.flashlightActive = this.guardType !== 'office';

    // Target position for investigation
    this.investigateX = x;
    this.investigateY = y;

    // Visual indicators: grey "?", orange "?", red "!"
    this.statusBubble = scene.add.text(x, y - 26, '', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#94a3b8'
    }).setOrigin(0.5).setDepth(200);

    // Vision cone & weapon telegraph laser line graphics
    this.coneGraphics = scene.add.graphics().setDepth(50);
    this.telegraphGraphics = scene.add.graphics().setDepth(155);

    this.createAnimations();
    this.initAnim();
  }

  initAnim() {
    if (this.isSleeping) {
      this.setFrame(16);
    } else {
      const baseFrame = this.guardType === 'heavy' ? 32 : (this.guardType === 'office' ? 16 : 0);
      this.setFrame(baseFrame);
    }
  }

  createAnimations() {
    const anims = this.scene.anims;
    if (anims.exists('dock_walk')) return;

    anims.create({
      key: 'dock_walk',
      frames: anims.generateFrameNumbers('guard', { start: 0, end: 7 }),
      frameRate: 7,
      repeat: -1
    });

    anims.create({
      key: 'dock_alert',
      frames: anims.generateFrameNumbers('guard', { start: 8, end: 15 }),
      frameRate: 8,
      repeat: -1
    });

    anims.create({
      key: 'office_walk',
      frames: anims.generateFrameNumbers('guard', { start: 16, end: 23 }),
      frameRate: 7,
      repeat: -1
    });

    anims.create({
      key: 'office_alert',
      frames: anims.generateFrameNumbers('guard', { start: 24, end: 31 }),
      frameRate: 8,
      repeat: -1
    });

    anims.create({
      key: 'heavy_walk',
      frames: anims.generateFrameNumbers('guard', { start: 32, end: 39 }),
      frameRate: 6,
      repeat: -1
    });

    anims.create({
      key: 'heavy_alert',
      frames: anims.generateFrameNumbers('guard', { start: 40, end: 47 }),
      frameRate: 7,
      repeat: -1
    });
  }

  update(time, delta) {
    const dt = delta / 1000;

    this.statusBubble.setPosition(this.x, this.y - 24);

    if (this.isKnockedOut || this.isDead || this.state === 'grabbed') {
      this.coneGraphics.clear();
      this.telegraphGraphics.clear();
      return;
    }

    if (this.state === 'stunned') {
      this.coneGraphics.clear();
      this.telegraphGraphics.clear();
      this.stunTimer -= dt;
      if (this.stunTimer <= 0) {
        this.state = 'search';
        this.statusBubble.setText('?').setColor('#f59e0b');
      }
      return;
    }

    if (this.isSleeping) {
      this.coneGraphics.clear();
      return;
    }

    // Vision raycast & player detection
    this.updateVision(dt);

    // AI state machine
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
      case 'search':
        this.updateSearch(dt);
        break;
      case 'alert':
        this.updateAlert(dt);
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

    // Overhead pipe hang makes Ghost invisible from below unless guard is alert!
    if (player.state === 'pipe_hang' && this.state !== 'alert') {
      this.detectionLevel = Math.max(0, this.detectionLevel - dt);
      this.drawVisionCone(false);
      return;
    }

    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const facingDir = this.flipX ? -1 : 1;
    const dx = player.x - this.x;
    const dy = player.y - this.y;

    const vis = this.scene.stealth?.playerVisibility || 0;
    const effectiveRange = vis < 30 ? (this.visionRange * 0.5) : this.visionRange;

    const inCone = (dist <= effectiveRange) && (dx * facingDir > 0) && (Math.abs(dy) <= 38);

    if (inCone) {
      const visRatio = Math.max(0.15, vis / 100);
      const fillRate = visRatio * 1.5;
      this.detectionLevel = Math.min(1.0, this.detectionLevel + fillRate * dt);

      if (this.detectionLevel >= 1.0) {
        this.setAlertState();
      } else if (this.detectionLevel >= 0.35 && this.state !== 'alert') {
        this.setSuspiciousState(player.x, player.y);
      }
    } else {
      this.detectionLevel = Math.max(0, this.detectionLevel - dt * 0.5);
    }

    this.checkBodiesInVision();
    this.drawVisionCone(inCone || this.state === 'alert');
  }

  drawVisionCone(hasTarget) {
    this.coneGraphics.clear();
    const facingDir = this.flipX ? -1 : 1;
    const startX = this.x + facingDir * 8;
    const startY = this.y - 2;
    const range = (this.scene.stealth?.playerVisibility || 0) < 30 ? (this.visionRange * 0.5) : this.visionRange;

    let coneColor = 0xfef08a;
    let alpha = 0.16;
    if (this.state === 'alert') {
      coneColor = 0xef4444;
      alpha = 0.32;
    } else if (this.state === 'suspicious' || this.state === 'search') {
      coneColor = 0xf59e0b;
      alpha = 0.24;
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
          this.scene.alarm?.raise('Unconscious body discovered');
          this.setAlertState();
        }
      }
    });
  }

  // ==========================================
  // AI PATROL & STATES
  // ==========================================
  updatePatrol(dt) {
    const facingDir = this.flipX ? -1 : 1;
    this.body.setVelocityX(facingDir * this.patrolSpeed);
    this.playAnim('walk');

    if (this.flipX && this.x <= this.patrolLeftX) {
      this.state = 'wait';
      this.waitTimer = 1.5;
      this.body.setVelocityX(0);
    } else if (!this.flipX && this.x >= this.patrolRightX) {
      this.state = 'wait';
      this.waitTimer = 1.5;
      this.body.setVelocityX(0);
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
      this.isSleeping = false;
    }
    this.setSuspiciousState(nx, ny);
  }

  setSuspiciousState(targetX, targetY) {
    if (this.state === 'alert') return;

    this.state = 'suspicious';
    this.investigateX = targetX;
    this.investigateY = targetY;
    this.suspiciousTimer = 4.0;
    this.statusBubble.setText('?').setColor('#94a3b8'); // grey '?'
    audioSystem.setSuspicionState(1);
    this.setFlipX(targetX < this.x);
  }

  updateSuspicious(dt) {
    this.suspiciousTimer -= dt;
    const dx = this.investigateX - this.x;

    if (Math.abs(dx) > 10) {
      this.body.setVelocityX(Math.sign(dx) * (this.patrolSpeed * 1.1));
      this.setFlipX(dx < 0);
      this.playAnim('walk');
    } else {
      this.body.setVelocityX(0);
    }

    if (this.suspiciousTimer <= 0) {
      this.state = 'search';
      this.searchTimer = 15.0;
      this.statusBubble.setText('?').setColor('#f59e0b'); // orange '?'
    }
  }

  updateSearch(dt) {
    this.searchTimer -= dt;
    if (Math.floor(this.searchTimer) % 3 === 0) {
      this.setFlipX(!this.flipX);
    }

    if (this.searchTimer <= 0) {
      this.state = 'patrol';
      this.statusBubble.setText('');
      audioSystem.setSuspicionState(0);
    }
  }

  setAlertState() {
    this.state = 'alert';
    this.isAlert = true;
    this.statusBubble.setText('!').setColor('#ef4444'); // red '!'
    audioSystem.setSuspicionState(2);
    audioSystem.playRadioBlip();
    this.scene.alarm?.raise('Guard spotted Ghost');
    this.playAnim('alert');
  }

  // ==========================================
  // TELEGRAPHED ENEMY WEAPON COMBAT
  // ==========================================
  updateAlert(dt) {
    const player = this.scene.player;
    if (!player || player.state === 'dead') {
      this.telegraphGraphics.clear();
      return;
    }

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    this.setFlipX(dx < 0);

    // Keep distance or pursue
    const targetDist = this.guardType === 'heavy' ? 80 : 110;
    if (dist > targetDist) {
      this.body.setVelocityX(Math.sign(dx) * this.alertSpeed);
      this.playAnim('alert');
    } else {
      this.body.setVelocityX(0);
      this.playAnim('alert');
    }

    // Telegraphing with Red Laser Sight (0.6s window before firing!)
    if (dist < 180 && Math.abs(dy) < 40) {
      if (!this.isTelegraphing) {
        this.isTelegraphing = true;
        this.telegraphTimer = 0.6; // 0.6s telegraph line
      } else {
        this.telegraphTimer -= dt;
        // Draw red laser sight line on the player
        this.telegraphGraphics.clear();
        this.telegraphGraphics.lineStyle(1.5, 0xef4444, 0.85);
        this.telegraphGraphics.lineBetween(this.x + (this.flipX ? -12 : 12), this.y - 4, player.x, player.y);

        if (this.telegraphTimer <= 0) {
          this.telegraphGraphics.clear();
          this.isTelegraphing = false;
          this.executeGuardAttack(player, dist);
        }
      }
    } else {
      this.telegraphGraphics.clear();
      this.isTelegraphing = false;
    }
  }

  executeGuardAttack(player, dist) {
    if (this.guardType === 'heavy') {
      // Shotgun blast (30 damage close / 10 damage far)
      const dmg = dist < 70 ? 30 : 10;
      audioSystem.playAlarmSiren();
      this.scene.cameras.main.shake(150, 0.008);
      player.takeDamage(dmg, 'heavy shotgun');
      this.spawnTracer(player.x, player.y, 0xf59e0b, 3);
    } else if (this.guardType === 'dock') {
      // 3-round SMG burst (8 damage per bullet)
      audioSystem.playFootstep(true);
      for (let b = 0; b < 3; b++) {
        this.scene.time.delayedCall(b * 100, () => {
          player.takeDamage(8, 'dock guard SMG');
          this.spawnTracer(player.x, player.y, 0xfde047, 1.5);
        });
      }
    } else {
      // Office guard pistol (12 damage)
      audioSystem.playFootstep(true);
      player.takeDamage(12, 'office pistol');
      this.spawnTracer(player.x, player.y, 0xfde047, 1.5);
    }
  }

  spawnTracer(tx, ty, color, width) {
    const line = this.scene.add.line(0, 0, this.x + (this.flipX ? -12 : 12), this.y - 4, tx, ty, color, 0.9)
      .setLineWidth(width)
      .setDepth(160);
    this.scene.tweens.add({
      targets: line,
      alpha: 0,
      duration: 100,
      onComplete: () => line.destroy()
    });
  }

  playAnim(animType) {
    const key = `${this.guardType}_${animType}`;
    if (this.anims.exists(key)) {
      this.play(key, true);
    }
  }

  // ==========================================
  // DAMAGE, HEADSHOTS & KNOCKOUT
  // ==========================================
  takeDamage(amount, isHeadshot = false, isSilentPistol = false) {
    if (this.isKnockedOut || this.isDead) return;

    if (isHeadshot && isSilentPistol) {
      // Silenced pistol headshot = instant silent takedown!
      this.knockout();
      return;
    }

    const multiplier = isHeadshot ? 2.5 : 1.0;
    this.hp -= (amount * multiplier);

    this.setTint(0xff2222);
    this.scene.time.delayedCall(100, () => this.clearTint());

    if (this.hp <= 0) {
      this.kill();
    } else {
      this.setAlertState();
    }
  }

  stun(duration = 6.0) {
    this.state = 'stunned';
    this.stunTimer = duration;
    this.body.setVelocity(0, 0);
    this.statusBubble.setText('⚡').setColor('#38bdf8');
    this.setTint(0x38bdf8);
    this.scene.time.delayedCall(200, () => this.clearTint());
  }

  knockout() {
    this.isKnockedOut = true;
    this.state = 'knocked';
    this.body.setVelocity(0, 0);
    this.statusBubble.setText('zZ').setColor('#94a3b8');
    this.setFrame(48); // knocked frame
    this.coneGraphics.clear();
    this.telegraphGraphics.clear();
  }

  getGrabbed(player) {
    this.state = 'grabbed';
    this.body.setVelocity(0, 0);
    this.statusBubble.setText('!').setColor('#ef4444');
    this.coneGraphics.clear();
    this.telegraphGraphics.clear();
  }

  kill() {
    this.isDead = true;
    this.isKnockedOut = true;
    this.state = 'dead';
    this.body.setVelocity(0, 0);
    this.statusBubble.setText('');
    this.setFrame(48);
    this.coneGraphics.clear();
    this.telegraphGraphics.clear();
  }
}
