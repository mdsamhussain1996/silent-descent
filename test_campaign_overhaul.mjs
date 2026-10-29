// test_campaign_overhaul.mjs
// Comprehensive automated playthrough & screenshot capture for NO TRACE

import { spawn } from 'child_process';
import fs from 'fs';

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless',
  '--remote-debugging-port=9226',
  '--disable-gpu',
  '--window-size=1280,720',
  'http://127.0.0.1:3005/'
]);

let msgId = 1;
const pending = new Map();
const consoleErrors = [];

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

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9226/json');
    const tabs = await listRes.json();
    const gameTab = tabs.find(t => t.url && t.url.includes('3005')) || tabs[0];
    const ws = new WebSocket(gameTab.webSocketDebuggerUrl);

    ws.onopen = async () => {
      console.log('[CDP] Connected to Chrome DevTools Protocol');
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        const resolve = pending.get(msg.id);
        pending.delete(msg.id);
        resolve(msg.result);
      } else if (msg.method === 'Runtime.consoleAPICalled') {
        if (msg.params.type === 'error') {
          consoleErrors.push(msg.params.args.map(a => a.value || a.description).join(' '));
          console.error('[CONSOLE ERROR]', ...msg.params.args.map(a => a.value || a.description));
        }
      } else if (msg.method === 'Runtime.exceptionThrown') {
        consoleErrors.push(msg.params.exceptionDetails.text + ' ' + (msg.params.exceptionDetails.exception?.description || ''));
        console.error('[UNCAUGHT EXCEPTION]', JSON.stringify(msg.params.exceptionDetails));
      }
    };

    await delay(2500);
    await send(ws, 'Runtime.enable');
    await send(ws, 'Page.enable');

    console.log('\n--- 1. Testing Title Screen ---');
    await delay(1500);
    await captureScreenshot(ws, 'screenshots/title_screen_v2.png');

    console.log('\n--- 2. Testing Campaign Map Scene ---');
    await evaluate(ws, `(() => {
      window.game.scene.stop('TitleScene');
      window.game.scene.start('CampaignMapScene');
    })()`);
    await delay(1500);
    await captureScreenshot(ws, 'screenshots/campaign_map.png');

    console.log('\n--- 3. Testing Tactical Armory & Loadout Scene ---');
    await evaluate(ws, `(() => {
      window.game.scene.stop('CampaignMapScene');
      window.game.scene.start('LoadoutScene', { returnTo: 'CampaignMapScene' });
    })()`);
    await delay(1500);
    await captureScreenshot(ws, 'screenshots/loadout_screen.png');

    console.log('\n--- 4. Testing Mission Briefing Scene ---');
    await evaluate(ws, `(() => {
      window.game.scene.stop('LoadoutScene');
      window.game.scene.start('BriefingScene', { mission: { num: 1, title: 'IRON TIDE', desc: 'Infiltrate Kestrel naval docks via helicopter rappel.', location: 'Kestrel Naval Yard', target: 'Dr. Meera Sen & Guidance Chip Manifest' } });
    })()`);
    await delay(1500);
    await captureScreenshot(ws, 'screenshots/briefing_screen.png');

    console.log('\n--- 5. Starting Infiltration: GameScene & Level 1 ---');
    await evaluate(ws, `(() => {
      window.game.scene.stop('BriefingScene');
      window.game.scene.start('GameScene', { mission: { id: 'm1', num: 1 } });
    })()`);
    await delay(2000);

    // Section A: Rooftop Insertion
    console.log('Capturing Section A (Rooftop insertion)...');
    await evaluate(ws, `(() => {
      const scene = window.game.scene.getScene('GameScene');
      if (scene) {
        scene.cameras.main.stopFollow();
        scene.cameras.main.setScroll(100, 160);
      }
    })()`);
    await delay(800);
    await captureScreenshot(ws, 'screenshots/section_A_rebuilt.png');

    // Section B: Rooftop AC & Water Tank
    console.log('Capturing Section B (Water tank, AC unit, roof hatch)...');
    await evaluate(ws, `(() => {
      const scene = window.game.scene.getScene('GameScene');
      if (scene) scene.cameras.main.setScroll(450, 160);
    })()`);
    await delay(800);
    await captureScreenshot(ws, 'screenshots/section_B_rebuilt.png');

    // Section C: Office Interior & Interrogation Room
    console.log('Capturing Section C (Office interior, wainscoting, terminal)...');
    await evaluate(ws, `(() => {
      const scene = window.game.scene.getScene('GameScene');
      if (scene) scene.cameras.main.setScroll(1100, 420);
    })()`);
    await delay(800);
    await captureScreenshot(ws, 'screenshots/section_C_rebuilt.png');

    // Section D: Cargo Warehouse Catwalk & Manager Desk
    console.log('Capturing Section D (Cargo warehouse, catwalk, manager manifest desk)...');
    await evaluate(ws, `(() => {
      const scene = window.game.scene.getScene('GameScene');
      if (scene) scene.cameras.main.setScroll(1900, 450);
    })()`);
    await delay(800);
    await captureScreenshot(ws, 'screenshots/section_D_rebuilt.png');

    // Section E: Docks & Container with Tracker Socket
    console.log('Capturing Section E (Docks, corrugated containers, pier)...');
    await evaluate(ws, `(() => {
      const scene = window.game.scene.getScene('GameScene');
      if (scene) scene.cameras.main.setScroll(2950, 600);
    })()`);
    await delay(800);
    await captureScreenshot(ws, 'screenshots/section_E_rebuilt.png');

    // Section F: Helicopter Extraction Finale
    console.log('Capturing Section F (Extraction helicopter, rope ladder, water)...');
    await evaluate(ws, `(() => {
      const scene = window.game.scene.getScene('GameScene');
      if (scene) scene.cameras.main.setScroll(3300, 560);
    })()`);
    await delay(800);
    await captureScreenshot(ws, 'screenshots/section_F_rebuilt.png');

    // Test Mission Objective Progression
    console.log('\n--- 6. Testing Mission Objectives Engine ---');
    const objTest = await evaluate(ws, `(() => {
      const scene = window.game.scene.getScene('GameScene');
      if (!scene || !scene.objectives) return { error: 'No objectives' };

      // Complete terminal hack
      scene.objectives.completePrimary('hack_terminal');
      // Photograph manifest
      scene.objectives.completePrimary('photo_manifest');
      // Rescue Dr. Meera Sen
      if (scene.meera) scene.meera.rescue();
      // Plant tracker
      scene.objectives.completePrimary('plant_tracker');

      const primaryStatus = scene.objectives.primary.map(p => ({ id: p.id, done: p.completed }));
      const activeObj = scene.objectives.getActivePrimary();

      return {
        primaries: primaryStatus,
        nextActiveId: activeObj ? activeObj.id : 'all_done',
        meeraFollowing: scene.meera ? scene.meera.state === 'following' : false,
        fps: Math.round(window.game.loop.actualFps)
      };
    })()`);

    console.log('Objective Progression Result:', JSON.stringify(objTest?.value || objTest, null, 2));

    // Test Mission Debriefing Scene
    console.log('\n--- 7. Testing Mission Debriefing Scene ---');
    await evaluate(ws, `(() => {
      window.game.scene.stop('HUDScene');
      window.game.scene.stop('GameScene');
      window.game.scene.start('MissionCompleteScene', {
        missionId: 'm1',
        rank: 'NO TRACE',
        credits: 2500,
        stats: {
          missionTime: 195,
          alarmsRaised: 0,
          kills: 0,
          nonLethalTakedowns: 4,
          camerasDisabled: 4,
          intelFound: 3,
          totalIntel: 3
        }
      });
    })()`);
    await delay(1500);
    await captureScreenshot(ws, 'screenshots/mission_complete.png');

    console.log('\n=======================================');
    console.log(`TOTAL CONSOLE ERRORS: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log('Console Errors List:', consoleErrors);
    } else {
      console.log('SUCCESS: ZERO CONSOLE ERRORS ACROSS ALL SCENES & SECTORS!');
    }
    console.log('=======================================\n');

    ws.close();
    chrome.kill();
    process.exit(consoleErrors.length === 0 ? 0 : 1);
  } catch (err) {
    console.error('Test Execution Error:', err);
    chrome.kill();
    process.exit(1);
  }
}, 1000);
