import { spawn } from 'child_process';
import fs from 'fs';

// Launch chrome with remote debugging
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless',
  '--remote-debugging-port=9223',
  '--disable-gpu',
  '--window-size=960,540',
  'http://127.0.0.1:3005/'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9223/json');
    const tabs = await listRes.json();
    const gameTab = tabs.find(t => t.url && t.url.includes('3005'));
    console.log('Target tab:', gameTab ? gameTab.title : 'None');

    if (gameTab) {
      const ws = new WebSocket(gameTab.webSocketDebuggerUrl);

      ws.onopen = () => {
        ws.send(JSON.stringify({ id: 1, method: 'Console.enable' }));
        ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.method === 'Runtime.consoleAPICalled') {
          console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
        } else if (msg.method === 'Runtime.exceptionThrown') {
          console.error('[BROWSER EXCEPTION]', msg.params.exceptionDetails);
        } else if (msg.id === 3 && msg.result && msg.result.data) {
          fs.writeFileSync('/Users/newtonuser/.gemini/antigravity-ide/brain/f655b77e-f404-476a-b4a4-5daa677a20a0/game_rendered.png', Buffer.from(msg.result.data, 'base64'));
          console.log('Saved real game_rendered.png successfully!');
          chrome.kill();
          process.exit(0);
        }
      };

      setTimeout(() => {
        ws.send(JSON.stringify({
          id: 3,
          method: 'Page.captureScreenshot',
          params: { format: 'png' }
        }));
      }, 2500);
    }
  } catch (err) {
    console.error('Error connecting to Chrome debugger:', err);
    chrome.kill();
    process.exit(1);
  }
}, 1500);
