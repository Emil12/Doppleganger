import * as THREE from 'three';
import { createAnomalyFeatures } from './anomalyModel';
import { createIdCard, createShoppingBag } from './customerAccessories';
import { createCustomerBody } from './customerBody';
import { customerStyle } from './customerStyle';
import { type AnomalyKind, randomAnomalyKind } from './anomalyTypes';

export { animateCustomer } from './customerAnimation';

export type AnomalyClue = 'height' | 'eyes' | 'twitch' | 'head' | 'arm' | 'id';

export type CustomerModel = {
  root: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  shoppingBag: THREE.Group;
  idCard: THREE.Group;
  isAnomaly: boolean;
  anomalyFeatures: THREE.Group;
  anomalyClue: AnomalyClue | null;
  anomalyKind: AnomalyKind | null;
};

const ANOMALY_CLUES: AnomalyClue[] = ['height', 'eyes', 'twitch', 'head', 'arm', 'id'];

export function createCustomerModel(index: number, isAnomaly = false): CustomerModel {
  const style = customerStyle(index);
  const anomalyClue = isAnomaly
    ? ANOMALY_CLUES[Math.floor(Math.random() * ANOMALY_CLUES.length)]
    : null;
  const anomalyKind = isAnomaly ? randomAnomalyKind() : null;
  const root = new THREE.Group();
  root.name = 'customer';
  const body = createCustomerBody(root, style, index, anomalyClue === 'eyes');
  const shoppingBag = createShoppingBag();
  const idCard = createIdCard(anomalyClue === 'id');
  const anomalyFeatures = anomalyKind ? createAnomalyFeatures(anomalyKind) : new THREE.Group();
  root.add(shoppingBag, idCard, anomalyFeatures);

  if (anomalyClue === 'height') root.scale.set(1.01, 1.08, 1.01);
  if (anomalyClue === 'head') body.head.scale.set(0.94, 1.12, 0.98);
  if (anomalyClue === 'arm') body.leftArm.scale.y = 1.12;

  return {
    root,
    ...body,
    shoppingBag,
    idCard,
    isAnomaly,
    anomalyFeatures,
    anomalyClue,
    anomalyKind,
  };
}

export function disposeCustomerModel(model: CustomerModel) {
  model.root.traverse((object) => {
    if (object instanceof THREE.Mesh) object.geometry.dispose();
  });
}
