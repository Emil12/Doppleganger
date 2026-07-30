import * as THREE from 'three';
import { type CheckoutKind } from './customerSystem';
import {
  fireRevolver,
  fireShotgun,
  setWeaponReloading,
  type WeaponKind,
  WEAPON_CONFIG,
} from './gameWeapon';
import {
  createGameInteraction,
  type CustomerInteractions,
  type DoorHudState,
} from './gameInteraction';

export type WeaponHudState = {
  weapon: WeaponKind | null;
  ammo: number;
  capacity: number;
  nearbyWeapon: WeaponKind | null;
  reloading: boolean;
};

export const INITIAL_WEAPON_STATE: WeaponHudState = {
  weapon: null,
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

type WeaponSounds = {
  fire: (weapon: WeaponKind) => void;
  empty: () => void;
};

export function createGameActions(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  showWeapon: (state: WeaponHudState) => void,
  showDoor: (state: DoorHudState) => void,
  sounds: WeaponSounds,
  customers: CustomerInteractions,
  healPlayer: () => boolean,
  showCleanup: (near: boolean) => void,
  showMedkit: (near: boolean) => void,
  showCheckout: (kind: CheckoutKind | null) => void,
  onShot: () => void,
  onPurchase: () => void,
) {
  const ammo: Record<WeaponKind, number> = { revolver: 6, shotgun: 2 };
  let reloading = false;
  let nearbyWeapon: WeaponKind | null = null;
  let reloadTimer: number | undefined;
  let nextShotAt = 0;

  const weaponState = (weapon: WeaponKind | null): WeaponHudState => ({
    weapon,
    ammo: weapon ? ammo[weapon] : 0,
    capacity: weapon ? WEAPON_CONFIG[weapon].capacity : 0,
    nearbyWeapon,
    reloading,
  });

  const interaction = createGameInteraction({
    scene,
    camera,
    customers,
    showDoor,
    showCleanup,
    showMedkit,
    showCheckout,
    healPlayer,
    onWeaponChange: (weapon) => {
      stopReload();
      showWeapon(weaponState(weapon));
    },
    onCabinetChange: (weapon) => {
      nearbyWeapon = weapon;
      showWeapon(weaponState(interaction.weaponKind()));
    },
    onPurchase,
  });

  const showCurrentWeapon = () => showWeapon(weaponState(interaction.weaponKind()));

  const stopReload = () => {
    reloading = false;
    setWeaponReloading(camera, false);
    if (reloadTimer !== undefined) window.clearTimeout(reloadTimer);
    reloadTimer = undefined;
  };

  const shoot = () => {
    const weapon = interaction.weaponKind();
    const now = performance.now();
    if (!weapon || reloading || now < nextShotAt) return;
    if (ammo[weapon] === 0) {
      sounds.empty();
      return;
    }
    ammo[weapon] -= 1;
    nextShotAt = now + (weapon === 'shotgun' ? 420 : 240);
    onShot();
    const hits = weapon === 'shotgun'
      ? fireShotgun(scene, camera)
      : fireRevolver(scene, camera);
    hits.forEach((hit) => customers.hitCustomer(hit.object, now));
    sounds.fire(weapon);
    showCurrentWeapon();
  };

  const reload = () => {
    const weapon = interaction.weaponKind();
    if (!weapon || ammo[weapon] === WEAPON_CONFIG[weapon].capacity || reloading) return;
    reloading = true;
    setWeaponReloading(camera, true);
    showCurrentWeapon();
    reloadTimer = window.setTimeout(() => {
      ammo[weapon] = WEAPON_CONFIG[weapon].capacity;
      reloading = false;
      reloadTimer = undefined;
      setWeaponReloading(camera, false);
      showCurrentWeapon();
    }, WEAPON_CONFIG[weapon].reloadMs);
  };

  return {
    interact: interaction.interact,
    refuse: interaction.refuse,
    shoot,
    reload,
    updateProximity: interaction.update,
    dispose: stopReload,
  };
}
