import { spawn } from 'child_process';
import fs from 'fs';

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless',
  '--remote-debugging-port=9227',
  '--disable-gpu',
  '--window-size=960,540',
  'http://127.0.0.1:3005/'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9227/json');
    const tabs = await listRes.json();
    const gameTab = tabs.find(t => t.url && t.url.includes('3005'));

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
        await send('Page.enable');
        await new Promise(r => setTimeout(r, 600));

        // Start DoorPeekScene directly with door data
        await send('Runtime.evaluate', {
          expression: `
            window.__GAME_INSTANCE__.scene.stop('TitleScene');
            window.__GAME_INSTANCE__.scene.start('DoorPeekScene', {
              door: {
                peekRoomDescription: 'Office Corridor - 1 guard patrolling with flashlight'
              }
            });
          `
        });
        console.log('Started DoorPeekScene');
        await new Promise(r => setTimeout(r, 800));

        const snap = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync('/Users/newtonuser/.gemini/antigravity-ide/brain/f655b77e-f404-476a-b4a4-5daa677a20a0/door_peek.png', Buffer.from(snap.data, 'base64'));
        console.log('Saved door_peek.png');

        // Test MissionCompleteScene
        await send('Runtime.evaluate', {
          expression: `
            window.__GAME_INSTANCE__.scene.stop('DoorPeekScene');
            window.__GAME_INSTANCE__.scene.start('MissionCompleteScene', {
              stats: {
                timeSec: 168,
                alarmsTriggered: 0,
                guardsKnocked: 3,
                guardsKilled: 0,
                intelFound: 3,
                lightsShot: 2
              }
            });
          `
        });
        console.log('Started MissionCompleteScene');
        await new Promise(r => setTimeout(r, 800));

        const snap2 = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync('/Users/newtonuser/.gemini/antigravity-ide/brain/f655b77e-f404-476a-b4a4-5daa677a20a0/mission_complete.png', Buffer.from(snap2.data, 'base64'));
        console.log('Saved mission_complete.png');

        chrome.kill();
        process.exit(0);
      };
    }
  } catch (err) {
    console.error(err);
    chrome.kill();
    process.exit(1);
  }
}, 1500);
