import * as THREE from 'three';
import { customerBodyGeometry as geometry } from './customerBodyGeometry';
import { customerMesh, type CustomerStyle } from './customerStyle';

export type CustomerBody = {
  torso: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
};

function capsule(length: number, radius: number, color: number) {
  return customerMesh(geometry.capsule(length, radius), color);
}

function createArm(side: -1 | 1, style: CustomerStyle) {
  const arm = new THREE.Group();
  arm.position.set(side * 0.38 * style.build, 1.48, 0);
  const upper = capsule(0.36, 0.105, style.shirt);
  upper.position.y = -0.2;
  const elbow = customerMesh(geometry.armJoint, style.skin);
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
  const knee = customerMesh(geometry.legJoint, style.trousers);
  knee.position.y = -0.47;
  const calf = capsule(0.37, 0.105, style.trousers);
  calf.position.y = -0.65;
  const shoe = customerMesh(geometry.shoe, style.shoes, 0.48);
  shoe.position.set(0, -0.86, -0.065);
  leg.add(thigh, knee, calf, shoe);
  return leg;
}

function addFace(head: THREE.Group, style: CustomerStyle, anomalousEyes: boolean) {
  const eyeY = 0.045;
  for (const x of [-0.085, 0.085]) {
    const eye = customerMesh(
      geometry.eye(anomalousEyes),
      anomalousEyes ? 0xd8d2c8 : 0xeee8dc,
    );
    eye.scale.y = 0.72;
    eye.position.set(x, eyeY, -0.225);
    const iris = customerMesh(
      geometry.iris(anomalousEyes),
      anomalousEyes ? 0x59373a : style.eyes,
      0.38,
      anomalousEyes ? 0x160204 : 0,
    );
    iris.position.set(x, eyeY, -0.268);
    iris.scale.y = 0.76;
    head.add(eye, iris);
  }
  const nose = customerMesh(geometry.nose, style.skin);
  nose.rotation.x = -Math.PI / 2;
  nose.position.set(0, -0.025, -0.25);
  const mouth = customerMesh(geometry.mouth, 0x633536);
  mouth.position.set(0, -0.115, -0.238);
  head.add(nose, mouth);
}

function createHead(style: CustomerStyle, anomalousEyes: boolean, index: number) {
  const head = new THREE.Group();
  head.position.set(0, 1.78, 0);
  const face = customerMesh(geometry.head, style.skin);
  face.scale.set(0.9, 1.12, 0.94);
  head.add(face);
  for (const side of [-1, 1]) {
    const ear = customerMesh(geometry.ear, style.skin);
    ear.scale.z = 0.55;
    ear.position.set(side * 0.235, 0, 0);
    head.add(ear);
  }
  const hair = customerMesh(geometry.hair, style.hair, 0.82);
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
  const chest = customerMesh(geometry.chest(style.build), style.shirt);
  chest.scale.z = 0.66;
  torso.position.y = 1.23;
  torso.add(chest);
  const collar = customerMesh(geometry.collar, style.accent);
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, 0.29, -0.04);
  torso.add(collar);

  const pelvis = customerMesh(geometry.pelvis(style.build), style.trousers);
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
