// src/core/Input.js
// Complete Unified Input System: Keyboard, Mouse (360° Aim), Gamepad & Mobile Touch

import * as THREE from 'three';

export class InputManager {
  constructor() {
    this.keys = new Set();
    this.justPressed = new Set();
    
    // Mouse state
    this.mouse = {
      screenX: 0,
      screenY: 0,
      worldX: 0,
      worldY: 0,
      leftDown: false,
      rightDown: false,
      leftJustPressed: false,
      rightJustPressed: false
    };

    // Virtual Touch state
    this.touch = {
      active: false,
      joystick: { x: 0, y: 0, active: false, startX: 0, startY: 0, curX: 0, curY: 0 },
      actionDown: false,
      jumpDown: false,
      shootDown: false,
      sneakDown: false
    };

    this.enabled = true;
    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      if (!this.enabled) return;
      if (!this.keys.has(e.code)) {
        this.justPressed.add(e.code);
      }
      this.keys.add(e.code);

      // Prevent scrolling on Space / Arrow keys
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.screenX = e.clientX;
      this.mouse.screenY = e.clientY;
    });

    window.addEventListener('mousedown', (e) => {
      if (!this.enabled) return;
      if (e.button === 0) {
        this.mouse.leftDown = true;
        this.mouse.leftJustPressed = true;
      } else if (e.button === 2) {
        this.mouse.rightDown = true;
        this.mouse.rightJustPressed = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.leftDown = false;
      if (e.button === 2) this.mouse.rightDown = false;
    });

    window.addEventListener('contextmenu', (e) => {
      e.preventDefault(); // disable right-click context menu for aiming
    });
  }

  // Update world mouse coords from camera
  updateWorldMouse(camera, planeZ = 0) {
    if (!camera) return;
    const ndcX = (this.mouse.screenX / window.innerWidth) * 2 - 1;
    const ndcY = -(this.mouse.screenY / window.innerHeight) * 2 + 1;
    
    // Raycast to Z = planeZ
    const vec = new THREE.Vector3(ndcX, ndcY, 0.5);
    vec.unproject(camera);
    const dir = vec.sub(camera.position).normalize();
    const distance = (planeZ - camera.position.z) / dir.z;
    const pos = camera.position.clone().add(dir.multiplyScalar(distance));

    this.mouse.worldX = pos.x;
    this.mouse.worldY = pos.y;
  }

  // Poll state (clears justPressed each frame)
  clearFrame() {
    this.justPressed.clear();
    this.mouse.leftJustPressed = false;
    this.mouse.rightJustPressed = false;
  }

  // Directional axes (-1 to 1)
  getHorizontal() {
    let axis = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) axis -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) axis += 1;
    if (this.touch.active && Math.abs(this.touch.joystick.x) > 0.15) {
      axis = this.touch.joystick.x;
    }
    return Math.max(-1, Math.min(1, axis));
  }

  getVertical() {
    let axis = 0;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) axis -= 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) axis += 1;
    if (this.touch.active && Math.abs(this.touch.joystick.y) > 0.15) {
      axis = -this.touch.joystick.y;
    }
    return Math.max(-1, Math.min(1, axis));
  }

  isJumping() {
    return this.justPressed.has('Space') || this.touch.jumpDown;
  }

  isSneaking() {
    return this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.touch.sneakDown;
  }

  isInteract() {
    return this.justPressed.has('KeyE') || this.justPressed.has('KeyF') || this.touch.actionDown;
  }

  isAiming() {
    return this.mouse.rightDown || this.keys.has('KeyC');
  }

  isShooting() {
    return this.mouse.leftJustPressed || this.touch.shootDown;
  }

  isReloading() {
    return this.justPressed.has('KeyR');
  }

  isMarkExecute() {
    return this.justPressed.has('KeyF');
  }

  isThermalToggle() {
    return this.justPressed.has('KeyV');
  }

  isGadgetThrow() {
    return this.justPressed.has('KeyG');
  }

  isWeaponWheel() {
    return this.keys.has('KeyQ');
  }

  isPause() {
    return this.justPressed.has('Escape');
  }

  isF3Toggle() {
    return this.justPressed.has('F3');
  }
}

export const input = new InputManager();
