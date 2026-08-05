import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { addShotgunDetails } from './shotgunDetails';
import {
  bluedSteel,
  brass,
  darkSteel,
  rubber,
  walnut,
} from './shotgunMaterials';

function mesh(
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

function tube(
  group: THREE.Group,
  radius: number,
  length: number,
  position: [number, number, number],
  material: THREE.Material,
  segments = 8,
) {
  const geometry = new THREE.CylinderGeometry(radius, radius, length, segments);
  geometry.rotateX(Math.PI / 2);
  return mesh(group, geometry, material, position);
}

function addBarrelAndMagazine(shotgun: THREE.Group) {
  tube(shotgun, 0.084, 1.72, [0, 0.15, -0.78], bluedSteel, 10);
  tube(shotgun, 0.049, 0.025, [0, 0.15, -1.655], darkSteel);
  const bore = mesh(shotgun, new THREE.CircleGeometry(0.047, 8), darkSteel, [0, 0.15, -1.67]);
  bore.rotation.y = Math.PI;

  tube(shotgun, 0.058, 1.42, [0, -0.005, -0.6], darkSteel);
  tube(shotgun, 0.066, 0.055, [0, -0.005, -1.32], brass);
  mesh(shotgun, new THREE.BoxGeometry(0.028, 0.035, 1.45), bluedSteel, [0, 0.245, -0.75]);
  mesh(shotgun, new THREE.BoxGeometry(0.025, 0.09, 0.045), brass, [0, 0.29, -1.52]);
}

function addReceiver(shotgun: THREE.Group) {
  mesh(
    shotgun,
    new RoundedBoxGeometry(0.34, 0.36, 0.58, 2, 0.055),
    bluedSteel,
    [0, 0.04, 0.25],
  );
  const guard = mesh(
    shotgun,
    new THREE.TorusGeometry(0.12, 0.022, 5, 10, Math.PI * 1.72),
    darkSteel,
    [0, -0.18, 0.3],
  );
  guard.rotation.y = Math.PI / 2;
  guard.rotation.z = -0.2;
  const trigger = mesh(shotgun, new THREE.BoxGeometry(0.025, 0.12, 0.028), brass, [
    0,
    -0.17,
    0.25,
  ]);
  trigger.rotation.x = -0.3;
}

function addPump(shotgun: THREE.Group) {
  const pump = new THREE.Group();
  pump.name = 'shotgun-pump';
  pump.position.set(0, -0.065, -0.62);
  pump.userData.baseZ = pump.position.z;
  mesh(pump, new RoundedBoxGeometry(0.31, 0.24, 0.62, 2, 0.065), walnut, [0, 0, 0]);
  for (const z of [-0.18, 0, 0.18]) {
    const rib = mesh(pump, new THREE.BoxGeometry(0.325, 0.025, 0.025), darkSteel, [0, -0.1, z]);
    rib.rotation.x = 0.08;
  }
  shotgun.add(pump);
}

function addStock(shotgun: THREE.Group) {
  const wrist = mesh(
    shotgun,
    new RoundedBoxGeometry(0.28, 0.4, 0.5, 2, 0.07),
    walnut,
    [0, -0.13, 0.58],
  );
  wrist.rotation.x = -0.18;
  const stockGeometry = new RoundedBoxGeometry(0.42, 0.58, 1.14, 2, 0.1);
  const positions = stockGeometry.attributes.position;
  for (let index = 0; index < positions.count; index += 1) {
    const z = positions.getZ(index);
    const taper = THREE.MathUtils.mapLinear(z, -0.57, 0.57, 0.62, 1);
    positions.setX(index, positions.getX(index) * taper);
    positions.setY(index, positions.getY(index) * (0.7 + taper * 0.3) - (taper - 0.62) * 0.08);
  }
  positions.needsUpdate = true;
  stockGeometry.computeVertexNormals();
  const stock = mesh(
    shotgun,
    stockGeometry,
    walnut,
    [0, -0.19, 1.32],
  );
  stock.rotation.x = -0.1;
  stock.scale.set(1, 0.72, 1);
  mesh(shotgun, new RoundedBoxGeometry(0.43, 0.45, 0.1, 2, 0.035), rubber, [
    0,
    -0.25,
    1.88,
  ]);
}

export function createShotgunModel(scale = 1) {
  const shotgun = new THREE.Group();
  addBarrelAndMagazine(shotgun);
  addReceiver(shotgun);
  addPump(shotgun);
  addStock(shotgun);
  addShotgunDetails(shotgun);
  shotgun.scale.setScalar(scale);
  return shotgun;
}
