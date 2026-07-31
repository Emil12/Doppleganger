import { type WeaponKind, WEAPON_CONFIG } from './weaponTypes';

export type StartingAmmo = Partial<Record<WeaponKind, number>>;

const WEAPON_KINDS = Object.keys(WEAPON_CONFIG) as WeaponKind[];

export function createWeaponAmmo() {
  const amounts = {} as Record<WeaponKind, number>;
  const capacities = {} as Record<WeaponKind, number>;

  const configure = (startingAmmo: StartingAmmo = {}) => {
    WEAPON_KINDS.forEach((kind) => {
      const configured = startingAmmo[kind] ?? WEAPON_CONFIG[kind].capacity;
      const capacity = Math.max(0, Math.floor(configured));
      capacities[kind] = capacity;
      amounts[kind] = capacity;
    });
  };

  const refill = () => {
    WEAPON_KINDS.forEach((kind) => { amounts[kind] = capacities[kind]; });
  };

  configure();

  return {
    configure,
    refill,
    get: (kind: WeaponKind) => amounts[kind],
    capacity: (kind: WeaponKind) => capacities[kind],
    isEmpty: (kind: WeaponKind) => amounts[kind] === 0,
    isFull: (kind: WeaponKind) => amounts[kind] === capacities[kind],
    spend: (kind: WeaponKind) => { amounts[kind] = Math.max(0, amounts[kind] - 1); },
    loadOne: (kind: WeaponKind) => {
      amounts[kind] = Math.min(amounts[kind] + 1, capacities[kind]);
    },
  };
}
