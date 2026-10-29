// src/systems/Radio.js
// Tactical Radio Comms transmission from HQ Control

import { audioSystem } from './Audio.js';

export class RadioSystem {
  constructor(scene) {
    this.scene = scene;
    this.queueList = [];
    this.currentTransmission = null;
    this.timer = 0;
  }

  queue(message) {
    this.queueList.push(message);
    if (!this.currentTransmission) {
      this.playNext();
    }
  }

  playNext() {
    if (this.queueList.length === 0) {
      this.currentTransmission = null;
      if (this.scene.hud) {
        this.scene.hud.hideRadioBox();
      }
      return;
    }

    this.currentTransmission = this.queueList.shift();
    audioSystem.playRadioBlip();

    if (this.scene.hud) {
      this.scene.hud.showRadioBox(this.currentTransmission);
    }

    const duration = this.currentTransmission.duration || 4500;
    this.scene.time.delayedCall(duration, () => {
      this.playNext();
    });
  }

  update(dt) {
    // Timer checks if needed
  }
}
