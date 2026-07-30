import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const steel = new THREE.MeshStandardMaterial({
  color: 0x252b2c,
  metalness: 0.94,
  roughness: 0.2,
});
const darkSteel = new THREE.MeshStandardMaterial({
  color: 0x080b0c,
  metalness: 0.86,
  roughness: 0.3,
});
const walnut = new THREE.MeshPhysicalMaterial({
  color: 0x71371f,
  roughness: 0.34,
  clearcoat: 0.65,
  clearcoatRoughness: 0.22,
});

function mesh(
  group: THREE.Group,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  position: [number, number, number],
) {
  const part = new THREE.Mesh(geometry, material);
  part.position.set(...position);
  part.castShadow = true;
  part.receiveShadow = true;
  group.add(part);
  return part;
}

function addBarrel(revolver: THREE.Group) {
  const barrelGeometry = new THREE.CylinderGeometry(0.065, 0.065, 0.68, 20);
  barrelGeometry.rotateX(Math.PI / 2);
  mesh(revolver, barrelGeometry, steel, [0, 0.11, -0.57]);
  const bore = mesh(revolver, new THREE.CircleGeometry(0.047, 18), darkSteel, [0, 0.11, -0.92]);
  bore.rotation.y = Math.PI;
  mesh(revolver, new THREE.BoxGeometry(0.055, 0.055, 0.56), steel, [0, 0.035, -0.54]);
  mesh(revolver, new THREE.BoxGeometry(0.035, 0.08, 0.045), darkSteel, [0, 0.2, -0.83]);
}

function addCylinder(revolver: THREE.Group) {
  const assembly = new THREE.Group();
  assembly.name = 'revolver-cylinder';
  assembly.position.set(0, 0.07, -0.17);
  const cylinderGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.25, 20);
  cylinderGeometry.rotateZ(Math.PI / 2);
  mesh(assembly, cylinderGeometry, steel, [0, 0, 0]);

  for (let chamber = 0; chamber < 6; chamber += 1) {
    const angle = (chamber / 6) * Math.PI * 2;
    const hole = mesh(assembly, new THREE.CircleGeometry(0.024, 10), darkSteel, [
      0.128,
      Math.cos(angle) * 0.095,
      Math.sin(angle) * 0.095,
    ]);
    hole.rotation.y = Math.PI / 2;
  }
  revolver.add(assembly);
}

function addFrameAndAction(revolver: THREE.Group) {
  mesh(revolver, new RoundedBoxGeometry(0.24, 0.27, 0.46, 3, 0.04), steel, [0, 0, 0.02]);
  const guard = mesh(
    revolver,
    new THREE.TorusGeometry(0.105, 0.018, 8, 18, Math.PI * 1.75),
    darkSteel,
    [0, -0.15, 0.08],
  );
  guard.rotation.y = Math.PI / 2;
  guard.rotation.z = -0.25;
  const trigger = mesh(revolver, new THREE.BoxGeometry(0.022, 0.1, 0.025), darkSteel, [
    0,
    -0.15,
    0.04,
  ]);
  trigger.rotation.x = -0.3;
  const hammer = mesh(
    revolver,
    new RoundedBoxGeometry(0.07, 0.16, 0.08, 2, 0.015),
    darkSteel,
    [0, 0.17, 0.22],
  );
  hammer.name = 'revolver-hammer';
  hammer.rotation.x = -0.35;
}

function addGrip(revolver: THREE.Group) {
  const grip = mesh(
    revolver,
    new RoundedBoxGeometry(0.25, 0.5, 0.24, 4, 0.065),
    walnut,
    [0, -0.34, 0.21],
  );
  grip.rotation.x = -0.24;
  grip.scale.set(0.92, 1, 0.86);
  mesh(revolver, new RoundedBoxGeometry(0.26, 0.08, 0.25, 3, 0.025), darkSteel, [
    0,
    -0.59,
    0.27,
  ]).rotation.x = -0.24;
}

export function createRevolverModel(scale = 1) {
  const revolver = new THREE.Group();
  addBarrel(revolver);
  addCylinder(revolver);
  addFrameAndAction(revolver);
  addGrip(revolver);
  revolver.scale.setScalar(scale);
  return revolver;
}
