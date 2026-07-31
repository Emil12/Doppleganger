import * as THREE from 'three';
import {
  SHOTGUN_CABINET_NAME,
  SHOTGUN_PICKUP_NAME,
} from './gameWeapon';
import { lowPolyBox } from './lowPolyGeometry';
import { createShotgunModel } from './shotgunModel';

type Position = [number, number, number];
type Size = [number, number, number];

function material(color: number, emissive = 0x000000, metalness = 0.08) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: emissive ? 1.8 : 1,
    roughness: metalness > 0.4 ? 0.35 : 0.68,
    metalness,
    flatShading: true,
  });
}

function part(
  group: THREE.Group,
  color: number,
  size: Size,
  position: Position,
  emissive = 0x000000,
) {
  const mesh = new THREE.Mesh(
    lowPolyBox(...size, Math.min(...size) * 0.12),
    material(color, emissive),
  );
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function addRegister(group: THREE.Group) {
  part(group, 0x292d2b, [0.62, 0.18, 0.75], [-0.05, 1.18, -0.55]);
  part(group, 0x252a28, [0.13, 0.42, 0.13], [0, 1.43, -0.55]);
  part(group, 0x18201d, [0.12, 0.5, 0.72], [-0.08, 1.66, -0.55], 0x183b2c);
  part(group, 0xa6d89c, [0.02, 0.31, 0.5], [-0.15, 1.66, -0.55], 0x4c9160);
  part(group, 0x404944, [0.6, 0.08, 0.72], [-0.08, 1.3, 0.28]);
}

function addPaymentTools(group: THREE.Group) {
  const cardReader = part(group, 0x303735, [0.42, 0.13, 0.34], [-0.32, 1.23, 0.85]);
  cardReader.rotation.z = -0.2;
  part(group, 0x58a56e, [0.02, 0.15, 0.22], [-0.55, 1.31, 0.85], 0x245c37);
  part(group, 0x1d2220, [0.48, 0.1, 0.5], [0.04, 1.21, 1.48]);
  part(group, 0xd94438, [0.03, 0.025, 0.36], [-0.22, 1.28, 1.48], 0x8f120d);
  part(group, 0xe6dfc4, [0.08, 0.2, 0.38], [-0.22, 1.3, -1.55]);
}

function addWeaponCabinet(group: THREE.Group) {
  part(group, 0x101412, [0.04, 1.58, 0.82], [0.66, 1.22, -0.78]);
  part(group, 0x59615b, [0.08, 0.09, 0.9], [0.71, 2.04, -0.78]);
  part(group, 0x59615b, [0.08, 0.09, 0.9], [0.71, 0.4, -0.78]);
  const shotgunMarker = new THREE.Object3D();
  shotgunMarker.name = SHOTGUN_CABINET_NAME;
  shotgunMarker.position.set(0.9, 1.22, -0.78);
  group.add(shotgunMarker);

  const shotgun = createShotgunModel(0.44);
  shotgun.name = SHOTGUN_PICKUP_NAME;
  shotgun.position.set(0.73, 1.22, -0.78);
  shotgun.rotation.set(Math.PI / 2, 0.05, 0);
  group.add(shotgun);
}

function addCounterDetails(group: THREE.Group) {
  for (const z of [-1.55, -1.02, 1.02, 1.55]) {
    const colors = [0xc95b44, 0xd5b950, 0x568d69, 0x557aa0];
    part(group, colors[Math.round((z + 1.55) * 10) % colors.length], [0.12, 0.48, 0.38], [
      -0.69,
      0.67,
      z,
    ]);
  }
  const mat = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 1.5),
    new THREE.MeshStandardMaterial({ color: 0x26382d, roughness: 0.9 }),
  );
  mat.rotation.x = -Math.PI / 2;
  mat.position.set(1.05, 0.015, 0);
  group.add(mat);
}

export function addCheckoutStation(scene: THREE.Scene) {
  const checkout = new THREE.Group();
  checkout.position.set(6.15, 0, -14.5);
  part(checkout, 0x31513c, [1.25, 1.05, 4.4], [0, 0.55, 0]);
  part(checkout, 0x2a302d, [1.42, 0.16, 4.58], [0, 1.1, 0]);
  part(checkout, 0x18231d, [0.08, 0.68, 4.05], [-0.67, 0.58, 0]);
  addRegister(checkout);
  addPaymentTools(checkout);
  addWeaponCabinet(checkout);
  addCounterDetails(checkout);
  scene.add(checkout);
}
