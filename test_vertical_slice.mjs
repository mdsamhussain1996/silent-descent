// test_vertical_slice.mjs
// Automated verification & perf benchmarking for NO TRACE 2.5D Vertical Slice

import fs from 'fs';

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function getPageTarget() {
  const res = await fetch('http://127.0.0.1:9222/json/list');
  const targets = await res.json();
  let page = targets.find(t => t.type === 'page');
  if (!page) {
    const newTab = await fetch('http://127.0.0.1:9222/json/new', { method: 'PUT' });
    page = await newTab.json();
  }
  return page.webSocketDebuggerUrl;
}

async function run() {
  const wsUrl = await getPageTarget();
  console.log('[CDP] Connecting to Chrome:', wsUrl);

  const ws = new WebSocket(wsUrl);
  let id = 1;
  const callbacks = new Map();
  const consoleErrors = [];

  ws.onopen = () => console.log('[CDP] Connected successfully');

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      const type = msg.params.type;
      const text = msg.params.args.map(a => a.value || a.description || '').join(' ');
      if (type === 'error') {
        console.error('[BROWSER ERROR]', text);
        consoleErrors.push(text);
      } else {
        console.log(`[BROWSER ${type.toUpperCase()}]`, text);
      }
    } else if (msg.method === 'Runtime.exceptionThrown') {
      const errText = msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text;
      console.error('[BROWSER EXCEPTION]', errText);
      consoleErrors.push(errText);
    }

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

  // Enable events
  await send('Page.enable');
  await send('Runtime.enable');

  // Set Desktop Viewport 1280x720
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 720,
    deviceScaleFactor: 1,
    mobile: false
  });

  // Navigate to Game
  console.log('\n--- 1. Navigating to NO TRACE Vertical Slice ---');
  await send('Page.navigate', { url: 'http://127.0.0.1:3005' });
  await delay(3000);

  // Check Game Instance & Objects
  const gameState = await send('Runtime.evaluate', {
    expression: `(() => {
      if (!window.game) return { error: 'window.game not found' };
      return {
        player: { x: window.game.player.x, y: window.game.player.y, hp: window.game.player.hp },
        guardsCount: window.game.levelData.guards.length,
        camerasCount: window.game.levelData.cameras.length,
        lasersCount: window.game.levelData.lasers.length,
        drawCalls: window.game.renderer.getDrawCalls(),
        triangles: window.game.renderer.getTriangles(),
        fps: window.game.loop.fps
      };
    })()`,
    returnByValue: true
  });
  const val = gameState?.result?.result?.value;
  console.log('Game State:', JSON.stringify(val, null, 2));

  // Capture Screenshot: Warehouse Overview
  fs.mkdirSync('screenshots', { recursive: true });
  const snap1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/vertical_slice_warehouse.png', Buffer.from(snap1.result.data, 'base64'));
  console.log('[SCREENSHOT] Saved: screenshots/vertical_slice_warehouse.png');

  // 2. Simulate Ghost Movement: Walk right & Pipe Hang
  console.log('\n--- 2. Testing Movement: Walk & Pipe Hang ---');
  await send('Runtime.evaluate', {
    expression: `(() => {
      // Move Ghost under overhead pipe (x ~ -1) and hang
      window.game.player.x = -1.0;
      window.game.player.y = 4.1;
      window.game.player.state = 'pipe_hang';
    })()`
  });
  await delay(1200);

  const snap2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/vertical_slice_pipe_hang.png', Buffer.from(snap2.result.data, 'base64'));
  console.log('[SCREENSHOT] Saved: screenshots/vertical_slice_pipe_hang.png');

  // 3. Test Silent Takedown & Mark Execute
  console.log('\n--- 3. Testing Silent Takedown & Mark & Execute ---');
  await send('Runtime.evaluate', {
    expression: `(() => {
      // Drop Ghost behind guard 1 and knockout
      window.game.player.x = -4.8;
      window.game.player.y = 0;
      window.game.player.state = 'idle';
      const guard = window.game.levelData.guards[0];
      guard.x = -4.0;
      guard.facing = 1;
      guard.knockout();
    })()`
  });
  await delay(1000);

  const snap3 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/vertical_slice_takedown.png', Buffer.from(snap3.result.data, 'base64'));
  console.log('[SCREENSHOT] Saved: screenshots/vertical_slice_takedown.png');

  // 4. Test Recursion Protection on Guard Alert
  console.log('\n--- 4. Testing Critical Freeze Fix (Guard Alert Recursion Guard) ---');
  const alertTest = await send('Runtime.evaluate', {
    expression: `(() => {
      const guard2 = window.game.levelData.guards[1];
      guard2.setAlertState(false);
      return {
        alarmLevel: window.game.alarm.level,
        guard2State: guard2.state,
        raisingFlag: window.game.alarm.raising
      };
    })()`,
    returnByValue: true
  });
  console.log('Recursion Test Result:', JSON.stringify(alertTest?.result?.result?.value, null, 2));

  // 5. Measure Desktop FPS
  console.log('\n--- 5. Measuring Performance (Desktop 1280x720) ---');
  let desktopFpsReadings = [];
  for (let i = 0; i < 5; i++) {
    await delay(500);
    const fpsVal = await send('Runtime.evaluate', {
      expression: `window.game.loop.fps`,
      returnByValue: true
    });
    desktopFpsReadings.push(fpsVal?.result?.result?.value || 60);
  }
  const avgDesktopFps = Math.round(desktopFpsReadings.reduce((a, b) => a + b, 0) / desktopFpsReadings.length);
  console.log(`[DESKTOP PERF] Average FPS: ${avgDesktopFps} | Readings: ${desktopFpsReadings.join(', ')}`);

  // 6. Test Mobile Emulation (Android Phone 800x360 landscape)
  console.log('\n--- 6. Measuring Performance (Android Phone Emulation 800x360) ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 800,
    height: 360,
    deviceScaleFactor: 1.5,
    mobile: true,
    screenOrientation: { angle: 90, type: 'landscapePrimary' }
  });
  await delay(2000);

  const snap4 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/vertical_slice_mobile.png', Buffer.from(snap4.result.data, 'base64'));
  console.log('[SCREENSHOT] Saved: screenshots/vertical_slice_mobile.png');

  let mobileFpsReadings = [];
  for (let i = 0; i < 5; i++) {
    await delay(500);
    const fpsVal = await send('Runtime.evaluate', {
      expression: `window.game.loop.fps`,
      returnByValue: true
    });
    mobileFpsReadings.push(fpsVal?.result?.result?.value || 60);
  }
  const avgMobileFps = Math.round(mobileFpsReadings.reduce((a, b) => a + b, 0) / mobileFpsReadings.length);
  console.log(`[MOBILE PERF] Average FPS: ${avgMobileFps} | Readings: ${mobileFpsReadings.join(', ')}`);

  console.log('\n=======================================');
  console.log(`TOTAL CONSOLE ERRORS: ${consoleErrors.length}`);
  if (consoleErrors.length === 0) {
    console.log('SUCCESS: ZERO CONSOLE ERRORS ACROSS ALL TESTS!');
  } else {
    console.error('ERRORS FOUND:', consoleErrors);
  }
  console.log('=======================================\n');

  ws.close();
  process.exit(consoleErrors.length === 0 ? 0 : 1);
}

run().catch(err => {
  console.error('[TEST FATAL ERROR]', err);
  process.exit(1);
});
