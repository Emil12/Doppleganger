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
  return new THREE.InstancedMesh(geometry, material, count);
}

function createSpatialChunks<T>() {
  return Array.from({ length: 4 }, () => [] as T[]);
}

function getChunkIndex(x: number, z: number) {
  return (x >= 0 ? 1 : 0) + (z >= 0 ? 2 : 0);
}

function addFinishedInstances(scene: THREE.Scene, instances: THREE.InstancedMesh[]) {
  instances.forEach((mesh) => {
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  });
  scene.add(...instances);
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
  const trunkGeometry = new THREE.CylinderGeometry(0.24, 0.36, 1, 7);
  const crownGeometries = needleMaterials.map(
    (_, layer) => new THREE.ConeGeometry(1, 2.6 - layer * 0.2, 7),
  );
  const chunks = createSpatialChunks<{ tree: ForestTree; sourceIndex: number }>();
  FOREST_TREES.forEach((tree, sourceIndex) => {
    chunks[getChunkIndex(tree[0], tree[1])].push({ tree, sourceIndex });
  });
  const transform = new THREE.Matrix4();

  chunks.forEach((chunk) => {
    if (chunk.length === 0) return;
    const trunks = createInstances(trunkGeometry, trunkMaterial, chunk.length);
    const crowns = needleMaterials.map((material, layer) =>
      createInstances(crownGeometries[layer], material, chunk.length),
    );

    chunk.forEach(({ tree: [x, z, scale], sourceIndex }, instanceIndex) => {
      const height = 4.8 * scale;
      transform.compose(
        new THREE.Vector3(x, height * 0.45, z),
        new THREE.Quaternion(),
        new THREE.Vector3(scale, height * 0.9, scale),
      );
      trunks.setMatrixAt(instanceIndex, transform);

      crowns.forEach((crown, layer) => {
        const layerScale = scale * (1.35 - layer * 0.2);
        transform.compose(
          new THREE.Vector3(x, 2.3 * scale + layer * 1.35 * scale, z),
          new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(0, 1, 0),
            random(sourceIndex, layer + 10) * Math.PI,
          ),
          new THREE.Vector3(layerScale, scale, layerScale),
        );
        crown.setMatrixAt(instanceIndex, transform);
      });
    });
    addFinishedInstances(scene, [trunks, ...crowns]);
  });
}

function addForestFloor(scene: THREE.Scene) {
  const material = new THREE.MeshStandardMaterial({
    color: 0x273027,
    roughness: 1,
    flatShading: true,
  });
  const geometry = new THREE.DodecahedronGeometry(0.55, 0);
  const chunks = createSpatialChunks<readonly [x: number, y: number, z: number, scale: number]>();
  const transform = new THREE.Matrix4();
  for (let index = 0; index < 64; index += 1) {
    const tree = FOREST_TREES[(index * 7) % FOREST_TREES.length];
    const scale = 0.35 + random(index, 15) * 0.65;
    const x = tree[0] + random(index, 16) * 4 - 2;
    const z = tree[1] + random(index, 17) * 4 - 2;
    chunks[getChunkIndex(x, z)].push([x, scale * 0.35, z, scale]);
  }
  chunks.forEach((chunk) => {
    if (chunk.length === 0) return;
    const shrubs = createInstances(geometry, material, chunk.length);
    chunk.forEach(([x, y, z, scale], index) => {
      transform.compose(
        new THREE.Vector3(x, y, z),
        new THREE.Quaternion(),
        new THREE.Vector3(scale * 1.4, scale, scale),
      );
      shrubs.setMatrixAt(index, transform);
    });
    addFinishedInstances(scene, [shrubs]);
  });
}

export function addGasStationForest(scene: THREE.Scene) {
  addTrees(scene);
  addForestFloor(scene);
}
