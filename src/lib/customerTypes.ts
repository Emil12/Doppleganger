import * as THREE from 'three';
import { type CustomerModel } from './customerModel';

export type CheckoutKind = 'buyer' | 'anomaly';
export type CustomerPhase = 'shopping' | 'queue' | 'leaving' | 'attacking';

export type Customer = {
  model: CustomerModel;
  phase: CustomerPhase;
  routeIndex: number;
  waitUntil: number;
  hitPoints: number;
  diedAt: number | null;
  splatter: THREE.Group | null;
  nextAttackAt: number;
  nextBloodDropAt: number;
  lastBloodShotAt: number | null;
  bloodTrail: THREE.Group[];
};
