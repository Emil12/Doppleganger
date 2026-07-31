import * as THREE from 'three';
import { lowPolyBox } from './lowPolyGeometry';
import {
  customerMesh,
  type CustomerStyle,
} from './customerStyle';

export type CustomerBody = {
  torso: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
};

function capsule(length: number, radius: number, color: number) {
  return customerMesh(
    new THREE.CapsuleGeometry(radius, Math.max(0.02, length - radius * 2), 6, 12),
    color,
  );
}

function createArm(side: -1 | 1, style: CustomerStyle) {
  const arm = new THREE.Group();
  arm.position.set(side * 0.38 * style.build, 1.48, 0);

  const upper = capsule(0.36, 0.105, style.shirt);
  upper.position.y = -0.2;
  const elbow = customerMesh(new THREE.SphereGeometry(0.1, 12, 8), style.skin);
  elbow.position.y = -0.4;
  const forearm = capsule(0.3, 0.085, style.skin);
  forearm.position.y = -0.54;
  const hand = capsule(0.2, 0.09, style.skin);
  hand.position.y = -0.76;
  arm.add(upper, elbow, forearm, hand);
  return arm;
}

function createLeg(side: -1 | 1, style: CustomerStyle) {
  const leg = new THREE.Group();
  leg.position.set(side * 0.17 * style.build, 0.91, 0);

  const thigh = capsule(0.43, 0.13, style.trousers);
  thigh.position.y = -0.23;
  const knee = customerMesh(new THREE.SphereGeometry(0.115, 12, 8), style.trousers);
  knee.position.y = -0.47;
  const calf = capsule(0.37, 0.105, style.trousers);
  calf.position.y = -0.65;
  const shoe = customerMesh(lowPolyBox(0.24, 0.14, 0.38, 0.055), style.shoes, 0.48);
  shoe.position.set(0, -0.86, -0.065);
  leg.add(thigh, knee, calf, shoe);
  return leg;
}

function addFace(head: THREE.Group, style: CustomerStyle, anomalousEyes: boolean) {
  const eyeY = 0.045;
  for (const x of [-0.085, 0.085]) {
    const eye = customerMesh(
      new THREE.SphereGeometry(anomalousEyes ? 0.054 : 0.052, 12, 8),
      anomalousEyes ? 0xd8d2c8 : 0xeee8dc,
    );
    eye.scale.y = 0.72;
    eye.position.set(x, eyeY, -0.225);
    const iris = customerMesh(
      new THREE.SphereGeometry(anomalousEyes ? 0.027 : 0.025, 10, 7),
      anomalousEyes ? 0x59373a : style.eyes,
      0.38,
      anomalousEyes ? 0x160204 : 0,
    );
    iris.position.set(x, eyeY, -0.268);
    iris.scale.y = 0.76;
    head.add(eye, iris);
  }

  const nose = customerMesh(new THREE.ConeGeometry(0.045, 0.12, 10), style.skin);
  nose.rotation.x = -Math.PI / 2;
  nose.position.set(0, -0.025, -0.25);
  const mouth = customerMesh(new THREE.BoxGeometry(0.1, 0.014, 0.014), 0x633536);
  mouth.position.set(0, -0.115, -0.238);
  head.add(nose, mouth);
}

function createHead(style: CustomerStyle, anomalousEyes: boolean, index: number) {
  const head = new THREE.Group();
  head.position.set(0, 1.78, 0);
  const face = customerMesh(new THREE.SphereGeometry(0.25, 18, 14), style.skin);
  face.scale.set(0.9, 1.12, 0.94);
  head.add(face);

  for (const side of [-1, 1]) {
    const ear = customerMesh(new THREE.SphereGeometry(0.055, 10, 7), style.skin);
    ear.scale.z = 0.55;
    ear.position.set(side * 0.235, 0, 0);
    head.add(ear);
  }
  const hair = customerMesh(
    new THREE.SphereGeometry(0.255, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.56),
    style.hair,
    0.82,
  );
  hair.position.y = 0.035;
  hair.scale.set(0.93, 1.05 + (index % 3) * 0.07, 0.96);
  head.add(hair);
  addFace(head, style, anomalousEyes);
  return head;
}

export function createCustomerBody(
  root: THREE.Group,
  style: CustomerStyle,
  index: number,
  anomalousEyes: boolean,
): CustomerBody {
  const torso = new THREE.Group();
  const chest = customerMesh(
    new THREE.CylinderGeometry(0.34 * style.build, 0.27 * style.build, 0.62, 14),
    style.shirt,
  );
  chest.scale.z = 0.66;
  torso.position.y = 1.23;
  torso.add(chest);
  const collar = customerMesh(new THREE.TorusGeometry(0.115, 0.025, 7, 14), style.accent);
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, 0.29, -0.04);
  torso.add(collar);

  const pelvis = customerMesh(lowPolyBox(0.53 * style.build, 0.22, 0.3, 0.07), style.trousers);
  pelvis.position.y = 0.91;
  const neck = capsule(0.18, 0.085, style.skin);
  neck.position.y = 1.57;
  const head = createHead(style, anomalousEyes, index);
  const leftArm = createArm(-1, style);
  const rightArm = createArm(1, style);
  const leftLeg = createLeg(-1, style);
  const rightLeg = createLeg(1, style);
  root.add(torso, pelvis, neck, head, leftArm, rightArm, leftLeg, rightLeg);
  return { torso, head, leftArm, rightArm, leftLeg, rightLeg };
}
