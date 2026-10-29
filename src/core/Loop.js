// src/core/Loop.js
// Rock-solid 60Hz fixed-step loop decoupled from variable monitor refresh rates

export class FixedStepLoop {
  constructor(updateFn, renderFn) {
    this.updateFn = updateFn;
    this.renderFn = renderFn;

    this.fixedDt = 1 / 60; // 60 Hz physics
    this.maxFrameTime = 0.1; // clamp to 100ms max to prevent death spiral
    this.accumulator = 0;
    this.lastTime = 0;
    this.running = false;
    this.rafId = null;

    // Profiling
    this.fps = 60;
    this.frameTime = 16.6;
    this.frameCount = 0;
    this.fpsTimer = 0;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now() / 1000;
    this.fpsTimer = performance.now();
    this.frameCount = 0;

    const tick = (nowMs) => {
      if (!this.running) return;

      const now = nowMs / 1000;
      let frameTime = now - this.lastTime;
      this.lastTime = now;

      if (frameTime > this.maxFrameTime) {
        frameTime = this.maxFrameTime;
      }

      this.accumulator += frameTime;

      // Fixed 60Hz physics ticks
      while (this.accumulator >= this.fixedDt) {
        this.updateFn(this.fixedDt);
        this.accumulator -= this.fixedDt;
      }

      // Interpolation alpha between ticks
      const alpha = this.accumulator / this.fixedDt;
      this.renderFn(alpha);

      // FPS calculation
      this.frameCount++;
      const elapsed = nowMs - this.fpsTimer;
      if (elapsed >= 500) {
        this.fps = Math.round((this.frameCount * 1000) / elapsed);
        this.frameTime = Number((elapsed / this.frameCount).toFixed(1));
        this.frameCount = 0;
        this.fpsTimer = nowMs;
      }

      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);
  }

  stop() {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}
