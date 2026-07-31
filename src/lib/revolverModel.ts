import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { bluedSteel, boltSteel, darkSteel, walnut } from './shotgunMaterials';

function mesh(
  group: THREE.Group,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  position: [number, number, number],
) {
  const part = new THREE.Mesh(geometry, material);
  part.position.set(...position);
  part.castShadow = true;
  group.add(part);
  return part;
}

export function createRevolverModel(scale = 1) {
  const revolver = new THREE.Group();
  const barrelGeometry = new THREE.CylinderGeometry(0.065, 0.065, 0.68, 20);
  barrelGeometry.rotateX(Math.PI / 2);
  mesh(revolver, barrelGeometry, bluedSteel, [0, 0.11, -0.57]);
  const bore = mesh(
    revolver,
    new THREE.CircleGeometry(0.047, 18),
    darkSteel,
    [0, 0.11, -0.92],
  );
  bore.rotation.y = Math.PI;
  mesh(revolver, new RoundedBoxGeometry(0.24, 0.27, 0.46, 3, 0.04), bluedSteel, [
    0, 0, 0.02,
  ]);

  const cylinder = new THREE.Group();
  cylinder.name = 'revolver-cylinder';
  cylinder.position.set(0, 0.07, -0.17);
  const cylinderGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.25, 20);
  cylinderGeometry.rotateZ(Math.PI / 2);
  mesh(cylinder, cylinderGeometry, boltSteel, [0, 0, 0]);
  for (let chamber = 0; chamber < 6; chamber += 1) {
    const angle = (chamber / 6) * Math.PI * 2;
    const hole = mesh(cylinder, new THREE.CircleGeometry(0.024, 10), darkSteel, [
      0.128,
      Math.cos(angle) * 0.095,
      Math.sin(angle) * 0.095,
    ]);
    hole.rotation.y = Math.PI / 2;
  }
  revolver.add(cylinder);

  const guard = mesh(
    revolver,
    new THREE.TorusGeometry(0.105, 0.018, 8, 18, Math.PI * 1.75),
    darkSteel,
    [0, -0.15, 0.08],
  );
  guard.rotation.y = Math.PI / 2;
  guard.rotation.z = -0.25;
  const grip = mesh(
    revolver,
    new RoundedBoxGeometry(0.25, 0.5, 0.24, 4, 0.065),
    walnut,
    [0, -0.34, 0.21],
  );
  grip.rotation.x = -0.24;
  revolver.scale.setScalar(scale);
  return revolver;
}
