import { type WeaponKind } from './weaponTypes';

export type PlayerClassKind =
  | 'attendant'
  | 'guard'
  | 'rifleman'
  | 'medic'
  | 'retired_hunter';

export type PlayerClassConfig = {
  name: string;
  description: string;
  icon: string;
  cost: number;
  weapon: WeaponKind;
  startingMedkits: number;
};

export const PLAYER_CLASS_KINDS: PlayerClassKind[] = [
  'attendant',
  'guard',
  'rifleman',
  'medic',
  'retired_hunter',
];

export const PLAYER_CLASSES: Record<PlayerClassKind, PlayerClassConfig> = {
  attendant: {
    name: 'NIGHT ATTENDANT',
    description: 'Standard pump-action shotgun with eight shells.',
    icon: 'A',
    cost: 0,
    weapon: 'shotgun',
    startingMedkits: 0,
  },
  guard: {
    name: 'GUARD',
    description: 'Starts every run with a six-round revolver.',
    icon: 'G',
    cost: 10,
    weapon: 'revolver',
    startingMedkits: 0,
  },
  rifleman: {
    name: 'RIFLEMAN',
    description: 'Starts with a powerful five-round bolt-action rifle.',
    icon: 'R',
    cost: 25,
    weapon: 'rifle',
    startingMedkits: 0,
  },
  medic: {
    name: 'MEDIC',
    description: 'Starts with a revolver and three free medkits.',
    icon: '+',
    cost: 35,
    weapon: 'revolver',
    startingMedkits: 3,
  },
  retired_hunter: {
    name: 'RETIRED HUNTER',
    description: 'Starts with a brutal double-barrel shotgun.',
    icon: 'H',
    cost: 45,
    weapon: 'double_barrel',
    startingMedkits: 0,
  },
};

export function isPlayerClassKind(value: unknown): value is PlayerClassKind {
  return typeof value === 'string' && PLAYER_CLASS_KINDS.includes(value as PlayerClassKind);
}
