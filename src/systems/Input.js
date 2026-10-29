/**
 * Input.js
 * Comprehensive input manager handling Keyboard, Gamepad, and on-screen Mobile Touch.
 */

export class InputManager {
  constructor(scene) {
    this.scene = scene;

    // State object polled by Player and Scenes
    this.state = {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,
      jumpJustPressed: false,
      sneak: false,
      action: false, // J: takedown, interact, open vent
      actionJustPressed: false,
      shoot: false, // K: shoot
      shootJustPressed: false,
      grab: false, // L: grab guard
      grabJustPressed: false,
      thermal: false, // V: thermal visor
      thermalJustPressed: false,
      pause: false
    };

    this.prevJump = false;
    this.prevAction = false;
    this.prevShoot = false;
    this.prevGrab = false;
    this.prevThermal = false;

    // Mobile touches
    this.touchStates = {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,
      action: false,
      shoot: false,
      sneak: false,
      visor: false
    };

    this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    this.initKeyboard();
  }

  initKeyboard() {
    const k = this.scene.input.keyboard;
    this.cursors = k.createCursorKeys();
    this.wasd = k.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });

    this.keys = k.addKeys({
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      j: Phaser.Input.Keyboard.KeyCodes.J,
      k: Phaser.Input.Keyboard.KeyCodes.K,
      l: Phaser.Input.Keyboard.KeyCodes.L,
      v: Phaser.Input.Keyboard.KeyCodes.V,
      p: Phaser.Input.Keyboard.KeyCodes.P,
      esc: Phaser.Input.Keyboard.KeyCodes.ESC
    });
  }

  update() {
    // 1. Keyboard
    const kLeft = this.cursors.left.isDown || this.wasd.left.isDown;
    const kRight = this.cursors.right.isDown || this.wasd.right.isDown;
    const kUp = this.cursors.up.isDown || this.wasd.up.isDown;
    const kDown = this.cursors.down.isDown || this.wasd.down.isDown;
    const kJump = this.keys.space.isDown;
    const kSneak = this.keys.shift.isDown;
    const kAction = this.keys.j.isDown;
    const kShoot = this.keys.k.isDown;
    const kGrab = this.keys.l.isDown;
    const kThermal = this.keys.v.isDown;
    const kPause = Phaser.Input.Keyboard.JustDown(this.keys.p) || Phaser.Input.Keyboard.JustDown(this.keys.esc);

    // 2. Gamepad
    let gpLeft = false, gpRight = false, gpUp = false, gpDown = false;
    let gpJump = false, gpSneak = false, gpAction = false, gpShoot = false, gpGrab = false, gpThermal = false, gpPause = false;

    if (this.scene.input.gamepad && this.scene.input.gamepad.total > 0) {
      const pad = this.scene.input.gamepad.getPad(0);
      if (pad) {
        gpLeft = pad.left || pad.leftStick.x < -0.3;
        gpRight = pad.right || pad.leftStick.x > 0.3;
        gpUp = pad.up || pad.leftStick.y < -0.3;
        gpDown = pad.down || pad.leftStick.y > 0.3;
        gpJump = pad.A;
        gpAction = pad.X;
        gpSneak = pad.B;
        gpShoot = pad.R1 || pad.R2;
        gpGrab = pad.L1 || pad.L2;
        gpThermal = pad.Y;
        gpPause = pad.startButton;
      }
    }

    // 3. Combine with touch
    const rawLeft = kLeft || gpLeft || this.touchStates.left;
    const rawRight = kRight || gpRight || this.touchStates.right;
    const rawUp = kUp || gpUp || this.touchStates.up;
    const rawDown = kDown || gpDown || this.touchStates.down;
    const rawJump = kJump || gpJump || this.touchStates.jump;
    const rawSneak = kSneak || gpSneak || this.touchStates.sneak;
    const rawAction = kAction || gpAction || this.touchStates.action;
    const rawShoot = kShoot || gpShoot || this.touchStates.shoot;
    const rawGrab = kGrab || gpGrab || this.touchStates.grab;
    const rawThermal = kThermal || gpThermal || this.touchStates.visor;

    this.state.left = rawLeft;
    this.state.right = rawRight;
    this.state.up = rawUp;
    this.state.down = rawDown;
    this.state.sneak = rawSneak;
    this.state.shoot = rawShoot;
    this.state.pause = kPause || gpPause;

    // Just Pressed edges
    this.state.jump = rawJump;
    this.state.jumpJustPressed = rawJump && !this.prevJump;
    this.prevJump = rawJump;

    this.state.action = rawAction;
    this.state.actionJustPressed = rawAction && !this.prevAction;
    this.prevAction = rawAction;

    this.state.shootJustPressed = rawShoot && !this.prevShoot;
    this.prevShoot = rawShoot;

    this.state.grab = rawGrab;
    this.state.grabJustPressed = rawGrab && !this.prevGrab;
    this.prevGrab = rawGrab;

    this.state.thermal = rawThermal;
    this.state.thermalJustPressed = rawThermal && !this.prevThermal;
    this.prevThermal = rawThermal;
  }
}
