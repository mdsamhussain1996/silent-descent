import { spawn } from 'child_process';
import http from 'http';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getWsUrl(port) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}/json`, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const list = JSON.parse(data);
          resolve(list[0].webSocketDebuggerUrl);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  const chromePort = 9223;
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    `--remote-debugging-port=${chromePort}`,
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    'http://127.0.0.1:3005/'
  ]);

  await delay(2000);
  const listRes = await fetch(`http://127.0.0.1:${chromePort}/json`);
  const tabs = await listRes.json();
  const gameTab = tabs.find(t => t.url && t.url.includes('3005')) || tabs[0];
  const ws = new WebSocket(gameTab.webSocketDebuggerUrl);

  let reqId = 1;
  const pending = new Map();
  const consoleErrors = [];

  await new Promise(res => {
    ws.onopen = res;
  });

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      if (msg.params.type === 'error') {
        consoleErrors.push(msg.params.args.map(a => a.value || a.description).join(' '));
      }
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      consoleErrors.push(msg.params.exceptionDetails.text + ' ' + (msg.params.exceptionDetails.exception?.description || ''));
    }
    if (msg.id && pending.has(msg.id)) {
      const { resolve } = pending.get(msg.id);
      pending.delete(msg.id);
      resolve(msg.result);
    }
  };

  function send(method, params = {}) {
    return new Promise(resolve => {
      const id = reqId++;
      pending.set(id, { resolve });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send('Runtime.enable');
  await send('Page.enable');

  await delay(1500);

  // Start the game by switching to Game scene
  await send('Runtime.evaluate', {
    expression: `(() => {
      const game = window.game;
      if (game && game.scene) {
        game.scene.stop('TitleScene');
        game.scene.stop('BriefingScene');
        game.scene.start('GameScene');
      }
    })()`
  });

  await delay(1500);

  // Test Phase 0: Guard spot player, alarm raise, camera alarm, laser alarm, body found
  const testResults = await send('Runtime.evaluate', {
    expression: `(() => {
      const scene = window.game.scene.getScene('GameScene');
      if (!scene || !scene.alarm || !scene.guards) return { error: 'No scene/guards' };

      const guards = scene.guards.getChildren();
      const firstGuard = guards[0];
      const secondGuard = guards[1];

      const initialAlarm = scene.alarm.level;
      
      // 1. Guard spots player / setAlertState
      firstGuard.setAlertState(false);
      const alarmAfterSpot = scene.alarm.level;
      const firstGuardAlert = firstGuard.state === 'alert';
      const secondGuardAlert = secondGuard ? secondGuard.state === 'alert' : true;

      // 2. Camera alarm raise
      scene.alarm.raise('Camera spotted player');
      const alarmAfterCamera = scene.alarm.level;

      // 3. Laser alarm raise
      scene.alarm.raise('Laser tripped');
      const alarmAfterLaser = scene.alarm.level;

      // 4. Body found
      if (secondGuard) {
        secondGuard.knockout();
        firstGuard.checkBodiesInVision();
      }

      return {
        guardCount: guards.length,
        initialAlarm,
        alarmAfterSpot,
        firstGuardAlert,
        secondGuardAlert,
        alarmAfterCamera,
        alarmAfterLaser,
        sceneActive: scene.scene.isActive(),
        fps: Math.round(window.game.loop.actualFps)
      };
    })()`,
    returnByValue: true
  });

  console.log('Phase 0 Test Result:', JSON.stringify(testResults?.value || testResults, null, 2));
  console.log('Console Errors count:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.log('Console Errors:', consoleErrors);
  }

  ws.close();
  chrome.kill();
  process.exit(consoleErrors.length === 0 ? 0 : 1);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
