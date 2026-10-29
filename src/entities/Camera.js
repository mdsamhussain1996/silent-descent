// src/entities/Camera.js
// 2.5D Surveillance Camera: sweeping ±35° cone, disables for 8s when shot

import * as THREE from 'three';
import { collision } from '../world/Collision.js';
import { audio } from '../core/Audio.js';

export class SecurityCamera {
  constructor(scene, x, y, alarmSystem) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.alarmSystem = alarmSystem;

    this.sweepAngle = 0;
    this.sweepSpeed = 0.8;
    this.sweepRange = (35 * Math.PI) / 180;
    this.disabledTimer = 0;
    this.detectionTimer = 0;

    // 3D Mesh
    this.mesh = this.buildCameraModel();
    this.scene.add(this.mesh);

    // Cyan / Red Detection Sweep Cone
    this.coneMesh = this.buildSweepCone();
    this.scene.add(this.coneMesh);
  }

  buildCameraModel() {
    const root = new THREE.Group();
    root.position.set(this.x, this.y, 0);

    // Wall mount
    const mountGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.2, 8);
    const mountMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
    const mount = new THREE.Mesh(mountGeo, mountMat);
    mount.rotation.z = Math.PI / 2;
    root.add(mount);

    // Camera body
    const bodyGeo = new THREE.BoxGeometry(0.32, 0.18, 0.18);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
    this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    this.bodyMesh.position.set(0.1, -0.05, 0);
    root.add(this.bodyMesh);

    // Blinking LED
    const ledGeo = new THREE.SphereGeometry(0.04, 6, 6);
    this.ledMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const led = new THREE.Mesh(ledGeo, this.ledMat);
    led.position.set(0.25, 0.05, 0.08);
    root.add(led);

    return root;
  }

  buildSweepCone() {
    const coneGeo = new THREE.ConeGeometry(2.5, 6, 16, 1, true);
    coneGeo.translate(0, -3, 0);
    coneGeo.rotateX(-Math.PI / 2);
    this.coneMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const cone = new THREE.Mesh(coneGeo, this.coneMat);
    cone.position.set(this.x, this.y, 0);
    return cone;
  }

  disable(duration = 8.0) {
    this.disabledTimer = duration;
    this.coneMesh.visible = false;
    this.ledMat.color.setHex(0x475569);
  }

  update(dt, player) {
    if (this.disabledTimer > 0) {
      this.disabledTimer -= dt;
      if (this.disabledTimer <= 0) {
        this.coneMesh.visible = true;
        this.ledMat.color.setHex(0xef4444);
      }
      return;
    }

    // Sweep camera left and right
    this.sweepAngle = Math.sin(performance.now() * 0.001 * this.sweepSpeed) * this.sweepRange;
    const baseAngle = -Math.PI / 2 + 0.3; // pointing downwards
    const currentAngle = baseAngle + this.sweepAngle;

    this.bodyMesh.rotation.z = currentAngle;
    this.coneMesh.rotation.z = currentAngle + Math.PI / 2;

    // Check Player in vision cone
    const dx = player.x - this.x;
    const dy = (player.y + 1.0) - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 6.5) {
      const angleToPlayer = Math.atan2(dy, dx);
      const angleDiff = Math.abs(angleToPlayer - currentAngle);

      if (angleDiff < Math.PI / 5) {
        // Line of sight raycast
        const cast = collision.raycast(this.x, this.y, player.x, player.y + 1.0);
        if (!cast.hit || cast.fraction > 0.95) {
          // Detected by camera!
          this.detectionTimer += dt;
          this.coneMat.color.setHex(0xff0000);
          this.coneMat.opacity = 0.25;

          if (this.detectionTimer >= 0.8) {
            audio.playAlarmSiren();
            if (this.alarmSystem) this.alarmSystem.raise(this.x, this.y);
          }
          return;
        }
      }
    }

    this.detectionTimer = Math.max(0, this.detectionTimer - dt);
    this.coneMat.color.setHex(0x00f0ff);
    this.coneMat.opacity = 0.09;
  }
}
