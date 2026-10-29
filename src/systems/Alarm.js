import { audioSystem } from './Audio.js';

export class AlarmSystem {
  constructor(scene) {
    this.scene = scene;
    this.level = 0; // 0, 1, 2, 3
    this.decayTimer = 0; // 60s to decay 1 level
    this.totalAlarmsTriggered = 0;
    this.criticalTimer = 10; // 10s countdown at level 3
    this.isCritical = false;
  }

  raise(reason = 'detection') {
    this.level = Math.min(3, this.level + 1);
    this.totalAlarmsTriggered++;
    this.decayTimer = 60; // reset decay timer

    audioSystem.playAlarmSiren();
    audioSystem.setSuspicionState(2);

    if (this.level === 3) {
      this.isCritical = true;
      this.criticalTimer = 10;
    }

    // Alert all guards in current section
    if (this.scene.guards) {
      this.scene.guards.getChildren().forEach(g => {
        if (!g.isKnockedOut && !g.isDead) {
          g.setAlertState();
        }
      });
    }

    // Notify HUD
    if (this.scene.hud) {
      this.scene.hud.onAlarmChange(this.level, reason);
    }
  }

  update(delta) {
    const dt = delta / 1000;

    // Decay when not in critical fail state
    if (this.level > 0 && this.level < 3) {
      this.decayTimer -= dt;
      if (this.decayTimer <= 0) {
        this.level = Math.max(0, this.level - 1);
        this.decayTimer = 60;
        if (this.level === 0) {
          audioSystem.setSuspicionState(0);
        }
        if (this.scene.hud) {
          this.scene.hud.onAlarmChange(this.level, 'decayed');
        }
      }
    }

    // Level 3 critical countdown
    if (this.isCritical) {
      this.criticalTimer -= dt;
      if (this.criticalTimer <= 0) {
        this.isCritical = false;
        this.scene.triggerMissionFailed('Facility reinforcements overwhelmed your position.');
      }
    }
  }

  reset() {
    this.level = 0;
    this.decayTimer = 0;
    this.isCritical = false;
    this.criticalTimer = 10;
  }
}
