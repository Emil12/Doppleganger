import * as THREE from 'three';
import {
  createShotEffect,
  type ShotImpact,
  updateShotEffects,
  WEAPON_EFFECT_NAME,
} from './weaponShotEffect';
import { type WeaponKind } from './weaponTypes';

const MAX_SHOT_DISTANCE = 45;

function shotTargets(scene: THREE.Scene, camera: THREE.Camera) {
  return scene.children.filter((child) => child !== camera && child.name !== WEAPON_EFFECT_NAME);
}

function shotDirection(
  camera: THREE.PerspectiveCamera,
  spreadX = 0,
  spreadY = 0,
) {
  const direction = new THREE.Vector3();
  const right = new THREE.Vector3();
  const up = new THREE.Vector3();
  camera.getWorldDirection(direction);
  right.setFromMatrixColumn(camera.matrixWorld, 0);
  up.setFromMatrixColumn(camera.matrixWorld, 1);
  return direction.addScaledVector(right, spreadX).addScaledVector(up, spreadY).normalize();
}

export function fireRevolver(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
  const direction = shotDirection(camera);
  const start = camera.position.clone().addScaledVector(direction, 0.58);
  const hit = new THREE.Raycaster(camera.position, direction, 0.6, MAX_SHOT_DISTANCE)
    .intersectObjects(shotTargets(scene, camera), true)[0];
  const end = hit?.point ?? camera.position.clone().addScaledVector(direction, MAX_SHOT_DISTANCE);
  createShotEffect(scene, start, direction, [{ point: end, hit: Boolean(hit) }], 'revolver');
  triggerWeaponRecoil(camera, 'revolver');
  return hit ? [hit] : [];
}

export function fireShotgun(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
  const hits: THREE.Intersection[] = [];
  const impacts: ShotImpact[] = [];
  const forward = shotDirection(camera);
  const start = camera.position.clone().addScaledVector(forward, 0.82);
  for (let pellet = 0; pellet < 9; pellet += 1) {
    const angle = pellet * 2.399;
    const radius = pellet === 0 ? 0 : 0.018 + (pellet % 3) * 0.009;
    const direction = shotDirection(camera, Math.cos(angle) * radius, Math.sin(angle) * radius);
    const hit = new THREE.Raycaster(camera.position, direction, 0.7, MAX_SHOT_DISTANCE)
      .intersectObjects(shotTargets(scene, camera), true)[0];
    if (hit) hits.push(hit);
    impacts.push({
      point: hit?.point ?? camera.position.clone().addScaledVector(direction, MAX_SHOT_DISTANCE),
      hit: Boolean(hit),
    });
  }
  createShotEffect(scene, start, forward, impacts, 'shotgun');
  triggerWeaponRecoil(camera, 'shotgun');
  return hits;
}

export function triggerWeaponRecoil(camera: THREE.Camera, kind: WeaponKind) {
  const held = camera.children.find((child) => child.userData.weaponKind === kind);
  if (!held) return;
  held.userData.recoil = 1;
  held.userData.recoilSide = (Math.random() - 0.5) * 0.16;
  if (kind === 'revolver') {
    held.userData.chamberAngle = Number(held.userData.chamberAngle ?? 0) + Math.PI / 3;
  }
}

export function setWeaponReloading(camera: THREE.Camera, reloading: boolean) {
  const held = camera.children.find((child) => child.userData.weaponKind);
  if (held) held.userData.reloading = reloading;
}

function updateHeldWeapon(object: THREE.Object3D, delta: number) {
  const kind = object.userData.weaponKind as WeaponKind | undefined;
  const basePosition = object.userData.basePosition as THREE.Vector3 | undefined;
  const baseRotation = object.userData.baseRotation as THREE.Euler | undefined;
  if (!kind || !basePosition || !baseRotation) return;
  const recoil = Math.max(0, Number(object.userData.recoil ?? 0) - delta * 5.5);
  const reloadTarget = object.userData.reloading === true ? 1 : 0;
  const reload = THREE.MathUtils.lerp(Number(object.userData.reloadPose ?? 0), reloadTarget, 0.12);
  const recoilSide = Number(object.userData.recoilSide ?? 0);
  const breathing = performance.now() * 0.0018;
  object.userData.recoil = recoil;
  object.userData.reloadPose = reload;
  object.position.copy(basePosition);
  object.position.x += Math.sin(breathing) * 0.004 + recoil * recoilSide;
  object.position.y += Math.cos(breathing * 0.8) * 0.003;
  object.position.z += recoil * (kind === 'shotgun' ? 0.3 : 0.18);
  object.rotation.set(
    baseRotation.x + recoil * (kind === 'shotgun' ? 0.38 : 0.3) + reload * 0.18,
    baseRotation.y + Math.sin(breathing * 0.7) * 0.004,
    baseRotation.z + recoil * recoilSide,
  );
  const barrels = object.getObjectByName('shotgun-barrels');
  if (barrels) barrels.rotation.x = -reload * 0.68;
  const cylinder = object.getObjectByName('revolver-cylinder');
  if (cylinder) {
    cylinder.position.x = reload * 0.2;
    cylinder.rotation.x = THREE.MathUtils.lerp(
      cylinder.rotation.x,
      Number(object.userData.chamberAngle ?? 0),
      0.28,
    );
  }
  const hammer = object.getObjectByName('revolver-hammer');
  if (hammer) {
    hammer.rotation.x = -0.35 - recoil * 0.65;
  }
}

export function updateWeaponEffects(scene: THREE.Scene, delta: number) {
  scene.traverse((object) => updateHeldWeapon(object, delta));
  updateShotEffects(scene, delta);
}
