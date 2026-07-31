import { type StartingAmmo } from './weaponAmmo';

export const NIGHTMARE_END_SHIFT = 35;
export const NIGHTMARE_REWARD = 75;
export const NIGHTMARE_REFUSAL_LIMIT = 15;

export const NIGHTMARE_AMMO: StartingAmmo = {
  shotgun: 50,
  double_barrel: 50,
  revolver: 70,
  rifle: 120,
  m16: 120,
  glock: 70,
  flamethrower: 120,
};

export function nightmareCustomerIsAnomaly(customerNumber: number) {
  return customerNumber % 5 !== 4;
}

export function nightmareMedkitHealth(current: number, maximum: number) {
  return Math.min(maximum, current + 50);
}
