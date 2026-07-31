import { animateCustomer, CustomerModel } from './customerModel';

export type RouteStop = {
  x: number;
  z: number;
  wait?: number;
  collectProducts?: boolean;
};

export const SHOPPING_ROUTE: RouteStop[] = [
  { x: 0.7, z: -7 },
  { x: 0.7, z: -11.2 },
  { x: -0.8, z: -14.8, wait: 7_000, collectProducts: true },
  { x: 3.6, z: -14.8 },
];

export const EXIT_ROUTE: RouteStop[] = [
  { x: 3.2, z: -11.2 },
  { x: 0.7, z: -9 },
  { x: 0.7, z: -6.5 },
];

const WALK_SPEED = 1.15;
const QUEUE_FRONT = { x: 4.75, z: -13.9 };

export function queuePosition(index: number) {
  return { x: QUEUE_FRONT.x - index * 0.9, z: QUEUE_FRONT.z };
}

export function moveCustomer(
  model: CustomerModel,
  target: { x: number; z: number },
  time: number,
  delta: number,
) {
  const position = model.root.position;
  const xDistance = target.x - position.x;
  const zDistance = target.z - position.z;
  const distance = Math.hypot(xDistance, zDistance);
  if (distance < 0.04) {
    position.set(target.x, 0, target.z);
    if (model.root.visible) animateCustomer(model, time, false);
    return true;
  }
  const movement = Math.min(WALK_SPEED * delta, distance);
  position.x += (xDistance / distance) * movement;
  position.z += (zDistance / distance) * movement;
  model.root.rotation.y = Math.atan2(-xDistance, -zDistance);
  if (model.root.visible) animateCustomer(model, time, true);
  return false;
}
