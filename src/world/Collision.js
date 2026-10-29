// src/world/Collision.js
// High-performance 2D AABB, raycast & platform system on the gameplay plane (Z = 0)

export class CollisionSystem {
  constructor() {
    this.solids = [];       // { x, y, w, h, isOneWay }
    this.ledges = [];       // { x, y, facing: 'left' | 'right' }
    this.pipes = [];        // { x1, x2, y }
    this.ladders = [];      // { x, y, w, h }
    this.vents = [];        // { x, y, w, h }
    this.shadowZones = [];  // { x, y, w, h, factor }
  }

  clear() {
    this.solids = [];
    this.ledges = [];
    this.pipes = [];
    this.ladders = [];
    this.vents = [];
    this.shadowZones = [];
  }

  addSolid(x, y, w, h, isOneWay = false) {
    this.solids.push({ x, y, w, h, isOneWay });
  }

  addLedge(x, y, facing) {
    this.ledges.push({ x, y, facing });
  }

  addPipe(x1, x2, y) {
    this.pipes.push({ x1: Math.min(x1, x2), x2: Math.max(x1, x2), y });
  }

  addLadder(x, y, w, h) {
    this.ladders.push({ x, y, w, h });
  }

  addVent(x, y, w, h) {
    this.vents.push({ x, y, w, h });
  }

  addShadowZone(x, y, w, h, factor = 0.25) {
    this.shadowZones.push({ x, y, w, h, factor });
  }

  // Check AABB overlap with solids
  checkOverlap(box) {
    for (let i = 0; i < this.solids.length; i++) {
      const s = this.solids[i];
      if (s.isOneWay) continue;
      if (
        box.x < s.x + s.w &&
        box.x + box.w > s.x &&
        box.y < s.y + s.h &&
        box.y + box.h > s.y
      ) {
        return s;
      }
    }
    return null;
  }

  // Move an AABB with sweeping resolution
  moveBox(box, vx, vy, dropDown = false) {
    const res = { x: box.x, y: box.y, vx, vy, onGround: false, onCeiling: false, hitWall: false };

    // 1. Move Horizontal
    res.x += vx;
    for (let i = 0; i < this.solids.length; i++) {
      const s = this.solids[i];
      if (s.isOneWay) continue;

      if (
        res.x < s.x + s.w &&
        res.x + box.w > s.x &&
        res.y < s.y + s.h &&
        res.y + box.h > s.y
      ) {
        if (vx > 0) {
          res.x = s.x - box.w;
          res.hitWall = true;
          res.vx = 0;
        } else if (vx < 0) {
          res.x = s.x + s.w;
          res.hitWall = true;
          res.vx = 0;
        }
      }
    }

    // 2. Move Vertical
    const prevY = res.y;
    res.y += vy;
    for (let i = 0; i < this.solids.length; i++) {
      const s = this.solids[i];

      // One-way platform logic
      if (s.isOneWay) {
        if (dropDown || vy > 0) continue; // Moving up or pressing drop ignores one-way
        // Only land if previously above the top of the platform
        const platformTop = s.y + s.h;
        if (prevY >= platformTop && res.y <= platformTop) {
          if (res.x + box.w > s.x && res.x < s.x + s.w) {
            res.y = platformTop;
            res.vy = 0;
            res.onGround = true;
          }
        }
        continue;
      }

      // Solid collision
      if (
        res.x < s.x + s.w &&
        res.x + box.w > s.x &&
        res.y < s.y + s.h &&
        res.y + box.h > s.y
      ) {
        if (vy < 0) {
          // Falling down onto floor
          res.y = s.y + s.h;
          res.onGround = true;
          res.vy = 0;
        } else if (vy > 0) {
          // Jumping up into ceiling
          res.y = s.y - box.h;
          res.onCeiling = true;
          res.vy = 0;
        }
      }
    }

    return res;
  }

  // Fast 2D Raycast against solids
  raycast(x1, y1, x2, y2, ignoreOneWay = true) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    let closestFraction = 1.0;
    let hitNormal = { x: 0, y: 0 };
    let hasHit = false;

    for (let i = 0; i < this.solids.length; i++) {
      const s = this.solids[i];
      if (s.isOneWay && ignoreOneWay) continue;

      // Slab test
      let tNear = -Infinity;
      let tFar = Infinity;
      let nx = 0, ny = 0;

      // X slab
      if (dx !== 0) {
        let t1 = (s.x - x1) / dx;
        let t2 = (s.x + s.w - x1) / dx;
        let sign = -Math.sign(dx);
        if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; sign = -sign; }
        if (t1 > tNear) { tNear = t1; nx = sign; ny = 0; }
        if (t2 < tFar) tFar = t2;
        if (tNear > tFar || tFar < 0) continue;
      } else if (x1 < s.x || x1 > s.x + s.w) {
        continue;
      }

      // Y slab
      if (dy !== 0) {
        let t1 = (s.y - y1) / dy;
        let t2 = (s.y + s.h - y1) / dy;
        let sign = -Math.sign(dy);
        if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; sign = -sign; }
        if (t1 > tNear) { tNear = t1; nx = 0; ny = sign; }
        if (t2 < tFar) tFar = t2;
        if (tNear > tFar || tFar < 0) continue;
      } else if (y1 < s.y || y1 > s.y + s.h) {
        continue;
      }

      if (tNear >= 0 && tNear < closestFraction) {
        closestFraction = tNear;
        hitNormal = { x: nx, y: ny };
        hasHit = true;
      }
    }

    return {
      hit: hasHit,
      fraction: closestFraction,
      point: {
        x: x1 + dx * closestFraction,
        y: y1 + dy * closestFraction
      },
      normal: hitNormal
    };
  }

  // Check if position is inside shadow zone
  getShadowFactor(x, y) {
    let factor = 1.0;
    for (let i = 0; i < this.shadowZones.length; i++) {
      const z = this.shadowZones[i];
      if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) {
        factor = Math.min(factor, z.factor);
      }
    }
    return factor;
  }

  // Get nearest ledge for auto-grabbing
  findLedgeNear(x, y, radius = 0.6) {
    for (let i = 0; i < this.ledges.length; i++) {
      const l = this.ledges[i];
      const dist = Math.hypot(l.x - x, l.y - y);
      if (dist <= radius) {
        return l;
      }
    }
    return null;
  }

  // Find pipe directly above player
  findPipeAbove(x, y, reachHeight = 2.2) {
    for (let i = 0; i < this.pipes.length; i++) {
      const p = this.pipes[i];
      if (x >= p.x1 && x <= p.x2 && p.y >= y && p.y <= y + reachHeight) {
        return p;
      }
    }
    return null;
  }

  // Check if in ladder
  findLadderAt(x, y) {
    for (let i = 0; i < this.ladders.length; i++) {
      const l = this.ladders[i];
      if (x >= l.x && x <= l.x + l.w && y >= l.y && y <= l.y + l.h) {
        return l;
      }
    }
    return null;
  }

  // Check if in vent duct
  findVentAt(x, y) {
    for (let i = 0; i < this.vents.length; i++) {
      const v = this.vents[i];
      if (x >= v.x && x <= v.x + v.w && y >= v.y && y <= v.y + v.h) {
        return v;
      }
    }
    return null;
  }
}

export const collision = new CollisionSystem();
