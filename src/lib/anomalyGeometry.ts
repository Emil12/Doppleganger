import * as THREE from 'three';
import { sharedCustomerGeometry } from './customerGeometry';

const shared = <T extends THREE.BufferGeometry>(key: string, create: () => T) => (
  sharedCustomerGeometry(`anomaly-${key}`, create)
);

const teeth = [0, 1, 2].map((size) => shared(
  `tooth-${size}`,
  () => new THREE.ConeGeometry(0.028 + size * 0.008, 0.13, 7),
));

const ribs = [0, 1, 2, 3].map((index) => shared(
  `rib-${index}`,
  () => new THREE.TorusGeometry(0.22 - index * 0.018, 0.018, 7, 14, Math.PI),
));

const spines = [0, 1, 2, 3, 4, 5].map((index) => shared(
  `spine-${index}`,
  () => new THREE.ConeGeometry(0.055, 0.28 + index * 0.025, 7),
));

const claws = [0, 1, 2].map((index) => shared(
  `claw-${index}`,
  () => new THREE.ConeGeometry(0.025, 0.25 + index * 0.035, 6),
));

const wounds = [0.12, 0.09, 0.07, 0.08].map((width) => shared(
  `wound-${width}`,
  () => new THREE.BoxGeometry(width, 0.48, 0.03),
));

const tendrils = [0, 1, 2].map((index) => shared(`tendril-${index}`, () => {
  const side = index === 1 ? 0.2 : index - 1;
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(side * 0.2, 1.48, 0.16),
    new THREE.Vector3(side * 0.68, 1.25 + index * 0.18, 0.38),
    new THREE.Vector3(side * 1.05, 0.65 + index * 0.55, 0.08),
  ]);
  return new THREE.TubeGeometry(curve, 12, 0.045, 7, false);
}));

export const anomalyGeometry = {
  mouth: shared('mouth', () => new THREE.SphereGeometry(0.22, 14, 10)),
  eyes: [
    shared('eye-large', () => new THREE.SphereGeometry(0.075, 12, 8)),
    shared('eye-small', () => new THREE.SphereGeometry(0.052, 12, 8)),
  ],
  teeth,
  ribs,
  spines,
  claws,
  wounds,
  horn: shared('horn', () => new THREE.ConeGeometry(0.075, 0.5, 8)),
  tendrils,
  torsoMaw: shared('torso-maw', () => new THREE.SphereGeometry(0.17, 12, 8)),
};
