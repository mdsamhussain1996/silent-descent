/**
 * Stealth.js
 * Core stealth mechanics: light levels, visibility calculation, and noise propagation.
 */

export class StealthSystem {
  constructor(scene) {
    this.scene = scene;
    this.playerVisibility = 0; // 0 to 100%
    this.noiseRings = []; // { x, y, radius, maxRadius, life, maxLife }
    this.shadowZones = []; // [{ x, y, width, height }]
  }

  addShadowZone(x, y, width, height) {
    this.shadowZones.push({ x, y, width, height });
  }

  emitNoise(x, y, radius = 80) {
    this.noiseRings.push({
      x,
      y,
      radius: 0,
      maxRadius: radius,
      life: 0.4,
      maxLife: 0.4
    });

    // Alert guards within radius
    if (this.scene.guards) {
      this.scene.guards.getChildren().forEach(guard => {
        if (!guard.isKnockedOut && !guard.isDead) {
          const dist = Phaser.Math.Distance.Between(x, y, guard.x, guard.y);
          if (dist <= radius) {
            guard.hearNoise(x, y);
          }
        }
      });
    }
  }

  update(time, delta) {
    const dt = delta / 1000;

    // Update noise rings
    for (let i = this.noiseRings.length - 1; i >= 0; i--) {
      const ring = this.noiseRings[i];
      ring.life -= dt;
      ring.radius = ring.maxRadius * (1 - ring.life / ring.maxLife);
      if (ring.life <= 0) {
        this.noiseRings.splice(i, 1);
      }
    }

    // Calculate player visibility
    const player = this.scene.player;
    if (!player) return;

    let baseLight = 15; // Ambient night base light

    // Check if player is inside defined shadow zones (e.g. behind water tank, inside vents, under dock)
    let inShadow = false;
    for (const sz of this.shadowZones) {
      if (player.x >= sz.x && player.x <= sz.x + sz.width &&
          player.y >= sz.y && player.y <= sz.y + sz.height) {
        inShadow = true;
        baseLight = 5;
        break;
      }
    }

    // Check dynamic lights (lamps, searchlights)
    if (!inShadow && this.scene.lightsList) {
      for (const light of this.scene.lightsList) {
        if (!light.isActive) continue;
        const dist = Phaser.Math.Distance.Between(player.x, player.y, light.x, light.y);
        if (dist < light.radius) {
          const intensity = (1 - dist / light.radius) * light.intensity;
          baseLight = Math.max(baseLight, intensity * 100);
        }
      }
    }

    // Check guard flashlights
    if (!inShadow && this.scene.guards) {
      this.scene.guards.getChildren().forEach(guard => {
        if (!guard.isKnockedOut && guard.flashlightActive) {
          const facing = guard.flipX ? -1 : 1;
          const dx = player.x - guard.x;
          const dy = player.y - guard.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130 && (dx * facing > 0) && Math.abs(dy) < 36) {
            baseLight = Math.max(baseLight, 95);
          }
        }
      });
    }

    // Apply posture multiplier:
    // sneak: x0.6, wall-press: x0.2, hanging: x0.3, standing: x1.0
    let postureMultiplier = 1.0;
    if (player.state === 'wall_press') {
      postureMultiplier = 0.2;
    } else if (player.state === 'pipe_hang' || player.state === 'ledge_grab') {
      postureMultiplier = 0.3;
    } else if (player.state === 'sneak' || player.state === 'vent_crawl') {
      postureMultiplier = 0.6;
    }

    this.playerVisibility = Math.round(Math.min(100, Math.max(0, baseLight * postureMultiplier)));
  }

  renderDebugNoise(graphics) {
    graphics.clear();
    for (const ring of this.noiseRings) {
      graphics.lineStyle(1.5, 0x38bdf8, ring.life / ring.maxLife);
      graphics.strokeCircle(ring.x, ring.y, ring.radius);
    }
  }
}
