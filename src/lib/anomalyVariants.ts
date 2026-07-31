import * as THREE from 'three';
import { type CustomerModel } from './customerModel';
import { sharedCustomerGeometry } from './customerGeometry';
import { type AnomalyKind } from './anomalyTypes';

const materials = new Map<string, THREE.MeshStandardMaterial>();

function material(color: number, emissive = 0) {
  const key = `${color}-${emissive}`;
  const cached = materials.get(key);
  if (cached) return cached;
  const created = new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: emissive ? 1.5 : 1,
    roughness: 0.72,
  });
  materials.set(key, created);
  return created;
}

export function disposeAnomalyVariantMaterials() {
  materials.forEach((item) => item.dispose());
}

function addScreamerFeatures(group: THREE.Group) {
  for (let ring = 0; ring < 3; ring += 1) {
    const throat = new THREE.Mesh(
      sharedCustomerGeometry(
        `screamer-throat-${ring}`,
        () => new THREE.TorusGeometry(0.15 + ring * 0.035, 0.018, 7, 14),
      ),
      material(0x5c090e, 0x210103),
    );
    throat.scale.y = 0.7;
    throat.position.set(0.02, 1.63, -0.405 - ring * 0.012);
    group.add(throat);
  }
}

function addCrierFeatures(group: THREE.Group) {
  for (const x of [-0.11, 0.1]) {
    const tear = new THREE.Mesh(
      sharedCustomerGeometry(
        'crier-tear',
        () => new THREE.BoxGeometry(0.035, 0.46, 0.025),
      ),
      material(0x111923, 0x09111d),
    );
    tear.position.set(x, 1.56, -0.355);
    tear.rotation.z = x * 0.7;
    group.add(tear);
    const drop = new THREE.Mesh(
      sharedCustomerGeometry(
        'crier-tear-drop',
        () => new THREE.SphereGeometry(0.055, 8, 6),
      ),
      material(0x182333, 0x081326),
    );
    drop.position.set(x * 1.15, 1.31, -0.37);
    group.add(drop);
  }
}

function addCrawlerFeatures(group: THREE.Group) {
  for (let index = 0; index < 5; index += 1) {
    const spine = new THREE.Mesh(
      sharedCustomerGeometry(
        `crawler-spine-${index}`,
        () => new THREE.ConeGeometry(0.055, 0.32 + index * 0.035, 6),
      ),
      material(0x25241e),
    );
    spine.position.set((index - 2) * 0.13, 1.2, 0.22);
    spine.rotation.x = Math.PI / 2;
    group.add(spine);
  }
}

function addStalkerFeatures(group: THREE.Group) {
  for (const [x, y] of [
    [-0.18, 1.93],
    [0.17, 1.92],
    [-0.2, 1.76],
    [0.19, 1.75],
  ] as const) {
    const eye = new THREE.Mesh(
      sharedCustomerGeometry(
        'stalker-eye',
        () => new THREE.SphereGeometry(0.038, 9, 7),
      ),
      material(0xe8e2c8, 0x403908),
    );
    eye.position.set(x, y, -0.335);
    eye.scale.z = 0.5;
    group.add(eye);
  }
}

export function createVariantFeatures(kind: AnomalyKind) {
  const group = new THREE.Group();
  if (kind === 'screamer') addScreamerFeatures(group);
  if (kind === 'crier') addCrierFeatures(group);
  if (kind === 'crawler') addCrawlerFeatures(group);
  if (kind === 'stalker') addStalkerFeatures(group);
  return group;
}

export function applyAnomalyShape(model: CustomerModel) {
  if (model.anomalyKind === 'screamer') {
    model.root.scale.set(1.18, 1.32, 1.18);
    model.head.scale.set(1.52, 1.72, 1.18);
    model.torso.scale.set(1.5, 1.08, 0.76);
  }
  if (model.anomalyKind === 'crier') {
    model.root.scale.set(1.08, 1.2, 1.08);
    model.head.scale.set(1.02, 1.28, 0.96);
    model.leftArm.scale.set(0.82, 2.25, 0.82);
    model.rightArm.scale.set(0.82, 2.25, 0.82);
  }
  if (model.anomalyKind === 'crawler') {
    model.root.scale.set(1.32, 0.72, 1.36);
    model.torso.scale.set(1.55, 1.32, 1.12);
    model.leftArm.scale.set(1.25, 2.3, 1.1);
    model.rightArm.scale.set(1.25, 2.3, 1.1);
  }
  if (model.anomalyKind === 'stalker') {
    model.root.scale.set(0.9, 1.68, 0.9);
    model.torso.scale.set(0.9, 1.25, 0.68);
    model.head.scale.set(0.72, 1.36, 0.78);
    model.leftArm.scale.set(0.65, 2.65, 0.68);
    model.rightArm.scale.set(0.65, 2.65, 0.68);
  }
}
