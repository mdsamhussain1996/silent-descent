// src/world/LevelLoader.js
// Procedural PBR 2.5D Warehouse Room Builder for Mission 1 Vertical Slice

import * as THREE from 'three';
import { collision } from './Collision.js';
import { Guard } from '../entities/Guard.js';
import { SecurityCamera } from '../entities/Camera.js';
import { LaserTripwire } from '../entities/Laser.js';
import { SecurityTerminal } from '../entities/Terminal.js';

export class LevelLoader {
  constructor(scene, lightingSystem, alarmSystem) {
    this.scene = scene;
    this.lighting = lightingSystem;
    this.alarm = alarmSystem;

    this.guards = [];
    this.cameras = [];
    this.lasers = [];
    this.terminals = [];
    this.interactives = [];

    // Shared PBR Materials
    this.steelMat = new THREE.MeshStandardMaterial({
      color: 0x1e2634,
      roughness: 0.6,
      metalness: 0.6
    });
    this.concreteMat = new THREE.MeshStandardMaterial({
      color: 0x141a24,
      roughness: 0.85,
      metalness: 0.1
    });
    this.grateMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.5,
      metalness: 0.8,
      wireframe: false
    });
    this.woodMat = new THREE.MeshStandardMaterial({
      color: 0x5c3317,
      roughness: 0.75,
      metalness: 0.05
    });
    this.bracketMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.4,
      metalness: 0.8
    });
    this.pipeMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.4,
      metalness: 0.85
    });
  }

  loadWarehouseSlice() {
    collision.clear();

    // ========================================================
    // 1. FLOOR & BOUNDARIES (Ground at Y = 0)
    // ========================================================
    this.createSolid(-18, -1, 36, 1, this.concreteMat); // Main concrete floor (X: -18 to 18, Top Y = 0)
    this.createSolid(-18, 0, 1, 10, this.concreteMat);  // Left wall
    this.createSolid(17, 0, 1, 10, this.concreteMat);   // Right exit blast door
    this.createSolid(-18, 9, 36, 1, this.steelMat);     // Ceiling structural girder beam

    // ========================================================
    // 2. ELEVATED STEEL CATWALK (One-way platform at Y = 3.6)
    // ========================================================
    this.createOneWayPlatform(-8, 3.6, 14, this.grateMat); // X: -8 to 6
    // Catwalk railing & support pillars
    this.createPillar(-7.5, 0, 3.6);
    this.createPillar(5.5, 0, 3.6);

    // Ledges on catwalk edges for auto-grab
    collision.addLedge(-8.0, 3.6, 'left');
    collision.addLedge(6.0, 3.6, 'right');

    // ========================================================
    // 3. OVERHEAD INDUSTRIAL PIPE (X: -6 to 4 at Y = 5.6)
    // ========================================================
    this.createHangingPipe(-6, 4, 5.6);
    collision.addPipe(-6, 4, 5.6);

    // ========================================================
    // 4. STACKED CARGO CRATES (Cover spots)
    // ========================================================
    // Left stack
    this.createCrate(-12, 0);
    this.createCrate(-11, 0);
    this.createCrate(-11.5, 1.0);

    // Mid room stack (under catwalk)
    this.createCrate(-1.5, 0);
    this.createCrate(-0.5, 0);

    // Right stack
    this.createCrate(9.5, 0);
    this.createCrate(10.5, 0);

    // Shadow pockets behind crates
    collision.addShadowZone(-13, 0, 4, 2.5, 0.25);
    collision.addShadowZone(-2.5, 0, 4, 2.5, 0.25);

    // ========================================================
    // 5. BACKGROUND 3D MID-GROUND (Densely dressed warehouse)
    // ========================================================
    this.buildWarehouseBackdrop();

    // ========================================================
    // 6. LIGHTING: SODIUM LAMPS (Shootable) & SHADOW ZONES
    // ========================================================
    // Lamp 1: Left high ceiling
    this.lamp1 = this.lighting.addSodiumLamp(-9, 6.8, 0, true);
    // Lamp 2: Center catwalk (Shootable to create dark infiltration route!)
    this.lamp2 = this.lighting.addSodiumLamp(0, 6.8, 0, true);
    // Lamp 3: Right terminal area
    this.lamp3 = this.lighting.addSodiumLamp(11, 6.8, 0, true);

    // ========================================================
    // 7. SECURITY TERMINAL & HACK OBJECTIVE
    // ========================================================
    const term = new SecurityTerminal(this.scene, 13.5, 0, {
      type: 'terminal',
      onHack: () => {
        // Disables camera and unlocks blast door
        if (this.cameras[0]) this.cameras[0].disable(999);
        if (this.lasers[0]) this.lasers[0].disable();
      }
    });
    this.terminals.push(term);
    this.interactives.push({
      x: 13.5,
      y: 0,
      promptText: '[E] HACK TERMINAL',
      check: (p) => term.canInteract(p),
      interact: () => term.interact()
    });

    // ========================================================
    // 8. CEILING SURVEILLANCE CAMERA (Sweeping catwalk)
    // ========================================================
    const cam = new SecurityCamera(this.scene, 3.5, 6.2, this.alarm);
    this.cameras.push(cam);

    // ========================================================
    // 9. LASER TRIPWIRE GRID (Protecting vault corridor at X: 8)
    // ========================================================
    const laser = new LaserTripwire(this.scene, 7.8, 0, 3.2, this.alarm);
    this.lasers.push(laser);

    // ========================================================
    // 10. PATROLLING KESTREL GUARDS (2 Guards with flashlights)
    // ========================================================
    // Guard 1: Ground floor patrol under catwalk
    const guard1 = new Guard(this.scene, -4.0, 0, -8.0, 5.0, this.alarm);
    this.guards.push(guard1);

    // Guard 2: Catwalk elevated patrol
    const guard2 = new Guard(this.scene, -1.0, 3.6, -7.0, 5.0, this.alarm);
    this.guards.push(guard2);

    this.alarm.setGuards(this.guards);

    return {
      playerSpawn: { x: -15, y: 0 },
      guards: this.guards,
      cameras: this.cameras,
      lasers: this.lasers,
      terminals: this.terminals,
      interactives: this.interactives,
      lamps: [this.lamp1, this.lamp2, this.lamp3]
    };
  }

  createSolid(x, y, w, h, material) {
    const geo = new THREE.BoxGeometry(w, h, 2.5);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(x + w / 2, y + h / 2, 0);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    this.scene.add(mesh);
    collision.addSolid(x, y, w, h, false);
  }

  createOneWayPlatform(x, y, w, material) {
    const h = 0.15;
    const geo = new THREE.BoxGeometry(w, h, 1.8);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(x + w / 2, y - h / 2, 0);
    mesh.receiveShadow = true;
    this.scene.add(mesh);

    // Handrails on front and back
    const railGeo = new THREE.CylinderGeometry(0.02, 0.02, w, 8);
    railGeo.rotateZ(Math.PI / 2);
    const railMesh = new THREE.Mesh(railGeo, this.bracketMat);
    railMesh.position.set(x + w / 2, y + 0.6, 0.8);
    this.scene.add(railMesh);

    collision.addSolid(x, y - h, w, h, true);
  }

  createPillar(x, y1, y2) {
    const h = y2 - y1;
    const geo = new THREE.BoxGeometry(0.2, h, 0.2);
    const mesh = new THREE.Mesh(geo, this.steelMat);
    mesh.position.set(x, (y1 + y2) / 2, 0);
    mesh.castShadow = true;
    this.scene.add(mesh);
  }

  createHangingPipe(x1, x2, y) {
    const len = x2 - x1;
    const geo = new THREE.CylinderGeometry(0.06, 0.06, len, 12);
    geo.rotateZ(Math.PI / 2);
    const mesh = new THREE.Mesh(geo, this.pipeMat);
    mesh.position.set((x1 + x2) / 2, y, 0);
    this.scene.add(mesh);

    // Ceiling hangers
    for (let hx = x1 + 1; hx < x2; hx += 3) {
      const hGeo = new THREE.CylinderGeometry(0.015, 0.015, 2.5, 6);
      const hMesh = new THREE.Mesh(hGeo, this.bracketMat);
      hMesh.position.set(hx, y + 1.25, 0);
      this.scene.add(hMesh);
    }
  }

  createCrate(x, y) {
    const size = 1.0;
    const geo = new THREE.BoxGeometry(size, size, 1.0);
    const mesh = new THREE.Mesh(geo, this.woodMat);
    mesh.position.set(x + size / 2, y + size / 2, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);

    // Metal corner trim
    const trimGeo = new THREE.BoxGeometry(size + 0.02, size + 0.02, 0.1);
    const trim = new THREE.Mesh(trimGeo, this.bracketMat);
    trim.position.set(x + size / 2, y + size / 2, 0);
    this.scene.add(trim);

    collision.addSolid(x, y, size, size, false);
  }

  buildWarehouseBackdrop() {
    // 3D Mid-ground wall at Z = -3.5 (Pipes, vents, high skylights)
    const wallGeo = new THREE.PlaneGeometry(45, 16);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x0c131d,
      roughness: 0.9,
      metalness: 0.1
    });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(0, 5, -3.5);
    this.scene.add(wall);

    // High skylight windows showing stormy rain sky
    for (let sx = -12; sx <= 12; sx += 8) {
      const winGeo = new THREE.PlaneGeometry(3.5, 1.6);
      const winMat = new THREE.MeshBasicMaterial({
        color: 0x1e3a5f,
        transparent: true,
        opacity: 0.6
      });
      const win = new THREE.Mesh(winGeo, winMat);
      win.position.set(sx, 7.8, -3.4);
      this.scene.add(win);
    }

    // Heavy industrial ventilation ducts running horizontally at Z = -2.5
    const ductGeo = new THREE.BoxGeometry(40, 0.7, 0.7);
    const ductMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.7 });
    const duct = new THREE.Mesh(ductGeo, ductMat);
    duct.position.set(0, 6.2, -2.5);
    this.scene.add(duct);
  }
}
