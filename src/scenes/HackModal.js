import Phaser from 'phaser';
import { audioSystem } from '../systems/Audio.js';

export class HackModalScene extends Phaser.Scene {
  constructor() {
    super('HackModalScene');
  }

  init(data) {
    this.terminal = data.terminal;
    this.timer = 10.0; // 10-second limit
    this.targetSequence = [];
    this.currentStep = 0;
    this.gridNodes = [];
  }

  create() {
    const cx = 240;
    const cy = 135;

    // Dark semi-transparent modal backdrop
    this.add.rectangle(cx, cy, 480, 270, 0x05070c, 0.88).setInteractive();

    // Cyber terminal window
    const winW = 280;
    const winH = 220;
    const winBg = this.add.rectangle(cx, cy, winW, winH, 0x090d16)
      .setStrokeStyle(1.5, 0x06b6d4);

    // Header
    this.add.rectangle(cx, cy - (winH / 2) + 12, winW, 24, 0x0f172a);
    this.add.text(cx, cy - (winH / 2) + 12, 'SECURITY BYPASS // 4x4 NODE SEQUENCE', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#22d3ee'
    }).setOrigin(0.5);

    // Timer display
    this.timerText = this.add.text(cx, cy - (winH / 2) + 30, 'TIME REMAINING: 10.0s', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '9px',
      color: '#f59e0b'
    }).setOrigin(0.5);

    // Instruction
    this.add.text(cx, cy - (winH / 2) + 42, 'CONNECT 4 GLOWING NODES IN ORDER', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '8px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    // Pick 4 unique random nodes from 16 (4x4)
    const indices = Phaser.Utils.Array.NumberArray(0, 15);
    Phaser.Utils.Array.Shuffle(indices);
    this.targetSequence = indices.slice(0, 4);

    // Create 4x4 Grid
    const gridSize = 4;
    const spacing = 32;
    const startX = cx - ((gridSize - 1) * spacing) / 2;
    const startY = cy - 25;

    this.gridNodes = [];
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const idx = r * gridSize + c;
        const x = startX + c * spacing;
        const y = startY + r * spacing;

        const isTarget = this.targetSequence.includes(idx);
        const orderIdx = this.targetSequence.indexOf(idx);

        const node = this.add.circle(x, y, 10, isTarget ? 0x0e7490 : 0x1e293b)
          .setStrokeStyle(1.5, isTarget ? 0x22d3ee : 0x334155)
          .setInteractive({ useHandCursor: true });

        const label = this.add.text(x, y, isTarget ? (orderIdx + 1).toString() : '•', {
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: '9px',
          color: isTarget ? '#ffffff' : '#64748b'
        }).setOrigin(0.5);

        node.on('pointerdown', () => this.handleNodeClick(idx, node, label));

        this.gridNodes.push({ idx, node, label, isTarget, orderIdx });
      }
    }

    // Cancel prompt
    const cancelBtn = this.add.text(cx, cy + (winH / 2) - 14, '[ESC / J] ABORT HACK', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '8px',
      color: '#64748b'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    cancelBtn.on('pointerdown', () => this.closeHack(false));
    this.input.keyboard.on('keydown-ESC', () => this.closeHack(false));
  }

  handleNodeClick(idx, nodeCircle, label) {
    if (this.currentStep >= 4) return;

    const expectedIdx = this.targetSequence[this.currentStep];

    if (idx === expectedIdx) {
      // Correct node clicked!
      audioSystem.playTerminalBeep(700 + this.currentStep * 150);
      nodeCircle.setFillStyle(0x22c55e);
      nodeCircle.setStrokeStyle(2, 0x86efac);
      this.currentStep++;

      if (this.currentStep >= 4) {
        // Complete puzzle!
        audioSystem.playTerminalBeep(1400);
        this.timerText.setText('BYPASS SUCCESSFUL!').setColor('#22c55e');
        this.time.delayedCall(500, () => {
          this.closeHack(true);
        });
      }
    } else {
      // Wrong node!
      audioSystem.playRadioBlip();
      nodeCircle.setFillStyle(0xef4444);
      this.time.delayedCall(200, () => {
        if (!this.targetSequence.includes(idx)) {
          nodeCircle.setFillStyle(0x1e293b);
        } else {
          nodeCircle.setFillStyle(0x0e7490);
        }
      });
    }
  }

  update(time, delta) {
    const dt = delta / 1000;
    this.timer -= dt;

    if (this.timerText) {
      this.timerText.setText(`TIME REMAINING: ${Math.max(0, this.timer).toFixed(1)}s`);
    }

    if (this.timer <= 0) {
      audioSystem.playRadioBlip();
      this.closeHack(false);
    }
  }

  closeHack(success) {
    if (success) {
      if (this.terminal) this.terminal.onHackSuccess();
    } else {
      if (this.terminal) this.terminal.onHackFail();
    }
    this.scene.stop();
    this.scene.resume('GameScene');
  }
}
