import * as THREE from 'three';
import { makeAnomalyHostile } from './anomalyModel';
import { type CustomerModel } from './customerModel';
import { type Customer } from './customerTypes';

function material(color: number, emissive = 0) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: emissive ? 2.2 : 1,
    roughness: 0.78,
  });
}

function mesh(
  group: THREE.Group,
  geometry: THREE.BufferGeometry,
  objectMaterial: THREE.Material,
  position: [number, number, number],
) {
  const object = new THREE.Mesh(geometry, objectMaterial);
  object.position.set(...position);
  object.castShadow = true;
  group.add(object);
  return object;
}

export function makeImmortalInspector(model: CustomerModel) {
  model.root.name = 'immortal-inspector';
  model.root.userData.inspector = true;
  model.root.scale.set(1.28, 2.05, 1.28);
  model.torso.scale.set(1.38, 1.45, 0.78);
  model.head.scale.set(0.72, 1.78, 0.76);
  model.leftArm.scale.set(0.62, 3.15, 0.7);
  model.rightArm.scale.set(0.62, 3.15, 0.7);
  model.leftLeg.scale.set(0.78, 1.5, 0.8);
  model.rightLeg.scale.set(0.78, 1.5, 0.8);
  model.anomalyFeatures.visible = true;

  const details = new THREE.Group();
  details.name = 'inspector-details';
  const coat = mesh(
    details,
    new THREE.CylinderGeometry(0.38, 0.62, 1.42, 9),
    material(0x090b0d),
    [0, 0.9, 0.02],
  );
  coat.scale.z = 0.72;
  const voidFace = mesh(
    details,
    new THREE.SphereGeometry(0.255, 18, 14),
    material(0x010101),
    [0, 1.84, -0.19],
  );
  voidFace.scale.set(0.84, 1.32, 0.62);

  for (const [x, y] of [
    [-0.13, 1.98],
    [0, 2.02],
    [0.13, 1.98],
    [-0.12, 1.84],
    [0.12, 1.84],
  ] as const) {
    const eye = mesh(
      details,
      new THREE.SphereGeometry(0.035, 10, 7),
      material(0xf2e7b1, 0x9a1609),
      [x, y, -0.37],
    );
    eye.scale.z = 0.45;
  }

  const badge = mesh(
    details,
    new THREE.OctahedronGeometry(0.1, 0),
    material(0xa47f31, 0x332000),
    [0.23, 1.46, -0.25],
  );
  badge.scale.y = 1.25;
  model.root.add(details);
}

export function spawnImmortalInspector(spawnCustomer: (isAnomaly: boolean) => Customer) {
  const inspector = spawnCustomer(true);
  inspector.phase = 'attacking';
  inspector.hitPoints = Number.POSITIVE_INFINITY;
  inspector.immortal = true;
  inspector.model.idCard.visible = false;
  inspector.model.shoppingBag.visible = false;
  makeAnomalyHostile(inspector.model);
  makeImmortalInspector(inspector.model);
  return inspector;
}
