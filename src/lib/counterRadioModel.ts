import * as THREE from 'three';
import { lowPolyBox } from './lowPolyGeometry';

export const COUNTER_RADIO_NAME = 'checkout-counter-radio';
export const COUNTER_RADIO_DISPLAY_NAME = 'checkout-counter-radio-display';
export const COUNTER_RADIO_POSITION = [7.25, 0.03, -15.2] as const;

type Position = [number, number, number];
type Size = [number, number, number];

function radioMaterial(
  color: number,
  emissive = 0x000000,
  metalness = 0.12,
) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: emissive ? 0.65 : 1,
    roughness: metalness > 0.4 ? 0.32 : 0.68,
    metalness,
    flatShading: true,
  });
}

function boxPart(
  group: THREE.Group,
  size: Size,
  position: Position,
  color: number,
  emissive = 0x000000,
) {
  const mesh = new THREE.Mesh(
    lowPolyBox(...size, Math.min(...size) * 0.14),
    radioMaterial(color, emissive),
  );
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function cylinderPart(
  group: THREE.Group,
  radius: number,
  depth: number,
  position: Position,
  color: number,
) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, depth, 10),
    radioMaterial(color, 0x000000, 0.3),
  );
  mesh.position.set(...position);
  mesh.rotation.x = Math.PI / 2;
  mesh.castShadow = true;
  group.add(mesh);
  return mesh;
}

function addSpeaker(group: THREE.Group, x: number) {
  cylinderPart(group, 0.43, 0.075, [x, 0.5, 0.385], 0x8d4960);
  cylinderPart(group, 0.36, 0.083, [x, 0.5, 0.425], 0x252b2a);
  cylinderPart(group, 0.13, 0.09, [x, 0.5, 0.47], 0x69716e);
}

function addHandle(group: THREE.Group) {
  boxPart(group, [0.15, 0.55, 0.15], [-0.94, 1.27, 0], 0x252a29);
  boxPart(group, [0.15, 0.55, 0.15], [0.94, 1.27, 0], 0x252a29);
  boxPart(group, [2.03, 0.17, 0.2], [0, 1.53, 0], 0x4d5350);
}

function addAntenna(group: THREE.Group) {
  const antenna = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.045, 1.35, 7),
    radioMaterial(0x9da59f, 0x000000, 0.8),
  );
  antenna.position.set(1.05, 1.85, -0.04);
  antenna.rotation.z = -0.18;
  antenna.castShadow = true;
  group.add(antenna);
  const tip = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.075, 0),
    radioMaterial(0xb5bcb6, 0x000000, 0.75),
  );
  tip.position.set(1.17, 2.52, -0.04);
  group.add(tip);
}

function addCassetteDeck(group: THREE.Group) {
  boxPart(group, [0.68, 0.38, 0.08], [0, 0.35, 0.405], 0x171b1a);
  boxPart(group, [0.56, 0.25, 0.035], [0, 0.35, 0.46], 0x4c5551);
  for (const x of [-0.16, 0.16]) {
    cylinderPart(group, 0.075, 0.045, [x, 0.35, 0.495], 0xb6a979);
  }
}

export function addCounterRadio(scene: THREE.Scene) {
  const radio = new THREE.Group();
  radio.name = COUNTER_RADIO_NAME;
  radio.position.set(...COUNTER_RADIO_POSITION);
  radio.rotation.y = -Math.PI / 2;
  radio.scale.setScalar(0.55);

  boxPart(radio, [2.75, 1.08, 0.72], [0, 0.57, 0], 0x9a936f);
  boxPart(radio, [2.58, 0.88, 0.05], [0, 0.55, 0.385], 0x242927);
  boxPart(radio, [0.72, 0.25, 0.08], [0, 0.82, 0.43], 0x14221d, 0xf09b48)
    .name = COUNTER_RADIO_DISPLAY_NAME;
  for (const x of [-0.23, -0.08, 0.08, 0.23]) {
    boxPart(radio, [0.08, 0.09, 0.04], [x, 0.82, 0.485], 0xf2bd63, 0xe47b3e);
  }
  addSpeaker(radio, -0.9);
  addSpeaker(radio, 0.9);
  addCassetteDeck(radio);
  for (const x of [-1.05, -0.82, 0.82, 1.05]) {
    cylinderPart(radio, 0.09, 0.09, [x, 1.05, 0.37], 0xd0c7a3);
  }
  boxPart(radio, [2.35, 0.06, 0.06], [0, 1.02, 0.41], 0x477a78, 0x234d4c);
  addHandle(radio);
  addAntenna(radio);
  scene.add(radio);
  return radio;
}

export function setCounterRadioActive(scene: THREE.Scene, active: boolean) {
  const display = scene.getObjectByName(COUNTER_RADIO_DISPLAY_NAME);
  if (!(display instanceof THREE.Mesh)) return;
  const material = display.material;
  if (!(material instanceof THREE.MeshStandardMaterial)) return;
  material.emissiveIntensity = active ? 2.8 : 0.65;
  material.color.setHex(active ? 0x6ee895 : 0x14221d);
}
