// src/render/Lighting.js
// PBR Lighting system: Ambient night blue, sodium lamps, alarm strobes, volumetric shafts & lightning

import * as THREE from 'three';
import { audio } from '../core/Audio.js';

export class LightingSystem {
  constructor(scene) {
    this.scene = scene;
    this.lights = [];
    this.shootableLamps = [];
    this.alarmActive = false;
    this.alarmSpinAngle = 0;

    // Ambient night sky blue (ensures readable shadows: 0.85-0.95 intensity)
    this.ambient = new THREE.AmbientLight(0x223854, 0.95);
    this.scene.add(this.ambient);

    // Directional moon/night rim light
    this.moonLight = new THREE.DirectionalLight(0x60a5fa, 0.85);
    this.moonLight.position.set(-10, 15, 8);
    this.scene.add(this.moonLight);

    // Alarm emergency rotating spotlight
    this.alarmLight = new THREE.PointLight(0xff1e1e, 0, 16);
    this.alarmLight.position.set(0, 6, 0);
    this.scene.add(this.alarmLight);

    // Lightning light
    this.lightningLight = new THREE.DirectionalLight(0xdbeafe, 0);
    this.lightningLight.position.set(5, 20, 10);
    this.scene.add(this.lightningLight);

    this.lightningTimer = 18;
  }

  addSodiumLamp(x, y, z = 0, isShootable = true) {
    // Warm sodium lamp (3000K amber: 0xf59e0b)
    const lamp = new THREE.SpotLight(0xf59e0b, 5.5, 18, Math.PI / 3, 0.65, 1.0);
    lamp.position.set(x, y, z + 0.5);
    lamp.target.position.set(x, y - 5, z);
    this.scene.add(lamp);
    this.scene.add(lamp.target);

    // Visual lamp fixture
    const fixtureGeo = new THREE.CylinderGeometry(0.2, 0.35, 0.25, 8);
    const fixtureMat = new THREE.MeshStandardMaterial({ color: 0x222d3d, metalness: 0.8, roughness: 0.3 });
    const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
    fixture.position.set(x, y, z);
    this.scene.add(fixture);

    // Emissive bulb lens
    const bulbGeo = new THREE.SphereGeometry(0.14, 8, 8);
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.set(x, y - 0.12, z);
    this.scene.add(bulb);

    // Volumetric cone shaft (additive transparent mesh)
    const coneGeo = new THREE.ConeGeometry(3.5, 7, 16, 1, true);
    coneGeo.translate(0, -3.5, 0);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.07,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.set(x, y, z);
    this.scene.add(cone);

    const lampData = {
      light: lamp,
      fixture,
      bulb,
      cone,
      x,
      y,
      isShootable,
      alive: true
    };

    if (isShootable) {
      this.shootableLamps.push(lampData);
    }
    this.lights.push(lampData);
    return lampData;
  }

  shootLamp(lampData) {
    if (!lampData || !lampData.alive) return;
    lampData.alive = false;
    lampData.light.intensity = 0;
    lampData.bulb.material.color.setHex(0x1e293b);
    lampData.cone.visible = false;
    audio.playPistolShot(); // glass shatter sound trigger
  }

  setAlarmState(active) {
    this.alarmActive = active;
    if (!active) {
      this.alarmLight.intensity = 0;
    }
  }

  update(dt) {
    // 1. Alarm strobe pulse and rotation
    if (this.alarmActive) {
      this.alarmSpinAngle += dt * 8.0;
      const pulse = (Math.sin(this.alarmSpinAngle) + 1) * 0.5;
      this.alarmLight.intensity = 2.0 + pulse * 4.0;
    }

    // 2. Lightning schedule
    this.lightningTimer -= dt;
    if (this.lightningTimer <= 0) {
      this.triggerLightning();
      this.lightningTimer = 20 + Math.random() * 25;
    }
  }

  triggerLightning() {
    this.lightningLight.intensity = 3.5;
    setTimeout(() => {
      this.lightningLight.intensity = 0;
      setTimeout(() => {
        this.lightningLight.intensity = 2.0;
        setTimeout(() => {
          this.lightningLight.intensity = 0;
          audio.playThunder();
        }, 60);
      }, 70);
    }, 60);
  }
}
