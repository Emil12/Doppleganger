import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {
  bluedSteel,
  boltSteel,
  darkSteel,
  rubber,
} from './shotgunMaterials';

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
  const red = new THREE.MeshStandardMaterial({
    color: 0x8f1618,
    metalness: 0.4,
    roughness: 0.3,
  });

  const port = add(
    shotgun,
    new RoundedBoxGeometry(0.026, 0.15, 0.28, 2, 0.012),
    darkSteel,
    [0.184, 0.09, 0.18],
  );
  port.rotation.z = -0.03;
  const bolt = add(
    shotgun,
    new RoundedBoxGeometry(0.029, 0.105, 0.18, 2, 0.01),
    boltSteel,
    [0.2, 0.09, 0.16],
  );
  bolt.name = 'shotgun-bolt';
  bolt.userData.baseZ = bolt.position.z;

  const loadingGate = add(
    shotgun,
    new RoundedBoxGeometry(0.16, 0.025, 0.31, 2, 0.01),
    darkSteel,
    [0, -0.172, 0.36],
  );
  loadingGate.rotation.x = -0.08;

  for (const z of [0.08, 0.34]) {
    const pin = add(
      shotgun,
      new THREE.CylinderGeometry(0.028, 0.028, 0.03, 12),
      boltSteel,
      [0.19, -0.01, z],
    );
    pin.rotation.z = Math.PI / 2;
  }

  add(shotgun, new THREE.SphereGeometry(0.034, 10, 7), red, [0.19, -0.1, 0.39]);
  add(shotgun, new THREE.BoxGeometry(0.11, 0.055, 0.035), darkSteel, [0, 0.265, 0.45]);
  add(shotgun, new THREE.BoxGeometry(0.035, 0.075, 0.045), boltSteel, [-0.045, 0.292, 0.45]);
  add(shotgun, new THREE.BoxGeometry(0.035, 0.075, 0.045), boltSteel, [0.045, 0.292, 0.45]);

  for (const z of [0.95, 1.08, 1.21, 1.34, 1.47]) {
    const checkering = add(
      shotgun,
      new THREE.BoxGeometry(0.018, 0.19, 0.035),
      rubber,
      [0.205, -0.24, z],
    );
    checkering.rotation.x = -0.12;
    checkering.rotation.z = 0.25;
  }

  const slingLoop = add(
    shotgun,
    new THREE.TorusGeometry(0.075, 0.014, 7, 14),
    darkSteel,
    [0, -0.43, 1.73],
  );
  slingLoop.rotation.x = Math.PI / 2;

  for (const x of [-0.135, 0.135]) {
    add(
      shotgun,
      new RoundedBoxGeometry(0.025, 0.035, 0.82, 2, 0.008),
      boltSteel,
      [x, -0.035, -0.27],
    );
  }

  for (const z of [-1.38, -1.08, -0.78, -0.48, -0.18]) {
    add(shotgun, new THREE.BoxGeometry(0.13, 0.055, 0.028), bluedSteel, [0, 0.235, z]);
  }

  const barrelBand = add(
    shotgun,
    new THREE.TorusGeometry(0.118, 0.022, 8, 22),
    darkSteel,
    [0, 0.075, -1.28],
  );
  barrelBand.scale.y = 1.45;

  const magazineCap = add(
    shotgun,
    new THREE.CylinderGeometry(0.072, 0.072, 0.08, 22),
    bluedSteel,
    [0, -0.005, -1.36],
  );
  magazineCap.rotation.x = Math.PI / 2;

  for (let groove = 0; groove < 4; groove += 1) {
    add(
      shotgun,
      new THREE.BoxGeometry(0.44, 0.025, 0.012),
      rubber,
      [0, -0.25 + groove * 0.085, 1.885],
    );
  }
}
