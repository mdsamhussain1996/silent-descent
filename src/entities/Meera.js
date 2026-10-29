// src/entities/Meera.js
// Dr. Meera Sen — Informant Escort NPC

export class MeeraSen extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'meera_idle');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setSize(22, 42);
    this.setOffset(4, 2);

    this.isRescued = false;
    this.hp = 60;
    this.maxHp = 60;
    this.isDead = false;
    this.isCrouching = false;
    this.state = 'waiting'; // 'waiting', 'following', 'rescued', 'dead'

    // Status bubble above head
    this.statusBubble = scene.add.text(x, y - 28, '', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#38bdf8'
    }).setOrigin(0.5);

    this.scene.physics.add.collider(this, scene.platforms);
  }

  rescue() {
    if (this.isRescued) return;
    this.isRescued = true;
    this.state = 'following';
    this.statusBubble.setText('FOLLOWING').setColor('#10b981');
    this.scene.time.delayedCall(2000, () => this.statusBubble.setText(''));

    // Notify objectives
    if (this.scene.objectives) {
      this.scene.objectives.completePrimary('rescue_meera');
    }
  }

  update(time, delta) {
    if (this.isDead) return;

    const dt = delta / 1000;
    this.statusBubble.setPosition(this.x, this.y - 28);

    if (!this.isRescued) {
      this.body.setVelocityX(0);
      return;
    }

    const player = this.scene.player;
    if (!player || player.state === 'dead') {
      this.body.setVelocityX(0);
      return;
    }

    // Mirror player crouch/cover
    if (player.state === 'crouch' || player.isCovered) {
      this.isCrouching = true;
      this.body.setSize(22, 26);
      this.setOffset(4, 18);
    } else {
      this.isCrouching = false;
      this.body.setSize(22, 42);
      this.setOffset(4, 2);
    }

    const dx = player.x - this.x;
    const dist = Math.abs(dx);
    const targetFollowDist = 45;

    if (dist > targetFollowDist) {
      const dir = Math.sign(dx);
      const speed = player.body.velocity.x !== 0 ? Math.min(130, Math.abs(player.body.velocity.x)) : 100;
      this.body.setVelocityX(dir * speed);
      this.setFlipX(dir < 0);

      // Jump over obstacles if player is on ground or jumping higher
      if (player.y < this.y - 20 && this.body.blocked.down) {
        this.body.setVelocityY(-350);
      }
    } else {
      this.body.setVelocityX(0);
    }

    // Guard vision detection against Meera
    if (this.scene.guards) {
      this.scene.guards.getChildren().forEach(guard => {
        if (!guard.isKnockedOut && !guard.isDead && guard.state !== 'alert') {
          const gDist = Phaser.Math.Distance.Between(this.x, this.y, guard.x, guard.y);
          const gDx = this.x - guard.x;
          const gFacing = guard.flipX ? -1 : 1;
          if (gDist < 180 && gDx * gFacing > 0 && Math.abs(this.y - guard.y) < 40 && !this.isCrouching) {
            guard.setAlertState(false);
            this.statusBubble.setText('SPOTTED!').setColor('#ef4444');
            this.scene.time.delayedCall(2000, () => this.statusBubble.setText(''));
          }
        }
      });
    }
  }

  takeDamage(amount) {
    if (this.isDead) return;
    this.hp -= amount;
    this.setTint(0xff3333);
    this.scene.time.delayedCall(120, () => this.clearTint());

    if (this.hp <= 0) {
      this.isDead = true;
      this.state = 'dead';
      this.body.setVelocity(0, 0);
      this.statusBubble.setText('KIA').setColor('#ef4444');
      if (this.scene.objectives) {
        this.scene.objectives.failMission('DR. MEERA SEN WAS KILLED IN ACTION');
      }
    }
  }
}
