import * as THREE from 'three';
import { markDistanceCullable } from './entityCulling';
import { RESTROOM } from './gasStationLayout';
import {
  RESTROOM_DOOR_ANCHOR_NAME,
  RESTROOM_DOOR_NAME,
} from './staffDoor';

export const RESTROOM_MIRROR_NAME = 'restroom-mirror';
export const RESTROOM_MIRROR_WALL_NAME = 'restroom-mirror-wall';

function material(color: number, metalness = 0.04, roughness = 0.7) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness, flatShading: true });
}

function box(
  scene: THREE.Object3D,
  size: [number, number, number],
  position: [number, number, number],
  color: number,
) {
  const object = new THREE.Mesh(new THREE.BoxGeometry(...size), material(color));
  object.position.set(...position);
  object.castShadow = true;
  object.receiveShadow = true;
  scene.add(object);
  return object;
}

function addWalls(scene: THREE.Scene) {
  const wallColor = 0xb6b7a9;
  const height = 3.25;
  const width = RESTROOM.right - RESTROOM.left;
  const depth = RESTROOM.front - RESTROOM.back;
  const middleX = (RESTROOM.left + RESTROOM.right) / 2;
  const middleZ = (RESTROOM.front + RESTROOM.back) / 2;
  box(scene, [width, 0.15, depth], [middleX, 0, middleZ], 0xc4c3b5);
  box(scene, [width + 0.2, 0.22, depth + 0.2], [middleX, 3.32, middleZ], 0x747b73);
  box(scene, [0.22, height, depth], [RESTROOM.left, height / 2, middleZ], wallColor);
  const mirrorWall = box(
    scene,
    [0.22, height, depth],
    [RESTROOM.right, height / 2, middleZ],
    wallColor,
  );
  mirrorWall.name = RESTROOM_MIRROR_WALL_NAME;
  box(scene, [width, height, 0.22], [middleX, height / 2, RESTROOM.back], wallColor);
}

function addSign(scene: THREE.Scene) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 112;
  const context = canvas.getContext('2d');
  if (!context) return;
  context.fillStyle = '#355347';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = '#e7dfc3';
  context.lineWidth = 9;
  context.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);
  context.fillStyle = '#f4ecd0';
  context.font = 'bold 58px monospace';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('W/C', canvas.width / 2, canvas.height / 2 + 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(1.25, 0.55),
    new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }),
  );
  sign.position.set((RESTROOM.doorLeft + RESTROOM.doorRight) / 2, 3.1, RESTROOM.front + 0.27);
  scene.add(sign);
}

function addDoor(scene: THREE.Scene) {
  const doorWidth = RESTROOM.doorRight - RESTROOM.doorLeft;
  const hinge = new THREE.Group();
  hinge.name = RESTROOM_DOOR_NAME;
  hinge.position.set(RESTROOM.doorLeft, 0, RESTROOM.front + 0.12);
  hinge.userData.open = true;
  hinge.userData.targetRotation = Math.PI / 2;
  hinge.rotation.y = Math.PI / 2;
  box(hinge, [doorWidth, 2.75, 0.12], [doorWidth / 2, 1.42, 0], 0x45584f);
  const handle = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 10, 7),
    material(0xc2a45b, 0.7, 0.24),
  );
  handle.position.set(0.93, 1.34, -0.09);
  hinge.add(handle);
  scene.add(hinge);

  const anchor = new THREE.Object3D();
  anchor.name = RESTROOM_DOOR_ANCHOR_NAME;
  anchor.position.set((RESTROOM.doorLeft + RESTROOM.doorRight) / 2, 1.4, RESTROOM.front);
  scene.add(anchor);
}

function addToilet(scene: THREE.Scene) {
  const toiletX = RESTROOM.left + 0.7;
  const toiletZ = RESTROOM.back + 0.85;
  const porcelain = material(0xd8d8c9, 0.02, 0.34);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.27, 0.42, 14), porcelain);
  bowl.scale.z = 1.2;
  bowl.position.set(toiletX, 0.28, toiletZ);
  scene.add(bowl);
  const seat = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.045, 8, 18), porcelain);
  seat.rotation.x = Math.PI / 2;
  seat.scale.y = 1.2;
  seat.position.set(toiletX, 0.52, toiletZ);
  scene.add(seat);
  box(scene, [0.64, 0.72, 0.28], [toiletX, 0.65, RESTROOM.back + 0.35], 0xd8d8c9);
  box(scene, [0.72, 0.1, 0.34], [toiletX, 1.05, RESTROOM.back + 0.35], 0xc9c9ba);
}

function addSinkAndMirror(scene: THREE.Scene) {
  const sinkX = RESTROOM.right - 0.58;
  const sinkZ = RESTROOM.back + 0.9;
  box(scene, [0.8, 0.14, 0.52], [sinkX, 0.9, sinkZ], 0xcfd2c6);
  box(scene, [0.16, 0.84, 0.16], [sinkX, 0.43, sinkZ], 0x69726c);
  const basin = new THREE.Mesh(
    new THREE.TorusGeometry(0.25, 0.055, 8, 18),
    material(0xe0e0d2, 0.02, 0.3),
  );
  basin.rotation.x = Math.PI / 2;
  basin.position.set(sinkX, 0.99, sinkZ);
  scene.add(basin);
  const mirror = new THREE.Mesh(
    new THREE.PlaneGeometry(0.82, 1.05),
    new THREE.MeshBasicMaterial({ color: 0x182421 }),
  );
  mirror.name = RESTROOM_MIRROR_NAME;
  mirror.position.set(RESTROOM.right - 0.14, 1.72, sinkZ);
  mirror.rotation.y = -Math.PI / 2;
  scene.add(mirror);
}

export function addRestroom(scene: THREE.Scene) {
  addWalls(scene);
  addDoor(scene);
  addSign(scene);
  addToilet(scene);
  addSinkAndMirror(scene);
  const light = markDistanceCullable(new THREE.PointLight(0xd7e5ce, 16, 5, 1.8), 12);
  light.position.set(
    (RESTROOM.left + RESTROOM.right) / 2,
    2.75,
    (RESTROOM.front + RESTROOM.back) / 2,
  );
  scene.add(light);
}

export function isHiddenInRestroom(scene: THREE.Scene, position: THREE.Vector3) {
  const inside = position.x > RESTROOM.left + 0.2
    && position.x < RESTROOM.right - 0.2
    && position.z < RESTROOM.front - 0.2
    && position.z > RESTROOM.back + 0.2;
  const doorClosed = scene.getObjectByName(RESTROOM_DOOR_NAME)?.userData.open === false;
  return inside && doorClosed;
}
