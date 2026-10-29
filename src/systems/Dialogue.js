import { audioSystem } from './Audio.js';

export class DialogueSystem {
  constructor(scene) {
    this.scene = scene;
    this.container = null;
    this.portrait = null;
    this.speakerText = null;
    this.bodyText = null;
    this.promptText = null;
    this.queue = [];
    this.currentDialogue = null;
    this.typingTimer = null;
    this.isTyping = false;
    this.fullText = '';
    this.charIndex = 0;
    this.onCompleteCallback = null;

    this.createUI();
  }

  createUI() {
    // Letterbox styled dialog box at bottom of screen (above HUD or overlay)
    const boxW = 380;
    const boxH = 56;
    const boxX = (480 - boxW) / 2;
    const boxY = 175;

    this.container = this.scene.add.container(boxX, boxY).setDepth(2000).setVisible(false);

    // Dark high-tech panel background
    const bg = this.scene.add.rectangle(0, 0, boxW, boxH, 0x070b14, 0.94)
      .setOrigin(0, 0)
      .setStrokeStyle(1.5, 0x0284c7);

    // Header strip
    const topBar = this.scene.add.rectangle(0, 0, boxW, 14, 0x0f172a, 1.0).setOrigin(0, 0);

    // Speaker portrait
    this.portrait = this.scene.add.image(18, 28, 'portrait_control').setScale(1.2);

    // Speaker Name
    this.speakerText = this.scene.add.text(42, 2, 'CONTROL // HQ', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#38bdf8'
    });

    // Frequency / Codec indicator
    const freqText = this.scene.add.text(boxW - 65, 2, 'CH: 140.85', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '8px',
      color: '#64748b'
    });

    // Dialogue Body Text
    this.bodyText = this.scene.add.text(42, 18, '', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '9px',
      color: '#f8fafc',
      wordWrap: { width: boxW - 54 }
    });

    // Advance prompt
    this.promptText = this.scene.add.text(boxW - 14, boxH - 12, '▼', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '9px',
      color: '#38bdf8'
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: this.promptText,
      alpha: 0.2,
      duration: 400,
      yoyo: true,
      repeat: -1
    });

    this.container.add([bg, topBar, this.portrait, this.speakerText, freqText, this.bodyText, this.promptText]);
  }

  showSequence(dialogues, onComplete = null) {
    this.queue = [...dialogues];
    this.onCompleteCallback = onComplete;
    this.advance();
  }

  advance() {
    if (this.isTyping) {
      // Instantly finish typing current line
      if (this.typingTimer) this.typingTimer.remove();
      this.bodyText.setText(this.fullText);
      this.isTyping = false;
      return;
    }

    if (this.queue.length === 0) {
      this.container.setVisible(false);
      this.currentDialogue = null;
      if (this.onCompleteCallback) {
        const cb = this.onCompleteCallback;
        this.onCompleteCallback = null;
        cb();
      }
      return;
    }

    this.currentDialogue = this.queue.shift();
    this.container.setVisible(true);

    const isGhost = this.currentDialogue.speaker.toUpperCase().includes('GHOST');
    const isGuard = this.currentDialogue.speaker.toUpperCase().includes('GUARD');
    const isMeera = this.currentDialogue.speaker.toUpperCase().includes('MEERA');

    if (isGhost) {
      this.portrait.setTexture('portrait_ghost');
      this.speakerText.setText('GHOST // OPERATIVE').setColor('#f59e0b');
    } else if (isMeera && this.scene.textures.exists('portrait_meera')) {
      this.portrait.setTexture('portrait_meera');
      this.speakerText.setText('DR. MEERA SEN // ASSET').setColor('#10b981');
    } else if (isGuard) {
      this.portrait.setTexture('tiles', 1);
      this.speakerText.setText(this.currentDialogue.speaker.toUpperCase()).setColor('#e2e8f0');
    } else {
      this.portrait.setTexture('portrait_control');
      this.speakerText.setText('CONTROL // HQ').setColor('#38bdf8');
    }

    this.fullText = this.currentDialogue.text;
    this.charIndex = 0;
    this.bodyText.setText('');
    this.isTyping = true;

    audioSystem.playRadioBlip();

    if (this.typingTimer) this.typingTimer.remove();
    this.typingTimer = this.scene.time.addEvent({
      delay: 24,
      repeat: this.fullText.length - 1,
      callback: () => {
        this.charIndex++;
        this.bodyText.setText(this.fullText.substring(0, this.charIndex));
        if (this.charIndex % 3 === 0) {
          audioSystem.playRadioBlip();
        }
        if (this.charIndex >= this.fullText.length) {
          this.isTyping = false;
        }
      }
    });
  }

  isActive() {
    return this.container && this.container.visible;
  }
}
