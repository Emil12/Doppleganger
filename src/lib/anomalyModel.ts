import * as THREE from 'three';
import { anomalyGeometry as geometry } from './anomalyGeometry';
import { type CustomerModel } from './customerModel';
import { type AnomalyKind } from './anomalyTypes';
import { applyAnomalyShape, createVariantFeatures } from './anomalyVariants';

const fleshMaterials = new Map<string, THREE.MeshStandardMaterial>();

function fleshMaterial(color: number, emissive = 0) {
  const key = `${color}-${emissive}`;
  const cached = fleshMaterials.get(key);
  if (cached) return cached;
  const material = new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: emissive ? 1.8 : 1,
    roughness: 0.76,
  });
  fleshMaterials.set(key, material);
  return material;
}

export function disposeAnomalyMaterials() {
  fleshMaterials.forEach((material) => material.dispose());
}

function addEyesAndJaw(features: THREE.Group) {
  const mouth = new THREE.Mesh(geometry.mouth, fleshMaterial(0x130305));
  mouth.scale.set(1.15, 0.62, 0.38);
  mouth.position.set(0.025, 1.64, -0.31);
  features.add(mouth);
  const eyes = [[-0.12, 1.84], [0.095, 1.78]] as const;
  eyes.forEach(([x, y], index) => {
    const eye = new THREE.Mesh(
      geometry.eyes[index],
      fleshMaterial(0xff1c28, 0xa5000b),
    );
    eye.scale.z = 0.55;
    eye.position.set(x, y, -0.31);
    features.add(eye);
  });
  for (let index = 0; index < 10; index += 1) {
    const tooth = new THREE.Mesh(
      geometry.teeth[index % geometry.teeth.length],
      fleshMaterial(0xd7cfb4),
    );
    tooth.position.set(-0.18 + index * 0.04, 1.64 + (index % 2) * 0.04, -0.395);
    tooth.rotation.z = index % 2 === 0 ? Math.PI : 0;
    features.add(tooth);
  }
}

function addExposedBones(features: THREE.Group) {
  geometry.ribs.forEach((ribGeometry, index) => {
    const rib = new THREE.Mesh(ribGeometry, fleshMaterial(0xc9c1a4));
    rib.position.set(0.06, 1.42 - index * 0.1, -0.235);
    rib.rotation.z = Math.PI;
    features.add(rib);
  });
  geometry.spines.forEach((spineGeometry, index) => {
    const spine = new THREE.Mesh(spineGeometry, fleshMaterial(0x706c5e));
    spine.position.set((index - 2.5) * 0.1, 1.25 + Math.abs(index - 2.5) * 0.07, 0.18);
    spine.rotation.x = Math.PI / 2;
    features.add(spine);
  });
}

function addClawsAndWounds(features: THREE.Group) {
  for (const side of [-1, 1]) {
    geometry.claws.forEach((clawGeometry, index) => {
      const nail = new THREE.Mesh(clawGeometry, fleshMaterial(0x29261f));
      nail.position.set(side * (0.4 + index * 0.025), 0.56, -0.04 + index * 0.035);
      nail.rotation.z = Math.PI + side * 0.18;
      features.add(nail);
    });
  }
  const woundTransforms = [
    [-0.18, 1.33, -0.3],
    [0.17, 1.12, 0.18],
    [-0.08, 1.74, 0.12],
    [0.24, 0.82, -0.15],
  ] as const;
  woundTransforms.forEach(([x, y, angle], index) => {
    const wound = new THREE.Mesh(
      geometry.wounds[index],
      fleshMaterial(0x761019, 0x280205),
    );
    wound.position.set(x, y, -0.22);
    wound.rotation.z = angle;
    features.add(wound);
  });
}

function addHorrorGrowths(features: THREE.Group) {
  for (const side of [-1, 1]) {
    const horn = new THREE.Mesh(geometry.horn, fleshMaterial(0x343128));
    horn.position.set(side * 0.16, 2.05, 0);
    horn.rotation.z = side * -0.35;
    features.add(horn);
  }
  geometry.tendrils.forEach((tendrilGeometry) => {
    features.add(new THREE.Mesh(tendrilGeometry, fleshMaterial(0x3f080d, 0x150104)));
  });
  const torsoMaw = new THREE.Mesh(geometry.torsoMaw, fleshMaterial(0x0b0203));
  torsoMaw.scale.set(1.35, 0.55, 0.35);
  torsoMaw.position.set(-0.04, 1.13, -0.29);
  features.add(torsoMaw);
}

export function createAnomalyFeatures(kind: AnomalyKind) {
  const features = new THREE.Group();
  features.visible = false;
  addEyesAndJaw(features);
  addExposedBones(features);
  addClawsAndWounds(features);
  addHorrorGrowths(features);
  features.add(createVariantFeatures(kind));
  return features;
}

export function makeAnomalyHostile(model: CustomerModel) {
  if (!model.isAnomaly || model.root.userData.hostile === true) return;
  model.root.userData.hostile = true;
  model.root.scale.set(1.15, 1.28, 1.15);
  model.torso.scale.set(1.38, 1.12, 0.82);
  model.head.scale.set(1.18, 1.48, 1.08);
  model.leftArm.scale.set(0.72, 2.15, 0.78);
  model.rightArm.scale.set(1.35, 1.55, 1.2);
  model.leftLeg.scale.set(0.82, 1.35, 0.82);
  model.rightLeg.scale.set(1.18, 0.92, 1.12);
  model.anomalyFeatures.visible = true;
  applyAnomalyShape(model);
}
