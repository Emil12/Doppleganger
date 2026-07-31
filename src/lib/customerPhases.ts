import { disposeCustomerModel } from './customerModel';
import {
  EXIT_ROUTE,
  moveCustomer,
  queuePosition,
  SHOPPING_ROUTE,
} from './customerRoute';
import { type Customer } from './customerTypes';

export function updateShoppingPhase(customer: Customer, time: number, delta: number) {
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
}

export function updateQueuePhase(
  customer: Customer,
  place: number,
  time: number,
  delta: number,
) {
  const target = queuePosition(place);
  const ready = moveCustomer(customer.model, target, time, delta);
  customer.model.idCard.visible = place === 0 && ready;
  if (customer.model.idCard.visible) customer.model.rightArm.rotation.x = -0.8;
}

export function updateLeavingPhase(customer: Customer, time: number, delta: number) {
  const target = EXIT_ROUTE[customer.routeIndex];
  if (!target) {
    customer.model.root.removeFromParent();
    disposeCustomerModel(customer.model);
    return false;
  }
  if (moveCustomer(customer.model, target, time, delta)) customer.routeIndex += 1;
  return true;
}
