export {
  REVOLVER_CABINET_NAME,
  REVOLVER_PICKUP_NAME,
  SHOTGUN_CABINET_NAME,
  SHOTGUN_PICKUP_NAME,
  nearestWeaponCabinet,
  pickupWeapon,
  putBackWeapon,
} from './weaponPickup';
export {
  fireRevolver,
  fireShotgun,
  setWeaponReloading,
  updateWeaponEffects,
} from './weaponFire';
export { type WeaponKind, WEAPON_CONFIG } from './weaponTypes';
