import * as THREE from 'three';
import { bluedSteel, boltSteel, brass, darkSteel } from './shotgunMaterials';

function add(
  group: THREE.Group,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  position: [number, number, number],
) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(...position);
  object.castShadow = true;
  group.add(object);
  return object;
}

export function addShotgunDetails(shotgun: THREE.Group) {
  const port = add(
    shotgun,
    new THREE.BoxGeometry(0.026, 0.14, 0.26),
    darkSteel,
    [0.184, 0.09, 0.18],
  );
  port.rotation.z = -0.03;

  const bolt = add(
    shotgun,
    new THREE.BoxGeometry(0.029, 0.1, 0.16),
    boltSteel,
    [0.2, 0.09, 0.16],
  );
  bolt.name = 'shotgun-bolt';
  bolt.userData.baseZ = bolt.position.z;

  add(shotgun, new THREE.BoxGeometry(0.11, 0.055, 0.035), darkSteel, [0, 0.265, 0.45]);
  add(shotgun, new THREE.BoxGeometry(0.025, 0.075, 0.04), boltSteel, [0, 0.29, 0.45]);

  for (const z of [-1.25, -0.75, -0.25]) {
    add(shotgun, new THREE.BoxGeometry(0.12, 0.05, 0.025), bluedSteel, [0, 0.235, z]);
  }

  add(shotgun, new THREE.BoxGeometry(0.16, 0.025, 0.32), darkSteel, [0, -0.155, 0.14]);
  add(shotgun, new THREE.CylinderGeometry(0.025, 0.025, 0.39, 8), boltSteel, [
    -0.13, -0.015, -0.56,
  ]).rotation.x = Math.PI / 2;
  add(shotgun, new THREE.CylinderGeometry(0.025, 0.025, 0.39, 8), boltSteel, [
    0.13, -0.015, -0.56,
  ]).rotation.x = Math.PI / 2;
  for (const z of [0.08, 0.34]) {
    add(shotgun, new THREE.CylinderGeometry(0.022, 0.022, 0.38, 8), boltSteel, [0, 0.04, z])
      .rotation.z = Math.PI / 2;
  }
  add(shotgun, new THREE.SphereGeometry(0.022, 8, 5), brass, [0, 0.285, -1.53]);
}
