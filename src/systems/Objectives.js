// src/systems/Objectives.js
// Dynamic Mission Objective Engine with edge-screen compass tracking

export class ObjectiveManager {
  constructor(scene, missionConfig) {
    this.scene = scene;
    this.missionId = missionConfig.id || 'm1';
    this.title = missionConfig.title || 'Mission';

    // Primary objectives list
    this.primary = (missionConfig.primary || []).map(obj => ({
      ...obj,
      completed: false,
      visible: obj.visible !== false
    }));

    // Secondary objectives list
    this.secondary = (missionConfig.secondary || []).map(obj => ({
      ...obj,
      completed: false,
      failed: false
    }));

    // Stats for evaluation
    this.stats = {
      alarmsRaised: 0,
      kills: 0,
      nonLethalTakedowns: 0,
      camerasDisabled: 0,
      intelFound: 0,
      totalIntel: missionConfig.totalIntel || 3,
      missionTime: 0,
      hostageSaved: false,
      criticalAlarmTimer: 0
    };

    this.isMissionFailed = false;
    this.isMissionComplete = false;
    this.activePrimaryIndex = 0;
  }

  update(dt) {
    if (this.isMissionComplete || this.isMissionFailed) return;

    this.stats.missionTime += dt;

    // Monitor Fail Condition: Critical Alarm level 3 for 15s
    if (this.scene.alarm && this.scene.alarm.level === 3) {
      this.stats.criticalAlarmTimer += dt;
      if (this.stats.criticalAlarmTimer >= 15) {
        this.failMission('REINFORCEMENTS OVERWHELMED COMPOUND (Alarm Level 3 for 15s)');
        return;
      }
    } else {
      this.stats.criticalAlarmTimer = 0;
    }

    // Monitor Secondary: Time limit
    const timeLimitObj = this.secondary.find(o => o.type === 'time_limit');
    if (timeLimitObj && this.stats.missionTime > timeLimitObj.seconds) {
      timeLimitObj.failed = true;
    }
  }

  completePrimary(id) {
    const obj = this.primary.find(o => o.id === id);
    if (!obj || obj.completed) return;

    obj.completed = true;
    console.log(`[Objectives] Primary Completed: ${obj.text}`);

    // Update active primary pointer to next incomplete visible objective
    this.updateActivePrimary();

    // Trigger radio announcement if configured
    if (obj.radioOnComplete && this.scene.radio) {
      this.scene.radio.queue(obj.radioOnComplete);
    }

    // Check if new mid-mission objectives unlock
    if (obj.unlocksObjective) {
      const nextObj = this.primary.find(o => o.id === obj.unlocksObjective);
      if (nextObj) {
        nextObj.visible = true;
        if (nextObj.radioOnReveal && this.scene.radio) {
          this.scene.radio.queue(nextObj.radioOnReveal);
        }
      }
    }

    // Check if all primary objectives are completed
    const allDone = this.primary.every(o => o.completed);
    if (allDone) {
      this.checkMissionSuccess();
    }

    // Notify HUD
    if (this.scene.hud) {
      this.scene.hud.refreshObjectives();
    }
  }

  updateActivePrimary() {
    for (let i = 0; i < this.primary.length; i++) {
      if (this.primary[i].visible && !this.primary[i].completed) {
        this.activePrimaryIndex = i;
        return;
      }
    }
  }

  getActivePrimary() {
    for (const obj of this.primary) {
      if (obj.visible && !obj.completed) {
        return obj;
      }
    }
    return null;
  }

  onAlarmTriggered() {
    this.stats.alarmsRaised++;
    const noAlarmObj = this.secondary.find(o => o.type === 'no_alarms');
    if (noAlarmObj) {
      noAlarmObj.failed = true;
    }
    if (this.scene.hud) this.scene.hud.refreshObjectives();
  }

  onEnemyKilled() {
    this.stats.kills++;
    const noKillsObj = this.secondary.find(o => o.type === 'no_kills');
    if (noKillsObj) {
      noKillsObj.failed = true;
    }
    if (this.scene.hud) this.scene.hud.refreshObjectives();
  }

  onCameraDisabled() {
    this.stats.camerasDisabled++;
    const camObj = this.secondary.find(o => o.type === 'cameras');
    if (camObj && this.stats.camerasDisabled >= (camObj.targetCount || 4)) {
      camObj.completed = true;
    }
    if (this.scene.hud) this.scene.hud.refreshObjectives();
  }

  onIntelCollected() {
    this.stats.intelFound++;
    const intelObj = this.secondary.find(o => o.type === 'intel');
    if (intelObj && this.stats.intelFound >= (intelObj.targetCount || 3)) {
      intelObj.completed = true;
    }
    if (this.scene.hud) this.scene.hud.refreshObjectives();
  }

  failMission(reason) {
    if (this.isMissionFailed || this.isMissionComplete) return;
    this.isMissionFailed = true;
    console.warn(`[Objectives] Mission Failed: ${reason}`);

    this.scene.cameras.main.fade(800, 20, 0, 0);
    this.scene.time.delayedCall(900, () => {
      this.scene.scene.stop('HUDScene');
      this.scene.scene.start('MissionFailedScene', {
        reason: reason,
        missionId: this.missionId
      });
    });
  }

  checkMissionSuccess() {
    if (this.isMissionComplete || this.isMissionFailed) return;
    this.isMissionComplete = true;

    // Check secondary objectives pass criteria
    const noAlarmObj = this.secondary.find(o => o.type === 'no_alarms');
    if (noAlarmObj && this.stats.alarmsRaised === 0) noAlarmObj.completed = true;

    const noKillsObj = this.secondary.find(o => o.type === 'no_kills');
    if (noKillsObj && this.stats.kills === 0) noKillsObj.completed = true;

    const timeObj = this.secondary.find(o => o.type === 'time_limit');
    if (timeObj && !timeObj.failed) timeObj.completed = true;

    // Calculate rating & rank
    let rank = 'ROOKIE';
    let credits = 500;
    const completedSecondaries = this.secondary.filter(s => s.completed).length;

    if (this.stats.alarmsRaised === 0 && this.stats.kills === 0 && completedSecondaries >= 3) {
      rank = 'NO TRACE';
      credits = 2500;
    } else if (this.stats.alarmsRaised === 0 && this.stats.kills === 0) {
      rank = 'GHOST';
      credits = 1800;
    } else if (this.stats.alarmsRaised <= 2) {
      rank = 'AGENT';
      credits = 1000;
    }

    console.log(`[Objectives] Mission Complete! Rank: ${rank}, Credits: ${credits}`);

    this.scene.time.delayedCall(1500, () => {
      this.scene.scene.stop('HUDScene');
      this.scene.scene.start('MissionCompleteScene', {
        missionId: this.missionId,
        rank: rank,
        credits: credits,
        stats: this.stats,
        primary: this.primary,
        secondary: this.secondary
      });
    });
  }
}
