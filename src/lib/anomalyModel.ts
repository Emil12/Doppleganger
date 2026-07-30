import * as THREE from 'three';
import { type CustomerModel } from './customerModel';

function fleshMaterial(color: number, emissive = 0) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: emissive ? 1.8 : 1,
    roughness: 0.76,
  });
}

function addEyesAndJaw(features: THREE.Group) {
  const mouth = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 14, 10),
    fleshMaterial(0x130305),
  );
  mouth.scale.set(1.15, 0.62, 0.38);
  mouth.position.set(0.025, 1.64, -0.31);
  features.add(mouth);
  for (const [x, y, size] of [[-0.12, 1.84, 0.075], [0.095, 1.78, 0.052]] as const) {
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(size, 12, 8),
      fleshMaterial(0xff1c28, 0xa5000b),
    );
    eye.scale.z = 0.55;
    eye.position.set(x, y, -0.31);
    features.add(eye);
  }
  for (let index = 0; index < 10; index += 1) {
    const tooth = new THREE.Mesh(
      new THREE.ConeGeometry(0.028 + (index % 3) * 0.008, 0.13, 7),
      fleshMaterial(0xd7cfb4),
    );
    tooth.position.set(-0.18 + index * 0.04, 1.64 + (index % 2) * 0.04, -0.395);
    tooth.rotation.z = index % 2 === 0 ? Math.PI : 0;
    features.add(tooth);
  }
}

function addExposedBones(features: THREE.Group) {
  for (let index = 0; index < 4; index += 1) {
    const rib = new THREE.Mesh(
      new THREE.TorusGeometry(0.22 - index * 0.018, 0.018, 7, 14, Math.PI),
      fleshMaterial(0xc9c1a4),
    );
    rib.position.set(0.06, 1.42 - index * 0.1, -0.235);
    rib.rotation.z = Math.PI;
    features.add(rib);
  }
  for (let index = 0; index < 6; index += 1) {
    const spine = new THREE.Mesh(
      new THREE.ConeGeometry(0.055, 0.28 + index * 0.025, 7),
      fleshMaterial(0x706c5e),
    );
    spine.position.set((index - 2.5) * 0.1, 1.25 + Math.abs(index - 2.5) * 0.07, 0.18);
    spine.rotation.x = Math.PI / 2;
    features.add(spine);
  }
}

function addClawsAndWounds(features: THREE.Group) {
  for (const side of [-1, 1]) {
    for (let claw = 0; claw < 3; claw += 1) {
      const nail = new THREE.Mesh(
        new THREE.ConeGeometry(0.025, 0.25 + claw * 0.035, 6),
        fleshMaterial(0x29261f),
      );
      nail.position.set(side * (0.4 + claw * 0.025), 0.56, -0.04 + claw * 0.035);
      nail.rotation.z = Math.PI + side * 0.18;
      features.add(nail);
    }
  }
  for (const [x, y, width, angle] of [
    [-0.18, 1.33, 0.12, -0.3],
    [0.17, 1.12, 0.09, 0.18],
    [-0.08, 1.74, 0.07, 0.12],
    [0.24, 0.82, 0.08, -0.15],
  ] as const) {
    const wound = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.48, 0.03),
      fleshMaterial(0x761019, 0x280205),
    );
    wound.position.set(x, y, -0.22);
    wound.rotation.z = angle;
    features.add(wound);
  }
}

function addHorrorGrowths(features: THREE.Group) {
  for (const side of [-1, 1]) {
    const horn = new THREE.Mesh(
      new THREE.ConeGeometry(0.075, 0.5, 8),
      fleshMaterial(0x343128),
    );
    horn.position.set(side * 0.16, 2.05, 0);
    horn.rotation.z = side * -0.35;
    features.add(horn);
  }
  for (let index = 0; index < 3; index += 1) {
    const side = index === 1 ? 0.2 : index - 1;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.2, 1.48, 0.16),
      new THREE.Vector3(side * 0.68, 1.25 + index * 0.18, 0.38),
      new THREE.Vector3(side * 1.05, 0.65 + index * 0.55, 0.08),
    ]);
    const tendril = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 12, 0.045, 7, false),
      fleshMaterial(0x3f080d, 0x150104),
    );
    features.add(tendril);
  }
  const torsoMaw = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 8), fleshMaterial(0x0b0203));
  torsoMaw.scale.set(1.35, 0.55, 0.35);
  torsoMaw.position.set(-0.04, 1.13, -0.29);
  features.add(torsoMaw);
}

export function createAnomalyFeatures() {
  const features = new THREE.Group();
  features.visible = false;
  addEyesAndJaw(features);
  addExposedBones(features);
  addClawsAndWounds(features);
  addHorrorGrowths(features);
  const glow = new THREE.PointLight(0xb30b16, 2.2, 3.5, 2);
  glow.position.set(0, 1.55, -0.45);
  features.add(glow);
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
}
