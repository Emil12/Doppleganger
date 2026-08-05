import * as THREE from 'three';
import { moveCustomer } from './customerRoute';
import { type Customer } from './customerTypes';

const target = new THREE.Vector3();

export function prepareOutlawAttack(customer: Customer, time: number) {
  customer.nextAttackAt = time + 700;
  customer.model.idCard.visible = false;
  customer.model.shoppingBag.visible = false;
}

export function updateOutlawAttack(
  customer: Customer,
  camera: THREE.Camera,
  time: number,
  delta: number,
  onPlayerHit: () => void,
) {
  target.copy(camera.position);
  const distance = Math.hypot(
    customer.model.root.position.x - target.x,
    customer.model.root.position.z - target.z,
  );
  if (distance > 1.35) {
    moveCustomer(customer.model, target, time, delta * 1.28);
    return;
  }
  customer.model.rightArm.rotation.x = -1.4 + Math.sin(time * 0.018) * 0.8;
  if (time < customer.nextAttackAt) return;
  customer.nextAttackAt = time + 1_150;
  customer.damagedPlayer = true;
  onPlayerHit();
}
