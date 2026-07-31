import * as THREE from 'three';
import { ANOMALY_PROFILES } from './anomalyTypes';
import { createCustomerModel } from './customerModel';
import { SHOPPING_ROUTE } from './customerRoute';
import { type Customer } from './customerTypes';

export function createCustomerSpawner(
  scene: THREE.Scene,
  customers: Customer[],
  getDifficultyMultiplier: () => number,
) {
  let customerNumber = 0;

  return (isAnomaly = false) => {
    const model = createCustomerModel(customerNumber, isAnomaly);
    customerNumber += 1;
    model.root.position.set(SHOPPING_ROUTE[0].x, 0, SHOPPING_ROUTE[0].z);
    scene.add(model.root);
    const customer: Customer = {
      model,
      phase: 'shopping',
      routeIndex: 1,
      waitUntil: 0,
      hitPoints: model.anomalyKind
        ? ANOMALY_PROFILES[model.anomalyKind].hitPoints * getDifficultyMultiplier()
        : 1,
      diedAt: null,
      splatter: null,
      nextAttackAt: 0,
      nextVocalAt: 0,
      nextBloodDropAt: 0,
      lastBloodShotAt: null,
      lastJudgementShotAt: null,
      damagedPlayer: false,
      immortal: false,
      bloodTrail: [],
    };
    customers.push(customer);
    return customer;
  };
}
