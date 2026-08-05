import * as THREE from 'three';
import { edgeSteel, gripPolymer } from './modernWeaponModels';

const steel = new THREE.MeshStandardMaterial({ color: 0x0b0e0d, metalness: 0.92, roughness: 0.24 });
const bolt = new THREE.MeshStandardMaterial({ color: 0x737b78, metalness: 1, roughness: 0.16 });
const sightPaint = new THREE.MeshBasicMaterial({ color: 0xe7dfbd });
const boreMaterial = new THREE.MeshBasicMaterial({ color: 0x010202 });

function part(
  root: THREE.Group,
  geometry: THREE.BufferGeometry,
  position: [number, number, number],
  material: THREE.Material = steel,
) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(...position);
  object.castShadow = true;
  root.add(object);
  return object;
}

function box(root: THREE.Group, size: [number, number, number], position: [number, number, number]) {
  return part(root, new THREE.BoxGeometry(...size), position);
}

function tube(root: THREE.Group, radius: number, length: number, position: [number, number, number]) {
  const geometry = new THREE.CylinderGeometry(radius, radius, length, 10);
  geometry.rotateX(Math.PI / 2);
  return part(root, geometry, position);
}

function frontSight(root: THREE.Group, z: number) {
  box(root, [0.025, 0.13, 0.025], [0, 0.29, z]);
  box(root, [0.13, 0.025, 0.045], [0, 0.23, z]);
  part(root, new THREE.SphereGeometry(0.014, 6, 4), [0, 0.355, z], sightPaint);
}

function muzzle(root: THREE.Group, z: number, radius: number) {
  const opening = part(root, new THREE.CircleGeometry(radius, 14), [0, 0.08, z], boreMaterial);
  opening.rotation.y = Math.PI;
}

function gripRibs(root: THREE.Group, yValues: number[], z: number, width: number) {
  yValues.forEach((y) => part(
    root,
    new THREE.BoxGeometry(width, 0.018, 0.28),
    [0, y, z],
    gripPolymer,
  ));
}

export function addM16Details(rifle: THREE.Group) {
  muzzle(rifle, -1.795, 0.035);
  tube(rifle, 0.065, 0.22, [0, 0.08, -1.68]);
  for (const z of [-1.76, -1.69, -1.62]) box(rifle, [0.14, 0.025, 0.025], [0, 0.08, z]);
  frontSight(rifle, -1.42);
  box(rifle, [0.22, 0.06, 0.48], [0, 0.35, -0.04]);
  box(rifle, [0.06, 0.16, 0.34], [-0.08, 0.29, -0.04]);
  box(rifle, [0.06, 0.16, 0.34], [0.08, 0.29, -0.04]);
  part(rifle, new THREE.BoxGeometry(0.012, 0.13, 0.3), [0.146, 0.05, -0.14], bolt);
  part(rifle, new THREE.SphereGeometry(0.035, 8, 5), [0.17, -0.01, 0.15]);
  gripRibs(rifle, [-0.24, -0.34, -0.44], -0.1, 0.19);
  for (const z of [-0.48, -0.28, -0.08]) {
    box(rifle, [0.3, 0.025, 0.05], [0, 0.18, z]);
  }
  part(rifle, new THREE.CylinderGeometry(0.025, 0.025, 0.12, 10), [0.17, 0.04, 0.2], edgeSteel)
    .rotation.z = Math.PI / 2;
}

export function addGlockDetails(pistol: THREE.Group) {
  const bore = part(pistol, new THREE.CircleGeometry(0.045, 12), [0, 0.01, -0.585]);
  bore.rotation.y = Math.PI;
  box(pistol, [0.055, 0.055, 0.07], [0, 0.145, -0.5]);
  box(pistol, [0.16, 0.055, 0.06], [0, 0.145, 0.14]);
  part(pistol, new THREE.BoxGeometry(0.018, 0.025, 0.018), [0, 0.18, -0.5], sightPaint);
  for (const z of [0.02, 0.08, 0.14]) {
    const left = box(pistol, [0.012, 0.15, 0.025], [-0.116, 0.02, z]);
    const right = left.clone();
    right.position.x = 0.116;
    pistol.add(right);
  }
  const guard = part(pistol, new THREE.TorusGeometry(0.1, 0.018, 7, 15, Math.PI * 1.65), [0, -0.23, -0.2]);
  guard.rotation.y = Math.PI / 2;
  const trigger = box(pistol, [0.022, 0.12, 0.025], [0, -0.23, -0.16]);
  trigger.rotation.x = -0.3;
  box(pistol, [0.23, 0.055, 0.28], [0, -0.76, 0.15]);
  gripRibs(pistol, [-0.3, -0.4, -0.5, -0.6], 0.16, 0.21);
  for (const z of [-0.31, -0.22, -0.13]) {
    box(pistol, [0.23, 0.025, 0.035], [0, -0.22, z]);
  }
  part(pistol, new THREE.CylinderGeometry(0.035, 0.035, 0.55, 12), [0, 0.005, -0.22], edgeSteel)
    .rotation.x = Math.PI / 2;
}

export function addAk47Details(rifle: THREE.Group) {
  muzzle(rifle, -1.73, 0.038);
  tube(rifle, 0.075, 0.2, [0, 0.08, -1.62]);
  box(rifle, [0.16, 0.035, 0.3], [0, 0.08, -1.63]);
  tube(rifle, 0.045, 0.82, [0, 0.24, -0.82]);
  frontSight(rifle, -1.36);
  box(rifle, [0.2, 0.055, 0.24], [0, 0.25, -0.15]);
  box(rifle, [0.25, 0.025, 0.46], [0, 0.17, 0.02]);
  const selector = box(rifle, [0.018, 0.035, 0.42], [0.162, 0.05, 0.1]);
  selector.rotation.x = -0.12;
  for (const z of [-0.24, 0.1, 0.26]) part(rifle, new THREE.SphereGeometry(0.018, 6, 4), [0.166, 0.02, z], bolt);
  const guard = part(rifle, new THREE.TorusGeometry(0.11, 0.018, 7, 15, Math.PI * 1.65), [0, -0.19, 0.22]);
  guard.rotation.y = Math.PI / 2;
  for (const z of [-0.83, -0.65, -0.47]) {
    box(rifle, [0.315, 0.025, 0.045], [0, 0.17, z]);
  }
  part(rifle, new THREE.BoxGeometry(0.33, 0.05, 0.07), [0, 0.04, -0.3], edgeSteel);
  gripRibs(rifle, [-0.27, -0.37, -0.47], 0.3, 0.18);
}
