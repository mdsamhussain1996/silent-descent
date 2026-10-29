import Phaser from 'phaser';
import { audioSystem } from '../systems/Audio.js';

export class BriefingScene extends Phaser.Scene {
  constructor() {
    super('BriefingScene');
  }

  create() {
    // Backdrop
    const bg = this.add.graphics();
    bg.fillStyle(0x05070c, 1);
    bg.fillRect(0, 0, 480, 270);

    // Frame
    bg.lineStyle(1.5, 0x0284c7, 0.8);
    bg.strokeRect(10, 10, 460, 250);

    // Header strip
    bg.fillStyle(0x0f172a, 1);
    bg.fillRect(11, 11, 458, 22);

    this.add.text(20, 16, 'NIGHTFALL DIRECTIVE // OPERATION IRON TIDE', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#38bdf8',
      letterSpacing: 2
    });

    this.add.text(370, 17, 'CLASSIFIED // TOP SECRET', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '8px',
      color: '#ef4444'
    });

    // Content: Left column (Mission Dossier)
    const dossier = [
      'OPERATIVE: Vikram "Ghost" Rao',
      'AGENCY: NIGHTFALL Strategic Recon',
      'TARGET: Kestrel Dynamics Harbour Hub',
      '',
      'PRIMARY OBJECTIVE:',
      '• Infiltrate office & warehouse',
      '• Hack security terminal to unlock cage',
      '• Retrieve stolen Guidance Chip Drive',
      '• Reach pier for helicopter extraction',
      '',
      'RULES OF ENGAGEMENT:',
      '• Stay in shadows. Avoid guard vision cones.',
      '• Pipe hang renders you invisible from below.',
      '• Shoot out lights to create dark paths.'
    ];

    dossier.forEach((line, idx) => {
      this.add.text(24, 44 + idx * 12, line, {
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: '8px',
        color: line.startsWith('•') ? '#f8fafc' : (line.includes('OBJECTIVE') ? '#f59e0b' : '#94a3b8')
      });
    });

    // Content: Right column (Tactical Controls & Gadgets)
    const controls = [
      'TACTICAL CONTROLS & GADGETS:',
      '← / → : Move / Sneak / Sprint',
      '↑ / ↓ : Climb / Crouch / Wall-Press / Peek',
      'SPACE : Jump / Ledge Pull Up',
      'SHIFT : Sneak (Silent, lower visibility)',
      'J     : Takedown (Behind) / Interact / Hack',
      'K     : Silenced Pistol (Aim with ↑ / ↓)',
      'L     : Grab Guard (Use on hand scanners)',
      'V     : Thermal Visor (6s duration, 10s CD)',
      '',
      'TOUCH : On-screen D-Pad & Action Buttons'
    ];

    controls.forEach((line, idx) => {
      this.add.text(240, 44 + idx * 12, line, {
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: '8px',
        color: idx === 0 ? '#38bdf8' : (line.startsWith('V') ? '#fbbf24' : '#cbd5e1')
      });
    });

    // Portraits on sides
    this.add.image(214, 60, 'portrait_ghost').setScale(1.1);
    this.add.image(214, 110, 'portrait_control').setScale(1.1);

    // Proceed Button
    const btn = this.add.rectangle(240, 236, 200, 20, 0x0284c7, 0.9)
      .setStrokeStyle(1, 0x38bdf8)
      .setInteractive({ useHandCursor: true });

    const btnText = this.add.text(240, 236, 'PROCEED TO INSERTION [SPACE / J]', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    const proceed = () => {
      audioSystem.playTerminalBeep(1000);
      this.scene.start('IntroScene');
    };

    btn.on('pointerdown', proceed);

    this.input.keyboard.on('keydown-SPACE', proceed);
    this.input.keyboard.on('keydown-ENTER', proceed);
    this.input.keyboard.on('keydown-J', proceed);
  }
}
