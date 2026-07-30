import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const bluedSteel = new THREE.MeshStandardMaterial({
  color: 0x171d1e,
  metalness: 0.94,
  roughness: 0.2,
});
const darkSteel = new THREE.MeshStandardMaterial({
  color: 0x090c0d,
  metalness: 0.82,
  roughness: 0.3,
});
const walnut = new THREE.MeshPhysicalMaterial({
  color: 0x6f351d,
  roughness: 0.3,
  clearcoat: 0.72,
  clearcoatRoughness: 0.2,
});
const brass = new THREE.MeshStandardMaterial({
  color: 0xbd842c,
  metalness: 0.8,
  roughness: 0.25,
});

function mesh(
  group: THREE.Group,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  position: [number, number, number],
) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(...position);
  object.castShadow = true;
  object.receiveShadow = true;
  group.add(object);
  return object;
}

function barrel(
  group: THREE.Group,
  radius: number,
  length: number,
  position: [number, number, number],
  material: THREE.Material,
  segments = 18,
) {
  const geometry = new THREE.CylinderGeometry(radius, radius, length, segments);
  geometry.rotateX(Math.PI / 2);
  return mesh(group, geometry, material, position);
}

function addTwinBarrels(group: THREE.Group) {
  for (const x of [-0.095, 0.095]) {
    barrel(group, 0.085, 1.65, [x, 0.12, -0.82], bluedSteel, 20);
    barrel(group, 0.06, 0.025, [x, 0.12, -1.655], darkSteel, 18);
    const bore = mesh(group, new THREE.CircleGeometry(0.048, 18), darkSteel, [x, 0.12, -1.67]);
    bore.rotation.y = Math.PI;
    const rim = mesh(group, new THREE.RingGeometry(0.05, 0.085, 18), bluedSteel, [
      x,
      0.12,
      -1.675,
    ]);
    rim.rotation.y = Math.PI;
  }
  mesh(group, new THREE.BoxGeometry(0.04, 0.035, 1.5), bluedSteel, [0, 0.215, -0.78]);
  mesh(group, new THREE.BoxGeometry(0.22, 0.055, 0.16), darkSteel, [0, 0.24, -0.08]);
  mesh(group, new THREE.BoxGeometry(0.025, 0.09, 0.05), brass, [0, 0.29, -1.53]);
}

function addAction(group: THREE.Group) {
  mesh(group, new RoundedBoxGeometry(0.31, 0.34, 0.48, 3, 0.055), bluedSteel, [0, 0.04, 0.15]);
  barrel(group, 0.045, 0.35, [0, 0.03, -0.03], darkSteel, 16).rotation.z = Math.PI / 2;
  for (const x of [-0.085, 0.085]) {
    const hammer = mesh(
      group,
      new RoundedBoxGeometry(0.07, 0.16, 0.1, 2, 0.018),
      darkSteel,
      [x, 0.25, 0.33],
    );
    hammer.rotation.x = -0.28;
  }
  const guard = mesh(
    group,
    new THREE.TorusGeometry(0.12, 0.022, 7, 16, Math.PI * 1.7),
    darkSteel,
    [0, -0.17, 0.22],
  );
  guard.rotation.y = Math.PI / 2;
  guard.rotation.z = -0.2;
  for (const z of [0.16, 0.24]) {
    const trigger = mesh(group, new THREE.BoxGeometry(0.025, 0.11, 0.025), brass, [0, -0.16, z]);
    trigger.rotation.x = -0.3;
  }
}

function addWoodwork(group: THREE.Group, barrelAssembly: THREE.Group) {
  const foreEnd = mesh(
    barrelAssembly,
    new RoundedBoxGeometry(0.3, 0.23, 0.72, 4, 0.07),
    walnut,
    [0, -0.06, -0.55],
  );
  foreEnd.scale.set(1, 0.8, 1);

  const wrist = mesh(
    group,
    new RoundedBoxGeometry(0.26, 0.34, 0.52, 4, 0.07),
    walnut,
    [0, -0.12, 0.48],
  );
  wrist.rotation.x = -0.14;
  const stock = mesh(
    group,
    new RoundedBoxGeometry(0.38, 0.58, 1.05, 5, 0.11),
    walnut,
    [0, -0.19, 1.1],
  );
  stock.rotation.x = -0.1;
  stock.scale.set(1, 0.72, 1);
  mesh(group, new RoundedBoxGeometry(0.4, 0.42, 0.09, 3, 0.04), darkSteel, [0, -0.25, 1.65]);
}

export function createShotgunModel(scale = 1) {
  const shotgun = new THREE.Group();
  const barrelAssembly = new THREE.Group();
  barrelAssembly.name = 'shotgun-barrels';
  addTwinBarrels(barrelAssembly);
  shotgun.add(barrelAssembly);
  addAction(shotgun);
  addWoodwork(shotgun, barrelAssembly);
  shotgun.scale.setScalar(scale);
  return shotgun;
}
