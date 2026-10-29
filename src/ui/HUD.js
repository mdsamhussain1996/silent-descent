// src/ui/HUD.js
// Minimal tactical HUD (auto-hides when calm, original design)

export class TacticalHUD {
  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'hud-container';
    this.container.style.cssText = `
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none;
      font-family: 'Share Tech Mono', monospace;
      color: #f8fafc;
      z-index: 1000;
    `;

    this.container.innerHTML = `
      <!-- TOP LEFT: TIMER & INTEL -->
      <div style="position: absolute; top: 12px; left: 16px; background: rgba(5,8,16,0.85); padding: 6px 12px; border: 1px solid #1e293b; border-radius: 4px; display: flex; gap: 16px;">
        <span id="hud-timer" style="color: #f8fafc; font-size: 13px;">TIME: 00:00</span>
        <span id="hud-intel" style="color: #f59e0b; font-size: 13px;">INTEL: 0/3</span>
      </div>

      <!-- TOP RIGHT: OBJECTIVES -->
      <div id="hud-objectives" style="position: absolute; top: 12px; right: 16px; background: rgba(5,8,16,0.88); padding: 8px 14px; border: 1px solid #1e293b; border-radius: 4px; min-width: 240px;">
        <div style="font-size: 11px; color: #f59e0b; letter-spacing: 1px; font-weight: bold; margin-bottom: 4px;">PRIMARY OBJECTIVES</div>
        <div id="hud-obj-list" style="font-size: 12px; line-height: 1.5; color: #94a3b8;">
          <div><span style="color:#38bdf8;">◈</span> Infiltrate Kestrel Warehouse</div>
          <div><span style="color:#64748b;">◇</span> Hack Security Terminal</div>
          <div><span style="color:#64748b;">◇</span> Eliminate Threat & Secure Sector</div>
        </div>
      </div>

      <!-- BOTTOM LEFT: HP & LIGHT METER -->
      <div style="position: absolute; bottom: 14px; left: 16px; background: rgba(5,8,16,0.88); padding: 8px 14px; border: 1px solid #1e293b; border-radius: 4px; display: flex; align-items: center; gap: 12px;">
        <div style="font-size: 11px; color: #38bdf8;">LIFE</div>
        <div style="width: 80px; height: 6px; background: #0f172a; border-radius: 2px; overflow: hidden;">
          <div id="hud-hp-bar" style="width: 100%; height: 100%; background: #10b981; transition: width 0.15s;"></div>
        </div>
        <div style="font-size: 11px; color: #f59e0b; margin-left: 8px;">LIGHT</div>
        <div style="width: 50px; height: 6px; background: #0f172a; border-radius: 2px; overflow: hidden;">
          <div id="hud-light-bar" style="width: 25%; height: 100%; background: #38bdf8; transition: width 0.15s;"></div>
        </div>
        <span id="hud-stealth-badge" style="font-size: 10px; color: #10b981; margin-left: 4px;">HIDDEN</span>
      </div>

      <!-- BOTTOM CENTRE: ALARM STATUS -->
      <div style="position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%); background: rgba(5,8,16,0.88); padding: 6px 16px; border: 1px solid #1e293b; border-radius: 4px; display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 11px; color: #94a3b8;">SECURITY THREAT:</span>
        <div style="display: flex; gap: 4px;">
          <div id="hud-alarm-seg1" style="width: 14px; height: 8px; background: #1e293b; border-radius: 1px;"></div>
          <div id="hud-alarm-seg2" style="width: 14px; height: 8px; background: #1e293b; border-radius: 1px;"></div>
          <div id="hud-alarm-seg3" style="width: 14px; height: 8px; background: #1e293b; border-radius: 1px;"></div>
        </div>
        <span id="hud-alarm-text" style="font-size: 11px; color: #10b981; font-weight: bold;">CALM</span>
      </div>

      <!-- BOTTOM RIGHT: WEAPONS & GADGETS -->
      <div style="position: absolute; bottom: 14px; right: 16px; background: rgba(5,8,16,0.88); padding: 8px 14px; border: 1px solid #1e293b; border-radius: 4px; display: flex; align-items: center; gap: 14px;">
        <div>
          <span style="font-size: 10px; color: #94a3b8;">SILENCED 9MM</span>
          <div id="hud-ammo" style="font-size: 13px; color: #f8fafc; font-weight: bold;">8 / 32</div>
        </div>
        <div style="border-left: 1px solid #1e293b; padding-left: 10px;">
          <span style="font-size: 10px; color: #94a3b8;">TASER [G]</span>
          <div id="hud-gadget" style="font-size: 12px; color: #38bdf8;">3 CHARGES</div>
        </div>
      </div>

      <!-- CONTEXTUAL INTERACTION POPUP -->
      <div id="hud-prompt" style="display: none; position: absolute; transform: translate(-50%, -100%); background: rgba(5,8,16,0.92); border: 1px solid #00f0ff; color: #f8fafc; padding: 4px 10px; border-radius: 3px; font-size: 11px; pointer-events: none; white-space: nowrap; box-shadow: 0 0 10px rgba(0,240,255,0.4);">
        [E] INTERACT
      </div>
    `;

    document.body.appendChild(this.container);

    this.timerEl = document.getElementById('hud-timer');
    this.hpBarEl = document.getElementById('hud-hp-bar');
    this.lightBarEl = document.getElementById('hud-light-bar');
    this.stealthBadgeEl = document.getElementById('hud-stealth-badge');
    this.alarmSegs = [
      document.getElementById('hud-alarm-seg1'),
      document.getElementById('hud-alarm-seg2'),
      document.getElementById('hud-alarm-seg3')
    ];
    this.alarmTextEl = document.getElementById('hud-alarm-text');
    this.ammoEl = document.getElementById('hud-ammo');
    this.promptEl = document.getElementById('hud-prompt');
  }

  showPrompt(screenX, screenY, text) {
    this.promptEl.style.display = 'block';
    this.promptEl.style.left = `${screenX}px`;
    this.promptEl.style.top = `${screenY - 30}px`;
    this.promptEl.textContent = text;
  }

  hidePrompt() {
    this.promptEl.style.display = 'none';
  }

  update(player, alarm, missionTimeSec, camera) {
    // Timer
    const m = Math.floor(missionTimeSec / 60);
    const s = Math.floor(missionTimeSec % 60);
    this.timerEl.textContent = `TIME: ${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    // HP Bar
    const hpPct = Math.max(0, Math.min(100, player.hp));
    this.hpBarEl.style.width = `${hpPct}%`;
    this.hpBarEl.style.background = hpPct > 50 ? '#10b981' : (hpPct > 25 ? '#f59e0b' : '#ef4444');

    // Light Meter
    const lightPct = Math.round(player.visibility * 100);
    this.lightBarEl.style.width = `${lightPct}%`;
    if (lightPct < 35) {
      this.stealthBadgeEl.textContent = 'HIDDEN';
      this.stealthBadgeEl.style.color = '#10b981';
      this.lightBarEl.style.background = '#10b981';
    } else if (lightPct < 70) {
      this.stealthBadgeEl.textContent = 'SHADOWED';
      this.stealthBadgeEl.style.color = '#f59e0b';
      this.lightBarEl.style.background = '#f59e0b';
    } else {
      this.stealthBadgeEl.textContent = 'EXPOSED';
      this.stealthBadgeEl.style.color = '#ef4444';
      this.lightBarEl.style.background = '#ef4444';
    }

    // Alarm Threat Segments
    const lvl = alarm ? alarm.level : 0;
    this.alarmSegs.forEach((seg, i) => {
      if (i < lvl) {
        seg.style.background = lvl === 1 ? '#f59e0b' : (lvl === 2 ? '#f97316' : '#ef4444');
      } else {
        seg.style.background = '#1e293b';
      }
    });
    this.alarmTextEl.textContent = lvl === 0 ? 'CALM' : `THREAT LVL ${lvl}`;
    this.alarmTextEl.style.color = lvl === 0 ? '#10b981' : (lvl === 1 ? '#f59e0b' : '#ef4444');
  }

  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
