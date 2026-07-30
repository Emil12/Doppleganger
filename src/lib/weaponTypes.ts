export type WeaponKind = 'revolver' | 'shotgun';

export const WEAPON_CONFIG: Record<
  WeaponKind,
  { label: string; capacity: number; reloadMs: number }
> = {
  revolver: {
    label: 'SIX-SHOT REVOLVER',
    capacity: 6,
    reloadMs: 2_000,
  },
  shotgun: {
    label: 'DOUBLE-BARREL',
    capacity: 2,
    reloadMs: 1_800,
  },
};
