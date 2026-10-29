// src/ui/TouchControls.js
// Mobile multi-touch virtual joystick & tactile action buttons

import { input } from '../core/Input.js';

export class TouchControls {
  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'touch-controls';
    this.container.style.cssText = `
      position: fixed;
      bottom: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none;
      z-index: 9999;
      display: none;
    `;

    // Only show on touch devices
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      this.container.style.display = 'block';
      input.touch.active = true;
    }

    this.container.innerHTML = `
      <!-- JOYSTICK ZONE (LEFT) -->
      <div id="touch-joystick-zone" style="position: absolute; bottom: 20px; left: 24px; width: 120px; height: 120px; border-radius: 60px; background: rgba(15, 23, 42, 0.4); border: 2px solid rgba(56, 189, 248, 0.3); pointer-events: auto;">
        <div id="touch-thumb" style="position: absolute; top: 35px; left: 35px; width: 50px; height: 50px; border-radius: 25px; background: rgba(56, 189, 248, 0.7); box-shadow: 0 0 10px rgba(56,189,248,0.5);"></div>
      </div>

      <!-- ACTION BUTTONS (RIGHT) -->
      <div style="position: absolute; bottom: 20px; right: 24px; display: grid; grid-template-columns: repeat(2, 60px); gap: 12px; pointer-events: auto;">
        <button id="btn-touch-action" style="width: 60px; height: 60px; border-radius: 30px; background: rgba(16, 185, 129, 0.4); border: 2px solid #10b981; color: #f8fafc; font-family: monospace; font-weight: bold; font-size: 13px;">ACT</button>
        <button id="btn-touch-jump" style="width: 60px; height: 60px; border-radius: 30px; background: rgba(56, 189, 248, 0.4); border: 2px solid #38bdf8; color: #f8fafc; font-family: monospace; font-weight: bold; font-size: 13px;">JUMP</button>
        <button id="btn-touch-sneak" style="width: 60px; height: 60px; border-radius: 30px; background: rgba(245, 158, 11, 0.4); border: 2px solid #f59e0b; color: #f8fafc; font-family: monospace; font-weight: bold; font-size: 13px;">SNEAK</button>
        <button id="btn-touch-shoot" style="width: 60px; height: 60px; border-radius: 30px; background: rgba(239, 68, 68, 0.4); border: 2px solid #ef4444; color: #f8fafc; font-family: monospace; font-weight: bold; font-size: 13px;">FIRE</button>
      </div>
    `;

    document.body.appendChild(this.container);
    this.bindEvents();
  }

  bindEvents() {
    const joyZone = document.getElementById('touch-joystick-zone');
    const thumb = document.getElementById('touch-thumb');

    let touchId = null;
    let centerX = 0;
    let centerY = 0;

    joyZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      touchId = t.identifier;
      const rect = joyZone.getBoundingClientRect();
      centerX = rect.left + rect.width / 2;
      centerY = rect.top + rect.height / 2;
      this.updateThumb(t.clientX, t.clientY, centerX, centerY, thumb);
    });

    joyZone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === touchId) {
          this.updateThumb(t.clientX, t.clientY, centerX, centerY, thumb);
          break;
        }
      }
    });

    const resetJoy = () => {
      touchId = null;
      input.touch.joystick.x = 0;
      input.touch.joystick.y = 0;
      thumb.style.left = '35px';
      thumb.style.top = '35px';
    };

    joyZone.addEventListener('touchend', resetJoy);
    joyZone.addEventListener('touchcancel', resetJoy);

    // Buttons
    this.bindBtn('btn-touch-action', (val) => input.touch.actionDown = val);
    this.bindBtn('btn-touch-jump', (val) => input.touch.jumpDown = val);
    this.bindBtn('btn-touch-sneak', (val) => input.touch.sneakDown = val);
    this.bindBtn('btn-touch-shoot', (val) => input.touch.shootDown = val);
  }

  updateThumb(clientX, clientY, centerX, centerY, thumb) {
    const maxRadius = 40;
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    thumb.style.left = `${35 + dx}px`;
    thumb.style.top = `${35 + dy}px`;

    input.touch.joystick.x = dx / maxRadius;
    input.touch.joystick.y = dy / maxRadius;
  }

  bindBtn(id, setFn) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('touchstart', (e) => {
      e.preventDefault();
      setFn(true);
    });
    el.addEventListener('touchend', (e) => {
      e.preventDefault();
      setFn(false);
    });
  }
}
