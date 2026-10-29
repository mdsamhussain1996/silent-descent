// src/ui/OverlayF3.js
// Built-in F3 Profiler: FPS, Frame time, Draw calls, Triangles & Memory

export class PerformanceOverlay {
  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'perf-overlay';
    this.container.style.cssText = `
      position: fixed;
      top: 10px; left: 10px;
      background: rgba(3, 7, 18, 0.92);
      border: 1px solid #10b981;
      padding: 8px 12px;
      font-family: 'Share Tech Mono', monospace;
      font-size: 11px;
      color: #10b981;
      z-index: 99999;
      pointer-events: none;
      line-height: 1.4;
      border-radius: 4px;
      display: none;
      box-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
    `;

    this.container.innerHTML = `
      <div style="font-weight: bold; color: #f8fafc; margin-bottom: 4px;">NO TRACE // ENGINE PROFILER (F3)</div>
      <div>FPS: <span id="f3-fps" style="color: #38bdf8;">60</span> (<span id="f3-ft">16.6</span> ms)</div>
      <div>DRAW CALLS: <span id="f3-draws">0</span> / 150</div>
      <div>TRIANGLES: <span id="f3-tris">0</span> / 300k</div>
      <div>RENDER SCALE: <span id="f3-scale">1.0</span></div>
      <div>RESOLUTION: <span id="f3-res">1920x1080</span></div>
    `;

    document.body.appendChild(this.container);

    this.fpsEl = document.getElementById('f3-fps');
    this.ftEl = document.getElementById('f3-ft');
    this.drawsEl = document.getElementById('f3-draws');
    this.trisEl = document.getElementById('f3-tris');
    this.scaleEl = document.getElementById('f3-scale');
    this.resEl = document.getElementById('f3-res');

    this.visible = false;
  }

  toggle() {
    this.visible = !this.visible;
    this.container.style.display = this.visible ? 'block' : 'none';
  }

  update(loop, renderer) {
    if (!this.visible) return;
    this.fpsEl.textContent = loop.fps;
    this.fpsEl.style.color = loop.fps >= 58 ? '#10b981' : (loop.fps >= 45 ? '#f59e0b' : '#ef4444');
    this.ftEl.textContent = loop.frameTime;

    const draws = renderer.getDrawCalls();
    this.drawsEl.textContent = draws;
    this.drawsEl.style.color = draws <= 150 ? '#10b981' : '#ef4444';

    const tris = renderer.getTriangles();
    this.trisEl.textContent = (tris / 1000).toFixed(1) + 'k';
    this.trisEl.style.color = tris <= 300000 ? '#10b981' : '#ef4444';

    this.scaleEl.textContent = renderer.currentScale.toFixed(2);
    this.resEl.textContent = `${window.innerWidth}x${window.innerHeight}`;
  }
}
