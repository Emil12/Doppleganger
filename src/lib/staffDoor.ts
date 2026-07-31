import * as THREE from 'three';
import { RESTROOM, STAFF_ROOM } from './gasStationLayout';

export const STAFF_DOOR_NAME = 'staff-door';
export const STAFF_DOOR_ANCHOR_NAME = 'staff-door-anchor';
export const BACK_DOOR_NAME = 'back-door';
export const BACK_DOOR_ANCHOR_NAME = 'back-door-anchor';
export const RESTROOM_DOOR_NAME = 'restroom-door';
export const RESTROOM_DOOR_ANCHOR_NAME = 'restroom-door-anchor';

export type DoorLabel = 'STAFF DOOR' | 'BACK DOOR' | 'RESTROOM';

const doors: Array<{ name: string; anchor: string; label: DoorLabel; openAngle: number }> = [
  {
    name: STAFF_DOOR_NAME,
    anchor: STAFF_DOOR_ANCHOR_NAME,
    label: 'STAFF DOOR',
    openAngle: -Math.PI / 2,
  },
  {
    name: BACK_DOOR_NAME,
    anchor: BACK_DOOR_ANCHOR_NAME,
    label: 'BACK DOOR',
    openAngle: Math.PI / 2,
  },
  {
    name: RESTROOM_DOOR_NAME,
    anchor: RESTROOM_DOOR_ANCHOR_NAME,
    label: 'RESTROOM',
    openAngle: Math.PI / 2,
  },
];

function distanceTo(scene: THREE.Scene, camera: THREE.Camera, anchorName: string) {
  const anchor = scene.getObjectByName(anchorName);
  if (!anchor) return Number.POSITIVE_INFINITY;
  const position = new THREE.Vector3();
  anchor.getWorldPosition(position);
  return position.distanceTo(camera.position);
}

export function nearestDoor(scene: THREE.Scene, camera: THREE.Camera) {
  return doors
    .map((config) => ({
      ...config,
      distance: distanceTo(scene, camera, config.anchor),
      open: Boolean(scene.getObjectByName(config.name)?.userData.open),
    }))
    .sort((a, b) => a.distance - b.distance)[0];
}

export function toggleNearestDoor(scene: THREE.Scene, camera: THREE.Camera) {
  const nearest = nearestDoor(scene, camera);
  if (!nearest || nearest.distance >= 2) return null;
  const hinge = scene.getObjectByName(nearest.name);
  if (!hinge) return null;
  const open = !Boolean(hinge.userData.open);
  hinge.userData.open = open;
  hinge.userData.targetRotation = open ? nearest.openAngle : 0;
  return { open, label: nearest.label };
}

export function updateStaffDoors(scene: THREE.Scene, delta: number) {
  doors.forEach(({ name }) => {
    const hinge = scene.getObjectByName(name);
    if (!hinge) return;
    hinge.rotation.y = THREE.MathUtils.damp(
      hinge.rotation.y,
      Number(hinge.userData.targetRotation),
      11,
      delta,
    );
  });
}

function sideDoorBlocks(scene: THREE.Scene, x: number, z: number, radius: number) {
  if (scene.getObjectByName(STAFF_DOOR_NAME)?.userData.open) return false;
  return (
    x + radius > STAFF_ROOM.left - 0.25 &&
    x - radius < STAFF_ROOM.left + 0.25 &&
    z + radius > STAFF_ROOM.doorBack &&
    z - radius < STAFF_ROOM.doorFront
  );
}

function backDoorBlocks(scene: THREE.Scene, x: number, z: number, radius: number) {
  if (scene.getObjectByName(BACK_DOOR_NAME)?.userData.open) return false;
  return (
    x + radius > 10.8 &&
    x - radius < 13.2 &&
    z + radius > STAFF_ROOM.back - 0.25 &&
    z - radius < STAFF_ROOM.back + 0.25
  );
}

function restroomDoorBlocks(scene: THREE.Scene, x: number, z: number, radius: number) {
  if (scene.getObjectByName(RESTROOM_DOOR_NAME)?.userData.open) return false;
  return (
    x + radius > RESTROOM.doorLeft
    && x - radius < RESTROOM.doorRight
    && z + radius > RESTROOM.front - 0.25
    && z - radius < RESTROOM.front + 0.25
  );
}

export function staffDoorBlocks(scene: THREE.Scene, x: number, z: number) {
  const radius = 0.34;
  return sideDoorBlocks(scene, x, z, radius)
    || backDoorBlocks(scene, x, z, radius)
    || restroomDoorBlocks(scene, x, z, radius);
}
