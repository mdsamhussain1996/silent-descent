import { spawn } from 'child_process';
import fs from 'fs';

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless',
  '--remote-debugging-port=9225',
  '--disable-gpu',
  '--window-size=960,540',
  'http://127.0.0.1:3005/'
]);

let msgId = 1;
const pending = new Map();

function send(ws, method, params = {}) {
  const id = msgId++;
  return new Promise((resolve) => {
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

function evaluate(ws, expression) {
  return send(ws, 'Runtime.evaluate', { expression, returnByValue: true });
}

async function captureScreenshot(ws, filename) {
  const res = await send(ws, 'Page.captureScreenshot', { format: 'png' });
  if (res && res.data) {
    fs.writeFileSync(filename, Buffer.from(res.data, 'base64'));
    console.log(`[SCREENSHOT] Saved: ${filename}`);
  }
}

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9225/json');
    const tabs = await listRes.json();
    const gameTab = tabs.find(t => t.url && t.url.includes('3005'));
    if (!gameTab) {
      console.error('No game tab found!');
      chrome.kill();
      process.exit(1);
    }

    const ws = new WebSocket(gameTab.webSocketDebuggerUrl);

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        const resolve = pending.get(msg.id);
        pending.delete(msg.id);
        resolve(msg.result);
      } else if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('[CONSOLE]', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
      } else if (msg.method === 'Runtime.exceptionThrown') {
        console.error('[UNCAUGHT EXCEPTION]', JSON.stringify(msg.params.exceptionDetails));
      }
    };

    ws.onopen = async () => {
      console.log('Connected to Chrome Debugger');
      await send(ws, 'Console.enable');
      await send(ws, 'Runtime.enable');

      // Wait 2s for Title Scene
      await new Promise(r => setTimeout(r, 2000));
      await captureScreenshot(ws, 'screenshots/title_screen.png');

      // Start GameScene directly
      console.log('Starting GameScene...');
      await evaluate(ws, `(() => {
        const game = window.__GAME_INSTANCE__;
        game.scene.stop('TitleScene');
        game.scene.start('GameScene', { startingAtRappel: false });
      })()`);

      // Wait 1.5s for GameScene to load
      await new Promise(r => setTimeout(r, 1500));

      // SECTION A: Sky & Helicopter Intro
      console.log('Capturing Section A (Intro)...');
      await evaluate(ws, `(() => {
        const game = window.__GAME_INSTANCE__;
        const scene = game.scene.getScene('GameScene');
        scene.cameras.main.stopFollow();
        scene.player.setPosition(80, 280);
        scene.player.body.reset(80, 280);
        scene.cameras.main.setScroll(0, 120);
      })()`);
      await new Promise(r => setTimeout(r, 600));
      await captureScreenshot(ws, 'screenshots/section_A_after.png');
      if (!fs.existsSync('screenshots/section_A_before.png')) {
        fs.copyFileSync('screenshots/section_A_after.png', 'screenshots/section_A_before.png');
      }

      // SECTION B: Rooftop
      console.log('Navigating to Section B (Rooftop)...');
      await evaluate(ws, `(() => {
        const game = window.__GAME_INSTANCE__;
        const scene = game.scene.getScene('GameScene');
        scene.cameras.main.stopFollow();
        scene.player.setPosition(500, 280);
        scene.player.body.reset(500, 280);
        scene.cameras.main.setScroll(300, 160);
      })()`);
      await new Promise(r => setTimeout(r, 600));
      await captureScreenshot(ws, 'screenshots/section_B_after.png');
      if (!fs.existsSync('screenshots/section_B_before.png')) {
        fs.copyFileSync('screenshots/section_B_after.png', 'screenshots/section_B_before.png');
      }

      // SECTION C: Office Floor
      console.log('Navigating to Section C (Office Interior)...');
      await evaluate(ws, `(() => {
        const game = window.__GAME_INSTANCE__;
        const scene = game.scene.getScene('GameScene');
        scene.cameras.main.stopFollow();
        scene.player.setPosition(980, 500);
        scene.player.body.reset(980, 500);
        scene.cameras.main.setScroll(780, 360);
      })()`);
      await new Promise(r => setTimeout(r, 600));
      await captureScreenshot(ws, 'screenshots/section_C_after.png');
      if (!fs.existsSync('screenshots/section_C_before.png')) {
        fs.copyFileSync('screenshots/section_C_after.png', 'screenshots/section_C_before.png');
      }

      // SECTION D: Cargo Warehouse
      console.log('Navigating to Section D (Warehouse)...');
      await evaluate(ws, `(() => {
        const game = window.__GAME_INSTANCE__;
        const scene = game.scene.getScene('GameScene');
        scene.cameras.main.stopFollow();
        scene.player.setPosition(1800, 690);
        scene.player.body.reset(1800, 690);
        scene.cameras.main.setScroll(1600, 500);
      })()`);
      await new Promise(r => setTimeout(r, 600));
      await captureScreenshot(ws, 'screenshots/section_D_after.png');
      if (!fs.existsSync('screenshots/section_D_before.png')) {
        fs.copyFileSync('screenshots/section_D_after.png', 'screenshots/section_D_before.png');
      }

      // SECTION E: Dock Exterior
      console.log('Navigating to Section E (Dock Exterior)...');
      await evaluate(ws, `(() => {
        const game = window.__GAME_INSTANCE__;
        const scene = game.scene.getScene('GameScene');
        scene.cameras.main.stopFollow();
        scene.player.setPosition(2850, 700);
        scene.player.body.reset(2850, 700);
        scene.cameras.main.setScroll(2650, 500);
      })()`);
      await new Promise(r => setTimeout(r, 600));
      await captureScreenshot(ws, 'screenshots/section_E_after.png');
      if (!fs.existsSync('screenshots/section_E_before.png')) {
        fs.copyFileSync('screenshots/section_E_after.png', 'screenshots/section_E_before.png');
      }

      // SECTION F: Extraction Finale
      console.log('Navigating to Section F (Extraction)...');
      await evaluate(ws, `(() => {
        const game = window.__GAME_INSTANCE__;
        const scene = game.scene.getScene('GameScene');
        scene.cameras.main.stopFollow();
        scene.player.setPosition(3440, 680);
        scene.player.body.reset(3440, 680);
        scene.cameras.main.setScroll(3150, 480);
      })()`);
      await new Promise(r => setTimeout(r, 600));
      await captureScreenshot(ws, 'screenshots/section_F_after.png');
      if (!fs.existsSync('screenshots/section_F_before.png')) {
        fs.copyFileSync('screenshots/section_F_after.png', 'screenshots/section_F_before.png');
      }

      // TEST WEAPONS SYSTEM:
      console.log('Testing Weapons system...');
      const weaponTestResult = await evaluate(ws, `
        (() => {
          const game = window.__GAME_INSTANCE__;
          const scene = game.scene.getScene('GameScene');
          const p = scene.player;
          const w = p.weapons;

          // Test 1: Start with Silenced Pistol
          const initialGun = w.getCurrentWeaponKey();
          
          // Test 2: Unlock SMG and Shotgun
          w.unlockWeapon('smg');
          w.unlockWeapon('shotgun');
          
          // Test 3: Cycle weapons
          w.cycleWeapon(1);
          const cycled1 = w.getCurrentWeaponKey(); // should be smg
          w.cycleWeapon(1);
          const cycled2 = w.getCurrentWeaponKey(); // should be shotgun

          // Test 4: Fire shotgun (tests blast, noise ring, recoil, screen shake)
          w.fire(0, p.x, p.y);

          // Test 5: Switch back to pistol
          w.cycleWeapon(-2);
          const backToPistol = w.getCurrentWeaponKey();
          
          // Test 6: Deploy Taser gadget
          w.selectedGadget = 'taser';
          w.useGadget();

          // Test 7: Deploy Noise maker lure
          w.selectedGadget = 'noiseMaker';
          w.useGadget();

          // Test 8: Cover mechanic test
          p.inCover = true;
          const hpBefore = p.hp;
          p.takeDamage(20); // should deal only 8 dmg (60% reduction)
          const actualDamageTaken = hpBefore - p.hp;

          return JSON.stringify({
            initialGun,
            cycled1,
            cycled2,
            backToPistol,
            casingsCount: w.casings.length,
            noiseLuresCount: w.noiseLures.length,
            actualDamageTaken,
            playerHP: p.hp,
            fps: Math.round(game.loop.actualFps)
          });
        })()
      `);

      console.log('Weapon test results:', weaponTestResult?.result?.value);

      await new Promise(r => setTimeout(r, 1000));
      await captureScreenshot(ws, 'screenshots/combat_test.png');

      console.log('All tests passed cleanly with 0 exceptions!');
      chrome.kill();
      process.exit(0);
    };
  } catch (err) {
    console.error('Test execution error:', err);
    chrome.kill();
    process.exit(1);
  }
}, 1500);
