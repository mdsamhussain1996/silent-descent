// src/render/CameraRig.js
// 2.5D Cinematic Side-View Camera Rig with horizontal lookahead & trauma shake

import * as THREE from 'three';

export class CameraRig {
  constructor() {
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 3, 13);
    this.target = new THREE.Vector3(0, 2, 0);

    // Lookahead & smoothing
    this.lookAheadX = 0;
    this.targetLookAheadX = 0;
    this.smoothSpeed = 5.0;

    // Camera shake (trauma model)
    this.trauma = 0;
    this.traumaDecay = 1.6;

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });
  }

  addTrauma(amount) {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  update(dt, playerPos, playerFacing = 1, isAiming = false) {
    // Lead lookahead
    const leadDistance = isAiming ? 2.5 : 1.2;
    this.targetLookAheadX = playerFacing * leadDistance;
    this.lookAheadX += (this.targetLookAheadX - this.lookAheadX) * Math.min(1, dt * 3.5);

    // Desired camera target
    const targetX = playerPos.x + this.lookAheadX;
    const targetY = playerPos.y + 1.2;

    // Smooth lerp
    this.target.x += (targetX - this.target.x) * Math.min(1, dt * this.smoothSpeed);
    this.target.y += (targetY - this.target.y) * Math.min(1, dt * (this.smoothSpeed * 0.8));

    // Base position
    this.camera.position.x = this.target.x;
    this.camera.position.y = this.target.y + 0.4;
    this.camera.position.z = 12.0;

    // Apply trauma shake
    if (this.trauma > 0) {
      const shake = this.trauma * this.trauma;
      const angle = Math.random() * Math.PI * 2;
      const magnitude = shake * 0.22;
      this.camera.position.x += Math.cos(angle) * magnitude;
      this.camera.position.y += Math.sin(angle) * magnitude;
      this.camera.rotation.z = (Math.random() - 0.5) * shake * 0.05;

      this.trauma = Math.max(0, this.trauma - this.traumaDecay * dt);
    } else {
      this.camera.rotation.z = 0;
    }

    this.camera.lookAt(this.target.x, this.target.y, 0);
  }
}
