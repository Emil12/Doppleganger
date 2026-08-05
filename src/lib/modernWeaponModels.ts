import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { addAk47Details, addGlockDetails, addM16Details } from './modernWeaponDetails';

export const gunMetal = new THREE.MeshStandardMaterial({
  color: 0x1b211f,
  metalness: 0.88,
  roughness: 0.3,
});
export const edgeSteel = new THREE.MeshStandardMaterial({
  color: 0x59615e,
  metalness: 0.96,
  roughness: 0.22,
});
export const polymer = new THREE.MeshStandardMaterial({ color: 0x282e2a, roughness: 0.76 });
export const gripPolymer = new THREE.MeshStandardMaterial({ color: 0x151917, roughness: 0.9 });
export const wood = new THREE.MeshStandardMaterial({ color: 0x784629, roughness: 0.52 });

function box(
  group: THREE.Group,
  size: [number, number, number],
  position: [number, number, number],
  material: THREE.Material = polymer,
  radius = 0.025,
) {
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(...size, 2, radius), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  group.add(mesh);
  return mesh;
}

function tube(group: THREE.Group, radius: number, length: number, position: [number, number, number]) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 12), gunMetal);
  mesh.rotation.x = Math.PI / 2;
  mesh.position.set(...position);
  mesh.castShadow = true;
  group.add(mesh);
  return mesh;
}

export function createM16Model(scale = 1) {
  const rifle = new THREE.Group();
  box(rifle, [0.28, 0.32, 0.78], [0, 0, 0], gunMetal);
  box(rifle, [0.12, 0.16, 0.72], [0, 0.22, -0.08]);
  tube(rifle, 0.045, 1.25, [0, 0.08, -0.98]);
  box(rifle, [0.25, 0.2, 0.75], [0, -0.02, 0.75]);
  const magazine = box(rifle, [0.18, 0.48, 0.26], [0, -0.37, -0.1], gripPolymer);
  magazine.name = 'weapon-magazine';
  magazine.rotation.x = -0.16;
  const grip = box(rifle, [0.16, 0.48, 0.2], [0, -0.34, 0.34], gripPolymer);
  grip.rotation.x = -0.25;
  addM16Details(rifle);
  rifle.scale.setScalar(scale);
  return rifle;
}

export function createGlockModel(scale = 1) {
  const pistol = new THREE.Group();
  const slide = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.2, 0.78, 2, 0.018), gunMetal);
  slide.name = 'weapon-slide';
  slide.userData.baseZ = -0.18;
  slide.castShadow = true;
  slide.position.z = -0.18;
  pistol.add(slide);
  const frame = box(pistol, [0.2, 0.16, 0.54], [0, -0.15, -0.05]);
  const grip = box(pistol, [0.2, 0.58, 0.25], [0, -0.46, 0.15], gripPolymer, 0.035);
  grip.rotation.x = -0.15;
  frame.rotation.x = 0.02;
  addGlockDetails(pistol);
  pistol.scale.setScalar(scale);
  return pistol;
}

export function createAk47Model(scale = 1) {
  const rifle = new THREE.Group();
  box(rifle, [0.3, 0.3, 0.72], [0, 0, 0], gunMetal);
  tube(rifle, 0.05, 1.22, [0, 0.08, -0.94]);
  box(rifle, [0.3, 0.27, 0.7], [0, 0.02, -0.58], wood);
  const stock = box(rifle, [0.24, 0.3, 0.9], [0, -0.02, 0.78], wood);
  stock.rotation.x = -0.08;
  const grip = box(rifle, [0.17, 0.48, 0.2], [0, -0.34, 0.3], wood);
  grip.rotation.x = -0.28;
  const magazineTop = box(rifle, [0.2, 0.42, 0.24], [0, -0.32, -0.12], gripPolymer);
  magazineTop.name = 'weapon-magazine';
  magazineTop.rotation.x = -0.18;
  const magazineBottom = box(rifle, [0.19, 0.34, 0.23], [0, -0.61, -0.03], gripPolymer);
  magazineBottom.rotation.x = -0.42;
  addAk47Details(rifle);
  rifle.scale.setScalar(scale);
  return rifle;
}
