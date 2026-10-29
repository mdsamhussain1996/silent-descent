// src/render/Renderer.js
// High-performance Three.js WebGL renderer with dynamic resolution scaling (DRS)

import * as THREE from 'three';
import { settings } from '../core/Settings.js';

export class GameRenderer {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050810);

    const preset = settings.getPreset();
    this.renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: preset.antialias,
      stencil: false,
      depth: true
    });

    const dpr = Math.min(window.devicePixelRatio || 1, preset.pixelRatioMax);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    // Shadows
    if (preset.shadows) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    container.appendChild(this.renderer.domElement);

    // Dynamic Resolution Scaling (DRS)
    this.currentScale = 1.0;
    this.overbudgetTimer = 0;
    this.underbudgetTimer = 0;

    window.addEventListener('resize', () => this.onResize());
  }

  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.setSize(width, height);
  }

  updateDRS(frameTimeMs) {
    // If frame time > 16.6ms for over 1s, drop to 0.75 scale
    if (frameTimeMs > 17.0) {
      this.overbudgetTimer += frameTimeMs / 1000;
      this.underbudgetTimer = 0;
      if (this.overbudgetTimer > 1.0 && this.currentScale > 0.75) {
        this.currentScale = 0.75;
        this.applyScale();
      }
    } else {
      this.underbudgetTimer += frameTimeMs / 1000;
      this.overbudgetTimer = 0;
      if (this.underbudgetTimer > 2.5 && this.currentScale < 1.0) {
        this.currentScale = 1.0;
        this.applyScale();
      }
    }
  }

  applyScale() {
    const width = Math.floor(window.innerWidth * this.currentScale);
    const height = Math.floor(window.innerHeight * this.currentScale);
    this.renderer.setSize(width, height, false);
  }

  render(camera) {
    this.renderer.render(this.scene, camera);
  }

  getDrawCalls() {
    return this.renderer.info.render.calls;
  }

  getTriangles() {
    return this.renderer.info.render.triangles;
  }
}
