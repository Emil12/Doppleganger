import { type WeaponKind } from './weaponTypes';
import { type StartingAmmo } from './weaponAmmo';

export type PlayerClassKind =
  | 'attendant'
  | 'guard'
  | 'rifleman'
  | 'medic'
  | 'retired_hunter'
  | 'soldier'
  | 'striker'
  | 'policeman'
  | 'flamer';

export type PlayerClassConfig = {
  name: string;
  description: string;
  icon: string;
  cost: number;
  weapons: readonly [WeaponKind, WeaponKind?];
  startingAmmo?: StartingAmmo;
  startingMedkits: number;
  maxHealth: number;
  sprintSpeed: number;
};

export const PLAYER_CLASS_KINDS: PlayerClassKind[] = [
  'attendant',
  'guard',
  'rifleman',
  'medic',
  'retired_hunter',
  'soldier',
  'striker',
  'policeman',
  'flamer',
];

export const PLAYER_CLASSES: Record<PlayerClassKind, PlayerClassConfig> = {
  attendant: {
    name: 'NIGHT ATTENDANT',
    description: 'Standard pump-action shotgun with eight shells.',
    icon: 'A',
    cost: 0,
    weapons: ['shotgun'],
    startingMedkits: 0,
    maxHealth: 100,
    sprintSpeed: 1.75,
  },
  guard: {
    name: 'GUARD',
    description: 'Starts every run with a six-round revolver.',
    icon: 'G',
    cost: 10,
    weapons: ['revolver'],
    startingMedkits: 0,
    maxHealth: 100,
    sprintSpeed: 1.75,
  },
  rifleman: {
    name: 'RIFLEMAN',
    description: 'Starts with a powerful five-round bolt-action rifle.',
    icon: 'R',
    cost: 25,
    weapons: ['rifle'],
    startingMedkits: 0,
    maxHealth: 100,
    sprintSpeed: 1.75,
  },
  medic: {
    name: 'MEDIC',
    description: 'Starts with a revolver and three free medkits.',
    icon: '+',
    cost: 35,
    weapons: ['revolver'],
    startingMedkits: 3,
    maxHealth: 100,
    sprintSpeed: 1.75,
  },
  retired_hunter: {
    name: 'RETIRED HUNTER',
    description: 'Starts with a brutal double-barrel shotgun.',
    icon: 'H',
    cost: 45,
    weapons: ['double_barrel'],
    startingMedkits: 0,
    maxHealth: 100,
    sprintSpeed: 1.75,
  },
  soldier: {
    name: 'SOLDIER',
    description: 'M16 rifle in slot 1 and Glock 17 in slot 2.',
    icon: 'S',
    cost: 150,
    weapons: ['m16', 'glock'],
    startingMedkits: 0,
    maxHealth: 100,
    sprintSpeed: 1.75,
  },
  striker: {
    name: 'STRIKER',
    description: 'Starts with a fully automatic AK-47 and a 30-round magazine.',
    icon: 'K',
    cost: 135,
    weapons: ['ak47'],
    startingMedkits: 0,
    maxHealth: 100,
    sprintSpeed: 1.75,
  },
  policeman: {
    name: 'POLICEMAN',
    description: 'Starts every run with a Glock and a 20-round magazine.',
    icon: 'P',
    cost: 35,
    weapons: ['glock'],
    startingAmmo: { glock: 20 },
    startingMedkits: 0,
    maxHealth: 100,
    sprintSpeed: 1.75,
  },
  flamer: {
    name: 'FLAMER',
    description: 'Flamethrower, shotgun, five medkits, and double health.',
    icon: 'F',
    cost: 250,
    weapons: ['flamethrower', 'shotgun'],
    startingMedkits: 5,
    maxHealth: 200,
    sprintSpeed: 3,
  },
};

export function isPlayerClassKind(value: unknown): value is PlayerClassKind {
  return typeof value === 'string' && PLAYER_CLASS_KINDS.includes(value as PlayerClassKind);
}
