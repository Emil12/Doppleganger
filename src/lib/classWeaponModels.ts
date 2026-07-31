import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { bluedSteel, boltSteel, brass, darkSteel, rubber, walnut } from './shotgunMaterials';

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

function tube(
  group: THREE.Group,
  radius: number,
  length: number,
  position: [number, number, number],
  material: THREE.Material,
) {
  const geometry = new THREE.CylinderGeometry(radius, radius, length, 20);
  geometry.rotateX(Math.PI / 2);
  return mesh(group, geometry, material, position);
}

function addLongGunStock(group: THREE.Group, positionZ: number) {
  const stock = mesh(
    group,
    new RoundedBoxGeometry(0.34, 0.48, 1.18, 5, 0.08),
    walnut,
    [0, -0.18, positionZ],
  );
  stock.rotation.x = -0.1;
  stock.scale.set(1, 0.78, 1);
  mesh(group, new RoundedBoxGeometry(0.35, 0.38, 0.1, 3, 0.03), rubber, [
    0, -0.23, positionZ + 0.62,
  ]);
}

export function createBoltActionRifleModel(scale = 1) {
  const rifle = new THREE.Group();
  tube(rifle, 0.052, 2.25, [0, 0.12, -0.93], bluedSteel);
  tube(rifle, 0.034, 0.03, [0, 0.12, -2.07], darkSteel);
  mesh(rifle, new RoundedBoxGeometry(0.25, 0.3, 0.74, 4, 0.045), bluedSteel, [
    0, 0.02, 0.35,
  ]);
  const bolt = mesh(rifle, new THREE.CylinderGeometry(0.035, 0.035, 0.55, 12), boltSteel, [
    0.17, 0.12, 0.28,
  ]);
  bolt.name = 'weapon-bolt';
  bolt.rotation.z = Math.PI / 2;
  bolt.userData.baseX = bolt.position.x;
  mesh(rifle, new THREE.BoxGeometry(0.2, 0.18, 0.48), darkSteel, [0, -0.18, 0.25]);
  addLongGunStock(rifle, 1.28);
  rifle.scale.setScalar(scale);
  return rifle;
}

export function createDoubleBarrelModel(scale = 1) {
  const shotgun = new THREE.Group();
  tube(shotgun, 0.067, 1.72, [-0.078, 0.12, -0.78], bluedSteel);
  tube(shotgun, 0.067, 1.72, [0.078, 0.12, -0.78], bluedSteel);
  for (const x of [-0.078, 0.078]) {
    const bore = mesh(shotgun, new THREE.CircleGeometry(0.052, 18), darkSteel, [
      x, 0.12, -1.65,
    ]);
    bore.rotation.y = Math.PI;
  }
  mesh(shotgun, new RoundedBoxGeometry(0.3, 0.35, 0.58, 4, 0.05), bluedSteel, [
    0, 0.01, 0.28,
  ]);
  mesh(shotgun, new THREE.BoxGeometry(0.24, 0.025, 1.72), brass, [0, 0.2, -0.78]);
  const guard = mesh(
    shotgun,
    new THREE.TorusGeometry(0.12, 0.02, 7, 18, Math.PI * 1.7),
    darkSteel,
    [0, -0.18, 0.34],
  );
  guard.rotation.y = Math.PI / 2;
  addLongGunStock(shotgun, 1.28);
  shotgun.scale.setScalar(scale);
  return shotgun;
}
