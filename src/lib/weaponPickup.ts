import * as THREE from 'three';
import {
  createBoltActionRifleModel,
  createDoubleBarrelModel,
} from './classWeaponModels';
import { createRevolverModel } from './revolverModel';
import { createShotgunModel } from './shotgunModel';
import { createFlamethrowerModel } from './flamethrowerModel';
import { createAk47Model, createGlockModel, createM16Model } from './modernWeaponModels';
import { type WeaponKind, type WeaponSlot } from './weaponTypes';

export const SHOTGUN_PICKUP_NAME = 'shotgun-pickup';
export const SHOTGUN_CABINET_NAME = 'shotgun-cabinet';

const HELD_NAMES: Record<WeaponKind, string> = {
  shotgun: 'held-shotgun',
  revolver: 'held-revolver',
  rifle: 'held-rifle',
  double_barrel: 'held-double-barrel',
  flamethrower: 'held-flamethrower',
  m16: 'held-m16',
  ak47: 'held-ak47',
  glock: 'held-glock',
};
const PICKUP_NAMES: Partial<Record<WeaponKind, string>> = {
  shotgun: SHOTGUN_PICKUP_NAME,
};
const CABINET_NAMES: Partial<Record<WeaponKind, string>> = {
  shotgun: SHOTGUN_CABINET_NAME,
};

const HELD_POSES: Record<WeaponKind, {
  position: [number, number, number];
  rotation: [number, number, number];
  muzzle: [number, number, number];
}> = {
  shotgun: { position: [0.4, -0.4, -0.88], rotation: [-0.1, -0.07, 0], muzzle: [0, 0.15, -1.7] },
  revolver: { position: [0.32, -0.34, -0.68], rotation: [-0.08, -0.05, 0], muzzle: [0, 0.11, -0.94] },
  rifle: { position: [0.42, -0.42, -0.94], rotation: [-0.11, -0.06, 0], muzzle: [0, 0.12, -2.1] },
  double_barrel: { position: [0.4, -0.4, -0.88], rotation: [-0.1, -0.07, 0], muzzle: [0, 0.12, -1.7] },
  flamethrower: { position: [0.42, -0.44, -0.92], rotation: [-0.08, -0.08, 0], muzzle: [0.04, 0.08, -1.75] },
  m16: { position: [0.41, -0.41, -0.9], rotation: [-0.08, -0.07, 0], muzzle: [0, 0.08, -1.8] },
  ak47: { position: [0.42, -0.42, -0.91], rotation: [-0.09, -0.07, 0], muzzle: [0, 0.08, -1.75] },
  glock: { position: [0.3, -0.34, -0.66], rotation: [-0.06, -0.04, 0], muzzle: [0, 0.01, -0.61] },
};

function createHeldWeapon(kind: WeaponKind, slot: WeaponSlot) {
  const weapon = {
    shotgun: () => createShotgunModel(0.52),
    revolver: () => createRevolverModel(0.72),
    rifle: () => createBoltActionRifleModel(0.48),
    double_barrel: () => createDoubleBarrelModel(0.52),
    flamethrower: () => createFlamethrowerModel(0.52),
    m16: () => createM16Model(0.52),
    ak47: () => createAk47Model(0.52),
    glock: () => createGlockModel(0.72),
  }[kind]();
  weapon.name = HELD_NAMES[kind];
  weapon.userData.weaponKind = kind;
  weapon.userData.weaponSlot = slot;
  const pose = HELD_POSES[kind];
  weapon.position.set(...pose.position);
  weapon.rotation.set(...pose.rotation);
  const muzzle = new THREE.Object3D();
  muzzle.name = 'weapon-muzzle';
  muzzle.position.set(...pose.muzzle);
  weapon.add(muzzle);
  weapon.userData.basePosition = weapon.position.clone();
  weapon.userData.baseRotation = weapon.rotation.clone();
  return weapon;
}

function cabinetDistance(scene: THREE.Scene, camera: THREE.Camera, kind: WeaponKind) {
  const markerName = CABINET_NAMES[kind];
  const marker = markerName ? scene.getObjectByName(markerName) : null;
  if (!marker) return Number.POSITIVE_INFINITY;
  const position = new THREE.Vector3();
  marker.getWorldPosition(position);
  return position.distanceTo(camera.position);
}

export function nearestWeaponCabinet(
  scene: THREE.Scene,
  camera: THREE.Camera,
  heldWeapon: WeaponKind | null,
) {
  const wallWeapons: WeaponKind[] = ['shotgun'];
  const kinds = heldWeapon && wallWeapons.includes(heldWeapon) ? [heldWeapon] : heldWeapon ? [] : wallWeapons;
  return kinds.reduce(
    (nearest, kind) => {
      const pickupName = PICKUP_NAMES[kind];
      const pickup = pickupName ? scene.getObjectByName(pickupName) : null;
      const distance = pickup?.visible || heldWeapon === kind
        ? cabinetDistance(scene, camera, kind)
        : Number.POSITIVE_INFINITY;
      return distance < nearest.distance ? { kind, distance } : nearest;
    },
    { kind: null as WeaponKind | null, distance: Number.POSITIVE_INFINITY },
  );
}

export function pickupWeapon(
  scene: THREE.Scene,
  camera: THREE.Camera,
  kind: WeaponKind,
  slot: WeaponSlot = 1,
) {
  if (cabinetDistance(scene, camera, kind) >= 1.75) return false;
  const pickupName = PICKUP_NAMES[kind];
  const pickup = pickupName ? scene.getObjectByName(pickupName) : null;
  if (!pickup?.visible) return false;
  pickup.visible = false;
  camera.children
    .filter((child) => child.userData.weaponSlot === slot)
    .forEach((child) => child.removeFromParent());
  camera.add(createHeldWeapon(kind, slot));
  return true;
}

export function putBackWeapon(scene: THREE.Scene, camera: THREE.Camera, kind: WeaponKind) {
  if (cabinetDistance(scene, camera, kind) >= 1.75) return false;
  const pickupName = PICKUP_NAMES[kind];
  const pickup = pickupName ? scene.getObjectByName(pickupName) : null;
  const held = camera.getObjectByName(HELD_NAMES[kind]);
  if (!pickup || !held) return false;
  pickup.visible = true;
  held.removeFromParent();
  return true;
}

export function equipStartingWeapon(
  scene: THREE.Scene,
  camera: THREE.Camera,
  kind: WeaponKind,
) {
  equipStartingWeapons(scene, camera, [kind]);
}

export function equipStartingWeapons(
  scene: THREE.Scene,
  camera: THREE.Camera,
  kinds: readonly [WeaponKind, WeaponKind?],
) {
  Object.values(HELD_NAMES).forEach((name) => camera.getObjectByName(name)?.removeFromParent());
  Object.entries(PICKUP_NAMES).forEach(([kind, name]) => {
    const pickup = name ? scene.getObjectByName(name) : null;
    if (pickup) pickup.visible = !kinds.includes(kind as WeaponKind);
  });
  kinds.forEach((kind, index) => {
    if (!kind) return;
    const weapon = createHeldWeapon(kind, (index + 1) as WeaponSlot);
    weapon.visible = index === 0;
    camera.add(weapon);
  });
}

export function showWeaponSlot(camera: THREE.Camera, slot: WeaponSlot | null) {
  camera.children.forEach((child) => {
    if (child.userData.weaponKind) child.visible = child.userData.weaponSlot === slot;
  });
}

export function resetWeapons(scene: THREE.Scene, camera: THREE.Camera) {
  Object.values(PICKUP_NAMES).forEach((name) => {
    if (name) {
      const pickup = scene.getObjectByName(name);
      if (pickup) pickup.visible = true;
    }
  });
  Object.values(HELD_NAMES).forEach((name) => camera.getObjectByName(name)?.removeFromParent());
}
