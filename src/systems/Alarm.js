import { audioSystem } from './Audio.js';

export class AlarmSystem {
  constructor(scene) {
    this.scene = scene;
    this.level = 0; // 0, 1, 2, 3
    this.decayTimer = 0; // 60s to decay 1 level
    this.totalAlarmsTriggered = 0;
    this.criticalTimer = 15; // 15s countdown at level 3
    this.isCritical = false;
    this.raising = false; // re-entrancy protection
  }

  raise(reason = 'detection', source = null) {
    if (this.raising) return;
    this.raising = true;

    try {
      this.level = Math.min(3, this.level + 1);
      this.totalAlarmsTriggered++;
      this.decayTimer = 60; // reset decay timer

      audioSystem.playAlarmSiren();
      audioSystem.setSuspicionState(2);

      if (this.level === 3) {
        this.isCritical = true;
        this.criticalTimer = 15;
      }

      // Alert nearby guards within ~600 px (or same section)
      if (this.scene.guards) {
        const sourceX = source && typeof source.x === 'number' 
          ? source.x 
          : (this.scene.player ? this.scene.player.x : 0);
        this.scene.guards.getChildren().forEach(g => {
          if (!g.isKnockedOut && !g.isDead) {
            const dist = Math.abs(g.x - sourceX);
            if (dist <= 600) {
              g.setAlertState(true);
            }
          }
        });
      }

      // Notify HUD
      if (this.scene.hud) {
        this.scene.hud.onAlarmChange(this.level, reason);
      }
    } finally {
      this.raising = false;
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
