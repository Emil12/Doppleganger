export type WeaponKind = 'shotgun' | 'revolver' | 'rifle' | 'double_barrel';

export const WEAPON_CONFIG: Record<
  WeaponKind,
  {
    label: string;
    capacity: number;
    shellLoadMs: number;
    shotDelayMs: number;
    projectiles: number;
    spread: number;
    damage: number;
  }
> = {
  shotgun: {
    label: 'PUMP-ACTION SHOTGUN',
    capacity: 8,
    shellLoadMs: 680,
    shotDelayMs: 720,
    projectiles: 9,
    spread: 0.036,
    damage: 1,
  },
  revolver: {
    label: 'SERVICE REVOLVER',
    capacity: 6,
    shellLoadMs: 460,
    shotDelayMs: 390,
    projectiles: 1,
    spread: 0.004,
    damage: 1,
  },
  rifle: {
    label: 'BOLT-ACTION RIFLE',
    capacity: 5,
    shellLoadMs: 820,
    shotDelayMs: 1_050,
    projectiles: 1,
    spread: 0.0015,
    damage: 3,
  },
  double_barrel: {
    label: 'DOUBLE-BARREL SHOTGUN',
    capacity: 2,
    shellLoadMs: 900,
    shotDelayMs: 560,
    projectiles: 12,
    spread: 0.048,
    damage: 1,
  },
};
