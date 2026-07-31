import { type DoorHudState } from './gameInteraction';
import { type WeaponKind, type WeaponSlot } from './weaponTypes';

export type WeaponHudState = {
  weapon: WeaponKind | null;
  activeSlot: WeaponSlot | null;
  ammo: number;
  capacity: number;
  nearbyWeapon: WeaponKind | null;
  reloading: boolean;
};

export const INITIAL_WEAPON_STATE: WeaponHudState = {
  weapon: null,
  activeSlot: 1,
  ammo: 0,
  capacity: 0,
  nearbyWeapon: null,
  reloading: false,
};

export const INITIAL_DOOR_STATE: DoorHudState = {
  near: false,
  open: true,
  label: 'STAFF DOOR',
};

export type WeaponSounds = {
  fire: (weapon: WeaponKind) => void;
  empty: () => void;
};
