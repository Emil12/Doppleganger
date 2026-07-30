import * as THREE from 'three';
import { createAnomalyFeatures } from './anomalyModel';
import { createIdCard, createShoppingBag } from './customerAccessories';
import { createCustomerBody } from './customerBody';
import { customerStyle } from './customerStyle';

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
};

const ANOMALY_CLUES: AnomalyClue[] = ['height', 'eyes', 'twitch', 'head', 'arm', 'id'];

export function createCustomerModel(index: number, isAnomaly = false): CustomerModel {
  const style = customerStyle(index);
  const anomalyClue = isAnomaly
    ? ANOMALY_CLUES[Math.floor(Math.random() * ANOMALY_CLUES.length)]
    : null;
  const root = new THREE.Group();
  root.name = 'customer';
  const body = createCustomerBody(root, style, index, anomalyClue === 'eyes');
  const shoppingBag = createShoppingBag();
  const idCard = createIdCard(anomalyClue === 'id');
  const anomalyFeatures = isAnomaly ? createAnomalyFeatures() : new THREE.Group();
  root.add(shoppingBag, idCard, anomalyFeatures);

  if (anomalyClue === 'height') root.scale.set(1.04, 1.42, 1.04);
  if (anomalyClue === 'head') body.head.scale.set(0.68, 1.58, 0.82);
  if (anomalyClue === 'arm') body.leftArm.scale.y = 1.68;

  return {
    root,
    ...body,
    shoppingBag,
    idCard,
    isAnomaly,
    anomalyFeatures,
    anomalyClue,
  };
}

export function disposeCustomerModel(model: CustomerModel) {
  model.root.traverse((object) => {
    if (object instanceof THREE.Mesh) object.geometry.dispose();
  });
}
