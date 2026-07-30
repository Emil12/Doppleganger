import * as THREE from 'three';

export type ForestTree = readonly [x: number, z: number, scale: number];

function random(index: number, salt: number) {
  return Math.abs(Math.sin(index * 91.73 + salt * 37.11) * 43758.5453) % 1;
}

function createTreePositions() {
  const trees: ForestTree[] = [];
  for (let index = 0; index < 48; index += 1) {
    const x = random(index, 1) * 72 - 36;
    const z = -30 - random(index, 2) * 10;
    if (x > 9 && x < 15 && z > -35) continue;
    trees.push([x, z, 0.72 + random(index, 3) * 0.72]);
  }
  for (let index = 0; index < 56; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    trees.push([
      side * (18 + random(index, 4) * 19),
      random(index, 5) * 52 - 27,
      0.7 + random(index, 6) * 0.78,
    ]);
  }
  for (let index = 0; index < 28; index += 1) {
    trees.push([
      random(index, 7) * 72 - 36,
      22 + random(index, 8) * 15,
      0.68 + random(index, 9) * 0.7,
    ]);
  }
  return trees;
}

export const FOREST_TREES = createTreePositions();

function createInstances(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  count: number,
) {
  const instances = new THREE.InstancedMesh(geometry, material, count);
  instances.castShadow = true;
  instances.receiveShadow = true;
  return instances;
}

function addTrees(scene: THREE.Scene) {
  const trunkMaterial = new THREE.MeshStandardMaterial({
    color: 0x3c3026,
    roughness: 0.95,
    flatShading: true,
  });
  const needleMaterials = [0x263c2d, 0x304a35, 0x1f3428].map(
    (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, flatShading: true }),
  );
  const trunks = createInstances(new THREE.CylinderGeometry(0.24, 0.36, 1, 7), trunkMaterial, FOREST_TREES.length);
  const crowns = needleMaterials.map((material, layer) =>
    createInstances(new THREE.ConeGeometry(1, 2.6 - layer * 0.2, 7), material, FOREST_TREES.length),
  );
  const transform = new THREE.Matrix4();

  FOREST_TREES.forEach(([x, z, scale], index) => {
    const height = 4.8 * scale;
    transform.compose(
      new THREE.Vector3(x, height * 0.45, z),
      new THREE.Quaternion(),
      new THREE.Vector3(scale, height * 0.9, scale),
    );
    trunks.setMatrixAt(index, transform);

    crowns.forEach((crown, layer) => {
      const layerScale = scale * (1.35 - layer * 0.2);
      transform.compose(
        new THREE.Vector3(x, 2.3 * scale + layer * 1.35 * scale, z),
        new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0),
          random(index, layer + 10) * Math.PI,
        ),
        new THREE.Vector3(layerScale, scale, layerScale),
      );
      crown.setMatrixAt(index, transform);
    });
  });
  scene.add(trunks, ...crowns);
}

function addForestFloor(scene: THREE.Scene) {
  const material = new THREE.MeshStandardMaterial({
    color: 0x273027,
    roughness: 1,
    flatShading: true,
  });
  const shrubs = createInstances(new THREE.DodecahedronGeometry(0.55, 0), material, 64);
  const transform = new THREE.Matrix4();
  for (let index = 0; index < 64; index += 1) {
    const tree = FOREST_TREES[(index * 7) % FOREST_TREES.length];
    const scale = 0.35 + random(index, 15) * 0.65;
    transform.compose(
      new THREE.Vector3(
        tree[0] + random(index, 16) * 4 - 2,
        scale * 0.35,
        tree[1] + random(index, 17) * 4 - 2,
      ),
      new THREE.Quaternion(),
      new THREE.Vector3(scale * 1.4, scale, scale),
    );
    shrubs.setMatrixAt(index, transform);
  }
  scene.add(shrubs);
}

export function addGasStationForest(scene: THREE.Scene) {
  addTrees(scene);
  addForestFloor(scene);
}
