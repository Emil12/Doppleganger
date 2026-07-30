import * as THREE from 'three';
import { createRevolverModel } from './revolverModel';
import { createShotgunModel } from './shotgunModel';
import { type WeaponKind } from './weaponTypes';

export const REVOLVER_PICKUP_NAME = 'revolver-pickup';
export const REVOLVER_CABINET_NAME = 'revolver-cabinet';
export const SHOTGUN_PICKUP_NAME = 'shotgun-pickup';
export const SHOTGUN_CABINET_NAME = 'shotgun-cabinet';

const HELD_NAMES: Record<WeaponKind, string> = {
  revolver: 'held-revolver',
  shotgun: 'held-shotgun',
};
const PICKUP_NAMES: Record<WeaponKind, string> = {
  revolver: REVOLVER_PICKUP_NAME,
  shotgun: SHOTGUN_PICKUP_NAME,
};
const CABINET_NAMES: Record<WeaponKind, string> = {
  revolver: REVOLVER_CABINET_NAME,
  shotgun: SHOTGUN_CABINET_NAME,
};

function createHeldWeapon(kind: WeaponKind) {
  const weapon = kind === 'revolver' ? createRevolverModel(0.82) : createShotgunModel(0.52);
  weapon.name = HELD_NAMES[kind];
  weapon.userData.weaponKind = kind;
  if (kind === 'revolver') {
    weapon.position.set(0.34, -0.34, -0.65);
    weapon.rotation.set(-0.08, -0.08, 0);
  } else {
    weapon.position.set(0.38, -0.38, -0.82);
    weapon.rotation.set(-0.12, -0.08, 0);
  }
  weapon.userData.basePosition = weapon.position.clone();
  weapon.userData.baseRotation = weapon.rotation.clone();
  return weapon;
}

function cabinetDistance(scene: THREE.Scene, camera: THREE.Camera, kind: WeaponKind) {
  const marker = scene.getObjectByName(CABINET_NAMES[kind]);
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
  const kinds: WeaponKind[] = heldWeapon ? [heldWeapon] : ['revolver', 'shotgun'];
  return kinds.reduce(
    (nearest, kind) => {
      const pickup = scene.getObjectByName(PICKUP_NAMES[kind]);
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
  const pickup = scene.getObjectByName(PICKUP_NAMES[kind]);
  if (!pickup?.visible) return false;
  pickup.visible = false;
  camera.add(createHeldWeapon(kind));
  return true;
}

export function putBackWeapon(scene: THREE.Scene, camera: THREE.Camera, kind: WeaponKind) {
  if (cabinetDistance(scene, camera, kind) >= 1.75) return false;
  const pickup = scene.getObjectByName(PICKUP_NAMES[kind]);
  const held = camera.getObjectByName(HELD_NAMES[kind]);
  if (!pickup || !held) return false;
  pickup.visible = true;
  held.removeFromParent();
  return true;
}
