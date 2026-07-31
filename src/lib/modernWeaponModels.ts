import * as THREE from 'three';

const black = new THREE.MeshStandardMaterial({ color: 0x111513, metalness: 0.7, roughness: 0.42 });
const polymer = new THREE.MeshStandardMaterial({ color: 0x252b27, roughness: 0.82 });

function box(group: THREE.Group, size: [number, number, number], position: [number, number, number]) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), polymer);
  mesh.position.set(...position);
  group.add(mesh);
  return mesh;
}

function tube(group: THREE.Group, radius: number, length: number, position: [number, number, number]) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 8), black);
  mesh.rotation.x = Math.PI / 2;
  mesh.position.set(...position);
  group.add(mesh);
}

export function createM16Model(scale = 1) {
  const rifle = new THREE.Group();
  box(rifle, [0.28, 0.32, 0.78], [0, 0, 0]);
  box(rifle, [0.12, 0.16, 0.72], [0, 0.22, -0.08]);
  tube(rifle, 0.045, 1.25, [0, 0.08, -0.98]);
  box(rifle, [0.25, 0.2, 0.75], [0, -0.02, 0.75]);
  const magazine = box(rifle, [0.18, 0.48, 0.26], [0, -0.37, -0.1]);
  magazine.rotation.x = -0.16;
  const grip = box(rifle, [0.16, 0.48, 0.2], [0, -0.34, 0.34]);
  grip.rotation.x = -0.25;
  rifle.scale.setScalar(scale);
  return rifle;
}

export function createGlockModel(scale = 1) {
  const pistol = new THREE.Group();
  const slide = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.78), black);
  slide.position.z = -0.18;
  pistol.add(slide);
  const frame = box(pistol, [0.2, 0.16, 0.54], [0, -0.15, -0.05]);
  const grip = box(pistol, [0.2, 0.58, 0.25], [0, -0.46, 0.15]);
  grip.rotation.x = -0.15;
  frame.rotation.x = 0.02;
  pistol.scale.setScalar(scale);
  return pistol;
}
