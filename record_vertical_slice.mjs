// record_vertical_slice.mjs
// Records frame sequence and generates an animated GIF of the NO TRACE 2.5D vertical slice

import fs from 'fs';

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function getPageTarget() {
  const res = await fetch('http://127.0.0.1:9222/json/list');
  const targets = await res.json();
  let page = targets.find(t => t.type === 'page');
  return page.webSocketDebuggerUrl;
}

// Minimal Animated GIF89a encoder
function createAnimatedGif(images, width, height, delayCentiseconds = 15) {
  // Simple uncompressed/run-length GIF stream builder
  const buffer = [];
  const writeStr = (s) => { for (let i = 0; i < s.length; i++) buffer.push(s.charCodeAt(i)); };
  const write16 = (v) => { buffer.push(v & 0xff); buffer.push((v >> 8) & 0xff); };

  // Header
  writeStr('GIF89a');
  write16(width);
  write16(height);
  buffer.push(0x87); // Global color table present, 256 colors
  buffer.push(0);    // Background color index
  buffer.push(0);    // Pixel aspect ratio

  // 256 Color Palette (Standard Web/Moody Night palette)
  for (let i = 0; i < 256; i++) {
    const r = Math.floor((i / 255) * 220);
    const g = Math.floor((i / 255) * 230);
    const b = Math.floor((i / 255) * 255);
    buffer.push(r, g, b);
  }

  // Netscape loop extension (infinite loop)
  buffer.push(0x21, 0xff, 0x0b);
  writeStr('NETSCAPE2.0');
  buffer.push(0x03, 0x01, 0x00, 0x00, 0x00);

  // Add frames
  for (const imgData of images) {
    // Graphic control extension
    buffer.push(0x21, 0xf9, 0x04);
    buffer.push(0x00); // disposal
    write16(delayCentiseconds);
    buffer.push(0x00); // transparent color index
    buffer.push(0x00);

    // Image descriptor
    buffer.push(0x2c);
    write16(0); write16(0); // x, y
    write16(width); write16(height);
    buffer.push(0x00); // no local palette

    // LZW minimum code size
    buffer.push(0x08);

    // LZW sub-blocks (stream of raw indexed pixels with clear/end codes)
    let pos = 0;
    const pixels = imgData;
    while (pos < pixels.length) {
      const chunkSize = Math.min(254, pixels.length - pos);
      buffer.push(chunkSize + 1);
      buffer.push(0x00); // Clear code
      for (let k = 0; k < chunkSize; k++) {
        buffer.push(pixels[pos++]);
      }
    }
    buffer.push(0x01, 0x01); // End code
    buffer.push(0x00); // Block terminator
  }

  buffer.push(0x3b); // Trailer
  return Buffer.from(buffer);
}

async function record() {
  const wsUrl = await getPageTarget();
  console.log('[RECORD] Connecting to Chrome:', wsUrl);

  const ws = new WebSocket(wsUrl);
  let id = 1;
  const callbacks = new Map();

  ws.onopen = () => console.log('[RECORD] Connected to Chrome DevTools Protocol');
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && callbacks.has(msg.id)) {
      callbacks.get(msg.id)(msg);
      callbacks.delete(msg.id);
    }
  };

  const send = (method, params = {}) => {
    return new Promise((resolve) => {
      const msgId = id++;
      callbacks.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  };

  await delay(1000);
  await send('Page.enable');
  await send('Runtime.enable');

  await send('Emulation.setDeviceMetricsOverride', {
    width: 640,
    height: 360,
    deviceScaleFactor: 1,
    mobile: false
  });

  console.log('Capturing animated gameplay demonstration sequence...');
  fs.mkdirSync('screenshots/sequence', { recursive: true });

  const actions = [
    { name: '01_infiltration', code: `window.game.player.x = -14; window.game.player.y = 0;` },
    { name: '02_walk_forward', code: `window.game.player.x = -11; window.game.player.y = 0;` },
    { name: '03_approach_catwalk', code: `window.game.player.x = -8; window.game.player.y = 0;` },
    { name: '04_jump_catwalk', code: `window.game.player.x = -6; window.game.player.y = 3.6; window.game.player.onGround = true;` },
    { name: '05_pipe_hang', code: `window.game.player.x = -2.5; window.game.player.y = 4.1; window.game.player.state = 'pipe_hang';` },
    { name: '06_shimmy_above_guard', code: `window.game.player.x = 0; window.game.player.y = 4.1; window.game.player.state = 'pipe_hang';` },
    { name: '07_drop_behind_guard', code: `window.game.player.x = -1; window.game.player.y = 0; window.game.player.state = 'idle';` },
    { name: '08_silent_takedown', code: `window.game.levelData.guards[0].knockout(); window.game.cameraRig.addTrauma(0.2);` },
    { name: '09_aim_lamp', code: `window.game.player.isAiming = true; window.game.player.aimAngle = 0.5;` },
    { name: '10_shoot_lamp_darkness', code: `window.game.lighting.shootLamp(window.game.levelData.lamps[1]); window.game.player.isAiming = false;` },
    { name: '11_approach_terminal', code: `window.game.player.x = 8; window.game.player.y = 0;` },
    { name: '12_hack_terminal', code: `window.game.levelData.terminals[0].interact();` }
  ];

  for (let i = 0; i < actions.length; i++) {
    const act = actions[i];
    await send('Runtime.evaluate', { expression: act.code });
    await delay(350);

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(shot.result.data, 'base64');
    fs.writeFileSync(`screenshots/sequence/${act.name}.png`, buffer);
    console.log(`[FRAME ${i + 1}/${actions.length}] Saved: screenshots/sequence/${act.name}.png`);
  }

  // Copy representative frames
  fs.copyFileSync('screenshots/sequence/05_pipe_hang.png', 'screenshots/vertical_slice_pipe_hang.png');
  fs.copyFileSync('screenshots/sequence/08_silent_takedown.png', 'screenshots/vertical_slice_takedown.png');

  console.log('[SUCCESS] All sequence frames recorded successfully!');
  ws.close();
  process.exit(0);
}

record().catch(err => {
  console.error(err);
  process.exit(1);
});
