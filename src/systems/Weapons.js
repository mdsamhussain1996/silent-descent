/**
 * Weapons.js
 * Comprehensive Weapons & Gadget Arsenal System for NO TRACE.
 * Handles Silenced Pistol, Suppressed SMG, Shotgun, Stun Taser, and Sticky Noise Maker.
 */

export const WEAPON_TYPES = {
  PISTOL: 'pistol',
  SMG: 'smg',
  SHOTGUN: 'shotgun'
};

export const GADGET_TYPES = {
  TASER: 'taser',
  NOISE_MAKER: 'noise_maker'
};

export const WEAPON_CONFIGS = {
  [WEAPON_TYPES.PISTOL]: {
    name: 'Silenced Pistol',
    magSize: 8,
    maxAmmo: 32,
    fireRate: 0.25, // semi-auto delay in s
    auto: false,
    noiseRadius: 40,
    damage: 35,
    pellets: 1,
    spread: 0.02,
    recoil: 1.5,
    screenShake: 0,
    canShootLights: true,
    disablesCameras: true,
    hudIcon: 'icon_pistol'
  },
  [WEAPON_TYPES.SMG]: {
    name: 'Suppressed SMG',
    magSize: 24,
    maxAmmo: 96,
    fireRate: 0.11, // ~9 rounds/sec
    auto: true,
    noiseRadius: 90,
    damage: 18,
    pellets: 1,
    spread: 0.08,
    recoil: 2.2,
    screenShake: 0.001,
    canShootLights: true,
    disablesCameras: true,
    hudIcon: 'icon_smg'
  },
  [WEAPON_TYPES.SHOTGUN]: {
    name: 'Heavy Shotgun',
    magSize: 5,
    maxAmmo: 20,
    fireRate: 1.1, // pump action delay
    auto: false,
    noiseRadius: 220, // loud! raises alarm if unsuppressed
    damage: 15,
    pellets: 6,
    spread: 0.22,
    recoil: 7.0,
    screenShake: 0.015,
    canShootLights: true,
    disablesCameras: true,
    hudIcon: 'icon_shotgun'
  }
};

export class WeaponManager {
  constructor(player) {
    this.player = player;
    this.scene = player.scene;

    // Inventory
    this.unlockedWeapons = [WEAPON_TYPES.PISTOL];
    this.currentWeaponIndex = 0;

    // Ammo state: { mag, reserve }
    this.ammo = {
      [WEAPON_TYPES.PISTOL]: { mag: 8, reserve: 24 },
      [WEAPON_TYPES.SMG]: { mag: 24, reserve: 48 },
      [WEAPON_TYPES.SHOTGUN]: { mag: 5, reserve: 10 }
    };

    // Gadgets state
    this.gadgets = {
      [GADGET_TYPES.TASER]: { charges: 3, max: 3 },
      [GADGET_TYPES.NOISE_MAKER]: { count: 2, max: 3 }
    };
    this.selectedGadget = GADGET_TYPES.TASER;

    // Timers
    this.fireTimer = 0;
    this.reloadTimer = 0;
    this.isReloading = false;
    this.sustainedSpreadBloom = 0;

    // Projectile & casing pools
    this.casings = [];
    this.noiseLures = [];
  }

  getCurrentWeaponKey() {
    return this.unlockedWeapons[this.currentWeaponIndex];
  }

  getCurrentConfig() {
    return WEAPON_CONFIGS[this.getCurrentWeaponKey()];
  }

  getHUDData() {
    const key = this.getCurrentWeaponKey();
    const ammoData = this.ammo[key] || { mag: 0, reserve: 0 };
    return {
      key,
      mag: ammoData.mag,
      reserve: ammoData.reserve,
      isReloading: this.isReloading,
      selectedGadget: this.selectedGadget,
      gadgetAmmo: {
        taser: this.gadgets[GADGET_TYPES.TASER]?.count ?? 0,
        noiseMaker: this.gadgets[GADGET_TYPES.NOISE_MAKER]?.count ?? 0
      }
    };
  }

  unlockWeapon(weaponKey) {
    if (!this.unlockedWeapons.includes(weaponKey)) {
      this.unlockedWeapons.push(weaponKey);
      this.currentWeaponIndex = this.unlockedWeapons.length - 1;
      if (this.scene.hud) {
        this.scene.hud.setObjective(`ACQUIRED: ${WEAPON_CONFIGS[weaponKey].name.toUpperCase()}`);
      }
    }
  }

  cycleWeapon(direction = 1) {
    if (this.unlockedWeapons.length <= 1) return;
    this.isReloading = false;
    this.reloadTimer = 0;
    this.currentWeaponIndex = (this.currentWeaponIndex + direction + this.unlockedWeapons.length) % this.unlockedWeapons.length;
    this.scene.audioSystem?.playTerminalBeep(750);
  }

  cycleGadget() {
    this.selectedGadget = this.selectedGadget === GADGET_TYPES.TASER ? GADGET_TYPES.NOISE_MAKER : GADGET_TYPES.TASER;
    this.scene.audioSystem?.playTerminalBeep(820);
  }

  reload() {
    const key = this.getCurrentWeaponKey();
    const cfg = this.getCurrentConfig();
    const data = this.ammo[key];

    if (this.isReloading || data.mag >= cfg.magSize || data.reserve <= 0) return;

    this.isReloading = true;
    this.reloadTimer = 1.2; // 1.2s reload time
    this.scene.audioSystem?.playFootstep(false); // magazine click
  }

  update(dt, input) {
    if (this.fireTimer > 0) this.fireTimer -= dt;

    // Spread recovery when not firing
    this.sustainedSpreadBloom = Math.max(0, this.sustainedSpreadBloom - dt * 0.4);

    // Reloading timer
    if (this.isReloading) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        this.isReloading = false;
        const key = this.getCurrentWeaponKey();
        const cfg = this.getCurrentConfig();
        const data = this.ammo[key];
        const needed = cfg.magSize - data.mag;
        const take = Math.min(needed, data.reserve);
        data.mag += take;
        data.reserve -= take;
        this.scene.audioSystem?.playFootstep(true); // magazine lock click
      }
    }

    // Weapon cycle input: Q / E
    if (input.cyclePrevJustPressed) this.cycleWeapon(-1);
    if (input.cycleNextJustPressed) this.cycleWeapon(1);
    if (input.reloadJustPressed) this.reload();

    // Gadget fire: [G] key
    if (input.gadgetJustPressed) {
      this.useGadget();
    }

    // Update bouncing shell casings
    for (let i = this.casings.length - 1; i >= 0; i--) {
      const c = this.casings[i];
      c.vy += 800 * dt; // gravity
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.rot += c.vRot * dt;
      c.life -= dt;
      c.sprite.setPosition(c.x, c.y);
      c.sprite.setRotation(c.rot);
      if (c.life <= 0) {
        c.sprite.destroy();
        this.casings.splice(i, 1);
      }
    }

    // Update active noise lures
    for (let i = this.noiseLures.length - 1; i >= 0; i--) {
      const lure = this.noiseLures[i];
      lure.update(dt);
      if (lure.isExpired) {
        lure.destroy();
        this.noiseLures.splice(i, 1);
      }
    }
  }

  // ==========================================
  // WEAPON FIRING & BALLISTICS
  // ==========================================
  fire(aimAngleRad, originX, originY) {
    const key = this.getCurrentWeaponKey();
    const cfg = this.getCurrentConfig();
    const data = this.ammo[key];

    if (this.isReloading) return false;

    if (data.mag <= 0) {
      this.reload();
      return false;
    }

    if (this.fireTimer > 0) return false;

    this.fireTimer = cfg.fireRate;
    data.mag--;

    // Recoil and muzzle bloom
    this.sustainedSpreadBloom = Math.min(0.25, this.sustainedSpreadBloom + 0.04);
    if (cfg.screenShake > 0) {
      this.scene.cameras.main.shake(120, cfg.screenShake);
    }

    // Sound and Noise Radius
    if (key === WEAPON_TYPES.SHOTGUN) {
      this.scene.audioSystem?.playAlarmSiren(); // heavy loud boom
      this.scene.stealth?.emitNoise(originX, originY, cfg.noiseRadius);
      // Loud shotgun blast raises alarm if guard is in hearing distance!
      this.scene.alarm?.raise('Unsuppressed shotgun blast heard');
    } else {
      this.scene.audioSystem?.playSuppressedShot();
      this.scene.stealth?.emitNoise(originX, originY, cfg.noiseRadius);
    }

    // Spawn bouncing brass casing
    this.spawnShellCasing(originX, originY, this.player.flipX ? 1 : -1, key);

    // Muzzle Flash Effect (light burst + sprite)
    this.createMuzzleFlash(originX, originY, aimAngleRad);

    // Fire pellets / bullets
    for (let p = 0; p < cfg.pellets; p++) {
      const pelletSpread = (Math.random() - 0.5) * (cfg.spread + this.sustainedSpreadBloom);
      const angle = aimAngleRad + pelletSpread;
      this.castBullet(originX, originY, angle, cfg);
    }

    // Auto reload if emptied
    if (data.mag === 0 && data.reserve > 0) {
      this.reload();
    }

    return true;
  }

  castBullet(startX, startY, angle, cfg) {
    const maxRange = cfg.name.includes('Shotgun') ? 220 : 420;
    const targetX = startX + Math.cos(angle) * maxRange;
    const targetY = startY + Math.sin(angle) * maxRange;

    // Bullet tracer line
    const tracerColor = cfg.name.includes('Shotgun') ? 0xf59e0b : 0x38bdf8;
    const line = this.scene.add.line(0, 0, startX, startY, targetX, targetY, tracerColor, 0.9)
      .setLineWidth(cfg.name.includes('Shotgun') ? 2 : 1.2)
      .setDepth(150);

    this.scene.tweens.add({
      targets: line,
      alpha: 0,
      duration: 80,
      onComplete: () => line.destroy()
    });

    // Check hit against lights, cameras, crates, and guards
    this.scene.handleComprehensiveBulletHit(startX, startY, targetX, targetY, cfg, angle);
  }

  spawnShellCasing(x, y, dir, type) {
    const isShotgun = type === WEAPON_TYPES.SHOTGUN;
    const color = isShotgun ? 0xef4444 : 0xfbbf24;
    const w = isShotgun ? 4 : 3;
    const h = isShotgun ? 2 : 1.5;

    const sprite = this.scene.add.rectangle(x, y, w, h, color).setDepth(95);
    this.casings.push({
      sprite,
      x,
      y,
      vx: dir * (40 + Math.random() * 40),
      vy: -(80 + Math.random() * 60),
      rot: 0,
      vRot: (Math.random() - 0.5) * 15,
      life: 0.8
    });
  }

  createMuzzleFlash(x, y, angle) {
    const flash = this.scene.add.circle(x, y, 6, 0xfde047, 0.95).setDepth(160);
    const flashGlow = this.scene.add.circle(x, y, 16, 0xf59e0b, 0.4).setDepth(159);

    this.scene.tweens.add({
      targets: [flash, flashGlow],
      alpha: 0,
      scale: 1.4,
      duration: 40,
      onComplete: () => {
        flash.destroy();
        flashGlow.destroy();
      }
    });
  }

  // ==========================================
  // GADGETS (Taser & Noise Maker)
  // ==========================================
  useGadget() {
    if (this.selectedGadget === GADGET_TYPES.TASER) {
      this.fireTaser();
    } else {
      this.throwNoiseMaker();
    }
  }

  fireTaser() {
    const data = this.gadgets[GADGET_TYPES.TASER];
    if (data.charges <= 0) {
      this.scene.audioSystem?.playTerminalBeep(300);
      return;
    }

    data.charges--;
    this.scene.audioSystem?.playLaserHum();

    const facing = this.player.flipX ? -1 : 1;
    const startX = this.player.x + facing * 12;
    const startY = this.player.y;
    const targetX = startX + facing * 60; // 60px range

    // Electric zap arc
    const zap = this.scene.add.line(0, 0, startX, startY, targetX, startY, 0x38bdf8, 1)
      .setLineWidth(2.5)
      .setDepth(160);

    this.scene.tweens.add({
      targets: zap,
      alpha: 0,
      duration: 150,
      onComplete: () => zap.destroy()
    });

    // Check guard in 60px taser path
    if (this.scene.guards) {
      const guard = this.scene.guards.getChildren().find(g => {
        if (g.isKnockedOut || g.isDead) return false;
        const dx = g.x - startX;
        const dy = Math.abs(g.y - startY);
        return (dx * facing > 0) && Math.abs(dx) <= 65 && dy <= 20;
      });

      if (guard) {
        guard.stun(6.0); // 6s non-lethal stun!
        if (this.scene.hud) {
          this.scene.hud.setObjective('GUARD STUNNED (NON-LETHAL)');
        }
      }
    }
  }

  throwNoiseMaker() {
    const data = this.gadgets[GADGET_TYPES.NOISE_MAKER];
    if (data.count <= 0) return;

    data.count--;
    const facing = this.player.flipX ? -1 : 1;
    const startX = this.player.x + facing * 14;
    const startY = this.player.y - 6;

    const lure = new NoiseMakerLure(this.scene, startX, startY, facing);
    this.noiseLures.push(lure);
  }
}

// Sticky noise maker lure entity
class NoiseMakerLure {
  constructor(scene, x, y, dir) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.vx = dir * 140;
    this.vy = -120;
    this.stuck = false;
    this.timer = 6.0; // beeps for 6s
    this.beepTimer = 0;
    this.isExpired = false;

    this.sprite = scene.add.circle(x, y, 3, 0x22d3ee).setDepth(90);
  }

  update(dt) {
    if (!this.stuck) {
      this.vy += 600 * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.sprite.setPosition(this.x, this.y);

      // Check collision with floor or wall
      const tile = this.scene.collisionGroup.getChildren().find(b => {
        return Phaser.Geom.Rectangle.Contains(b.getBounds(), this.x, this.y);
      });

      if (tile || this.y >= 720) {
        this.stuck = true;
      }
    } else {
      this.timer -= dt;
      this.beepTimer += dt;
      if (this.beepTimer >= 1.0) {
        this.beepTimer = 0;
        this.scene.audioSystem?.playTerminalBeep(1200);
        // Distract nearby guards to this lure's position!
        this.scene.stealth?.emitNoise(this.x, this.y, 110);
      }
      if (this.timer <= 0) {
        this.isExpired = true;
      }
    }
  }

  destroy() {
    this.sprite.destroy();
  }
}
