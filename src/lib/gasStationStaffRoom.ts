import * as THREE from 'three';
import { markDistanceCullable } from './entityCulling';
import { STAFF_ROOM } from './gasStationLayout';
import { PixelTexture, pixelMaterial } from './pixelTextures';
import {
  BACK_DOOR_ANCHOR_NAME,
  BACK_DOOR_NAME,
  STAFF_DOOR_ANCHOR_NAME,
  STAFF_DOOR_NAME,
} from './staffDoor';

type Size = [number, number, number];
type Position = [number, number, number];

function box(
  scene: THREE.Object3D,
  color: number,
  size: Size,
  position: Position,
  texture?: PixelTexture,
) {
  const material = texture
    ? pixelMaterial(texture, 4, 5, color)
    : new THREE.MeshStandardMaterial({ color, roughness: 0.72, flatShading: true });
  const object = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  object.position.set(...position);
  object.castShadow = true;
  object.receiveShadow = true;
  scene.add(object);
  return object;
}

function createStaffSign() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 80;
  const context = canvas.getContext('2d');
  if (!context) return new THREE.Group();
  context.fillStyle = '#5b2421';
  context.fillRect(0, 0, 256, 80);
  context.strokeStyle = '#d9c99f';
  context.lineWidth = 7;
  context.strokeRect(5, 5, 246, 70);
  context.fillStyle = '#f1e7c9';
  context.font = 'bold 31px monospace';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('STAFF ONLY', 128, 42);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(
    new THREE.PlaneGeometry(1.55, 0.5),
    new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }),
  );
}

function addDoor(scene: THREE.Scene) {
  box(scene, 0x344139, [0.28, 3.2, 0.28], [8.5, 1.6, STAFF_ROOM.doorFront]);
  box(scene, 0x344139, [0.28, 3.2, 0.28], [8.5, 1.6, STAFF_ROOM.doorBack]);
  box(scene, 0x344139, [0.28, 0.3, 2.9], [8.5, 3.05, -14.5]);

  const hinge = new THREE.Group();
  hinge.name = STAFF_DOOR_NAME;
  hinge.userData.open = true;
  hinge.userData.targetRotation = -Math.PI / 2;
  hinge.position.set(8.62, 0, STAFF_ROOM.doorFront - 0.12);
  hinge.rotation.y = -Math.PI / 2;
  box(hinge, 0x546257, [0.14, 2.8, 2.4], [0, 1.45, -1.2], 'wood');
  const sign = createStaffSign();
  sign.position.set(-0.08, 1.75, -1.2);
  sign.rotation.y = -Math.PI / 2;
  hinge.add(sign);
  scene.add(hinge);

  const anchor = new THREE.Object3D();
  anchor.name = STAFF_DOOR_ANCHOR_NAME;
  anchor.position.set(STAFF_ROOM.left, 1.45, -14.5);
  scene.add(anchor);
}

function addBackDoor(scene: THREE.Scene) {
  box(scene, 0x344139, [0.28, 3.2, 0.28], [10.8, 1.6, STAFF_ROOM.back]);
  box(scene, 0x344139, [0.28, 3.2, 0.28], [13.2, 1.6, STAFF_ROOM.back]);
  box(scene, 0x344139, [2.7, 0.3, 0.28], [12, 3.05, STAFF_ROOM.back]);

  const hinge = new THREE.Group();
  hinge.name = BACK_DOOR_NAME;
  hinge.userData.open = true;
  hinge.userData.targetRotation = Math.PI / 2;
  hinge.position.set(10.92, 0, STAFF_ROOM.back + 0.12);
  hinge.rotation.y = Math.PI / 2;
  box(hinge, 0x4b5b52, [2.2, 2.8, 0.14], [1.1, 1.45, 0], 'wood');
  scene.add(hinge);

  const anchor = new THREE.Object3D();
  anchor.name = BACK_DOOR_ANCHOR_NAME;
  anchor.position.set(12, 1.45, STAFF_ROOM.back);
  scene.add(anchor);
}

function addTrashCan(scene: THREE.Scene) {
  const metal = new THREE.MeshStandardMaterial({
    color: 0x465149,
    metalness: 0.42,
    roughness: 0.58,
    flatShading: true,
  });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.32, 0.9, 10), metal);
  body.position.set(9.55, 0.45, -25.7);
  scene.add(body);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.12, 10), metal);
  lid.position.set(9.55, 0.95, -25.7);
  scene.add(lid);
  box(scene, 0x252b27, [0.28, 0.12, 0.1], [9.55, 1.08, -25.7]);
  box(scene, 0x29312c, [0.28, 0.08, 0.22], [9.25, 0.08, -25.7]);
}

function addFurniture(scene: THREE.Scene) {
  for (const z of [-12, -14.1, -16.2, -18.3]) {
    box(scene, 0x59645f, [0.65, 2.4, 1.65], [14.9, 1.2, z], 'metal');
    box(scene, 0x1c2622, [0.04, 0.55, 1.2], [14.55, 1.48, z]);
    box(scene, 0xc1b878, [0.05, 0.12, 0.12], [14.51, 1.2, z]);
  }
  box(scene, 0x654832, [2.8, 0.15, 1.3], [11.2, 1.1, -23.8], 'wood');
  for (const x of [10, 12.4]) box(scene, 0x3b403c, [0.15, 1.05, 0.15], [x, 0.54, -23.8]);
  for (const y of [0.45, 1.25, 2.05]) {
    box(scene, 0x4c554f, [0.55, 0.1, 4.4], [14.85, y, -25.7], 'metal');
  }
  for (const z of [-27.1, -26, -24.9]) {
    box(scene, 0x806147, [0.75, 0.6, 0.8], [14.5, 0.78, z], 'wood');
  }
}

function addLights(scene: THREE.Scene) {
  for (const z of [-12, -18.5, -25]) {
    box(scene, 0xece4c1, [2.8, 0.08, 0.35], [12, 3.9, z]);
    const light = markDistanceCullable(new THREE.PointLight(0xffe7bd, 32, 9, 1.8), 16);
    light.position.set(12, 3.72, z);
    scene.add(light);
  }
}

export function addStaffRoom(scene: THREE.Scene) {
  box(scene, 0xffffff, [7, 0.15, 20], [12, 0, -18.5], 'tile');
  box(scene, 0x69736d, [7.5, 0.45, 20.5], [12, 4.25, -18.5], 'metal');
  box(scene, 0xffffff, [0.5, 4, 20], [15.5, 2, -18.5], 'wall');
  box(scene, 0xffffff, [7.5, 4, 0.5], [12, 2, STAFF_ROOM.front], 'wall');
  box(scene, 0xffffff, [2.3, 4, 0.5], [9.65, 2, STAFF_ROOM.back], 'wall');
  box(scene, 0xffffff, [2.3, 4, 0.5], [14.35, 2, STAFF_ROOM.back], 'wall');
  box(scene, 0xffffff, [0.5, 4, 3.7], [8.5, 2, -11.35], 'wall');
  box(scene, 0xffffff, [0.5, 4, 7.7], [8.5, 2, -19.65], 'wall');
  box(scene, 0xffffff, [0.5, 4, 5], [8.5, 2, -26], 'wall');
  addDoor(scene);
  addBackDoor(scene);
  addFurniture(scene);
  addTrashCan(scene);
  addLights(scene);
}
