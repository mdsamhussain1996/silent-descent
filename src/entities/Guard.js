// src/entities/Guard.js
// Kestrel PMC Guard entity with 2.5D vision cone, flashlight, telegraph laser & recursion protection

import * as THREE from 'three';
import { collision } from '../world/Collision.js';
import { audio } from '../core/Audio.js';
import { events } from '../core/Events.js';

export class Guard {
  constructor(scene, x, y, patrolMinX, patrolMaxX, alarmSystem) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.patrolMinX = patrolMinX;
    this.patrolMaxX = patrolMaxX;
    this.alarmSystem = alarmSystem;

    this.vx = 0;
    this.facing = 1;
    this.box = { x: x - 0.25, y: y, w: 0.5, h: 1.7 };

    // AI state: 'patrol', 'suspicious', 'investigate', 'alert', 'combat', 'knocked'
    this.state = 'patrol';
    this.patrolSpeed = 1.4;
    this.combatSpeed = 3.2;
    this.investigateTimer = 0;
    this.lastKnownX = 0;
    this.lastKnownY = 0;

    // Vision cone & spotting
    this.visionAngle = (70 * Math.PI) / 180;
    this.visionRange = 12.0; // 12m in light, drops in shadow
    this.spotMeter = 0; // 0 to 1
    this.spottedSlowMoTriggered = false;

    // Combat shooting & telegraph (§6.4)
    this.telegraphTimer = 0;
    this.shootCooldown = 0;

    // 3D Model
    this.mesh = this.buildGuardModel();
    this.scene.add(this.mesh);

    // Flashlight SpotLight & Volumetric Cone
    this.setupFlashlight();

    // Red Telegraph Laser Sight (0.6s before shooting)
    this.telegraphLaser = this.buildTelegraphLaser();
    this.scene.add(this.telegraphLaser);
  }

  buildGuardModel() {
    const root = new THREE.Group();

    const ponchoMat = new THREE.MeshStandardMaterial({ color: 0x3b4a24, roughness: 0.8 }); // Kestrel Olive
    const armorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0x9a5b32, roughness: 0.8 });
    const helmetMat = new THREE.MeshStandardMaterial({ color: 0x242e16, roughness: 0.4 });

    // Torso with Olive Poncho
    const torsoGeo = new THREE.BoxGeometry(0.4, 0.6, 0.26);
    const torso = new THREE.Mesh(torsoGeo, ponchoMat);
    torso.position.y = 1.05;
    torso.castShadow = true;
    root.add(torso);

    // Head & Tactical Helmet
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.48, 0);
    const headGeo = new THREE.BoxGeometry(0.22, 0.22, 0.22);
    const head = new THREE.Mesh(headGeo, skinMat);
    headGroup.add(head);

    const helmetGeo = new THREE.BoxGeometry(0.26, 0.16, 0.26);
    const helmet = new THREE.Mesh(helmetGeo, helmetMat);
    helmet.position.y = 0.08;
    headGroup.add(helmet);
    root.add(headGroup);

    // Legs
    this.rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.72, 0.14), armorMat);
    this.rightLeg.position.set(0.12, 0.38, 0);
    root.add(this.rightLeg);

    this.leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.72, 0.14), armorMat);
    this.leftLeg.position.set(-0.12, 0.38, 0);
    root.add(this.leftLeg);

    // Flashlight Arm & SMG
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.24, 1.25, 0);
    const armMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.45, 0.1), ponchoMat);
    armMesh.position.y = -0.18;
    this.rightArm.add(armMesh);

    // SMG model
    const smgMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.35), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
    smgMesh.position.set(0, -0.38, 0.15);
    this.rightArm.add(smgMesh);
    root.add(this.rightArm);

    this.animTime = 0;
    return root;
  }

  setupFlashlight() {
    this.flashlight = new THREE.SpotLight(0xfffbeb, 3.2, 14, Math.PI / 5, 0.5, 1.2);
    this.flashlight.position.set(0.24, 1.1, 0.3);
    this.flashlightTarget = new THREE.Object3D();
    this.flashlightTarget.position.set(5, 1.1, 0);
    this.mesh.add(this.flashlight);
    this.mesh.add(this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;

    // Volumetric flashlight cone
    const coneGeo = new THREE.ConeGeometry(2.8, 8, 16, 1, true);
    coneGeo.translate(0, -4, 0);
    coneGeo.rotateX(-Math.PI / 2);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xfffbeb,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.flashCone = new THREE.Mesh(coneGeo, coneMat);
    this.flashCone.position.set(0.24, 1.1, 0.3);
    this.mesh.add(this.flashCone);
  }

  buildTelegraphLaser() {
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(1, 0, 0)
    ]);
    const mat = new THREE.LineBasicMaterial({
      color: 0xff0000,
      linewidth: 2,
      transparent: true,
      opacity: 0.8
    });
    const line = new THREE.Line(geo, mat);
    line.visible = false;
    return line;
  }

  // RECURSION GUARD: §1 CRITICAL FIX
  setAlertState(fromAlarm = false) {
    if (this.state === 'alert' || this.state === 'knocked') return;
    this.state = 'alert';

    // Only raise alarm if not initiated from alarm
    if (!fromAlarm && this.alarmSystem) {
      this.alarmSystem.raise(this.x, this.y);
    }
  }

  knockout() {
    if (this.state === 'knocked') return;
    this.state = 'knocked';
    this.flashlight.intensity = 0;
    this.flashCone.visible = false;
    this.telegraphLaser.visible = false;

    // Rotate flat on ground
    this.mesh.rotation.z = Math.PI / 2;
    this.mesh.position.y = this.y + 0.2;
    audio.playTakedown();
    events.emit('guard_knocked', { x: this.x, y: this.y });
  }

  update(dt, player) {
    if (this.state === 'knocked') return;
    this.animTime += dt;
    this.shootCooldown -= dt;

    // 1. Vision Check against Player
    this.checkVision(player, dt);

    // 2. AI State Machine
    if (this.state === 'patrol') {
      this.vx = this.facing * this.patrolSpeed;
      if (this.facing > 0 && this.x >= this.patrolMaxX) {
        this.facing = -1;
      } else if (this.facing < 0 && this.x <= this.patrolMinX) {
        this.facing = 1;
      }
    } else if (this.state === 'investigate') {
      const dx = this.lastKnownX - this.x;
      if (Math.abs(dx) > 0.4) {
        this.facing = Math.sign(dx);
        this.vx = this.facing * this.patrolSpeed;
      } else {
        this.vx = 0;
        this.investigateTimer -= dt;
        if (this.investigateTimer <= 0) {
          this.state = 'patrol';
        }
      }
    } else if (this.state === 'alert' || this.state === 'combat') {
      const dx = player.x - this.x;
      this.facing = Math.sign(dx) || 1;

      // Close distance or shoot
      const dist = Math.hypot(dx, player.y - this.y);
      if (dist > 5.0) {
        this.vx = this.facing * this.combatSpeed;
      } else {
        this.vx = 0;
      }

      // Telegraph laser before shooting (§6.4: 0.6s red laser)
      this.updateTelegraphCombat(dt, player);
    }

    // Apply movement on gameplay plane
    this.x += this.vx * dt;
    this.box.x = this.x - 0.25;
    this.box.y = this.y;

    // Animate legs
    if (Math.abs(this.vx) > 0.1) {
      const swing = Math.sin(this.animTime * 10) * 0.5;
      this.rightLeg.rotation.x = swing;
      this.leftLeg.rotation.x = -swing;
    } else {
      this.rightLeg.rotation.x = 0;
      this.leftLeg.rotation.x = 0;
    }

    this.mesh.position.set(this.x, this.y, 0);
    this.mesh.scale.set(this.facing, 1, 1);
  }

  checkVision(player, dt) {
    if (player.hp <= 0 || player.state === 'pipe_hang') {
      this.spotMeter = Math.max(0, this.spotMeter - dt * 1.5);
      return;
    }

    const dx = player.x - this.x;
    const dy = (player.y + 1.0) - (this.y + 1.2);
    const dist = Math.hypot(dx, dy);

    // Is player in front?
    const inFront = (dx * this.facing) > 0;
    const effectiveRange = player.visibility < 0.35 ? 6.0 : this.visionRange;

    if (inFront && dist <= effectiveRange) {
      // Raycast line-of-sight check
      const cast = collision.raycast(this.x, this.y + 1.2, player.x, player.y + 1.0);
      if (!cast.hit || cast.fraction > 0.95) {
        // Spotted! Fill detection bar
        this.spotMeter += dt * (1.5 / Math.max(1, dist * 0.2));
        this.lastKnownX = player.x;
        this.lastKnownY = player.y;

        if (this.spotMeter >= 1.0 && this.state !== 'alert') {
          // Detection complete! Enter alert state
          this.setAlertState(false);
          audio.playAlarmSiren();
        } else if (this.state === 'patrol') {
          this.state = 'investigate';
          this.investigateTimer = 4.0;
        }
        return;
      }
    }

    // Decay spot meter if not seen
    this.spotMeter = Math.max(0, this.spotMeter - dt * 1.0);
  }

  updateTelegraphCombat(dt, player) {
    this.telegraphLaser.visible = true;
    this.telegraphTimer += dt;

    // Update laser line from weapon to player
    const positions = this.telegraphLaser.geometry.attributes.position.array;
    positions[0] = this.x + this.facing * 0.2;
    positions[1] = this.y + 1.1;
    positions[2] = 0.05;
    positions[3] = player.x;
    positions[4] = player.y + 1.0;
    positions[5] = 0.05;
    this.telegraphLaser.geometry.attributes.position.needsUpdate = true;

    // Shoot after 0.6s telegraph
    if (this.telegraphTimer >= 0.6 && this.shootCooldown <= 0) {
      audio.playPistolShot();
      player.takeDamage(18);
      this.telegraphTimer = 0;
      this.shootCooldown = 1.2;
      this.telegraphLaser.visible = false;
    }
  }
}
