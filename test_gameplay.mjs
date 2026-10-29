import { spawn } from 'child_process';
import fs from 'fs';

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless',
  '--remote-debugging-port=9225',
  '--disable-gpu',
  '--window-size=960,540',
  'http://127.0.0.1:3005/'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9225/json');
    const tabs = await listRes.json();
    const gameTab = tabs.find(t => t.url && t.url.includes('3005'));
    console.log('Target tab:', gameTab ? gameTab.title : 'None');

    if (gameTab) {
      const ws = new WebSocket(gameTab.webSocketDebuggerUrl);

      const send = (method, params = {}) => {
        return new Promise((resolve) => {
          const id = Math.floor(Math.random() * 1000000);
          const handler = (evt) => {
            const data = JSON.parse(evt.data);
            if (data.id === id) {
              ws.removeEventListener('message', handler);
              resolve(data.result);
            }
          };
          ws.addEventListener('message', handler);
          ws.send(JSON.stringify({ id, method, params }));
        });
      };

      ws.onopen = async () => {
        await send('Console.enable');
        await send('Runtime.enable');
        await send('Page.enable');

        ws.onmessage = (event) => {
          const msg = JSON.parse(event.data);
          if (msg.method === 'Runtime.consoleAPICalled') {
            console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
          } else if (msg.method === 'Runtime.exceptionThrown') {
            console.error('[BROWSER EXCEPTION]', msg.params.exceptionDetails);
          }
        };

        await new Promise(r => setTimeout(r, 600));

        // Start IntroScene
        await send('Runtime.evaluate', {
          expression: `window.__GAME_INSTANCE__.scene.start('IntroScene');`
        });
        console.log('Started IntroScene');
        await new Promise(r => setTimeout(r, 2600));

        const snap1 = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync('/Users/newtonuser/.gemini/antigravity-ide/brain/f655b77e-f404-476a-b4a4-5daa677a20a0/intro_cutscene.png', Buffer.from(snap1.data, 'base64'));
        console.log('Saved intro_cutscene.png');

        // Start GameScene
        await send('Runtime.evaluate', {
          expression: `window.__GAME_INSTANCE__.scene.start('GameScene', { startingAtRappel: false });`
        });
        console.log('Started GameScene');
        await new Promise(r => setTimeout(r, 1200));

        const snap2 = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync('/Users/newtonuser/.gemini/antigravity-ide/brain/f655b77e-f404-476a-b4a4-5daa677a20a0/gameplay_rooftop.png', Buffer.from(snap2.data, 'base64'));
        console.log('Saved gameplay_rooftop.png');

        // Toggle Thermal Visor ON
        await send('Runtime.evaluate', {
          expression: `
            const gs = window.__GAME_INSTANCE__.scene.getScene('GameScene');
            if (gs && gs.player) {
              gs.player.toggleThermal(true);
            }
          `
        });
        console.log('Toggled Thermal Visor');
        await new Promise(r => setTimeout(r, 500));

        const snap3 = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync('/Users/newtonuser/.gemini/antigravity-ide/brain/f655b77e-f404-476a-b4a4-5daa677a20a0/gameplay_thermal.png', Buffer.from(snap3.data, 'base64'));
        console.log('Saved gameplay_thermal.png');

        // Test Hack Minigame Modal
        await send('Runtime.evaluate', {
          expression: `
            const gs = window.__GAME_INSTANCE__.scene.getScene('GameScene');
            if (gs) {
              gs.openHackMinigame(gs.terminalC);
            }
          `
        });
        console.log('Opened Hack Minigame');
        await new Promise(r => setTimeout(r, 600));

        const snap4 = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync('/Users/newtonuser/.gemini/antigravity-ide/brain/f655b77e-f404-476a-b4a4-5daa677a20a0/hack_minigame.png', Buffer.from(snap4.data, 'base64'));
        console.log('Saved hack_minigame.png');

        chrome.kill();
        process.exit(0);
      };
    }
  } catch (err) {
    console.error('Test error:', err);
    chrome.kill();
    process.exit(1);
  }
}, 1500);
