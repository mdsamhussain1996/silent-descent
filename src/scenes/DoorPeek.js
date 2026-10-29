import Phaser from 'phaser';

export class DoorPeekScene extends Phaser.Scene {
  constructor() {
    super('DoorPeekScene');
  }

  init(data) {
    this.door = data.door;
  }

  create() {
    const cx = 240;
    const cy = 135;

    // Dark spy vignette / peephole border
    this.add.rectangle(cx, cy, 480, 270, 0x05070c, 0.92).setInteractive();

    // Peephole window / Gap frame (220x130)
    const viewW = 240;
    const viewH = 130;
    const frame = this.add.rectangle(cx, cy - 10, viewW, viewH, 0x0a121e)
      .setStrokeStyle(2, 0x0284c7);

    // Header tag
    this.add.text(cx, cy - 84, 'TACTICAL OPTICAL FEED // DOOR GAP PEEK', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#38bdf8'
    }).setOrigin(0.5);

    // Interior room rendering inside peephole
    const roomBg = this.add.graphics();
    roomBg.fillStyle(0x18202c, 1);
    roomBg.fillRect(cx - (viewW / 2) + 2, cy - (viewH / 2) - 8, viewW - 4, viewH - 4);

    // Floor and moonlight shaft
    roomBg.fillStyle(0x2b384a, 1);
    roomBg.fillRect(cx - (viewW / 2) + 2, cy + 28, viewW - 4, 26);
    roomBg.fillStyle(0x38bdf8, 0.12);
    roomBg.fillRect(cx - 30, cy - (viewH / 2) - 8, 60, viewH - 4);

    // Guard silhouette in room
    const guardSil = this.add.image(cx + 20, cy + 25, 'guard', 6).setScale(1.4);
    // Patrolling back and forth in peek window
    this.tweens.add({
      targets: guardSil,
      x: cx - 40,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      onYoyo: () => guardSil.setFlipX(true),
      onRepeat: () => guardSil.setFlipX(false)
    });

    // Flashlight beam from guard in preview
    const flashGlow = this.add.circle(cx + 35, cy + 22, 18, 0xfef08a, 0.35);
    this.tweens.add({
      targets: flashGlow,
      x: cx - 55,
      duration: 2000,
      yoyo: true,
      repeat: -1
    });

    // Room info overlay
    const desc = this.door ? this.door.peekRoomDescription : 'Warehouse Hallway - Guard on patrol';
    this.add.text(cx, cy + 68, desc.toUpperCase(), {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '9px',
      color: '#f59e0b'
    }).setOrigin(0.5);

    // Return prompt
    const returnText = this.add.text(cx, cy + 96, 'PRESS ANY KEY OR TAP TO RETURN [ESC / J]', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '8px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: returnText,
      alpha: 0.3,
      duration: 350,
      yoyo: true,
      repeat: -1
    });

    const closePeek = () => {
      this.scene.stop();
      this.scene.resume('GameScene');
    };

    this.input.keyboard.on('keydown', closePeek);
    this.input.on('pointerdown', closePeek);
  }
}
