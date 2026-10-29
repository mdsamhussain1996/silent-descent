/**
 * AssetGenerator.js
 * Generates all 100% original 2D pixel-art textures and animations for Silent Descent
 * adhering to the 32-color industrial spy palette.
 */

export class AssetGenerator {
  static createAllTextures(scene) {
    const tm = scene.textures;

    this.createGhostSprites(scene);
    this.createGuardSprites(scene);
    this.createTileset(scene);
    this.createEntitiesTextures(scene);
    this.createHelicopterTexture(scene);
    this.createHUDTextures(scene);
    this.createThermalTextures(scene);
  }

  // Helper to create an offscreen canvas
  static makeCanvas(w, h) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    return { canvas, ctx };
  }

  // ==========================================
  // GHOST (VIKRAM RAO) SPRITESHEET (24x32 per frame)
  // ==========================================
  static createGhostSprites(scene) {
    const tm = scene.textures;
    // Total frames:
    // Row 0 (0-3): Idle (4 frames)
    // Row 1 (4-9): Walk (6 frames)
    // Row 2 (10-13): Sneak (4 frames)
    // Row 3 (14-19): Run (6 frames)
    // Row 4 (20-21): Jump (2 frames)
    // Row 5 (22-23): Fall (2 frames)
    // Row 6 (24-25): Ledge grab & hang (2 frames)
    // Row 7 (26-29): Ledge climb (4 frames)
    // Row 8 (30-33): Pipe hang & move (4 frames)
    // Row 9 (34-36): Rope slide (3 frames)
    // Row 10 (37-40): Ladder climb (4 frames)
    // Row 11 (41-42): Wall press (2 frames)
    // Row 12 (43-45): Shoot (3 frames)
    // Row 13 (46-49): Knockout takedown (4 frames)
    // Row 14 (50-51): Grab guard (2 frames)
    // Row 15 (52-55): Drag body (4 frames)
    // Row 16 (56-57): Zip line (2 frames)
    // Row 17 (58-61): Vent crawl (4 frames)
    // Row 18 (62-63): Hurt / Dead (2 frames)

    const frameW = 24;
    const frameH = 32;
    const cols = 6;
    const rows = 19;
    const { canvas, ctx } = this.makeCanvas(cols * frameW, rows * frameH);

    const drawFrame = (col, row, drawFn) => {
      ctx.save();
      ctx.translate(col * frameW, row * frameH);
      drawFn(ctx);
      ctx.restore();
    };

    // Color definitions
    const C = {
      suitDark: '#161a23',
      suitMid: '#242c3d',
      suitLight: '#39465e',
      boots: '#0c0f14',
      gloves: '#0c0f14',
      skin: '#c68660',
      skinShadow: '#8f573c',
      hair: '#111317',
      amberVisor: '#f59e0b',
      amberGlow: '#fbbf24',
      ropePack: '#524336',
      ropePackStrap: '#1e2430',
      gunMetal: '#475569',
      flashMuzzle: '#fde047'
    };

    // Base body drawing helper
    const drawBaseGhost = (ctx, opt = {}) => {
      const {
        legOffset = 0,
        crouch = 0,
        armPose = 'down', // 'down', 'aim', 'hang', 'climb', 'wall', 'vent'
        visorGlow = true,
        backToWall = false,
        headTilt = 0,
        carryingRope = true
      } = opt;

      const yOff = crouch;

      // Rope pack on back
      if (carryingRope && !backToWall) {
        ctx.fillStyle = C.ropePack;
        ctx.fillRect(5, 11 + yOff, 4, 9);
        ctx.fillStyle = C.ropePackStrap;
        ctx.fillRect(8, 11 + yOff, 2, 9);
      }

      // Torso / Suit
      ctx.fillStyle = C.suitDark;
      ctx.fillRect(9, 10 + yOff, 7, 10);
      ctx.fillStyle = C.suitMid;
      ctx.fillRect(10, 11 + yOff, 5, 8);
      ctx.fillStyle = C.suitLight;
      ctx.fillRect(11, 12 + yOff, 3, 4); // Tactical chest rig

      // Head
      ctx.fillStyle = C.skinShadow;
      ctx.fillRect(10, 5 + yOff + headTilt, 5, 6);
      ctx.fillStyle = C.skin;
      ctx.fillRect(11, 6 + yOff + headTilt, 4, 4);

      // Stubble & Hair
      ctx.fillStyle = C.hair;
      ctx.fillRect(10, 4 + yOff + headTilt, 6, 2); // hair top
      ctx.fillRect(9, 5 + yOff + headTilt, 2, 3); // hair back
      ctx.fillStyle = '#6b4632'; // stubble
      ctx.fillRect(13, 8 + yOff + headTilt, 2, 2);

      // Single amber monocular visor (right eye)
      if (backToWall) {
        ctx.fillStyle = C.amberGlow;
        ctx.fillRect(13, 6 + yOff + headTilt, 2, 2);
      } else {
        ctx.fillStyle = C.amberVisor;
        ctx.fillRect(14, 6 + yOff + headTilt, 2, 2);
        if (visorGlow) {
          ctx.fillStyle = C.amberGlow;
          ctx.fillRect(15, 6 + yOff + headTilt, 1, 2);
        }
      }

      // Legs / Boots
      if (armPose === 'vent') {
        // Vent crawling: horizontal
        ctx.fillStyle = C.suitDark;
        ctx.fillRect(3, 22, 16, 5);
        ctx.fillStyle = C.boots;
        ctx.fillRect(1, 23, 3, 4);
        return;
      }

      if (armPose === 'hang') {
        // Hanging legs dangling
        ctx.fillStyle = C.suitDark;
        ctx.fillRect(10, 20 + yOff, 3, 8);
        ctx.fillRect(12, 20 + yOff, 3, 7);
        ctx.fillStyle = C.boots;
        ctx.fillRect(10, 27 + yOff, 3, 3);
        ctx.fillRect(12, 26 + yOff, 3, 3);
        // Arms up
        ctx.fillStyle = C.suitDark;
        ctx.fillRect(10, 3, 3, 8);
        ctx.fillStyle = C.gloves;
        ctx.fillRect(10, 1, 3, 3);
        return;
      }

      // Standard legs
      const leg1 = Math.sin(legOffset) * 3;
      const leg2 = -leg1;

      ctx.fillStyle = C.suitDark;
      ctx.fillRect(9 + leg1, 19 + yOff, 3, 7 - crouch * 0.4);
      ctx.fillRect(13 + leg2, 19 + yOff, 3, 7 - crouch * 0.4);

      // Boots
      ctx.fillStyle = C.boots;
      ctx.fillRect(9 + leg1, 26 + yOff - (crouch > 4 ? 2 : 0), 4, 4);
      ctx.fillRect(13 + leg2, 26 + yOff - (crouch > 4 ? 2 : 0), 4, 4);

      // Arms based on pose
      if (armPose === 'aim') {
        ctx.fillStyle = C.suitMid;
        ctx.fillRect(13, 11 + yOff, 6, 3);
        ctx.fillStyle = C.gloves;
        ctx.fillRect(18, 11 + yOff, 3, 3);
        // Silenced pistol
        ctx.fillStyle = C.gunMetal;
        ctx.fillRect(19, 10 + yOff, 5, 2); // suppressor
        ctx.fillRect(19, 12 + yOff, 2, 2); // grip
      } else if (armPose === 'wall') {
        ctx.fillStyle = C.suitDark;
        ctx.fillRect(7, 12 + yOff, 3, 7);
        ctx.fillRect(15, 12 + yOff, 3, 7);
      } else {
        // Arm swinging/down
        const armSwing = Math.sin(legOffset + Math.PI) * 2;
        ctx.fillStyle = C.suitDark;
        ctx.fillRect(11 + armSwing, 11 + yOff, 3, 8);
        ctx.fillStyle = C.gloves;
        ctx.fillRect(11 + armSwing, 18 + yOff, 3, 3);
      }
    };

    // Generate each frame
    // 0: Idle (4 frames)
    for (let i = 0; i < 4; i++) {
      drawFrame(i, 0, (c) => drawBaseGhost(c, { crouch: i === 2 ? 1 : 0 }));
    }

    // 1: Walk (6 frames)
    for (let i = 0; i < 6; i++) {
      drawFrame(i, 1, (c) => drawBaseGhost(c, { legOffset: (i / 6) * Math.PI * 2 }));
    }

    // 2: Sneak (4 frames)
    for (let i = 0; i < 4; i++) {
      drawFrame(i, 2, (c) => drawBaseGhost(c, { crouch: 5, legOffset: (i / 4) * Math.PI * 2 }));
    }

    // 3: Run (6 frames)
    for (let i = 0; i < 6; i++) {
      drawFrame(i, 3, (c) => drawBaseGhost(c, { legOffset: (i / 6) * Math.PI * 2, crouch: 1, headTilt: 1 }));
    }

    // 4: Jump (2 frames)
    drawFrame(0, 4, (c) => drawBaseGhost(c, { crouch: -2, legOffset: 1 }));
    drawFrame(1, 4, (c) => drawBaseGhost(c, { crouch: -3, legOffset: 1.5 }));

    // 5: Fall (2 frames)
    drawFrame(0, 5, (c) => drawBaseGhost(c, { crouch: 0, legOffset: 0.5 }));
    drawFrame(1, 5, (c) => drawBaseGhost(c, { crouch: 1, legOffset: 0.8 }));

    // 6: Ledge grab & hang (2 frames)
    drawFrame(0, 6, (c) => drawBaseGhost(c, { armPose: 'hang', crouch: 2 }));
    drawFrame(1, 6, (c) => drawBaseGhost(c, { armPose: 'hang', crouch: 3 }));

    // 7: Ledge climb (4 frames)
    for (let i = 0; i < 4; i++) {
      drawFrame(i, 7, (c) => drawBaseGhost(c, { crouch: -i * 3, armPose: 'climb' }));
    }

    // 8: Pipe hang & move (4 frames)
    for (let i = 0; i < 4; i++) {
      drawFrame(i, 8, (c) => drawBaseGhost(c, { armPose: 'hang', legOffset: i }));
    }

    // 9: Rope slide (3 frames)
    for (let i = 0; i < 3; i++) {
      drawFrame(i, 9, (c) => {
        drawBaseGhost(c, { crouch: 1 });
        c.fillStyle = '#8b5cf6'; // rope guide
        c.fillRect(11, 0, 2, 32);
      });
    }

    // 10: Ladder climb (4 frames)
    for (let i = 0; i < 4; i++) {
      drawFrame(i, 10, (c) => drawBaseGhost(c, { backToWall: true, legOffset: i * 1.5 }));
    }

    // 11: Wall press (2 frames)
    drawFrame(0, 11, (c) => drawBaseGhost(c, { backToWall: true, armPose: 'wall' }));
    drawFrame(1, 11, (c) => drawBaseGhost(c, { backToWall: true, armPose: 'wall', crouch: 1 }));

    // 12: Shoot (3 frames)
    drawFrame(0, 12, (c) => drawBaseGhost(c, { armPose: 'aim' }));
    drawFrame(1, 12, (c) => {
      drawBaseGhost(c, { armPose: 'aim' });
      // muzzle spark
      c.fillStyle = C.flashMuzzle;
      c.fillRect(23, 9, 1, 3);
    });
    drawFrame(2, 12, (c) => drawBaseGhost(c, { armPose: 'aim' }));

    // 13: Knockout takedown (4 frames)
    for (let i = 0; i < 4; i++) {
      drawFrame(i, 13, (c) => {
        drawBaseGhost(c, { crouch: i === 2 ? 2 : 1 });
        // strike arm
        c.fillStyle = C.suitLight;
        c.fillRect(14 + i * 2, 10, 4, 3);
      });
    }

    // 14: Grab guard (2 frames)
    drawFrame(0, 14, (c) => drawBaseGhost(c, { armPose: 'aim', crouch: 1 }));
    drawFrame(1, 14, (c) => drawBaseGhost(c, { armPose: 'aim', crouch: 2 }));

    // 15: Drag body (4 frames)
    for (let i = 0; i < 4; i++) {
      drawFrame(i, 15, (c) => {
        drawBaseGhost(c, { crouch: 3, legOffset: -i });
        // dragged limbs
        c.fillStyle = '#365314';
        c.fillRect(3, 23, 7, 5);
      });
    }

    // 16: Zip line (2 frames)
    drawFrame(0, 16, (c) => {
      drawBaseGhost(c, { armPose: 'hang', crouch: 1 });
      c.fillStyle = '#cbd5e1'; // pulley handle
      c.fillRect(8, 0, 8, 3);
      c.fillStyle = '#94a3b8';
      c.fillRect(11, 3, 2, 4);
    });
    drawFrame(1, 16, (c) => {
      drawBaseGhost(c, { armPose: 'hang', crouch: 2 });
      c.fillStyle = '#cbd5e1';
      c.fillRect(8, 0, 8, 3);
      c.fillStyle = '#94a3b8';
      c.fillRect(11, 3, 2, 4);
    });

    // 17: Vent crawl (4 frames)
    for (let i = 0; i < 4; i++) {
      drawFrame(i, 17, (c) => {
        // low profile horizontal crawl
        c.fillStyle = C.suitDark;
        c.fillRect(4 + (i % 2), 22, 15, 6);
        c.fillStyle = C.skin;
        c.fillRect(18 + (i % 2), 22, 4, 4);
        c.fillStyle = C.amberGlow;
        c.fillRect(20 + (i % 2), 23, 2, 2);
      });
    }

    // 18: Hurt (0) & Death (1)
    drawFrame(0, 18, (c) => drawBaseGhost(c, { crouch: 2, headTilt: -2, visorGlow: false }));
    drawFrame(1, 18, (c) => {
      // fallen flat on back
      c.fillStyle = C.suitDark;
      c.fillRect(2, 27, 20, 5);
      c.fillStyle = C.boots;
      c.fillRect(0, 27, 3, 4);
      c.fillStyle = C.skin;
      c.fillRect(18, 25, 4, 4);
      c.fillStyle = C.amberVisor;
      c.fillRect(19, 26, 2, 1);
    });

    if (tm.exists('ghost')) tm.remove('ghost');
    scene.textures.addSpriteSheet('ghost', canvas, {
      frameWidth: frameW,
      frameHeight: frameH
    });
  }

  // ==========================================
  // GUARDS SPRITESHEET (Kestrel Yard & Office)
  // ==========================================
  static createGuardSprites(scene) {
    const tm = scene.textures;
    const frameW = 24;
    const frameH = 32;
    const cols = 6;
    const rows = 8;
    const { canvas, ctx } = this.makeCanvas(cols * frameW, rows * frameH);

    const drawFrame = (col, row, drawFn) => {
      ctx.save();
      ctx.translate(col * frameW, row * frameH);
      drawFn(ctx);
      ctx.restore();
    };

    const drawGuard = (ctx, opt = {}) => {
      const {
        isOffice = false,
        legOffset = 0,
        alert = false,
        knocked = false,
        sleeping = false,
        flashlight = true
      } = opt;

      if (knocked) {
        ctx.fillStyle = isOffice ? '#1e3a5f' : '#2d4512';
        ctx.fillRect(2, 26, 19, 6);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 26, 3, 5);
        ctx.fillStyle = '#d97706';
        ctx.fillRect(17, 24, 4, 4);
        return;
      }

      if (sleeping) {
        // Sitting slumped on chair/desk
        ctx.fillStyle = '#334155';
        ctx.fillRect(8, 14, 8, 12);
        ctx.fillStyle = '#1e3a5f';
        ctx.fillRect(8, 12, 7, 7);
        ctx.fillStyle = '#d97706';
        ctx.fillRect(9, 8, 5, 4);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(8, 6, 7, 3); // cap
        return;
      }

      const leg1 = Math.sin(legOffset) * 2.5;
      const leg2 = -leg1;

      // Legs
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(9 + leg1, 20, 3, 7);
      ctx.fillRect(13 + leg2, 20, 3, 7);
      ctx.fillRect(8 + leg1, 27, 4, 4);
      ctx.fillRect(12 + leg2, 27, 4, 4);

      // Torso
      if (isOffice) {
        ctx.fillStyle = '#1e3a5f'; // Security guard navy shirt
        ctx.fillRect(8, 10, 8, 10);
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(9, 11, 2, 3); // badge
      } else {
        ctx.fillStyle = '#365314'; // Kestrel olive waterproof poncho
        ctx.fillRect(7, 10, 10, 11);
        ctx.fillStyle = '#4d7c0f';
        ctx.fillRect(9, 11, 6, 8);
      }

      // Head
      ctx.fillStyle = '#d97706';
      ctx.fillRect(9, 5, 6, 5);

      // Headwear (helmet or cap)
      ctx.fillStyle = '#1e293b';
      if (isOffice) {
        ctx.fillRect(8, 4, 8, 3);
        ctx.fillRect(12, 6, 4, 1); // visor cap
      } else {
        ctx.fillRect(8, 3, 8, 4); // tactical combat helmet
        ctx.fillStyle = '#334155';
        ctx.fillRect(8, 7, 2, 2); // chinstrap
      }

      // Flashlight / Gun
      if (alert) {
        ctx.fillStyle = '#475569';
        ctx.fillRect(13, 11, 9, 3); // rifle pointed
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(17, 13, 2, 4);
      } else if (flashlight) {
        ctx.fillStyle = '#475569';
        ctx.fillRect(14, 13, 5, 3);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(18, 13, 2, 3); // lens
      }
    };

    // Row 0: Kestrel Guard Idle (4 frames)
    for (let i = 0; i < 4; i++) {
      drawFrame(i, 0, (c) => drawGuard(c, { legOffset: 0 }));
    }
    // Row 1: Kestrel Guard Patrol Walk (6 frames)
    for (let i = 0; i < 6; i++) {
      drawFrame(i, 1, (c) => drawGuard(c, { legOffset: (i / 6) * Math.PI * 2 }));
    }
    // Row 2: Kestrel Guard Alert/Shoot (4 frames)
    for (let i = 0; i < 4; i++) {
      drawFrame(i, 2, (c) => drawGuard(c, { alert: true, legOffset: i % 2 }));
    }
    // Row 3: Office Guard Idle / Walk (4 frames)
    for (let i = 0; i < 4; i++) {
      drawFrame(i, 3, (c) => drawGuard(c, { isOffice: true, legOffset: (i / 4) * Math.PI * 2 }));
    }
    // Row 4: Office Guard Sleeping at desk (2 frames)
    drawFrame(0, 4, (c) => drawGuard(c, { isOffice: true, sleeping: true }));
    drawFrame(1, 4, (c) => drawGuard(c, { isOffice: true, sleeping: true }));
    // Row 5: Knocked out guard (1 frame)
    drawFrame(0, 5, (c) => drawGuard(c, { knocked: true }));
    drawFrame(1, 5, (c) => drawGuard(c, { isOffice: true, knocked: true }));

    if (tm.exists('guard')) tm.remove('guard');
    scene.textures.addSpriteSheet('guard', canvas, {
      frameWidth: frameW,
      frameHeight: frameH
    });
  }

  // ==========================================
  // TILESET (16x16 tiles in a grid)
  // ==========================================
  static createTileset(scene) {
    const tm = scene.textures;
    const ts = 16;
    const cols = 16;
    const rows = 16;
    const { canvas, ctx } = this.makeCanvas(cols * ts, rows * ts);

    const drawTile = (idx, fn) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      ctx.save();
      ctx.translate(col * ts, row * ts);
      fn(ctx);
      ctx.restore();
    };

    // 0: Empty
    // 1: Dark industrial metal block
    drawTile(1, (c) => {
      c.fillStyle = '#141a24';
      c.fillRect(0, 0, ts, ts);
      c.fillStyle = '#222b3a';
      c.fillRect(1, 1, ts - 2, ts - 2);
      c.fillStyle = '#2d3748';
      c.fillRect(1, 1, ts - 2, 1);
      c.fillRect(1, 1, 1, ts - 2);
      // rivets
      c.fillStyle = '#4a5568';
      c.fillRect(2, 2, 2, 2);
      c.fillRect(12, 2, 2, 2);
      c.fillRect(2, 12, 2, 2);
      c.fillRect(12, 12, 2, 2);
    });

    // 2: Platform with hazard yellow/black stripes
    drawTile(2, (c) => {
      c.fillStyle = '#2b3445';
      c.fillRect(0, 0, ts, ts);
      c.fillStyle = '#1a202c';
      c.fillRect(0, 0, ts, 4);
      // stripes
      for (let x = 0; x < ts; x += 4) {
        c.fillStyle = '#d97706';
        c.fillRect(x, 1, 2, 3);
        c.fillStyle = '#111827';
        c.fillRect(x + 2, 1, 2, 3);
      }
      c.fillStyle = '#475569';
      c.fillRect(0, 4, ts, 1);
    });

    // 3: Metal catwalk (one-way platform)
    drawTile(3, (c) => {
      c.fillStyle = '#475569';
      c.fillRect(0, 0, ts, 3);
      c.fillStyle = '#94a3b8';
      c.fillRect(0, 0, ts, 1);
      // grate perforations
      c.fillStyle = '#1e293b';
      for (let x = 1; x < ts; x += 3) {
        c.fillRect(x, 1, 2, 2);
      }
    });

    // 4: Ladder
    drawTile(4, (c) => {
      c.fillStyle = '#475569';
      c.fillRect(2, 0, 2, ts); // left upright
      c.fillRect(12, 0, 2, ts); // right upright
      c.fillStyle = '#94a3b8';
      c.fillRect(2, 4, 12, 2); // rungs
      c.fillRect(2, 11, 12, 2);
    });

    // 5: Overhead pipe (for pipe hang & hand-over-hand)
    drawTile(5, (c) => {
      c.fillStyle = '#334155';
      c.fillRect(0, 2, ts, 6);
      c.fillStyle = '#64748b';
      c.fillRect(0, 3, ts, 2); // metallic highlight
      c.fillStyle = '#1e293b';
      c.fillRect(0, 7, ts, 1);
      // collar / coupling
      c.fillStyle = '#94a3b8';
      c.fillRect(6, 1, 4, 8);
    });

    // 6: Ledge grab edge corner (left)
    drawTile(6, (c) => {
      c.fillStyle = '#2b3445';
      c.fillRect(0, 0, ts, ts);
      c.fillStyle = '#38bdf8'; // subtle tactical highlight
      c.fillRect(0, 0, 3, 3);
      c.fillStyle = '#d97706';
      c.fillRect(3, 0, ts - 3, 3);
    });

    // 7: Ledge grab edge corner (right)
    drawTile(7, (c) => {
      c.fillStyle = '#2b3445';
      c.fillRect(0, 0, ts, ts);
      c.fillStyle = '#38bdf8';
      c.fillRect(ts - 3, 0, 3, 3);
      c.fillStyle = '#d97706';
      c.fillRect(0, 0, ts - 3, 3);
    });

    // 8: Wet harbour pier (concrete / wet reflection)
    drawTile(8, (c) => {
      c.fillStyle = '#1e293b';
      c.fillRect(0, 0, ts, ts);
      c.fillStyle = '#334155';
      c.fillRect(0, 0, ts, 2);
      // puddles
      c.fillStyle = '#38bdf8';
      c.fillRect(3, 1, 4, 1);
      c.fillRect(10, 1, 3, 1);
    });

    // 9: Water surface (deadly pit, respawns player)
    drawTile(9, (c) => {
      c.fillStyle = '#082f49';
      c.fillRect(0, 0, ts, ts);
      c.fillStyle = '#0ea5e9';
      c.fillRect(0, 2, ts, 2);
      c.fillStyle = '#38bdf8';
      c.fillRect(2, 3, 4, 1);
      c.fillRect(9, 2, 5, 1);
    });

    // 10: Office floor tiles (beige-grey carpet)
    drawTile(10, (c) => {
      c.fillStyle = '#252e3d';
      c.fillRect(0, 0, ts, ts);
      c.fillStyle = '#374357';
      c.fillRect(0, 0, ts, 2);
      c.fillStyle = '#1c2430';
      c.fillRect(0, 0, 1, ts);
    });

    // 11: Office wall / framed blueprint
    drawTile(11, (c) => {
      c.fillStyle = '#1a222f';
      c.fillRect(0, 0, ts, ts);
      // framed technical picture
      c.fillStyle = '#0f172a';
      c.fillRect(2, 2, 12, 10);
      c.fillStyle = '#0284c7';
      c.fillRect(3, 3, 10, 8);
      c.fillStyle = '#bae6fd';
      c.fillRect(4, 5, 8, 1);
      c.fillRect(6, 7, 5, 1);
    });

    // 12: Vent duct tile (tight crawlspace)
    drawTile(12, (c) => {
      c.fillStyle = '#090d14';
      c.fillRect(0, 0, ts, ts);
      c.fillStyle = '#1e293b';
      c.fillRect(0, 0, ts, 2);
      c.fillRect(0, ts - 2, ts, 2);
      // vent ribs
      c.fillStyle = '#334155';
      for (let x = 2; x < ts; x += 4) {
        c.fillRect(x, 2, 1, ts - 4);
      }
    });

    // 13: Rooftop gravel / brick wall
    drawTile(13, (c) => {
      c.fillStyle = '#18202c';
      c.fillRect(0, 0, ts, ts);
      c.fillStyle = '#0f141d';
      c.fillRect(0, 4, ts, 1);
      c.fillRect(0, 9, ts, 1);
      c.fillRect(0, 14, ts, 1);
      c.fillRect(7, 0, 1, 4);
      c.fillRect(3, 5, 1, 4);
      c.fillRect(11, 10, 1, 4);
    });

    // 14: Dark Shadow Zone tile (for visually cueing shadows)
    drawTile(14, (c) => {
      c.fillStyle = '#030508';
      c.fillRect(0, 0, ts, ts);
    });

    // 15: Railing
    drawTile(15, (c) => {
      c.fillStyle = '#64748b';
      c.fillRect(0, 3, ts, 2); // rail
      c.fillRect(2, 5, 2, 11); // upright post
      c.fillRect(12, 5, 2, 11);
    });

    if (tm.exists('tiles')) tm.remove('tiles');
    scene.textures.addSpriteSheet('tiles', canvas, {
      frameWidth: ts,
      frameHeight: ts
    });
  }

  // ==========================================
  // ENTITIES (Camera, Laser, Lamps, Terminal, Door, Vents, Zipline)
  // ==========================================
  static createEntitiesTextures(scene) {
    const tm = scene.textures;

    // 1. Security Camera (24x16)
    {
      const { canvas, ctx } = this.makeCanvas(24, 16);
      // Mount bracket
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 0, 6, 8);
      // Camera body
      ctx.fillStyle = '#64748b';
      ctx.fillRect(4, 4, 14, 8);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(4, 4, 14, 2);
      // Red blinking lens
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(16, 6, 4, 4);
      ctx.fillStyle = '#fca5a5';
      ctx.fillRect(17, 7, 2, 2);

      if (tm.exists('camera')) tm.remove('camera');
      scene.textures.addCanvas('camera', canvas);
    }

    // 2. Rooftop Sodium Lamp Post (16x32)
    {
      const { canvas, ctx } = this.makeCanvas(16, 32);
      // Post
      ctx.fillStyle = '#334155';
      ctx.fillRect(7, 6, 2, 26);
      // Lamp head
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(2, 2, 12, 4);
      // Bulb
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(4, 6, 8, 3);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(6, 6, 4, 2);

      if (tm.exists('lamp_post')) tm.remove('lamp_post');
      scene.textures.addCanvas('lamp_post', canvas);
    }

    // 3. Popped / Broken Lamp (16x32)
    {
      const { canvas, ctx } = this.makeCanvas(16, 32);
      ctx.fillStyle = '#334155';
      ctx.fillRect(7, 6, 2, 26);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(2, 2, 12, 4);
      // Broken shattered bulb
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(5, 6, 6, 2);

      if (tm.exists('lamp_post_broken')) tm.remove('lamp_post_broken');
      scene.textures.addCanvas('lamp_post_broken', canvas);
    }

    // 4. Security Terminal (24x24)
    {
      const { canvas, ctx } = this.makeCanvas(24, 24);
      // Desk/stand
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(2, 14, 20, 10);
      // Monitor bezel
      ctx.fillStyle = '#334155';
      ctx.fillRect(4, 2, 16, 12);
      // Green/cyan glowing CRT screen
      ctx.fillStyle = '#0e7490';
      ctx.fillRect(6, 4, 12, 8);
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(7, 5, 8, 2);
      ctx.fillRect(7, 8, 5, 2);

      if (tm.exists('terminal')) tm.remove('terminal');
      scene.textures.addCanvas('terminal', canvas);
    }

    // 5. Door & Hand-Scanner (16x32)
    {
      const { canvas, ctx } = this.makeCanvas(16, 32);
      // Steel door frame
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 16, 32);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(2, 2, 12, 28);
      // Scanner biometric hand pad
      ctx.fillStyle = '#ef4444'; // locked red
      ctx.fillRect(10, 14, 3, 4);
      ctx.fillStyle = '#f87171';
      ctx.fillRect(11, 15, 1, 2);

      if (tm.exists('door_locked')) tm.remove('door_locked');
      scene.textures.addCanvas('door_locked', canvas);

      // Unlocked version
      const { canvas: cOpen, ctx: ctxOpen } = this.makeCanvas(16, 32);
      ctxOpen.fillStyle = '#0f172a';
      ctxOpen.fillRect(0, 0, 16, 32);
      ctxOpen.fillStyle = '#065f46';
      ctxOpen.fillRect(2, 2, 4, 28); // slide open
      ctxOpen.fillStyle = '#22c55e'; // unlocked green
      ctxOpen.fillRect(10, 14, 3, 4);

      if (tm.exists('door_unlocked')) tm.remove('door_unlocked');
      scene.textures.addCanvas('door_unlocked', canvas);
    }

    // 6. Floor Vent (16x16)
    {
      const { canvas, ctx } = this.makeCanvas(16, 16);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 10, 16, 6);
      // Vent grate slats
      ctx.fillStyle = '#475569';
      for (let x = 2; x < 14; x += 3) {
        ctx.fillRect(x, 11, 1, 4);
      }

      if (tm.exists('floor_vent')) tm.remove('floor_vent');
      scene.textures.addCanvas('floor_vent', canvas);
    }

    // 7. Zip Line Pulley Handle & Cable Anchor (16x16)
    {
      const { canvas, ctx } = this.makeCanvas(16, 16);
      // Pulley wheel
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(8, 4, 3, 0, Math.PI * 2);
      ctx.fill();
      // Handle bar
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(3, 8, 10, 3);
      ctx.fillStyle = '#334155';
      ctx.fillRect(7, 5, 2, 4);

      if (tm.exists('zipline_handle')) tm.remove('zipline_handle');
      scene.textures.addCanvas('zipline_handle', canvas);
    }

    // 8. Laser Emitter (8x16)
    {
      const { canvas, ctx } = this.makeCanvas(8, 16);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 3, 6, 10);
      ctx.fillStyle = '#ff0033';
      ctx.fillRect(6, 6, 2, 4);

      if (tm.exists('laser_emitter')) tm.remove('laser_emitter');
      scene.textures.addCanvas('laser_emitter', canvas);
    }

    // 9. Collectibles: Data Drive & Intel Folder & Ammo
    {
      // Data Drive (16x16)
      const { canvas, ctx } = this.makeCanvas(16, 16);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(3, 4, 10, 9);
      ctx.fillStyle = '#06b6d4'; // Cyan military chip
      ctx.fillRect(5, 5, 6, 7);
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(6, 6, 4, 2);

      if (tm.exists('data_drive')) tm.remove('data_drive');
      scene.textures.addCanvas('data_drive', canvas);

      // Intel Folder (16x16)
      const { canvas: cF, ctx: ctxF } = this.makeCanvas(16, 16);
      ctxF.fillStyle = '#d97706'; // Manila dossier
      ctxF.fillRect(2, 3, 12, 10);
      ctxF.fillStyle = '#b45309';
      ctxF.fillRect(4, 2, 4, 2); // tab
      ctxF.fillStyle = '#ef4444'; // TOP SECRET stamp
      ctxF.fillRect(5, 7, 6, 2);

      if (tm.exists('intel_file')) tm.remove('intel_file');
      scene.textures.addCanvas('intel_file', cF);

      // Ammo Clip (16x16)
      const { canvas: cA, ctx: ctxA } = this.makeCanvas(16, 16);
      ctxA.fillStyle = '#334155';
      ctxA.fillRect(4, 4, 8, 9);
      ctxA.fillStyle = '#f59e0b';
      ctxA.fillRect(5, 3, 2, 3);
      ctxA.fillRect(8, 3, 2, 3);

      if (tm.exists('ammo_clip')) tm.remove('ammo_clip');
      scene.textures.addCanvas('ammo_clip', cA);
    }

    // 10. Water Tank (32x48) & AC Unit (32x24) & Crates
    {
      const { canvas, ctx } = this.makeCanvas(32, 48);
      // Legs
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(4, 30, 3, 18);
      ctx.fillRect(25, 30, 3, 18);
      ctx.fillRect(4, 40, 24, 2);
      // Tank cylinder
      ctx.fillStyle = '#475569';
      ctx.fillRect(2, 6, 28, 24);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(2, 6, 28, 4);
      // Roof conical top
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(2, 6);
      ctx.lineTo(30, 6);
      ctx.closePath();
      ctx.fill();

      if (tm.exists('water_tank')) tm.remove('water_tank');
      scene.textures.addCanvas('water_tank', canvas);

      // AC Unit (32x24)
      const { canvas: cAC, ctx: ctxAC } = this.makeCanvas(32, 24);
      ctxAC.fillStyle = '#1e293b';
      ctxAC.fillRect(0, 0, 32, 24);
      ctxAC.fillStyle = '#334155';
      ctxAC.fillRect(2, 2, 28, 20);
      // Fan grill
      ctxAC.strokeStyle = '#64748b';
      ctxAC.lineWidth = 1;
      ctxAC.strokeRect(6, 5, 12, 12);
      ctxAC.fillStyle = '#0f172a';
      ctxAC.fillRect(21, 5, 6, 12); // vent slats

      if (tm.exists('ac_unit')) tm.remove('ac_unit');
      scene.textures.addCanvas('ac_unit', cAC);

      // Crate (24x24)
      const { canvas: cCrate, ctx: ctxCrate } = this.makeCanvas(24, 24);
      ctxCrate.fillStyle = '#1e293b';
      ctxCrate.fillRect(0, 0, 24, 24);
      ctxCrate.fillStyle = '#334155';
      ctxCrate.fillRect(2, 2, 20, 20);
      // Cross braces
      ctxCrate.strokeStyle = '#475569';
      ctxCrate.lineWidth = 2;
      ctxCrate.beginPath();
      ctxCrate.moveTo(3, 3);
      ctxCrate.lineTo(21, 21);
      ctxCrate.moveTo(21, 3);
      ctxCrate.lineTo(3, 21);
      ctxCrate.stroke();

      if (tm.exists('crate')) tm.remove('crate');
      scene.textures.addCanvas('crate', cCrate);
    }
  }

  // ==========================================
  // HELICOPTER (NIGHTFALL "Kite" Stealth Helicopter)
  // ==========================================
  static createHelicopterTexture(scene) {
    const tm = scene.textures;
    const { canvas, ctx } = this.makeCanvas(120, 48);

    // Fuselage (stealth angular lines)
    ctx.fillStyle = '#0b0f17';
    ctx.beginPath();
    ctx.moveTo(110, 24); // nose
    ctx.lineTo(85, 12);
    ctx.lineTo(35, 12);
    ctx.lineTo(5, 20); // tail boom
    ctx.lineTo(0, 16); // tail fin
    ctx.lineTo(4, 26);
    ctx.lineTo(35, 28);
    ctx.lineTo(75, 30);
    ctx.closePath();
    ctx.fill();

    // Cockpit canopy (tinted dark gold/amber)
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.moveTo(98, 22);
    ctx.lineTo(85, 14);
    ctx.lineTo(75, 14);
    ctx.lineTo(80, 22);
    ctx.closePath();
    ctx.fill();

    // Side open cargo door for rappel / rescue
    ctx.fillStyle = '#161e2e';
    ctx.fillRect(45, 15, 22, 14);

    // Landing skids
    ctx.fillStyle = '#475569';
    ctx.fillRect(35, 38, 55, 3); // skid bar
    ctx.fillRect(45, 29, 3, 9); // strut front
    ctx.fillRect(75, 29, 3, 9); // strut back

    // Main rotor hub & blur line
    ctx.fillStyle = '#334155';
    ctx.fillRect(58, 8, 5, 5);
    ctx.fillStyle = 'rgba(203, 213, 225, 0.4)';
    ctx.fillRect(10, 6, 100, 2); // rotor disk blur

    if (tm.exists('helicopter')) tm.remove('helicopter');
    scene.textures.addCanvas('helicopter', canvas);
  }

  // ==========================================
  // HUD ASSETS (Original Bottom Bar, Meters, Portraits)
  // ==========================================
  static createHUDTextures(scene) {
    const tm = scene.textures;

    // 1. Vikram "Ghost" Rao Portrait (28x28)
    {
      const { canvas, ctx } = this.makeCanvas(28, 28);
      ctx.fillStyle = '#0b0f17';
      ctx.fillRect(0, 0, 28, 28);
      // Face
      ctx.fillStyle = '#a16207';
      ctx.fillRect(6, 6, 16, 18);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(8, 8, 12, 12);
      // Dark short hair
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(5, 3, 18, 6);
      ctx.fillRect(4, 7, 3, 9);
      // Stubble
      ctx.fillStyle = '#78350f';
      ctx.fillRect(8, 16, 12, 4);
      // Amber single visor monocular (right eye)
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(14, 9, 7, 5);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(16, 10, 3, 3);
      // Tactical collar
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(4, 21, 20, 7);

      if (tm.exists('portrait_ghost')) tm.remove('portrait_ghost');
      scene.textures.addCanvas('portrait_ghost', canvas);
    }

    // 2. Control HQ Portrait (28x28)
    {
      const { canvas, ctx } = this.makeCanvas(28, 28);
      ctx.fillStyle = '#082f49';
      ctx.fillRect(0, 0, 28, 28);
      // Operator face
      ctx.fillStyle = '#f5d0b0';
      ctx.fillRect(7, 7, 14, 15);
      // Dark hair
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(6, 4, 16, 5);
      ctx.fillRect(5, 7, 4, 12);
      // Tactical headset / boom mic
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(5, 9, 3, 7); // earpiece
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(7, 15, 8, 2); // mic boom
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(15, 14, 3, 3);

      if (tm.exists('portrait_control')) tm.remove('portrait_control');
      scene.textures.addCanvas('portrait_control', canvas);
    }

    // 3. HUD Bottom Bar Background (480x32)
    {
      const { canvas, ctx } = this.makeCanvas(480, 32);
      ctx.fillStyle = '#070b12';
      ctx.fillRect(0, 0, 480, 32);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 480, 1); // top bezel line
      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(0, 1, 480, 1);

      // Section borders
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(130, 4, 1, 24);
      ctx.fillRect(320, 4, 1, 24);

      if (tm.exists('hud_bar')) tm.remove('hud_bar');
      scene.textures.addCanvas('hud_bar', canvas);
    }

    // 4. Silenced Pistol Icon (24x16)
    {
      const { canvas, ctx } = this.makeCanvas(24, 16);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(2, 4, 8, 4); // slide
      ctx.fillStyle = '#64748b';
      ctx.fillRect(10, 4, 12, 3); // silencer tube
      ctx.fillStyle = '#334155';
      ctx.fillRect(4, 8, 4, 6); // grip
      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(9, 8, 2, 2); // trigger guard

      if (tm.exists('icon_pistol')) tm.remove('icon_pistol');
      scene.textures.addCanvas('icon_pistol', canvas);
    }

    // 5. Thermal Visor Icon (20x16)
    {
      const { canvas, ctx } = this.makeCanvas(20, 16);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(1, 2, 18, 12);
      ctx.fillStyle = '#f59e0b'; // Amber visor screen
      ctx.fillRect(3, 4, 14, 8);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(6, 6, 8, 4);

      if (tm.exists('icon_thermal')) tm.remove('icon_thermal');
      scene.textures.addCanvas('icon_thermal', canvas);
    }
  }

  // ==========================================
  // LIGHTING & THERMAL OVERLAYS
  // ==========================================
  static createThermalTextures(scene) {
    const tm = scene.textures;

    // Radial Light Glow Texture (128x128 soft circular gradient)
    {
      const { canvas, ctx } = this.makeCanvas(128, 128);
      const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 60);
      grad.addColorStop(0, 'rgba(255, 235, 170, 0.85)');
      grad.addColorStop(0.3, 'rgba(245, 158, 11, 0.45)');
      grad.addColorStop(0.7, 'rgba(180, 83, 9, 0.15)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);

      if (tm.exists('light_radial')) tm.remove('light_radial');
      scene.textures.addCanvas('light_radial', canvas);
    }

    // Flashlight Vision Cone (160x120 arc/triangle)
    {
      const { canvas, ctx } = this.makeCanvas(160, 120);
      const grad = ctx.createRadialGradient(10, 60, 5, 10, 60, 140);
      grad.addColorStop(0, 'rgba(254, 240, 138, 0.85)');
      grad.addColorStop(0.5, 'rgba(254, 240, 138, 0.35)');
      grad.addColorStop(1, 'rgba(254, 240, 138, 0)');

      ctx.beginPath();
      ctx.moveTo(10, 60);
      ctx.arc(10, 60, 140, -Math.PI / 6, Math.PI / 6);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      if (tm.exists('light_cone')) tm.remove('light_cone');
      scene.textures.addCanvas('light_cone', canvas);
    }

    // Camera Red Cone (140x100)
    {
      const { canvas, ctx } = this.makeCanvas(140, 100);
      const grad = ctx.createRadialGradient(10, 50, 5, 10, 50, 120);
      grad.addColorStop(0, 'rgba(239, 68, 68, 0.75)');
      grad.addColorStop(0.6, 'rgba(220, 38, 38, 0.25)');
      grad.addColorStop(1, 'rgba(185, 28, 28, 0)');

      ctx.beginPath();
      ctx.moveTo(10, 50);
      ctx.arc(10, 50, 120, -Math.PI / 7, Math.PI / 7);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      if (tm.exists('camera_cone')) tm.remove('camera_cone');
      scene.textures.addCanvas('camera_cone', canvas);
    }

    // Searchlight Blue-White Cone (240x160)
    {
      const { canvas, ctx } = this.makeCanvas(240, 160);
      const grad = ctx.createRadialGradient(10, 80, 10, 10, 80, 220);
      grad.addColorStop(0, 'rgba(224, 242, 254, 0.85)');
      grad.addColorStop(0.5, 'rgba(56, 189, 248, 0.3)');
      grad.addColorStop(1, 'rgba(14, 165, 233, 0)');

      ctx.beginPath();
      ctx.moveTo(10, 80);
      ctx.arc(10, 80, 220, -Math.PI / 5, Math.PI / 5);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      if (tm.exists('searchlight_cone')) tm.remove('searchlight_cone');
      scene.textures.addCanvas('searchlight_cone', canvas);
    }
  }
}
