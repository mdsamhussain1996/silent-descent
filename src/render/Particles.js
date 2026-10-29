// src/render/Particles.js
// Instanced GPU Rain, Muzzle flashes, sparks and laser beams (1-draw-call rain)

import * as THREE from 'three';
import { settings } from '../core/Settings.js';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;

    // 1. Instanced Rain (Single Draw Call)
    const preset = settings.getPreset();
    this.rainCount = preset.rainParticles;
    const rainGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.rainCount * 3);
    const velocities = new Float32Array(this.rainCount);

    for (let i = 0; i < this.rainCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 35;
      positions[i * 3 + 1] = Math.random() * 15;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
      velocities[i] = 12 + Math.random() * 8;
    }

    rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.rainVelocities = velocities;

    const rainMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.08,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });

    this.rainPoints = new THREE.Points(rainGeo, rainMat);
    this.scene.add(this.rainPoints);

    // 2. Dynamic Laser Tripwire Mesh Pool
    this.laserMaterial = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    // 3. Sparks / Impacts Pool
    this.sparks = [];
  }

  update(dt, cameraPos) {
    // 1. Rain update around camera
    const pos = this.rainPoints.geometry.attributes.position.array;
    for (let i = 0; i < this.rainCount; i++) {
      pos[i * 3 + 1] -= this.rainVelocities[i] * dt;
      pos[i * 3 + 0] -= dt * 2.5; // slight slant

      // Wrap around camera
      if (pos[i * 3 + 1] < cameraPos.y - 4) {
        pos[i * 3 + 1] = cameraPos.y + 10;
        pos[i * 3 + 0] = cameraPos.x + (Math.random() - 0.5) * 30;
      }
    }
    this.rainPoints.geometry.attributes.position.needsUpdate = true;

    // 2. Sparks update
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const sp = this.sparks[i];
      sp.mesh.position.addScaledVector(sp.vel, dt);
      sp.life -= dt;
      sp.mesh.material.opacity = sp.life / sp.maxLife;
      if (sp.life <= 0) {
        this.scene.remove(sp.mesh);
        this.sparks.splice(i, 1);
      }
    }
  }

  spawnImpactSparks(x, y, z = 0, normalX = 0, normalY = 1) {
    for (let i = 0; i < 6; i++) {
      const geo = new THREE.SphereGeometry(0.03, 4, 4);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xfef08a,
        transparent: true,
        opacity: 1
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      this.scene.add(mesh);

      const angle = Math.atan2(normalY, normalX) + (Math.random() - 0.5) * 1.5;
      const speed = 2 + Math.random() * 4;
      this.sparks.push({
        mesh,
        vel: new THREE.Vector3(Math.cos(angle) * speed, Math.sin(angle) * speed, (Math.random() - 0.5) * 2),
        life: 0.18,
        maxLife: 0.18
      });
    }
  }
}
