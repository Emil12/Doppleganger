import * as THREE from 'three';
import {
  createCustomerSplatter,
  createShotBloodPuddles,
  MAX_BLOOD_MARKS_PER_CUSTOMER,
} from './customerMess';
import { type CheckoutKind, type Customer } from './customerTypes';
import { prepareAnomalyChase } from './anomalyChase';
import { makeAnomalyHostile } from './anomalyModel';
import { disposeCustomerModel } from './customerModel';

function horizontalDistance(first: THREE.Vector3, second: THREE.Vector3) {
  return Math.hypot(first.x - second.x, first.z - second.z);
}

export function createCustomerInteractions(
  scene: THREE.Scene,
  customers: Customer[],
  onAnomalyKilled: (flawless: boolean) => void,
  onInnocentShot: () => void,
  isBloodEnabled: () => boolean,
) {
  const frontCustomer = () => customers.find(
    ({ phase, diedAt }) => phase === 'queue' && diedAt === null,
  );

  const hitCustomer = (object: THREE.Object3D, time: number) => {
    const customer = customers.find(({ model, diedAt }) => (
      diedAt === null &&
      (model.root === object || model.root.getObjectById(object.id) !== undefined)
    ));
    if (!customer) return false;
    if (customer.immortal) return true;
    if (
      !customer.model.isAnomaly
      && customer.lastJudgementShotAt !== time
    ) {
      customer.lastJudgementShotAt = time;
      onInnocentShot();
    }
    customer.hitPoints = Math.max(0, customer.hitPoints - 1);
    if (isBloodEnabled() && customer.lastBloodShotAt !== time) {
      customer.lastBloodShotAt = time;
      customer.bloodTrail.push(...createShotBloodPuddles(scene, customer.model.root.position));
      while (customer.bloodTrail.length > MAX_BLOOD_MARKS_PER_CUSTOMER) {
        customer.bloodTrail.shift()?.removeFromParent();
      }
    }
    if (customer.hitPoints > 0) return true;
    customer.diedAt = time;
    if (customer.model.isAnomaly) onAnomalyKilled(!customer.damagedPlayer);
    customer.model.idCard.visible = false;
    customer.splatter = isBloodEnabled()
      ? createCustomerSplatter(
          scene,
          customer.model.root.position,
          customer.model.isAnomaly ? 1.65 : 1,
        )
      : null;
    return true;
  };

  const checkoutDistance = (camera: THREE.Camera) => {
    const customer = frontCustomer();
    if (!customer?.model.idCard.visible) return Number.POSITIVE_INFINITY;
    return horizontalDistance(customer.model.root.position, camera.position);
  };

  const checkoutKind = (camera: THREE.Camera): CheckoutKind | null => {
    const customer = frontCustomer();
    if (!customer?.model.idCard.visible || checkoutDistance(camera) >= 2.5) return null;
    return customer.model.anomalyClue === 'id' ? 'anomaly' : 'buyer';
  };

  const serveNext = (camera: THREE.Camera) => {
    const customer = frontCustomer();
    if (!customer?.model.idCard.visible || checkoutDistance(camera) >= 2.5) return null;
    customer.phase = customer.model.isAnomaly ? 'attacking' : 'leaving';
    customer.routeIndex = 0;
    customer.model.idCard.visible = false;
    if (customer.model.isAnomaly) {
      makeAnomalyHostile(customer.model);
      prepareAnomalyChase(customer, performance.now());
    }
    return customer.model.isAnomaly ? 'anomaly' : 'buyer';
  };

  const refuseNext = (camera: THREE.Camera) => {
    const customer = frontCustomer();
    if (!customer?.model.idCard.visible) return false;
    if (checkoutDistance(camera) >= 2.5) return false;
    customer.phase = 'leaving';
    customer.routeIndex = 0;
    customer.model.idCard.visible = false;
    return true;
  };

  const messDistance = (camera: THREE.Camera) => customers.reduce((nearest, customer) => {
    const bodyDistance = customer.diedAt === null
      ? Number.POSITIVE_INFINITY
      : horizontalDistance(customer.model.root.position, camera.position);
    const trailDistance = customer.bloodTrail.reduce(
      (closest, drop) => Math.min(closest, horizontalDistance(drop.position, camera.position)),
      Number.POSITIVE_INFINITY,
    );
    return Math.min(nearest, bodyDistance, trailDistance);
  }, Number.POSITIVE_INFINITY);

  const cleanNearest = (camera: THREE.Camera) => {
    let dead: { customer: Customer; index: number; distance: number } | null = null;
    let trail: { customer: Customer; drop: THREE.Group; distance: number } | null = null;
    for (let index = 0; index < customers.length; index += 1) {
      const customer = customers[index];
      if (customer.diedAt !== null) {
        const distance = horizontalDistance(customer.model.root.position, camera.position);
        if (!dead || distance < dead.distance) dead = { customer, index, distance };
      }
      for (const drop of customer.bloodTrail) {
        const distance = horizontalDistance(drop.position, camera.position);
        if (!trail || distance < trail.distance) trail = { customer, drop, distance };
      }
    }
    if (trail && trail.distance < 2 && (!dead || trail.distance < dead.distance)) {
      trail.drop.removeFromParent();
      trail.customer.bloodTrail.splice(trail.customer.bloodTrail.indexOf(trail.drop), 1);
      return true;
    }
    if (!dead || dead.distance >= 2) return false;
    const [customer] = customers.splice(dead.index, 1);
    customer.model.root.removeFromParent();
    disposeCustomerModel(customer.model);
    customer.splatter?.removeFromParent();
    customer.bloodTrail.forEach((drop) => drop.removeFromParent());
    return true;
  };

  return {
    hitCustomer,
    messDistance,
    cleanNearest,
    checkoutDistance,
    checkoutKind,
    serveNext,
    refuseNext,
  };
}
