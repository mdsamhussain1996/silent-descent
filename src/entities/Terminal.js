// src/entities/Terminal.js
// Interactive Security Console / Breaker box entity for hacking

import * as THREE from 'three';
import { audio } from '../core/Audio.js';
import { events } from '../core/Events.js';

export class SecurityTerminal {
  constructor(scene, x, y, options = {}) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.type = options.type || 'terminal'; // 'terminal' or 'breaker'
    this.hacked = false;
    this.onHack = options.onHack || null;

    // 3D Terminal Mesh
    this.mesh = this.buildModel();
    this.scene.add(this.mesh);
  }

  buildModel() {
    const root = new THREE.Group();
    root.position.set(this.x, this.y, 0);

    // Console stand
    const standGeo = new THREE.BoxGeometry(0.5, 0.9, 0.3);
    const standMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
    const stand = new THREE.Mesh(standGeo, standMat);
    stand.position.y = 0.45;
    root.add(stand);

    // Glowing CRT Screen / Hologram display
    const screenGeo = new THREE.PlaneGeometry(0.35, 0.25);
    this.screenMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const screen = new THREE.Mesh(screenGeo, this.screenMat);
    screen.position.set(0, 0.72, 0.16);
    root.add(screen);

    // Ambient screen point light
    this.screenLight = new THREE.PointLight(0x00f0ff, 0.8, 1.8);
    this.screenLight.position.set(0, 0.72, 0.3);
    root.add(this.screenLight);

    return root;
  }

  canInteract(player) {
    if (this.hacked) return false;
    const dist = Math.hypot(player.x - this.x, player.y - this.y);
    return dist < 1.2;
  }

  interact() {
    if (this.hacked) return;
    this.hacked = true;
    this.screenMat.color.setHex(0x10b981); // Green hacked state
    this.screenLight.color.setHex(0x10b981);
    audio.playRadioBlip();
    events.emit('terminal_hacked', { x: this.x, y: this.y, type: this.type });
    if (this.onHack) this.onHack();
  }
}
