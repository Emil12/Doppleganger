import * as THREE from 'three';
import { sharedCustomerGeometry } from './customerGeometry';
import { lowPolyBox } from './lowPolyGeometry';

const shared = <T extends THREE.BufferGeometry>(key: string, create: () => T) => (
  sharedCustomerGeometry(`body-${key}`, create)
);

const staticGeometry = {
  armJoint: shared('arm-joint', () => new THREE.SphereGeometry(0.1, 12, 8)),
  legJoint: shared('leg-joint', () => new THREE.SphereGeometry(0.115, 12, 8)),
  shoe: shared('shoe', () => lowPolyBox(0.24, 0.14, 0.38, 0.055)),
  normalEye: shared('eye-false', () => new THREE.SphereGeometry(0.052, 12, 8)),
  anomalyEye: shared('eye-true', () => new THREE.SphereGeometry(0.054, 12, 8)),
  normalIris: shared('iris-false', () => new THREE.SphereGeometry(0.025, 10, 7)),
  anomalyIris: shared('iris-true', () => new THREE.SphereGeometry(0.027, 10, 7)),
  nose: shared('nose', () => new THREE.ConeGeometry(0.045, 0.12, 10)),
  mouth: shared('mouth', () => new THREE.BoxGeometry(0.1, 0.014, 0.014)),
  head: shared('head', () => new THREE.SphereGeometry(0.25, 18, 14)),
  ear: shared('ear', () => new THREE.SphereGeometry(0.055, 10, 7)),
  hair: shared(
    'hair',
    () => new THREE.SphereGeometry(0.255, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.56),
  ),
  collar: shared('collar', () => new THREE.TorusGeometry(0.115, 0.025, 7, 14)),
};

export const customerBodyGeometry = {
  ...staticGeometry,
  eye: (anomalous: boolean) => (
    anomalous ? staticGeometry.anomalyEye : staticGeometry.normalEye
  ),
  iris: (anomalous: boolean) => (
    anomalous ? staticGeometry.anomalyIris : staticGeometry.normalIris
  ),
  capsule: (length: number, radius: number) => shared(
    `capsule-${length}-${radius}`,
    () => new THREE.CapsuleGeometry(radius, Math.max(0.02, length - radius * 2), 6, 12),
  ),
  chest: (build: number) => shared(
    `chest-${build}`,
    () => new THREE.CylinderGeometry(0.34 * build, 0.27 * build, 0.62, 14),
  ),
  pelvis: (build: number) => shared(
    `pelvis-${build}`,
    () => lowPolyBox(0.53 * build, 0.22, 0.3, 0.07),
  ),
};
