import * as THREE from 'three';
import {
  createShotEffect,
  disposeShotEffectAssets,
  type ShotImpact,
  updateShotEffects,
  WEAPON_EFFECT_NAME,
} from './weaponShotEffect';
import { type WeaponKind, WEAPON_CONFIG } from './weaponTypes';
import {
  createFlameEffect,
  disposeFlameEffectAssets,
} from './flamethrowerEffect';

const MAX_SHOT_DISTANCE = 45;
const DEFAULT_FOV = 68;
const AIM_FOV = 56;
const shotRaycaster = new THREE.Raycaster();
const forwardDirection = new THREE.Vector3();
const pelletDirection = new THREE.Vector3();
const directionRight = new THREE.Vector3();
const directionUp = new THREE.Vector3();
const shotStart = new THREE.Vector3();

function shotTargets(scene: THREE.Scene, camera: THREE.Camera) {
  return scene.children.filter((child) => child !== camera && child.name !== WEAPON_EFFECT_NAME);
}

function shotDirection(
  camera: THREE.PerspectiveCamera,
  target: THREE.Vector3,
  spreadX = 0,
  spreadY = 0,
) {
  camera.getWorldDirection(target);
  directionRight.setFromMatrixColumn(camera.matrixWorld, 0);
  directionUp.setFromMatrixColumn(camera.matrixWorld, 1);
  return target
    .addScaledVector(directionRight, spreadX)
    .addScaledVector(directionUp, spreadY)
    .normalize();
}

export function fireWeapon(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  kind: WeaponKind,
) {
  const config = WEAPON_CONFIG[kind];
  const hits: THREE.Intersection[] = [];
  const impacts: ShotImpact[] = [];
  const intersections: THREE.Intersection[] = [];
  const targets = shotTargets(scene, camera);
  const forward = shotDirection(camera, forwardDirection);
  const held = camera.children.find((child) => child.userData.weaponKind === kind);
  const muzzle = held?.getObjectByName('weapon-muzzle');
  const start = muzzle
    ? muzzle.getWorldPosition(shotStart)
    : shotStart.copy(camera.position).addScaledVector(forward, 0.82);
  const shotDistance = kind === 'flamethrower' ? 6 : MAX_SHOT_DISTANCE;
  for (let pellet = 0; pellet < config.projectiles; pellet += 1) {
    const angle = pellet * 2.399;
    const radius = pellet === 0 ? 0 : config.spread * (0.5 + (pellet % 3) * 0.25);
    const direction = shotDirection(
      camera,
      pelletDirection,
      Math.cos(angle) * radius,
      Math.sin(angle) * radius,
    );
    shotRaycaster.set(camera.position, direction);
    shotRaycaster.near = 0.7;
    shotRaycaster.far = shotDistance;
    intersections.length = 0;
    const hit = shotRaycaster.intersectObjects(targets, true, intersections)[0];
    if (hit) hits.push(hit);
    impacts.push({
      point: hit?.point ?? camera.position.clone().addScaledVector(direction, shotDistance),
      hit: Boolean(hit),
    });
  }
  if (kind === 'flamethrower') createFlameEffect(scene, start, forward);
  else createShotEffect(scene, start, forward, impacts);
  triggerWeaponRecoil(camera, kind);
  return hits;
}

export function disposeWeaponEffectAssets(scene: THREE.Scene) {
  disposeShotEffectAssets(scene);
  disposeFlameEffectAssets();
}

export function triggerWeaponRecoil(camera: THREE.Camera, kind: WeaponKind) {
  const held = camera.children.find((child) => child.userData.weaponKind === kind);
  if (!held) return;
  held.userData.recoil = 1;
  held.userData.recoilSide = (Math.random() - 0.5) * 0.16;
  held.userData.actionCycle = 1;
}

export function setWeaponReloading(camera: THREE.Camera, reloading: boolean) {
  const held = camera.children.find((child) => child.visible && child.userData.weaponKind);
  if (held) held.userData.reloading = reloading;
}

export function setWeaponAiming(camera: THREE.Camera, aiming: boolean) {
  const held = camera.children.find((child) => child.visible && child.userData.weaponKind);
  camera.userData.weaponAiming = Boolean(held && aiming);
  if (held) held.userData.aiming = aiming;
}

function updateHeldWeapon(object: THREE.Object3D, delta: number) {
  const kind = object.userData.weaponKind as WeaponKind | undefined;
  const basePosition = object.userData.basePosition as THREE.Vector3 | undefined;
  const baseRotation = object.userData.baseRotation as THREE.Euler | undefined;
  if (!kind || !basePosition || !baseRotation) return;
  const recoil = Math.max(0, Number(object.userData.recoil ?? 0) - delta * 5.5);
  const reloadTarget = object.userData.reloading === true ? 1 : 0;
  const reload = THREE.MathUtils.lerp(Number(object.userData.reloadPose ?? 0), reloadTarget, 0.12);
  const aimTarget = object.userData.aiming === true && reloadTarget === 0 ? 1 : 0;
  const aim = THREE.MathUtils.lerp(Number(object.userData.aimPose ?? 0), aimTarget, 0.18);
  const recoilSide = Number(object.userData.recoilSide ?? 0);
  const actionRemaining = Math.max(0, Number(object.userData.actionCycle ?? 0) - delta * 1.65);
  const actionMotion = Math.sin((1 - actionRemaining) * Math.PI);
  const breathing = performance.now() * 0.0018;
  object.userData.recoil = recoil;
  object.userData.reloadPose = reload;
  object.userData.actionCycle = actionRemaining;
  object.userData.aimPose = aim;
  object.position.set(
    THREE.MathUtils.lerp(basePosition.x, 0, aim),
    THREE.MathUtils.lerp(basePosition.y, -0.16, aim),
    THREE.MathUtils.lerp(basePosition.z, -0.72, aim),
  );
  object.position.x += Math.sin(breathing) * 0.004 * (1 - aim) + recoil * recoilSide;
  object.position.y += Math.cos(breathing * 0.8) * 0.003 * (1 - aim);
  object.position.z += recoil * 0.3;
  object.rotation.set(
    THREE.MathUtils.lerp(baseRotation.x, 0, aim)
      + recoil * 0.38
      + reload * 0.18,
    THREE.MathUtils.lerp(baseRotation.y, 0, aim)
      + Math.sin(breathing * 0.7) * 0.004 * (1 - aim),
    THREE.MathUtils.lerp(baseRotation.z, 0, aim) + recoil * recoilSide,
  );
  const pump = object.getObjectByName('shotgun-pump');
  if (pump) {
    pump.position.z = Number(pump.userData.baseZ) + actionMotion * 0.28;
  }
  const bolt = object.getObjectByName('shotgun-bolt');
  if (bolt) {
    bolt.position.z = Number(bolt.userData.baseZ) + actionMotion * 0.2;
  }
  const rifleBolt = object.getObjectByName('weapon-bolt');
  if (rifleBolt) {
    rifleBolt.position.x = Number(rifleBolt.userData.baseX) + actionMotion * 0.18;
  }
  const slide = object.getObjectByName('weapon-slide');
  if (slide) {
    slide.position.z = Number(slide.userData.baseZ) + actionMotion * 0.16;
  }
  const magazine = object.getObjectByName('weapon-magazine');
  if (magazine) {
    const baseY = Number(magazine.userData.baseY ?? magazine.position.y);
    magazine.userData.baseY = baseY;
    magazine.position.y = baseY - reload * 0.18;
  }
  const cylinder = object.getObjectByName('revolver-cylinder');
  if (cylinder) {
    cylinder.rotation.x = actionMotion * (Math.PI / 3);
  }
}

function updateAimCamera(camera: THREE.PerspectiveCamera, delta: number) {
  const targetFov = camera.userData.weaponAiming === true ? AIM_FOV : DEFAULT_FOV;
  const nextFov = THREE.MathUtils.lerp(camera.fov, targetFov, Math.min(1, delta * 12));
  if (Math.abs(camera.fov - nextFov) < 0.01) return;
  camera.fov = nextFov;
  camera.updateProjectionMatrix();
}

export function updateWeaponEffects(scene: THREE.Scene, delta: number) {
  for (const object of scene.children) {
    if (!(object instanceof THREE.PerspectiveCamera)) continue;
    updateAimCamera(object, delta);
    object.children.forEach((child) => {
      if (child.visible) updateHeldWeapon(child, delta);
    });
  }
  updateShotEffects(scene, delta);
}
