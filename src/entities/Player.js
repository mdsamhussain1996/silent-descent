// src/entities/Player.js
// Vikram "Ghost" Rao: 2.5D Humanoid Operative with PBR Materials & Amber Visor

import * as THREE from 'three';
import { collision } from '../world/Collision.js';
import { audio } from '../core/Audio.js';
import { events } from '../core/Events.js';

export class Player {
  constructor(scene, startX = 0, startY = 1) {
    this.scene = scene;

    // Gameplay Plane Coordinates (Z = 0)
    this.x = startX;
    this.y = startY;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1; // 1 = right, -1 = left
    this.box = { x: startX - 0.25, y: startY, w: 0.5, h: 1.7 };

    // Movement speeds (m/s) as defined in §6.1
    this.SPEED_WALK = 2.2;
    this.SPEED_SNEAK = 1.3;
    this.SPEED_RUN = 4.5;
    this.SPEED_PIPE = 1.8;
    this.JUMP_SPEED = 6.2;
    this.GRAVITY = -18.0;

    // Movement state
    this.state = 'idle'; // idle, walk, sneak, run, jump, fall, ledge_grab, pipe_hang, cover, vent, takedown
    this.onGround = false;
    this.coyoteTimer = 0;
    this.jumpBuffer = 0;
    this.isSneaking = false;
    this.inCover = false;
    this.isAiming = false;
    this.aimAngle = 0;

    // Stats
    this.hp = 100;
    this.maxHp = 100;
    this.visibility = 0.2; // 0 to 1
    this.noiseRadius = 0;

    // Mark & Execute system (§6.5)
    this.markedTargets = [];
    this.markExecuteReady = true;

    // 3D Mesh Hierarchy
    this.mesh = this.buildGhostModel();
    this.scene.add(this.mesh);

    // Laser Sight Line
    this.laserSight = this.buildLaserSight();
    this.scene.add(this.laserSight);
  }

  buildGhostModel() {
    const root = new THREE.Group();

    // Materials (Charcoal tactical suit, Kevlar plate, Amber Visor)
    const suitMat = new THREE.MeshStandardMaterial({
      color: 0x181c24,
      roughness: 0.75,
      metalness: 0.15
    });
    const vestMat = new THREE.MeshStandardMaterial({
      color: 0x222733,
      roughness: 0.5,
      metalness: 0.3
    });
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xb47243,
      roughness: 0.8
    });
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x090b0e,
      roughness: 0.9
    });
    const visorMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b
    });

    // 1. Torso & Kevlar Vest
    const torsoGeo = new THREE.BoxGeometry(0.38, 0.58, 0.24);
    const torso = new THREE.Mesh(torsoGeo, suitMat);
    torso.position.y = 1.05;
    torso.castShadow = true;
    root.add(torso);

    const vestGeo = new THREE.BoxGeometry(0.40, 0.45, 0.26);
    const vest = new THREE.Mesh(vestGeo, vestMat);
    vest.position.y = 1.05;
    root.add(vest);

    // Tactical Webbing Straps & Belt
    const beltGeo = new THREE.BoxGeometry(0.42, 0.08, 0.27);
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x0c0f14, roughness: 0.6 });
    const belt = new THREE.Mesh(beltGeo, beltMat);
    belt.position.y = 0.8;
    root.add(belt);

    // Rope Pack on back
    const packGeo = new THREE.BoxGeometry(0.24, 0.32, 0.14);
    const packMat = new THREE.MeshStandardMaterial({ color: 0x293548, roughness: 0.8 });
    const pack = new THREE.Mesh(packGeo, packMat);
    pack.position.set(0, 1.1, -0.16);
    root.add(pack);

    // 2. Head & Monocular Amber Visor
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.48, 0);

    const headGeo = new THREE.BoxGeometry(0.22, 0.24, 0.22);
    const head = new THREE.Mesh(headGeo, skinMat);
    headGroup.add(head);

    const hairGeo = new THREE.BoxGeometry(0.23, 0.08, 0.23);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 0.1;
    headGroup.add(hair);

    // Single glowing amber monocular visor (right eye)
    const visorGeo = new THREE.BoxGeometry(0.08, 0.06, 0.06);
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0.06, 0.02, 0.11);
    headGroup.add(visor);

    // Point light on visor for dramatic ocular glow
    const visorLight = new THREE.PointLight(0xf59e0b, 0.6, 1.2);
    visorLight.position.set(0.06, 0.02, 0.15);
    headGroup.add(visorLight);

    root.add(headGroup);
    this.headGroup = headGroup;

    // 3. Arms & Holstered Weapon
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.22, 1.25, 0);
    const armGeo = new THREE.BoxGeometry(0.1, 0.42, 0.1);
    const armMesh = new THREE.Mesh(armGeo, suitMat);
    armMesh.position.y = -0.18;
    this.rightArm.add(armMesh);

    // Weapon model in right hand
    const gunGeo = new THREE.BoxGeometry(0.06, 0.1, 0.24);
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8, roughness: 0.3 });
    this.gunMesh = new THREE.Mesh(gunGeo, gunMat);
    this.gunMesh.position.set(0, -0.38, 0.1);
    this.rightArm.add(this.gunMesh);
    root.add(this.rightArm);

    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.22, 1.25, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, suitMat);
    leftArmMesh.position.y = -0.18;
    this.leftArm.add(leftArmMesh);
    root.add(this.leftArm);

    // 4. Legs
    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.11, 0.75, 0);
    const legGeo = new THREE.BoxGeometry(0.12, 0.72, 0.14);
    const rightLegMesh = new THREE.Mesh(legGeo, suitMat);
    rightLegMesh.position.y = -0.36;
    this.rightLeg.add(rightLegMesh);
    root.add(this.rightLeg);

    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.11, 0.75, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, suitMat);
    leftLegMesh.position.y = -0.36;
    this.leftLeg.add(leftLegMesh);
    root.add(this.leftLeg);

    this.animTime = 0;
    return root;
  }

  buildLaserSight() {
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(5, 0, 0)
    ]);
    const mat = new THREE.LineBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.65
    });
    const line = new THREE.Line(geo, mat);
    line.visible = false;
    return line;
  }

  update(dt, input) {
    this.animTime += dt;

    // Check coyote time and jump buffer
    if (this.onGround) this.coyoteTimer = 0.08;
    else this.coyoteTimer -= dt;

    if (input.isJumping()) this.jumpBuffer = 0.1;
    else this.jumpBuffer -= dt;

    this.isSneaking = input.isSneaking();
    const hAxis = input.getHorizontal();
    const vAxis = input.getVertical();

    // 1. Pipe Hang Check (§6.1)
    const pipeAbove = collision.findPipeAbove(this.x, this.y, 2.2);
    if (pipeAbove && vAxis > 0.5 && this.state !== 'pipe_hang') {
      this.state = 'pipe_hang';
      this.y = pipeAbove.y - 1.5;
      this.vy = 0;
    }

    if (this.state === 'pipe_hang') {
      this.vy = 0;
      this.vx = hAxis * this.SPEED_PIPE;
      if (hAxis !== 0) this.facing = Math.sign(hAxis);

      if (vAxis < -0.5 || input.isJumping()) {
        this.state = 'fall'; // drop from pipe
      }
      this.x += this.vx * dt;
      this.box.x = this.x - 0.25;
      this.box.y = this.y;
      this.updateMeshTransform();
      return;
    }

    // 2. Normal / Sneak / Run Movement
    let targetSpeed = this.SPEED_WALK;
    if (this.isSneaking) targetSpeed = this.SPEED_SNEAK;
    else if (Math.abs(hAxis) > 0.8) targetSpeed = this.SPEED_RUN;

    this.vx = hAxis * targetSpeed;
    if (hAxis !== 0) this.facing = Math.sign(hAxis);

    // Jump execution
    if (this.jumpBuffer > 0 && this.coyoteTimer > 0) {
      this.vy = this.JUMP_SPEED;
      this.jumpBuffer = 0;
      this.coyoteTimer = 0;
      this.onGround = false;
      audio.playFootstep('concrete', false);
    }

    // Apply gravity
    this.vy += this.GRAVITY * dt;

    // Drop down through one-way platforms (S + Space or S tap)
    const dropDown = vAxis < -0.6;

    // Swept Box Movement
    this.box.x = this.x - 0.25;
    this.box.y = this.y;
    const moveRes = collision.moveBox(this.box, this.vx * dt, this.vy * dt, dropDown);

    this.x = moveRes.x + 0.25;
    this.y = moveRes.y;
    this.vx = moveRes.vx / dt;
    this.vy = moveRes.vy / dt;
    this.onGround = moveRes.onGround;

    // 3. Aiming & Laser Sight
    this.isAiming = input.isAiming();
    if (this.isAiming) {
      const dx = input.mouse.worldX - this.x;
      const dy = input.mouse.worldY - (this.y + 1.1);
      this.aimAngle = Math.atan2(dy, dx);
      if (Math.abs(dx) > 0.2) this.facing = Math.sign(dx);

      // Raycast laser sight against environment
      const maxDist = 14;
      const rayX2 = this.x + Math.cos(this.aimAngle) * maxDist;
      const rayY2 = (this.y + 1.1) + Math.sin(this.aimAngle) * maxDist;
      const cast = collision.raycast(this.x, this.y + 1.1, rayX2, rayY2);

      const hitX = cast.hit ? cast.point.x : rayX2;
      const hitY = cast.hit ? cast.point.y : rayY2;

      this.laserSight.visible = true;
      const positions = this.laserSight.geometry.attributes.position.array;
      positions[0] = this.x + this.facing * 0.2;
      positions[1] = this.y + 1.1;
      positions[2] = 0.05;
      positions[3] = hitX;
      positions[4] = hitY;
      positions[5] = 0.05;
      this.laserSight.geometry.attributes.position.needsUpdate = true;
    } else {
      this.laserSight.visible = false;
    }

    // Calculate Visibility & Noise
    const shadowFactor = collision.getShadowFactor(this.x, this.y);
    const postureFactor = this.state === 'pipe_hang' ? 0.3 : (this.isSneaking ? 0.5 : 1.0);
    this.visibility = Math.max(0.1, 0.85 * shadowFactor * postureFactor);

    // Noise emission radius
    if (this.onGround && Math.abs(this.vx) > 0.1) {
      this.noiseRadius = this.isSneaking ? 0 : (Math.abs(this.vx) > 3.0 ? 8.0 : 3.0);
    } else {
      this.noiseRadius = 0;
    }

    this.updateAnimationPose(dt);
    this.updateMeshTransform();
  }

  updateAnimationPose(dt) {
    if (this.state === 'pipe_hang') {
      // Arms straight up gripping overhead pipe
      this.rightArm.rotation.z = Math.PI * 0.85;
      this.leftArm.rotation.z = -Math.PI * 0.85;
      this.rightLeg.rotation.x = 0.4;
      this.leftLeg.rotation.x = -0.4;
      return;
    }

    if (this.isAiming) {
      // Upper body IK toward aim point
      const relAngle = this.facing > 0 ? this.aimAngle : (Math.PI - this.aimAngle);
      this.rightArm.rotation.z = relAngle;
      this.leftArm.rotation.z = relAngle * 0.5;
    } else if (this.onGround && Math.abs(this.vx) > 0.1) {
      // Articulated legs and arms walking swing
      const swingSpeed = this.isSneaking ? 8.0 : 13.0;
      const legSwing = Math.sin(this.animTime * swingSpeed) * 0.6;
      this.rightLeg.rotation.x = legSwing;
      this.leftLeg.rotation.x = -legSwing;
      this.rightArm.rotation.x = -legSwing * 0.7;
      this.leftArm.rotation.x = legSwing * 0.7;
    } else {
      // Idle breathing
      const breath = Math.sin(this.animTime * 3.0) * 0.04;
      this.rightLeg.rotation.x = 0;
      this.leftLeg.rotation.x = 0;
      this.rightArm.rotation.x = breath;
      this.leftArm.rotation.x = -breath;
      this.rightArm.rotation.z = 0.1;
      this.leftArm.rotation.z = -0.1;
    }
  }

  updateMeshTransform() {
    this.mesh.position.set(this.x, this.y, 0);
    this.mesh.scale.set(this.facing, 1, 1);
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0) {
      events.emit('player_dead');
    }
  }
}
