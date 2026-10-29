// src/systems/Alarm.js
// 3-Level Alarm System with Re-entrancy Recursion Guard & Proximity Alerting

import { audio } from '../core/Audio.js';
import { events } from '../core/Events.js';

export class AlarmSystem {
  constructor(lightingSystem) {
    this.lighting = lightingSystem;
    this.level = 0; // 0 = calm, 1 = search, 2 = reinforcements, 3 = lockdown
    this.calmTimer = 0;
    this.raising = false; // RE-ENTRANCY RECURSION GUARD (§1)
    this.guards = [];
  }

  setGuards(guardsList) {
    this.guards = guardsList;
  }

  // Raise alarm level with recursion guard and proximity filtering
  raise(sourceX = 0, sourceY = 0) {
    if (this.raising) return; // Prevent infinite re-entrancy
    this.raising = true;

    try {
      this.level = Math.min(3, this.level + 1);
      this.calmTimer = 60.0; // 60s before decaying one level

      if (this.lighting) {
        this.lighting.setAlarmState(this.level > 0);
      }

      audio.playAlarmSiren();
      events.emit('alarm_raised', { level: this.level, x: sourceX, y: sourceY });

      // Alert only guards within ~20m radius (or all if Level 3)
      const alertRadius = this.level === 3 ? 999 : 20.0;
      for (let i = 0; i < this.guards.length; i++) {
        const g = this.guards[i];
        if (g.state === 'knocked') continue;
        const dist = Math.hypot(g.x - sourceX, g.y - sourceY);
        if (dist <= alertRadius) {
          // Pass fromAlarm = true to prevent re-entering AlarmSystem.raise()
          g.setAlertState(true);
        }
      }
    } finally {
      this.raising = false;
    }
  }

  update(dt) {
    if (this.level > 0) {
      this.calmTimer -= dt;
      if (this.calmTimer <= 0) {
        this.level = Math.max(0, this.level - 1);
        if (this.level > 0) {
          this.calmTimer = 60.0;
        } else if (this.lighting) {
          this.lighting.setAlarmState(false);
        }
        events.emit('alarm_decayed', { level: this.level });
      }
    }
  }
}
