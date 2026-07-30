import * as THREE from 'three';
import { createCustomerModel, disposeCustomerModel } from './customerModel';
import { animateCustomerDeath, createBloodDrop } from './customerMess';
import { createCustomerInteractions } from './customerInteractions';
import { createAnomalySelector, randomCustomerDelay } from './customerRandomness';
import {
  EXIT_ROUTE,
  moveCustomer,
  queuePosition,
  SHOPPING_ROUTE,
} from './customerRoute';
import { type Customer } from './customerTypes';

export { type CheckoutKind } from './customerTypes';

const ANOMALY_RUN_SPEED = 7.7;
const ANOMALY_HIT_POINTS = 5;

function horizontalDistance(first: THREE.Vector3, second: THREE.Vector3) {
  return Math.hypot(first.x - second.x, first.z - second.z);
}

export function createCustomerSystem(
  scene: THREE.Scene,
  onPlayerHit: () => void,
  onAnomalyKilled: () => void,
) {
  const customers: Customer[] = [];
  const interactions = createCustomerInteractions(scene, customers, onAnomalyKilled);
  const selectAnomaly = createAnomalySelector();
  let started = false;
  let nextCustomerAt = Number.POSITIVE_INFINITY;
  let customerNumber = 0;

  const clearCustomers = () => {
    customers.forEach(({ model, splatter, bloodTrail }) => {
      model.root.removeFromParent();
      disposeCustomerModel(model);
      splatter?.removeFromParent();
      bloodTrail.forEach((drop) => drop.removeFromParent());
    });
    customers.length = 0;
  };

  const spawnCustomer = (isAnomaly = false) => {
    const model = createCustomerModel(customerNumber, isAnomaly);
    customerNumber += 1;
    model.root.position.set(SHOPPING_ROUTE[0].x, 0, SHOPPING_ROUTE[0].z);
    scene.add(model.root);
    customers.push({
      model,
      phase: 'shopping',
      routeIndex: 1,
      waitUntil: 0,
      hitPoints: isAnomaly ? ANOMALY_HIT_POINTS : 1,
      diedAt: null,
      splatter: null,
      nextAttackAt: 0,
      nextBloodDropAt: 0,
      lastBloodShotAt: null,
      bloodTrail: [],
    });
  };

  const start = (time: number) => {
    if (started) clearCustomers();
    started = true;
    spawnCustomer();
    nextCustomerAt = time + randomCustomerDelay();
  };

  const updateShopping = (customer: Customer, time: number, delta: number) => {
    if (time < customer.waitUntil) return;
    const target = SHOPPING_ROUTE[customer.routeIndex];
    if (!target) {
      customer.phase = 'queue';
      return;
    }
    if (!moveCustomer(customer.model, target, time, delta)) return;
    customer.routeIndex += 1;
    customer.waitUntil = time + (target.wait ?? 0);
    if (target.collectProducts) customer.model.shoppingBag.visible = true;
  };

  const updateQueue = (customer: Customer, place: number, time: number, delta: number) => {
    const target = queuePosition(place);
    const ready = moveCustomer(customer.model, target, time, delta);
    customer.model.idCard.visible = place === 0 && ready;
    if (customer.model.idCard.visible) customer.model.rightArm.rotation.x = -0.8;
  };

  const updateLeaving = (customer: Customer, time: number, delta: number) => {
    const target = EXIT_ROUTE[customer.routeIndex];
    if (!target) {
      customer.model.root.removeFromParent();
      disposeCustomerModel(customer.model);
      return false;
    }
    if (moveCustomer(customer.model, target, time, delta)) customer.routeIndex += 1;
    return true;
  };

  const updateAttack = (
    customer: Customer,
    camera: THREE.PerspectiveCamera,
    time: number,
    delta: number,
  ) => {
    const target = { x: camera.position.x, z: camera.position.z };
    const distance = horizontalDistance(customer.model.root.position, camera.position);
    if (distance > 0.9) {
      moveCustomer(customer.model, target, time, delta * (ANOMALY_RUN_SPEED / 1.15));
    }
    if (distance < 1.25 && time >= customer.nextAttackAt) {
      customer.nextAttackAt = time + 1_100;
      onPlayerHit();
    }
    if (time >= customer.nextBloodDropAt) {
      customer.nextBloodDropAt = time + 160;
      customer.bloodTrail.push(createBloodDrop(scene, customer.model.root.position));
      if (customer.bloodTrail.length > 32) customer.bloodTrail.shift()?.removeFromParent();
    }
  };

  const update = (time: number, delta: number, camera: THREE.PerspectiveCamera) => {
    if (!started) return;
    if (time >= nextCustomerAt) {
      spawnCustomer(selectAnomaly());
      nextCustomerAt = time + randomCustomerDelay();
    }
    const queue = customers.filter(({ phase, diedAt }) => phase === 'queue' && diedAt === null);
    queue.forEach((customer, place) => updateQueue(customer, place, time, delta));
    for (let index = customers.length - 1; index >= 0; index -= 1) {
      const customer = customers[index];
      if (customer.diedAt !== null) {
        animateCustomerDeath(customer.model, time - customer.diedAt);
      } else if (customer.phase === 'shopping') {
        updateShopping(customer, time, delta);
      } else if (customer.phase === 'leaving' && !updateLeaving(customer, time, delta)) {
        customers.splice(index, 1);
      } else if (customer.phase === 'attacking') {
        updateAttack(customer, camera, time, delta);
      }
    }
  };

  const dispose = () => {
    clearCustomers();
    started = false;
    nextCustomerAt = Number.POSITIVE_INFINITY;
  };

  return { start, update, ...interactions, dispose };
}
