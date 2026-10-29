/**
 * AssetGenerator.js — NO TRACE: LEVEL 1 "IRON TIDE"
 * High-fidelity, 48-64 color master palette procedural pixel art generator.
 * Creates rich, textured tiles, multi-frame 32-40px characters, weapons, props, and UI.
 */

export class AssetGenerator {
  static createAllTextures(scene) {
    const tm = scene.textures;

    this.createGhostSprites(scene);
    this.createGuardSprites(scene);
    this.createMeeraSprites(scene);
    this.createTileset(scene);
    this.createEntitiesTextures(scene);
    this.createWeaponsAndGadgetsTextures(scene);
    this.createHelicopterTexture(scene);
    this.createHUDTextures(scene);
    this.createThermalTextures(scene);
  }

  static makeCanvas(w, h) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    return { canvas, ctx };
  }

  // =========================================================================
  // GHOST (VIKRAM RAO) — ~36px Tall High-Detail Pixel Art (Frame: 28x40)
  // =========================================================================
  static createGhostSprites(scene) {
    const tm = scene.textures;
    const frameW = 28;
    const frameH = 40;
    const cols = 8;
    const rows = 14;
    const { canvas, ctx } = this.makeCanvas(cols * frameW, rows * frameH);

    const drawFrame = (col, row, drawFn) => {
      ctx.save();
      ctx.translate(col * frameW, row * frameH);
      drawFn(ctx);
      ctx.restore();
    };

    // 48-64 Master Palette Shades
    const PAL = {
      outline: '#05070c',
      suitDark: '#121721',
      suitMid: '#1e2636',
      suitLight: '#2f3d54',
      suitHighlight: '#475b7a',
      webbing: '#0a0d14',
      webbingBuckle: '#64748b',
      skinDark: '#78350f',
      skinMid: '#b45309',
      skinLight: '#d97706',
      hair: '#090b0e',
      amberVisorDark: '#b45309',
      amberVisorMid: '#f59e0b',
      amberVisorGlow: '#fef08a',
      boots: '#090c10',
      gloves: '#0a0d12',
      ropeDark: '#3f2e1e',
      ropeMid: '#634b35',
      ropeLight: '#8a6b4f',
      gunMetal: '#334155',
      gunLight: '#64748b'
    };

    const drawGhostBase = (ctx, opt = {}) => {
      const {
        crouch = 0,
        legOffset = 0,
        armPose = 'down', // 'down', 'aim_straight', 'aim_up', 'aim_down', 'hang', 'climb', 'wall', 'vent', 'cover'
        inCover = false,
        backToWall = false,
        visorGlow = true,
        weaponType = 'pistol'
      } = opt;

      const yOff = crouch;

      // Dark tactical contour outline behind torso & head
      ctx.fillStyle = PAL.outline;
      ctx.fillRect(9, 4 + yOff, 11, 23);

      // Rope Pack on back
      if (!backToWall && armPose !== 'vent') {
        ctx.fillStyle = PAL.outline;
        ctx.fillRect(4, 11 + yOff, 7, 13);
        ctx.fillStyle = PAL.ropeDark;
        ctx.fillRect(5, 12 + yOff, 5, 11);
        ctx.fillStyle = PAL.ropeMid;
        ctx.fillRect(6, 13 + yOff, 3, 9);
        // Coiled rope highlights
        ctx.fillStyle = PAL.ropeLight;
        ctx.fillRect(6, 14 + yOff, 3, 2);
        ctx.fillRect(6, 18 + yOff, 3, 2);
      }

      // Torso — Tactical stealth suit with Kevlar paneling
      ctx.fillStyle = PAL.suitDark;
      ctx.fillRect(10, 12 + yOff, 9, 13);
      ctx.fillStyle = PAL.suitMid;
      ctx.fillRect(11, 13 + yOff, 7, 11);
      ctx.fillStyle = PAL.suitLight;
      ctx.fillRect(12, 14 + yOff, 5, 6);
      ctx.fillStyle = PAL.suitHighlight;
      ctx.fillRect(13, 15 + yOff, 2, 3); // chest specular glint

      // Tactical Webbing Harness & Buckle
      ctx.fillStyle = PAL.webbing;
      ctx.fillRect(11, 17 + yOff, 7, 2); // belt
      ctx.fillRect(14, 13 + yOff, 2, 7); // cross strap
      ctx.fillStyle = PAL.webbingBuckle;
      ctx.fillRect(14, 17 + yOff, 2, 2); // buckle

      // Pistol Holster on hip
      ctx.fillStyle = PAL.gunMetal;
      ctx.fillRect(9, 21 + yOff, 2, 4);

      // Head & Face
      ctx.fillStyle = PAL.skinDark;
      ctx.fillRect(11, 5 + yOff, 7, 7);
      ctx.fillStyle = PAL.skinMid;
      ctx.fillRect(12, 6 + yOff, 6, 6);
      ctx.fillStyle = PAL.skinLight;
      ctx.fillRect(13, 7 + yOff, 4, 4);

      // Short Hair & Stubble
      ctx.fillStyle = PAL.hair;
      ctx.fillRect(11, 4 + yOff, 8, 3); // hair top
      ctx.fillRect(10, 5 + yOff, 2, 5); // hair back
      ctx.fillStyle = PAL.skinDark;
      ctx.fillRect(14, 10 + yOff, 3, 2); // 5 o'clock stubble

      // Single Glowing Amber Monocular Visor (Right Eye)
      ctx.fillStyle = PAL.amberVisorDark;
      ctx.fillRect(15, 7 + yOff, 3, 3);
      ctx.fillStyle = PAL.amberVisorMid;
      ctx.fillRect(16, 7 + yOff, 2, 2);
      if (visorGlow) {
        ctx.fillStyle = PAL.amberVisorGlow;
        ctx.fillRect(17, 8 + yOff, 1, 1); // bright center LED
      }

      // Legs & Footwear
      if (armPose === 'vent') {
        // Horizontal crawl
        ctx.fillStyle = PAL.suitDark;
        ctx.fillRect(4, 26, 20, 7);
        ctx.fillStyle = PAL.boots;
        ctx.fillRect(1, 27, 4, 5);
        return;
      }

      if (armPose === 'hang') {
        // Hanging from pipe
        ctx.fillStyle = PAL.suitDark;
        ctx.fillRect(11, 25, 4, 9);
        ctx.fillRect(14, 24, 4, 9);
        ctx.fillStyle = PAL.boots;
        ctx.fillRect(11, 33, 4, 5);
        ctx.fillRect(14, 32, 4, 5);
        // Arms straight up gripping overhead
        ctx.fillStyle = PAL.suitMid;
        ctx.fillRect(11, 1, 3, 11);
        ctx.fillRect(15, 1, 3, 11);
        ctx.fillStyle = PAL.gloves;
        ctx.fillRect(10, 0, 4, 3);
        ctx.fillRect(15, 0, 4, 3);
        return;
      }

      if (inCover) {
        // Kneeling low in cover behind barricade
        ctx.fillStyle = PAL.suitDark;
        ctx.fillRect(9, 23, 10, 8);
        ctx.fillStyle = PAL.boots;
        ctx.fillRect(8, 29, 6, 4);
        return;
      }

      // Articulated walking / running legs
      const leg1 = Math.sin(legOffset) * 4;
      const leg2 = -leg1;

      ctx.fillStyle = PAL.suitDark;
      ctx.fillRect(10 + leg1, 24 + yOff, 4, 9 - crouch * 0.4);
      ctx.fillRect(15 + leg2, 24 + yOff, 4, 9 - crouch * 0.4);
      ctx.fillStyle = PAL.suitMid;
      ctx.fillRect(11 + leg1, 25 + yOff, 2, 5);
      ctx.fillRect(16 + leg2, 25 + yOff, 2, 5);

      // Heavy combat boots with grip tread
      ctx.fillStyle = PAL.boots;
      ctx.fillRect(10 + leg1, 32 + yOff - (crouch > 4 ? 2 : 0), 5, 5);
      ctx.fillRect(15 + leg2, 32 + yOff - (crouch > 4 ? 2 : 0), 5, 5);

      // Arms & Weapon based on pose
      if (armPose === 'aim_straight') {
        ctx.fillStyle = PAL.suitMid;
        ctx.fillRect(15, 13 + yOff, 8, 3);
        ctx.fillStyle = PAL.gloves;
        ctx.fillRect(21, 13 + yOff, 3, 3);
        // Weapon
        ctx.fillStyle = PAL.gunMetal;
        ctx.fillRect(22, 12 + yOff, 6, 3);
        ctx.fillStyle = PAL.gunLight;
        ctx.fillRect(24, 13 + yOff, 4, 1); // barrel highlight
      } else if (armPose === 'aim_up') {
        ctx.fillStyle = PAL.suitMid;
        ctx.fillRect(14, 11 + yOff, 6, 3);
        ctx.fillStyle = PAL.gloves;
        ctx.fillRect(18, 8 + yOff, 3, 3);
        ctx.fillStyle = PAL.gunMetal;
        ctx.fillRect(19, 5 + yOff, 5, 4);
      } else if (armPose === 'aim_down') {
        ctx.fillStyle = PAL.suitMid;
        ctx.fillRect(14, 15 + yOff, 6, 3);
        ctx.fillStyle = PAL.gloves;
        ctx.fillRect(18, 17 + yOff, 3, 3);
        ctx.fillStyle = PAL.gunMetal;
        ctx.fillRect(19, 19 + yOff, 5, 4);
      } else if (armPose === 'wall') {
        ctx.fillStyle = PAL.suitDark;
        ctx.fillRect(8, 14 + yOff, 3, 9);
        ctx.fillRect(18, 14 + yOff, 3, 9);
      } else {
        const armSwing = Math.sin(legOffset + Math.PI) * 2.5;
        ctx.fillStyle = PAL.suitMid;
        ctx.fillRect(12 + armSwing, 14 + yOff, 3, 9);
        ctx.fillStyle = PAL.gloves;
        ctx.fillRect(12 + armSwing, 22 + yOff, 3, 3);
      }
    };

    // Row 0: Idle (8 frames of breathing)
    for (let i = 0; i < 8; i++) {
      drawFrame(i, 0, (c) => drawGhostBase(c, { crouch: i === 3 || i === 4 ? 1 : 0 }));
    }

    // Row 1: Tactical Walk (8 frames)
    for (let i = 0; i < 8; i++) {
      drawFrame(i, 1, (c) => drawGhostBase(c, { legOffset: (i / 8) * Math.PI * 2 }));
    }

    // Row 2: Low Sneak Glide (8 frames)
    for (let i = 0; i < 8; i++) {
      drawFrame(i, 2, (c) => drawGhostBase(c, { crouch: 6, legOffset: (i / 8) * Math.PI * 2 }));
    }

    // Row 3: Sprint Run (8 frames)
    for (let i = 0; i < 8; i++) {
      drawFrame(i, 3, (c) => drawGhostBase(c, { legOffset: (i / 8) * Math.PI * 2, crouch: 1 }));
    }

    // Row 4: Jump (4 frames) & Fall (4 frames)
    for (let i = 0; i < 4; i++) {
      drawFrame(i, 4, (c) => drawGhostBase(c, { crouch: -2 - i, legOffset: 1 }));
      drawFrame(i + 4, 4, (c) => drawGhostBase(c, { crouch: i, legOffset: 0.8 }));
    }

    // Row 5: Ledge Grab (4) & Climb (4)
    for (let i = 0; i < 4; i++) {
      drawFrame(i, 5, (c) => drawGhostBase(c, { armPose: 'hang', crouch: 2 + i * 0.5 }));
      drawFrame(i + 4, 5, (c) => drawGhostBase(c, { crouch: -i * 6, armPose: 'climb' }));
    }

    // Row 6: Pipe Hang & Shimmy (8 frames)
    for (let i = 0; i < 8; i++) {
      drawFrame(i, 6, (c) => drawGhostBase(c, { armPose: 'hang', legOffset: (i / 8) * Math.PI * 2 }));
    }

    // Row 7: Aiming (Straight 0-2, Up 3-4, Down 5-6, Cover 7)
    drawFrame(0, 7, (c) => drawGhostBase(c, { armPose: 'aim_straight' }));
    drawFrame(1, 7, (c) => drawGhostBase(c, { armPose: 'aim_straight' }));
    drawFrame(2, 7, (c) => drawGhostBase(c, { armPose: 'aim_straight' }));
    drawFrame(3, 7, (c) => drawGhostBase(c, { armPose: 'aim_up' }));
    drawFrame(4, 7, (c) => drawGhostBase(c, { armPose: 'aim_up' }));
    drawFrame(5, 7, (c) => drawGhostBase(c, { armPose: 'aim_down' }));
    drawFrame(6, 7, (c) => drawGhostBase(c, { armPose: 'aim_down' }));
    drawFrame(7, 7, (c) => drawGhostBase(c, { inCover: true, crouch: 6 }));

    // Row 8: Wall Press (4) & Reload (4)
    for (let i = 0; i < 4; i++) {
      drawFrame(i, 8, (c) => drawGhostBase(c, { backToWall: true, armPose: 'wall' }));
      drawFrame(i + 4, 8, (c) => {
        drawGhostBase(c, { crouch: 2 });
        // magazine slap in
        c.fillStyle = PAL.gunLight;
        c.fillRect(16, 17 - i * 2, 2, 4);
      });
    }

    // Row 9: Takedown Elbow Smash (4 frames) & Grab Guard (4 frames)
    for (let i = 0; i < 4; i++) {
      drawFrame(i, 9, (c) => {
        drawGhostBase(c, { crouch: 2 });
        c.fillStyle = PAL.suitHighlight;
        c.fillRect(16 + i * 2, 12, 5, 4); // elbow strike
      });
      drawFrame(i + 4, 9, (c) => drawGhostBase(c, { armPose: 'aim_straight', crouch: 2 }));
    }

    // Row 10: Vent Crawl (8 frames)
    for (let i = 0; i < 8; i++) {
      drawFrame(i, 10, (c) => drawGhostBase(c, { armPose: 'vent', legOffset: i }));
    }

    // Row 11: Ladder Climb (8 frames)
    for (let i = 0; i < 8; i++) {
      drawFrame(i, 11, (c) => drawGhostBase(c, { backToWall: true, legOffset: (i / 8) * Math.PI * 2 }));
    }

    // Row 12: Zip Line (4) & Rope Slide (4)
    for (let i = 0; i < 4; i++) {
      drawFrame(i, 12, (c) => {
        drawGhostBase(c, { armPose: 'hang', crouch: 2 });
        c.fillStyle = '#94a3b8';
        c.fillRect(12, 0, 8, 3); // pulley
      });
      drawFrame(i + 4, 12, (c) => {
        drawGhostBase(c, { crouch: 2 });
        c.fillStyle = PAL.ropeLight;
        c.fillRect(13, 0, 2, 40); // cord
      });
    }

    // Row 13: Hurt (0-2) & Dead (3-7)
    for (let i = 0; i < 3; i++) {
      drawFrame(i, 13, (c) => drawGhostBase(c, { crouch: 3, visorGlow: false }));
    }
    for (let i = 3; i < 8; i++) {
      drawFrame(i, 13, (c) => {
        // fallen on back
        c.fillStyle = PAL.suitDark;
        c.fillRect(2, 34, 24, 6);
        c.fillStyle = PAL.boots;
        c.fillRect(0, 34, 4, 5);
        c.fillStyle = PAL.skinMid;
        c.fillRect(20, 31, 5, 5);
      });
    }

    if (tm.exists('ghost')) tm.remove('ghost');
    scene.textures.addSpriteSheet('ghost', canvas, {
      frameWidth: frameW,
      frameHeight: frameH
    });
  }

  // =========================================================================
  // 3 ENEMY GUARD TYPES — Dock, Office, Heavy (Frame: 28x40)
  // =========================================================================
  static createGuardSprites(scene) {
    const tm = scene.textures;
    const frameW = 28;
    const frameH = 40;
    const cols = 8;
    const rows = 9;
    const { canvas, ctx } = this.makeCanvas(cols * frameW, rows * frameH);

    const drawFrame = (col, row, drawFn) => {
      ctx.save();
      ctx.translate(col * frameW, row * frameH);
      drawFn(ctx);
      ctx.restore();
    };

    const drawGuardBase = (ctx, opt = {}) => {
      const {
        type = 'dock', // 'dock', 'office', 'heavy'
        legOffset = 0,
        alert = false,
        aiming = false,
        knocked = false,
        sleeping = false
      } = opt;

      if (knocked) {
        ctx.fillStyle = type === 'heavy' ? '#1f2937' : (type === 'office' ? '#1e3a5f' : '#273812');
        ctx.fillRect(2, 32, 23, 7);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 32, 4, 6);
        ctx.fillStyle = '#d97706';
        ctx.fillRect(20, 29, 5, 5);
        return;
      }

      const leg1 = Math.sin(legOffset) * 3;
      const leg2 = -leg1;

      // Legs
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(10 + leg1, 24, 4, 10);
      ctx.fillRect(15 + leg2, 24, 4, 10);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(9 + leg1, 33, 5, 6);
      ctx.fillRect(14 + leg2, 33, 5, 6);

      // Torso based on Type
      if (type === 'heavy') {
        // Heavy Guard: Ballistic Vest, armor plating
        ctx.fillStyle = '#111827';
        ctx.fillRect(7, 10, 14, 15);
        ctx.fillStyle = '#374151';
        ctx.fillRect(8, 11, 12, 13);
        ctx.fillStyle = '#4b5563';
        ctx.fillRect(9, 12, 10, 6); // ceramic chest plate
      } else if (type === 'office') {
        // Office Guard: Navy security shirt, tie, badge
        ctx.fillStyle = '#1e3a5f';
        ctx.fillRect(9, 11, 10, 14);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(13, 11, 2, 8); // black tie
        ctx.fillStyle = '#facc15';
        ctx.fillRect(11, 13, 2, 3); // gold security badge
      } else {
        // Dock Guard: Olive waterproof poncho with hood
        ctx.fillStyle = '#273910';
        ctx.fillRect(7, 11, 14, 14);
        ctx.fillStyle = '#3f5d1b';
        ctx.fillRect(8, 12, 12, 12);
        ctx.fillStyle = '#557c25';
        ctx.fillRect(10, 13, 8, 8); // poncho front
      }

      // Head & Helmet
      ctx.fillStyle = '#b45309';
      ctx.fillRect(11, 6, 7, 6);

      if (type === 'heavy') {
        // Riot Helmet with dark face shield
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(9, 3, 11, 7);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(14, 6, 6, 3); // tinted visor
      } else if (type === 'office') {
        // Security Visor Cap
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(9, 4, 10, 4);
        ctx.fillRect(14, 6, 5, 2);
      } else {
        // Combat Helmet with strap
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(9, 3, 11, 5);
        ctx.fillStyle = '#475569';
        ctx.fillRect(9, 8, 2, 3); // chinstrap
      }

      // Weapons (SMG for Dock, Pistol for Office, Shotgun for Heavy)
      if (alert || aiming) {
        ctx.fillStyle = '#334155';
        const wLen = type === 'heavy' ? 14 : (type === 'office' ? 7 : 11);
        ctx.fillRect(16, 14, wLen, 4);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(16, 14, wLen, 2);
      } else {
        // Weapon / Flashlight lowered
        ctx.fillStyle = '#334155';
        ctx.fillRect(16, 17, 7, 3);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(21, 17, 2, 3); // flashlight lens
      }
    };

    // Rows 0-1: Dock Guard (Idle, Patrol, Alert)
    for (let i = 0; i < 8; i++) {
      drawFrame(i, 0, (c) => drawGuardBase(c, { type: 'dock', legOffset: (i / 8) * Math.PI * 2 }));
      drawFrame(i, 1, (c) => drawGuardBase(c, { type: 'dock', alert: true, legOffset: (i / 8) * Math.PI * 2 }));
    }

    // Rows 2-3: Office Guard (Idle, Patrol, Alert, Sleep)
    for (let i = 0; i < 8; i++) {
      drawFrame(i, 2, (c) => drawGuardBase(c, { type: 'office', legOffset: (i / 8) * Math.PI * 2 }));
      drawFrame(i, 3, (c) => drawGuardBase(c, { type: 'office', alert: true, legOffset: (i / 8) * Math.PI * 2 }));
    }

    // Rows 4-5: Heavy Guard (Idle, Patrol, Alert with Shotgun)
    for (let i = 0; i < 8; i++) {
      drawFrame(i, 4, (c) => drawGuardBase(c, { type: 'heavy', legOffset: (i / 8) * Math.PI * 2 }));
      drawFrame(i, 5, (c) => drawGuardBase(c, { type: 'heavy', alert: true, legOffset: (i / 8) * Math.PI * 2 }));
    }

    // Row 6: Knocked Out States
    drawFrame(0, 6, (c) => drawGuardBase(c, { type: 'dock', knocked: true }));
    drawFrame(1, 6, (c) => drawGuardBase(c, { type: 'office', knocked: true }));
    drawFrame(2, 6, (c) => drawGuardBase(c, { type: 'heavy', knocked: true }));

    if (tm.exists('guard')) tm.remove('guard');
    scene.textures.addSpriteSheet('guard', canvas, {
      frameWidth: frameW,
      frameHeight: frameH
    });
  }

  // =========================================================================
  // DR. MEERA SEN — Inside Informant Escort Character (Frame: 28x44)
  // =========================================================================
  static createMeeraSprites(scene) {
    const tm = scene.textures;
    const w = 28;
    const h = 44;

    const drawMeera = (c, opt = {}) => {
      const { crouch = false, walkFrame = 0 } = opt;
      const yOff = crouch ? 12 : 0;

      // Dark contour outline
      c.fillStyle = '#060a12';
      c.fillRect(9, 4 + yOff, 10, 24);

      // Lab Coat Torso
      c.fillStyle = '#e2e8f0';
      c.fillRect(9, 13 + yOff, 10, 15);
      c.fillStyle = '#cbd5e1';
      c.fillRect(10, 14 + yOff, 2, 13);
      c.fillRect(17, 14 + yOff, 2, 13);
      // Dark turtleneck underneath
      c.fillStyle = '#0f172a';
      c.fillRect(12, 11 + yOff, 4, 5);

      // Security ID badge
      c.fillStyle = '#38bdf8';
      c.fillRect(11, 16 + yOff, 2, 3);

      // Head & Face (Indian complexion)
      c.fillStyle = '#92400e';
      c.fillRect(10, 5 + yOff, 8, 7);
      c.fillStyle = '#b45309';
      c.fillRect(11, 6 + yOff, 6, 5);

      // Glasses
      c.strokeStyle = '#38bdf8';
      c.lineWidth = 1;
      c.strokeRect(12, 7 + yOff, 2, 2);
      c.strokeRect(15, 7 + yOff, 2, 2);

      // Hair bun
      c.fillStyle = '#090b0e';
      c.fillRect(9, 3 + yOff, 10, 3);
      c.fillRect(12, 1 + yOff, 4, 3); // hair bun top

      // Legs / Slacks
      if (crouch) {
        c.fillStyle = '#0f172a';
        c.fillRect(8, 28, 12, 8);
        c.fillStyle = '#090c10';
        c.fillRect(7, 36, 6, 4);
      } else {
        const legShift = Math.sin(walkFrame) * 4;
        c.fillStyle = '#0f172a';
        c.fillRect(10, 28, 3, 12 + legShift);
        c.fillRect(15, 28, 3, 12 - legShift);
        c.fillStyle = '#090c10';
        c.fillRect(9, 40 + legShift, 4, 3);
        c.fillRect(15, 40 - legShift, 4, 3);
      }
    };

    // Idle
    {
      const { canvas, ctx } = this.makeCanvas(w, h);
      drawMeera(ctx, { crouch: false });
      if (tm.exists('meera_idle')) tm.remove('meera_idle');
      scene.textures.addCanvas('meera_idle', canvas);
    }
    // Walk
    {
      const { canvas, ctx } = this.makeCanvas(w, h);
      drawMeera(ctx, { crouch: false, walkFrame: 1 });
      if (tm.exists('meera_walk')) tm.remove('meera_walk');
      scene.textures.addCanvas('meera_walk', canvas);
    }
    // Crouch
    {
      const { canvas, ctx } = this.makeCanvas(w, h);
      drawMeera(ctx, { crouch: true });
      if (tm.exists('meera_crouch')) tm.remove('meera_crouch');
      scene.textures.addCanvas('meera_crouch', canvas);
    }
  }

  // =========================================================================
  // RICH TEXTURED 16x16 TILESET (No flat colors — bevels, rivets, rust, grain)
  // =========================================================================
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

    // Tile 1: Industrial Dark Steel Block (Rivet borders, grime & beveled edge)
    drawTile(1, (c) => {
      c.fillStyle = '#0c1017';
      c.fillRect(0, 0, ts, ts);
      c.fillStyle = '#1c2432';
      c.fillRect(1, 1, ts - 2, ts - 2);
      c.fillStyle = '#2d3b50';
      c.fillRect(1, 1, ts - 2, 1);
      c.fillRect(1, 1, 1, ts - 2);
      c.fillStyle = '#0a0e14';
      c.fillRect(1, ts - 2, ts - 2, 1);
      c.fillRect(ts - 2, 1, 1, ts - 2);
      // Steel rivets
      c.fillStyle = '#64748b';
      c.fillRect(2, 2, 2, 2);
      c.fillRect(12, 2, 2, 2);
      c.fillRect(2, 12, 2, 2);
      c.fillRect(12, 12, 2, 2);
    });

    // Tile 2: Hazard Yellow/Black Stripe Edge (Chipped paint & scuffs)
    drawTile(2, (c) => {
      c.fillStyle = '#1e2634';
      c.fillRect(0, 0, ts, ts);
      for (let x = -4; x < ts + 4; x += 6) {
        c.fillStyle = '#d97706';
        c.beginPath();
        c.moveTo(x, 5);
        c.lineTo(x + 3, 1);
        c.lineTo(x + 5, 1);
        c.lineTo(x + 2, 5);
        c.fill();
        c.fillStyle = '#090d14';
        c.beginPath();
        c.moveTo(x + 2, 5);
        c.lineTo(x + 5, 1);
        c.lineTo(x + 7, 1);
        c.lineTo(x + 4, 5);
        c.fill();
      }
      c.fillStyle = '#475569';
      c.fillRect(0, 5, ts, 1);
      c.fillStyle = '#111827';
      c.fillRect(0, 0, ts, 1);
    });

    // Tile 3: Steel Catwalk (One-way diamond truss grate)
    drawTile(3, (c) => {
      c.fillStyle = '#334155';
      c.fillRect(0, 0, ts, 4);
      c.fillStyle = '#94a3b8';
      c.fillRect(0, 0, ts, 1); // metallic sheen
      // Diamond perforations
      c.fillStyle = '#0f172a';
      for (let x = 1; x < ts; x += 3) {
        c.fillRect(x, 1, 2, 2);
      }
      // Steel truss support beam underneath
      c.fillStyle = '#1e293b';
      c.fillRect(2, 4, 2, 12);
      c.fillRect(12, 4, 2, 12);
    });

    // Tile 4: Ladder (Riveted steel rungs)
    drawTile(4, (c) => {
      c.fillStyle = '#334155';
      c.fillRect(1, 0, 3, ts); // left stringer
      c.fillRect(12, 0, 3, ts); // right stringer
      c.fillStyle = '#64748b';
      c.fillRect(2, 0, 1, ts);
      c.fillRect(13, 0, 1, ts);
      // Rungs
      c.fillStyle = '#cbd5e1';
      c.fillRect(2, 4, 12, 2);
      c.fillRect(2, 11, 12, 2);
    });

    // Tile 5: Overhead Pipe (Coupling collars for pipe-hang)
    drawTile(5, (c) => {
      c.fillStyle = '#1e293b';
      c.fillRect(0, 2, ts, 7);
      c.fillStyle = '#475569';
      c.fillRect(0, 3, ts, 5);
      c.fillStyle = '#94a3b8';
      c.fillRect(0, 4, ts, 2); // metallic highlight
      // Heavy flange coupling
      c.fillStyle = '#cbd5e1';
      c.fillRect(6, 1, 4, 9);
      c.fillStyle = '#0f172a';
      c.fillRect(7, 2, 2, 2); // bolt
      c.fillRect(7, 6, 2, 2);
    });

    // Tile 8: Wet Dock Wooden Pier Planks (Wood grain & wet glint)
    drawTile(8, (c) => {
      c.fillStyle = '#1a1815';
      c.fillRect(0, 0, ts, ts);
      c.fillStyle = '#3b2f22';
      c.fillRect(0, 0, ts, ts - 1);
      c.fillStyle = '#544331';
      c.fillRect(0, 1, ts, 3);
      // Nail heads
      c.fillStyle = '#0f172a';
      c.fillRect(2, 2, 1, 1);
      c.fillRect(13, 2, 1, 1);
      // Water puddle gloss reflection
      c.fillStyle = '#38bdf8';
      c.fillRect(5, 1, 6, 1);
    });

    // Tile 9: Ocean Water with Animated Waves
    drawTile(9, (c) => {
      c.fillStyle = '#041d33';
      c.fillRect(0, 0, ts, ts);
      c.fillStyle = '#0284c7';
      c.fillRect(0, 2, ts, 3);
      c.fillStyle = '#38bdf8';
      c.fillRect(2, 2, 5, 1);
      c.fillRect(9, 3, 6, 1);
      c.fillStyle = '#e0f2fe';
      c.fillRect(4, 2, 2, 1); // sea foam crest
    });

    // Tile 10: Polished Office Hardwood Floor (Glossy reflection)
    drawTile(10, (c) => {
      c.fillStyle = '#20160e';
      c.fillRect(0, 0, ts, ts);
      c.fillStyle = '#422d1d';
      c.fillRect(0, 0, ts, ts - 1);
      c.fillStyle = '#61432b';
      c.fillRect(0, 1, ts, 4);
      // Window reflection stripe
      c.fillStyle = 'rgba(56, 189, 248, 0.15)';
      c.fillRect(4, 0, 8, ts);
    });

    // Tile 11: Office Wallpaper & Mahogany Wainscoting
    drawTile(11, (c) => {
      c.fillStyle = '#19202c';
      c.fillRect(0, 0, ts, 10); // upper wall
      c.fillStyle = '#352115';
      c.fillRect(0, 10, ts, 6); // mahogany wainscoting
      c.fillStyle = '#543622';
      c.fillRect(0, 10, ts, 1); // moulding trim
      // Framed picture miniature
      c.fillStyle = '#0f172a';
      c.fillRect(3, 2, 10, 6);
      c.fillStyle = '#0284c7';
      c.fillRect(4, 3, 8, 4);
    });

    // Tile 12: Vent Duct Shaft (Tight corrugated metal)
    drawTile(12, (c) => {
      c.fillStyle = '#080c14';
      c.fillRect(0, 0, ts, ts);
      c.fillStyle = '#1e293b';
      c.fillRect(0, 0, ts, 2);
      c.fillRect(0, ts - 2, ts, 2);
      c.fillStyle = '#334155';
      for (let x = 2; x < ts; x += 3) {
        c.fillRect(x, 2, 1, ts - 4);
      }
    });

    // Tile 13: Concrete Roof with Puddle Reflections
    drawTile(13, (c) => {
      c.fillStyle = '#161d27';
      c.fillRect(0, 0, ts, ts);
      c.fillStyle = '#222d3d';
      c.fillRect(0, 0, ts, 2);
      // Puddle
      c.fillStyle = '#0f172a';
      c.fillRect(3, 3, 10, 4);
      c.fillStyle = '#f59e0b';
      c.fillRect(5, 4, 4, 1); // sodium light puddle glint
    });

    if (tm.exists('tiles')) tm.remove('tiles');
    scene.textures.addSpriteSheet('tiles', canvas, {
      frameWidth: ts,
      frameHeight: ts
    });
  }

  // =========================================================================
  // WEAPONS & GADGET HUD ICONS
  // =========================================================================
  static createWeaponsAndGadgetsTextures(scene) {
    const tm = scene.textures;

    // Silenced Pistol (28x18)
    {
      const { canvas, ctx } = this.makeCanvas(28, 18);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(2, 4, 10, 5); // slide
      ctx.fillStyle = '#334155';
      ctx.fillRect(12, 4, 14, 4); // suppressor tube
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(2, 4, 24, 1); // specular rim
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(4, 9, 5, 8); // grip
      if (tm.exists('icon_pistol')) tm.remove('icon_pistol');
      scene.textures.addCanvas('icon_pistol', canvas);
    }

    // Suppressed SMG (32x18)
    {
      const { canvas, ctx } = this.makeCanvas(32, 18);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(4, 4, 14, 6);
      ctx.fillStyle = '#475569';
      ctx.fillRect(18, 5, 12, 4); // barrel/suppressor
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(8, 10, 3, 7); // curved magazine
      ctx.fillRect(4, 10, 4, 6); // rear grip
      if (tm.exists('icon_smg')) tm.remove('icon_smg');
      scene.textures.addCanvas('icon_smg', canvas);
    }

    // Heavy Shotgun (34x18)
    {
      const { canvas, ctx } = this.makeCanvas(34, 18);
      ctx.fillStyle = '#334155';
      ctx.fillRect(2, 4, 28, 4); // twin barrel
      ctx.fillStyle = '#8a5b3a';
      ctx.fillRect(14, 8, 8, 4); // wood pump fore-end
      ctx.fillRect(2, 7, 7, 7); // wood stock
      if (tm.exists('icon_shotgun')) tm.remove('icon_shotgun');
      scene.textures.addCanvas('icon_shotgun', canvas);
    }

    // Stun Taser Icon (20x16)
    {
      const { canvas, ctx } = this.makeCanvas(20, 16);
      ctx.fillStyle = '#0e7490';
      ctx.fillRect(2, 3, 14, 7);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(16, 4, 3, 5); // prongs
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(4, 10, 4, 5);
      if (tm.exists('icon_taser')) tm.remove('icon_taser');
      scene.textures.addCanvas('icon_taser', canvas);
    }

    // Noise Maker Lure Icon (20x16)
    {
      const { canvas, ctx } = this.makeCanvas(20, 16);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(4, 3, 12, 10);
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.arc(10, 8, 3, 0, Math.PI * 2);
      ctx.fill();
      if (tm.exists('icon_noisemaker')) tm.remove('icon_noisemaker');
      scene.textures.addCanvas('icon_noisemaker', canvas);
    }

    // Camera Icon (20x16)
    {
      const { canvas, ctx } = this.makeCanvas(20, 16);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(2, 4, 16, 10);
      ctx.fillRect(6, 2, 8, 2);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(10, 9, 3, 0, Math.PI * 2);
      ctx.fill();
      if (tm.exists('icon_camera')) tm.remove('icon_camera');
      scene.textures.addCanvas('icon_camera', canvas);
    }

    // EMP Icon (20x16)
    {
      const { canvas, ctx } = this.makeCanvas(20, 16);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(5, 3, 10, 10);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(8, 5, 4, 6);
      if (tm.exists('icon_emp')) tm.remove('icon_emp');
      scene.textures.addCanvas('icon_emp', canvas);
    }

    // NVG Icon (20x16)
    {
      const { canvas, ctx } = this.makeCanvas(20, 16);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(3, 4, 14, 8);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(5, 6, 4, 4);
      ctx.fillRect(11, 6, 4, 4);
      if (tm.exists('icon_nvg')) tm.remove('icon_nvg');
      scene.textures.addCanvas('icon_nvg', canvas);
    }

    // Sniper Icon (32x18)
    {
      const { canvas, ctx } = this.makeCanvas(32, 18);
      ctx.fillStyle = '#334155';
      ctx.fillRect(2, 6, 28, 3);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(10, 3, 8, 3); // scope
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(6, 9, 4, 6); // stock
      if (tm.exists('icon_sniper')) tm.remove('icon_sniper');
      scene.textures.addCanvas('icon_sniper', canvas);
    }
  }

  // =========================================================================
  // ENVIRONMENT PROPS (AC Fans, Shipping Containers, Terminals, Cameras)
  // =========================================================================
  static createEntitiesTextures(scene) {
    const tm = scene.textures;

    // 1. Animated Rooftop AC Fan (32x28, 4 frames)
    {
      const { canvas, ctx } = this.makeCanvas(32 * 4, 28);
      for (let f = 0; f < 4; f++) {
        ctx.save();
        ctx.translate(f * 32, 0);
        // Beveled metal enclosure
        ctx.fillStyle = '#1a222e';
        ctx.fillRect(0, 0, 32, 28);
        ctx.fillStyle = '#283547';
        ctx.fillRect(2, 2, 28, 24);
        // Circular grill
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(6, 4, 20, 20);
        // Rotating fan blades
        ctx.save();
        ctx.translate(16, 14);
        ctx.rotate((f * Math.PI) / 4);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-8, -2, 16, 4);
        ctx.fillRect(-2, -8, 4, 16);
        ctx.restore();
        ctx.restore();
      }
      if (tm.exists('ac_fan')) tm.remove('ac_fan');
      scene.textures.addSpriteSheet('ac_fan', canvas, { frameWidth: 32, frameHeight: 28 });
    }

    // 2. High-Tech Security Camera (28x18)
    {
      const { canvas, ctx } = this.makeCanvas(28, 18);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 8, 10); // mount
      ctx.fillStyle = '#475569';
      ctx.fillRect(6, 4, 16, 10); // chassis
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(6, 4, 16, 2);
      // Lens & LED
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(18, 7, 5, 5);
      ctx.fillStyle = '#fca5a5';
      ctx.fillRect(19, 8, 2, 2);
      if (tm.exists('camera')) tm.remove('camera');
      scene.textures.addCanvas('camera', canvas);
    }

    // 3. Realistic Military Cargo Crate (28x28)
    {
      const { canvas, ctx } = this.makeCanvas(28, 28);
      // Dark border
      ctx.fillStyle = '#221508';
      ctx.fillRect(0, 0, 28, 28);
      // Wood plank base
      ctx.fillStyle = '#6b3e15';
      ctx.fillRect(1, 1, 26, 26);
      // Individual wood planks with shading
      ctx.fillStyle = '#7d4a1b';
      ctx.fillRect(2, 2, 24, 7);
      ctx.fillRect(2, 10, 24, 8);
      ctx.fillRect(2, 19, 24, 7);
      // Plank division seams
      ctx.fillStyle = '#3a200a';
      ctx.fillRect(2, 9, 24, 1);
      ctx.fillRect(2, 18, 24, 1);
      // Diagonal wood brace
      ctx.strokeStyle = '#532f10';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(3, 3);
      ctx.lineTo(25, 25);
      ctx.moveTo(25, 3);
      ctx.lineTo(3, 25);
      ctx.stroke();
      // Heavy metal corner brackets
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(1, 1, 6, 2);
      ctx.fillRect(1, 1, 2, 6);
      ctx.fillRect(21, 1, 6, 2);
      ctx.fillRect(25, 1, 2, 6);
      ctx.fillRect(1, 25, 6, 2);
      ctx.fillRect(1, 21, 2, 6);
      ctx.fillRect(21, 25, 6, 2);
      ctx.fillRect(25, 21, 2, 6);
      // Rivet glints
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(2, 2, 1, 1);
      ctx.fillRect(25, 2, 1, 1);
      ctx.fillRect(2, 25, 1, 1);
      ctx.fillRect(25, 25, 1, 1);
      // Covert cargo marking
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(10, 12, 8, 4);
      if (tm.exists('crate')) tm.remove('crate');
      scene.textures.addCanvas('crate', canvas);
    }

    // 4. Corrugated Shipping Container (48x32, 3 colors: rust orange, ocean teal, crimson)
    const containerColors = [
      { key: 'container_rust', base: '#7c2d12', dark: '#431407', light: '#c2410c' },
      { key: 'container_teal', base: '#0e7490', dark: '#164e63', light: '#06b6d4' },
      { key: 'container_navy', base: '#1e3a8a', dark: '#172554', light: '#2563eb' }
    ];

    containerColors.forEach(cDef => {
      const { canvas, ctx } = this.makeCanvas(48, 32);
      ctx.fillStyle = cDef.dark;
      ctx.fillRect(0, 0, 48, 32);
      ctx.fillStyle = cDef.base;
      ctx.fillRect(2, 2, 44, 28);
      // Corrugation ribs
      for (let x = 4; x < 44; x += 4) {
        ctx.fillStyle = cDef.light;
        ctx.fillRect(x, 2, 2, 28);
        ctx.fillStyle = cDef.dark;
        ctx.fillRect(x + 2, 2, 2, 28);
      }
      // Corner cast iron locks
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(2, 2, 4, 4);
      ctx.fillRect(42, 2, 4, 4);
      ctx.fillRect(2, 26, 4, 4);
      ctx.fillRect(42, 26, 4, 4);
      if (tm.exists(cDef.key)) tm.remove(cDef.key);
      scene.textures.addCanvas(cDef.key, canvas);
    });

    // 5. Water Tank (36x54)
    {
      const { canvas, ctx } = this.makeCanvas(36, 54);
      // Support struts
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(6, 32, 4, 22);
      ctx.fillRect(26, 32, 4, 22);
      ctx.fillRect(6, 42, 24, 2);
      // Cylinder with rivets
      ctx.fillStyle = '#334155';
      ctx.fillRect(2, 8, 32, 24);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(2, 8, 32, 4);
      // Roof conical top
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(2, 8);
      ctx.lineTo(34, 8);
      ctx.closePath();
      ctx.fill();
      if (tm.exists('water_tank')) tm.remove('water_tank');
      scene.textures.addCanvas('water_tank', canvas);
    }

    // 6. Security Terminal (28x28)
    {
      const { canvas, ctx } = this.makeCanvas(28, 28);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(2, 16, 24, 12);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(4, 2, 20, 15);
      // Glowing CRT screen
      ctx.fillStyle = '#083344';
      ctx.fillRect(6, 4, 16, 11);
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(8, 6, 10, 2);
      ctx.fillRect(8, 9, 6, 2);
      if (tm.exists('terminal')) tm.remove('terminal');
      scene.textures.addCanvas('terminal', canvas);
    }

    // 7. Doors, Floor Vent, Zipline Handle, Laser Emitter, Collectibles
    {
      // Steel Door (18x36)
      const { canvas: cd, ctx: ctxd } = this.makeCanvas(18, 36);
      ctxd.fillStyle = '#090d14';
      ctxd.fillRect(0, 0, 18, 36);
      ctxd.fillStyle = '#1e293b';
      ctxd.fillRect(2, 2, 14, 32);
      ctxd.fillStyle = '#ef4444'; // locked biometric pad
      ctxd.fillRect(11, 16, 4, 5);
      if (tm.exists('door_locked')) tm.remove('door_locked');
      scene.textures.addCanvas('door_locked', cd);

      const { canvas: cdu, ctx: ctxdu } = this.makeCanvas(18, 36);
      ctxdu.fillStyle = '#090d14';
      ctxdu.fillRect(0, 0, 18, 36);
      ctxdu.fillStyle = '#065f46';
      ctxdu.fillRect(2, 2, 6, 32);
      ctxdu.fillStyle = '#22c55e'; // unlocked
      ctxdu.fillRect(11, 16, 4, 5);
      if (tm.exists('door_unlocked')) tm.remove('door_unlocked');
      scene.textures.addCanvas('door_unlocked', cdu);

      // Floor vent (16x16)
      const { canvas: cv, ctx: ctxv } = this.makeCanvas(16, 16);
      ctxv.fillStyle = '#111827';
      ctxv.fillRect(0, 8, 16, 8);
      ctxv.fillStyle = '#475569';
      for (let x = 2; x < 14; x += 3) ctxv.fillRect(x, 9, 1, 6);
      if (tm.exists('floor_vent')) tm.remove('floor_vent');
      scene.textures.addCanvas('floor_vent', cv);

      // Zipline handle (16x16)
      const { canvas: cz, ctx: ctxz } = this.makeCanvas(16, 16);
      ctxz.fillStyle = '#cbd5e1';
      ctxz.beginPath();
      ctxz.arc(8, 4, 3.5, 0, Math.PI * 2);
      ctxz.fill();
      ctxz.fillStyle = '#f59e0b';
      ctxz.fillRect(3, 8, 10, 4);
      if (tm.exists('zipline_handle')) tm.remove('zipline_handle');
      scene.textures.addCanvas('zipline_handle', cz);

      // Laser emitter (8x16)
      const { canvas: cl, ctx: ctxl } = this.makeCanvas(8, 16);
      ctxl.fillStyle = '#1e293b';
      ctxl.fillRect(0, 2, 6, 12);
      ctxl.fillStyle = '#ef4444';
      ctxl.fillRect(6, 6, 2, 4);
      if (tm.exists('laser_emitter')) tm.remove('laser_emitter');
      scene.textures.addCanvas('laser_emitter', cl);

      // Data Drive (16x16)
      const { canvas: cdd, ctx: ctxdd } = this.makeCanvas(16, 16);
      ctxdd.fillStyle = '#0f172a';
      ctxdd.fillRect(2, 3, 12, 10);
      ctxdd.fillStyle = '#06b6d4';
      ctxdd.fillRect(4, 5, 8, 7);
      ctxdd.fillStyle = '#ffffff';
      ctxdd.fillRect(5, 6, 6, 2);
      if (tm.exists('data_drive')) tm.remove('data_drive');
      scene.textures.addCanvas('data_drive', cdd);

      // Intel file (16x16)
      const { canvas: cif, ctx: ctxif } = this.makeCanvas(16, 16);
      ctxif.fillStyle = '#d97706';
      ctxif.fillRect(2, 3, 12, 10);
      ctxif.fillStyle = '#ef4444';
      ctxif.fillRect(5, 7, 6, 2); // TOP SECRET
      if (tm.exists('intel_file')) tm.remove('intel_file');
      scene.textures.addCanvas('intel_file', cif);

      // Ammo clip (16x16)
      const { canvas: ca, ctx: ctxa } = this.makeCanvas(16, 16);
      ctxa.fillStyle = '#334155';
      ctxa.fillRect(3, 3, 10, 10);
      ctxa.fillStyle = '#f59e0b';
      ctxa.fillRect(4, 2, 3, 3);
      ctxa.fillRect(8, 2, 3, 3);
      if (tm.exists('ammo_clip')) tm.remove('ammo_clip');
      scene.textures.addCanvas('ammo_clip', ca);

      // Document Manifest (18x20)
      const { canvas: cdm, ctx: ctxdm } = this.makeCanvas(18, 20);
      ctxdm.fillStyle = '#78350f';
      ctxdm.fillRect(1, 1, 16, 18); // clipboard
      ctxdm.fillStyle = '#f8fafc';
      ctxdm.fillRect(3, 3, 12, 14); // paper
      ctxdm.fillStyle = '#0284c7';
      ctxdm.fillRect(4, 5, 8, 2); // Kestrel header
      ctxdm.fillStyle = '#64748b';
      ctxdm.fillRect(4, 9, 10, 1);
      ctxdm.fillRect(4, 12, 7, 1);
      ctxdm.fillStyle = '#10b981';
      ctxdm.fillRect(12, 12, 3, 3); // stamp
      if (tm.exists('doc_manifest')) tm.remove('doc_manifest');
      scene.textures.addCanvas('doc_manifest', cdm);

      // Tracker Beacon (16x16)
      const { canvas: ctb, ctx: ctxtb } = this.makeCanvas(16, 16);
      ctxtb.fillStyle = '#0f172a';
      ctxtb.fillRect(3, 4, 10, 8);
      ctxtb.fillStyle = '#38bdf8';
      ctxtb.fillRect(6, 6, 4, 4); // glowing cyan diode
      if (tm.exists('tracker_beacon')) tm.remove('tracker_beacon');
      scene.textures.addCanvas('tracker_beacon', ctb);

      // Lamp Post (16x32) & Broken
      const { canvas: clp, ctx: ctxlp } = this.makeCanvas(16, 32);
      ctxlp.fillStyle = '#334155';
      ctxlp.fillRect(7, 6, 2, 26);
      ctxlp.fillStyle = '#1e293b';
      ctxlp.fillRect(2, 2, 12, 4);
      ctxlp.fillStyle = '#f59e0b';
      ctxlp.fillRect(4, 6, 8, 3);
      if (tm.exists('lamp_post')) tm.remove('lamp_post');
      scene.textures.addCanvas('lamp_post', clp);

      const { canvas: clpb, ctx: ctxlpb } = this.makeCanvas(16, 32);
      ctxlpb.fillStyle = '#334155';
      ctxlpb.fillRect(7, 6, 2, 26);
      ctxlpb.fillStyle = '#1e293b';
      ctxlpb.fillRect(2, 2, 12, 4);
      ctxlpb.fillStyle = '#0f172a';
      ctxlpb.fillRect(5, 6, 6, 2);
      if (tm.exists('lamp_post_broken')) tm.remove('lamp_post_broken');
      scene.textures.addCanvas('lamp_post_broken', clpb);
    }
  }

  // =========================================================================
  // NIGHTFALL "KITE" STEALTH HELICOPTER (140x54)
  // =========================================================================
  static createHelicopterTexture(scene) {
    const tm = scene.textures;
    const { canvas, ctx } = this.makeCanvas(140, 54);

    // Fuselage stealth faceting
    ctx.fillStyle = '#080c14';
    ctx.beginPath();
    ctx.moveTo(130, 28);
    ctx.lineTo(100, 14);
    ctx.lineTo(40, 14);
    ctx.lineTo(6, 22);
    ctx.lineTo(0, 16);
    ctx.lineTo(5, 30);
    ctx.lineTo(40, 32);
    ctx.lineTo(85, 34);
    ctx.closePath();
    ctx.fill();

    // Body shading
    ctx.fillStyle = '#162030';
    ctx.beginPath();
    ctx.moveTo(98, 16);
    ctx.lineTo(42, 16);
    ctx.lineTo(42, 28);
    ctx.lineTo(95, 28);
    ctx.closePath();
    ctx.fill();

    // Gold tinted cockpit canopy
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.moveTo(116, 26);
    ctx.lineTo(100, 16);
    ctx.lineTo(88, 16);
    ctx.lineTo(92, 26);
    ctx.closePath();
    ctx.fill();

    // Open troop compartment door
    ctx.fillStyle = '#090e17';
    ctx.fillRect(52, 18, 26, 16);

    // Landing skids
    ctx.fillStyle = '#475569';
    ctx.fillRect(40, 44, 65, 3);
    ctx.fillRect(52, 33, 4, 11);
    ctx.fillRect(88, 33, 4, 11);

    // Spinning rotor blur line
    ctx.fillStyle = 'rgba(226, 232, 240, 0.45)';
    ctx.fillRect(10, 8, 120, 2);
    ctx.fillStyle = '#334155';
    ctx.fillRect(68, 10, 6, 6);

    if (tm.exists('helicopter')) tm.remove('helicopter');
    scene.textures.addCanvas('helicopter', canvas);
  }

  // =========================================================================
  // 40PX BOTTOM BAR HUD & PORTRAITS
  // =========================================================================
  static createHUDTextures(scene) {
    const tm = scene.textures;

    // Vikram "Ghost" Rao Portrait (32x32 fallback if image missing)
    if (!tm.exists('portrait_ghost')) {
      const { canvas, ctx } = this.makeCanvas(32, 32);
      ctx.fillStyle = '#06090e';
      ctx.fillRect(0, 0, 32, 32);
      // Skin
      ctx.fillStyle = '#a16207';
      ctx.fillRect(7, 7, 18, 20);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(9, 9, 14, 14);
      // Hair
      ctx.fillStyle = '#090c10';
      ctx.fillRect(6, 4, 20, 7);
      // Amber visor
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(16, 10, 8, 6);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(19, 11, 4, 4);
      // Webbing collar
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(5, 24, 22, 8);
      scene.textures.addCanvas('portrait_ghost', canvas);
    }

    // Control HQ Portrait (32x32 fallback if image missing)
    if (!tm.exists('portrait_control')) {
      const { canvas, ctx } = this.makeCanvas(32, 32);
      ctx.fillStyle = '#051928';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#f5d0b0';
      ctx.fillRect(8, 8, 16, 18);
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(6, 4, 20, 6);
      // Tactical headset
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(6, 10, 4, 8);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(8, 17, 10, 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(18, 16, 4, 4);
      scene.textures.addCanvas('portrait_control', canvas);
    }

    // Bottom Bar HUD (480x40)
    {
      const { canvas, ctx } = this.makeCanvas(480, 40);
      ctx.fillStyle = '#060a12';
      ctx.fillRect(0, 0, 480, 40);
      ctx.fillStyle = '#1e2d42';
      ctx.fillRect(0, 0, 480, 1);
      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(0, 1, 480, 1); // neon border
      // Partition lines
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(145, 4, 1, 32);
      ctx.fillRect(315, 4, 1, 32);
      if (tm.exists('hud_bar')) tm.remove('hud_bar');
      scene.textures.addCanvas('hud_bar', canvas);
    }
  }

  // =========================================================================
  // LIGHTING CONES & ADDITIVE SPRITES
  // =========================================================================
  static createThermalTextures(scene) {
    const tm = scene.textures;

    // Radial Light Glow
    {
      const { canvas, ctx } = this.makeCanvas(128, 128);
      const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
      grad.addColorStop(0, 'rgba(255, 235, 170, 0.9)');
      grad.addColorStop(0.35, 'rgba(245, 158, 11, 0.45)');
      grad.addColorStop(0.75, 'rgba(180, 83, 9, 0.12)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
      if (tm.exists('light_radial')) tm.remove('light_radial');
      scene.textures.addCanvas('light_radial', canvas);
    }

    // Flashlight Vision Cone
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

    // Camera Red Cone
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
  }
}
