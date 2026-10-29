/**
 * Input.js
 * Comprehensive input manager handling Keyboard, Gamepad, and on-screen Mobile Touch.
 */

export class InputManager {
  constructor(scene) {
    this.scene = scene;

    // State object polled by Player, Weapons, and Scenes
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
      shoot: false, // K or mouse click: shoot
      shootJustPressed: false,
      grab: false, // L: grab guard
      grabJustPressed: false,
      thermal: false, // V: thermal visor
      thermalJustPressed: false,
      cyclePrevJustPressed: false, // Q: prev weapon
      cycleNextJustPressed: false, // E: next weapon
      reloadJustPressed: false, // R: reload
      gadgetJustPressed: false, // G: use gadget (taser / noise maker)
      mouseActive: false,
      mouseWorldX: 0,
      mouseWorldY: 0,
      pause: false
    };

    this.prevJump = false;
    this.prevAction = false;
    this.prevShoot = false;
    this.prevGrab = false;
    this.prevThermal = false;
    this.prevCyclePrev = false;
    this.prevCycleNext = false;
    this.prevReload = false;
    this.prevGadget = false;

    // Wheel cycle buffer
    this.wheelCycle = 0;

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
      visor: false,
      cycle: false,
      reload: false,
      gadget: false
    };

    this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    this.initKeyboard();
    this.initMouse();
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
      f: Phaser.Input.Keyboard.KeyCodes.F,
      k: Phaser.Input.Keyboard.KeyCodes.K,
      l: Phaser.Input.Keyboard.KeyCodes.L,
      v: Phaser.Input.Keyboard.KeyCodes.V,
      q: Phaser.Input.Keyboard.KeyCodes.Q,
      e: Phaser.Input.Keyboard.KeyCodes.E,
      r: Phaser.Input.Keyboard.KeyCodes.R,
      g: Phaser.Input.Keyboard.KeyCodes.G,
      p: Phaser.Input.Keyboard.KeyCodes.P,
      esc: Phaser.Input.Keyboard.KeyCodes.ESC
    });
  }

  initMouse() {
    this.scene.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
      if (deltaY > 0) this.wheelCycle = 1;
      else if (deltaY < 0) this.wheelCycle = -1;
    });

    this.scene.input.on('pointermove', (pointer) => {
      this.state.mouseActive = true;
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
    const kAction = this.keys.j.isDown || this.keys.f.isDown;
    const kShoot = this.keys.k.isDown;
    const kGrab = this.keys.l.isDown;
    const kThermal = this.keys.v.isDown;
    const kCyclePrev = this.keys.q.isDown;
    const kCycleNext = this.keys.e.isDown;
    const kReload = this.keys.r.isDown;
    const kGadget = this.keys.g.isDown;
    const kPause = Phaser.Input.Keyboard.JustDown(this.keys.p) || Phaser.Input.Keyboard.JustDown(this.keys.esc);

    // Mouse pointer
    const pointer = this.scene.input.activePointer;
    const mouseLeftClick = pointer ? pointer.leftButtonDown() : false;
    if (pointer && this.scene.cameras && this.scene.cameras.main) {
      this.state.mouseWorldX = pointer.worldX;
      this.state.mouseWorldY = pointer.worldY;
      if (pointer.movementX !== 0 || pointer.movementY !== 0) {
        this.state.mouseActive = true;
      }
    }

    // 2. Gamepad
    let gpLeft = false, gpRight = false, gpUp = false, gpDown = false;
    let gpJump = false, gpSneak = false, gpAction = false, gpShoot = false, gpGrab = false, gpThermal = false, gpPause = false;
    let gpCyclePrev = false, gpCycleNext = false, gpReload = false, gpGadget = false;

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
        gpShoot = pad.R2;
        gpGrab = pad.L2;
        gpThermal = pad.Y;
        gpCyclePrev = pad.L1;
        gpCycleNext = pad.R1;
        gpReload = pad.leftStickButton;
        gpGadget = pad.rightStickButton;
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
    const rawShoot = kShoot || mouseLeftClick || gpShoot || this.touchStates.shoot;
    const rawGrab = kGrab || gpGrab;
    const rawThermal = kThermal || gpThermal || this.touchStates.visor;
    const rawCyclePrev = kCyclePrev || gpCyclePrev || (this.wheelCycle < 0);
    const rawCycleNext = kCycleNext || gpCycleNext || (this.wheelCycle > 0) || this.touchStates.cycle;
    const rawReload = kReload || gpReload || this.touchStates.reload;
    const rawGadget = kGadget || gpGadget || this.touchStates.gadget;

    // Reset wheel cycle once consumed
    this.wheelCycle = 0;

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

    this.state.cyclePrevJustPressed = rawCyclePrev && !this.prevCyclePrev;
    this.prevCyclePrev = rawCyclePrev;

    this.state.cycleNextJustPressed = rawCycleNext && !this.prevCycleNext;
    this.prevCycleNext = rawCycleNext;

    this.state.reloadJustPressed = rawReload && !this.prevReload;
    this.prevReload = rawReload;

    this.state.gadgetJustPressed = rawGadget && !this.prevGadget;
    this.prevGadget = rawGadget;
  }
}
