import * as THREE from 'three';
import {
  createBoltActionRifleModel,
  createDoubleBarrelModel,
} from './classWeaponModels';
import { createRevolverModel } from './revolverModel';
import { createShotgunModel } from './shotgunModel';
import { createFlamethrowerModel } from './flamethrowerModel';
import { createGlockModel, createM16Model } from './modernWeaponModels';
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
  glock: 'held-glock',
};
const PICKUP_NAMES: Partial<Record<WeaponKind, string>> = {
  shotgun: SHOTGUN_PICKUP_NAME,
};
const CABINET_NAMES: Partial<Record<WeaponKind, string>> = {
  shotgun: SHOTGUN_CABINET_NAME,
};

function createHeldWeapon(kind: WeaponKind, slot: WeaponSlot) {
  const weapon = {
    shotgun: () => createShotgunModel(0.52),
    revolver: () => createRevolverModel(0.72),
    rifle: () => createBoltActionRifleModel(0.48),
    double_barrel: () => createDoubleBarrelModel(0.52),
    flamethrower: () => createFlamethrowerModel(0.52),
    m16: () => createM16Model(0.52),
    glock: () => createGlockModel(0.72),
  }[kind]();
  weapon.name = HELD_NAMES[kind];
  weapon.userData.weaponKind = kind;
  weapon.userData.weaponSlot = slot;
  weapon.position.set(0.38, -0.38, -0.82);
  weapon.rotation.set(-0.12, -0.08, 0);
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
  const kinds: WeaponKind[] =
    heldWeapon === 'shotgun' ? ['shotgun'] : heldWeapon ? [] : ['shotgun'];
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

export function pickupWeapon(scene: THREE.Scene, camera: THREE.Camera, kind: WeaponKind) {
  if (cabinetDistance(scene, camera, kind) >= 1.75) return false;
  const pickupName = PICKUP_NAMES[kind];
  const pickup = pickupName ? scene.getObjectByName(pickupName) : null;
  if (!pickup?.visible) return false;
  pickup.visible = false;
  camera.add(createHeldWeapon(kind, 1));
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
  const shotgunPickup = scene.getObjectByName(SHOTGUN_PICKUP_NAME);
  if (shotgunPickup) shotgunPickup.visible = !kinds.includes('shotgun');
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
  const pickup = scene.getObjectByName(SHOTGUN_PICKUP_NAME);
  if (pickup) pickup.visible = true;
  Object.values(HELD_NAMES).forEach((name) => camera.getObjectByName(name)?.removeFromParent());
}
