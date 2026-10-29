// src/entities/Laser.js
// 2.5D Pulsing Laser Grid Tripwire with alarm trigger

import * as THREE from 'three';
import { audio } from '../core/Audio.js';

export class LaserTripwire {
  constructor(scene, x, y1, y2, alarmSystem) {
    this.scene = scene;
    this.x = x;
    this.y1 = Math.min(y1, y2);
    this.y2 = Math.max(y1, y2);
    this.alarmSystem = alarmSystem;

    this.active = true;
    this.pulseTime = 0;

    // Laser Beam Cylinder Mesh
    const height = this.y2 - this.y1;
    const geo = new THREE.CylinderGeometry(0.02, 0.02, height, 8);
    geo.translate(0, height / 2, 0);

    this.mat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.position.set(this.x, this.y1, 0.05);
    this.scene.add(this.mesh);

    // Emitter pods
    const podGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    const podMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
    const podBottom = new THREE.Mesh(podGeo, podMat);
    podBottom.position.set(this.x, this.y1, 0);
    const podTop = new THREE.Mesh(podGeo, podMat);
    podTop.position.set(this.x, this.y2, 0);
    this.scene.add(podBottom);
    this.scene.add(podTop);
  }

  update(dt, player) {
    if (!this.active) return;
    this.pulseTime += dt * 4;
    this.mat.opacity = 0.65 + Math.sin(this.pulseTime) * 0.25;

    // AABB trigger check against player
    if (
      player.x + 0.25 > this.x - 0.08 &&
      player.x - 0.25 < this.x + 0.08 &&
      player.y < this.y2 &&
      player.y + 1.6 > this.y1
    ) {
      // Player intersected laser tripwire!
      audio.playLaserTrip();
      if (this.alarmSystem) this.alarmSystem.raise(this.x, (this.y1 + this.y2) / 2);
    }
  }

  disable() {
    this.active = false;
    this.mesh.visible = false;
  }
}
