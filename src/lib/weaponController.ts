import * as THREE from 'three';
import {
  fireWeapon,
  setWeaponAiming,
  setWeaponReloading,
  type WeaponKind,
  WEAPON_CONFIG,
} from './gameWeapon';
import { type WeaponHudState, type WeaponSounds } from './gameActionTypes';
import { type CustomerInteractions } from './gameInteraction';

type WeaponControllerOptions = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  customers: CustomerInteractions;
  sounds: WeaponSounds;
  getWeapon: () => WeaponKind | null;
  showWeapon: (state: WeaponHudState) => void;
  onShot: () => void;
};

export function createWeaponController(options: WeaponControllerOptions) {
  const { scene, camera, customers, sounds } = options;
  const ammo: Record<WeaponKind, number> = {
    shotgun: WEAPON_CONFIG.shotgun.capacity,
    revolver: WEAPON_CONFIG.revolver.capacity,
    rifle: WEAPON_CONFIG.rifle.capacity,
    double_barrel: WEAPON_CONFIG.double_barrel.capacity,
  };
  let activeSlot: 1 | null = 1;
  let nearbyWeapon: WeaponKind | null = null;
  let reloading = false;
  let reloadTimer: number | undefined;
  let nextShotAt = 0;

  const state = (weapon: WeaponKind | null): WeaponHudState => ({
    weapon,
    activeSlot,
    ammo: weapon ? ammo[weapon] : 0,
    capacity: weapon ? WEAPON_CONFIG[weapon].capacity : 0,
    nearbyWeapon,
    reloading,
  });
  const showCurrent = () => options.showWeapon(state(options.getWeapon()));
  const showHeldWeapon = (visible: boolean) => {
    camera.children.forEach((child) => {
      if (child.userData.weaponKind) child.visible = visible;
    });
  };
  const stopReload = () => {
    reloading = false;
    setWeaponReloading(camera, false);
    if (reloadTimer !== undefined) window.clearTimeout(reloadTimer);
    reloadTimer = undefined;
  };

  const onWeaponChange = (weapon: WeaponKind | null) => {
    stopReload();
    setWeaponAiming(camera, false);
    showHeldWeapon(activeSlot === 1);
    options.showWeapon(state(weapon));
  };
  const onCabinetChange = (weapon: WeaponKind | null) => {
    nearbyWeapon = weapon;
    showCurrent();
  };
  const shoot = () => {
    if (activeSlot !== 1) return;
    const weapon = options.getWeapon();
    const now = performance.now();
    if (!weapon || now < nextShotAt) return;
    if (reloading) {
      if (ammo[weapon] === 0) return;
      stopReload();
    }
    if (ammo[weapon] === 0) {
      sounds.empty();
      return;
    }
    ammo[weapon] -= 1;
    nextShotAt = now + WEAPON_CONFIG[weapon].shotDelayMs;
    options.onShot();
    const hits = fireWeapon(scene, camera, weapon);
    hits.forEach((hit) => {
      for (let damage = 0; damage < WEAPON_CONFIG[weapon].damage; damage += 1) {
        customers.hitCustomer(hit.object, now);
      }
    });
    sounds.fire(weapon);
    showCurrent();
  };
  const loadShell = () => {
    reloadTimer = undefined;
    const weapon = options.getWeapon();
    if (!reloading || !weapon) return;
    ammo[weapon] = Math.min(ammo[weapon] + 1, WEAPON_CONFIG[weapon].capacity);
    if (ammo[weapon] === WEAPON_CONFIG[weapon].capacity) {
      reloading = false;
      setWeaponReloading(camera, false);
    } else {
      reloadTimer = window.setTimeout(loadShell, WEAPON_CONFIG[weapon].shellLoadMs);
    }
    showCurrent();
  };
  const reload = () => {
    const weapon = options.getWeapon();
    if (
      activeSlot !== 1
      || !weapon
      || ammo[weapon] === WEAPON_CONFIG[weapon].capacity
      || reloading
    ) return;
    setWeaponAiming(camera, false);
    reloading = true;
    setWeaponReloading(camera, true);
    showCurrent();
    reloadTimer = window.setTimeout(loadShell, WEAPON_CONFIG[weapon].shellLoadMs);
  };
  const aim = (aiming: boolean) => {
    if (activeSlot !== 1) return;
    setWeaponAiming(camera, aiming);
  };
  const selectSlot = (slot: 1) => {
    if (activeSlot === slot) {
      stopReload();
      setWeaponAiming(camera, false);
      activeSlot = null;
      showHeldWeapon(false);
      showCurrent();
      return;
    }
    stopReload();
    setWeaponAiming(camera, false);
    activeSlot = slot;
    showHeldWeapon(slot === 1);
    showCurrent();
  };
  const reset = () => {
    stopReload();
    setWeaponAiming(camera, false);
    ammo.shotgun = WEAPON_CONFIG.shotgun.capacity;
    ammo.revolver = WEAPON_CONFIG.revolver.capacity;
    ammo.rifle = WEAPON_CONFIG.rifle.capacity;
    ammo.double_barrel = WEAPON_CONFIG.double_barrel.capacity;
    nextShotAt = 0;
    activeSlot = 1;
  };

  return {
    onWeaponChange,
    onCabinetChange,
    shoot,
    reload,
    aim,
    selectSlot,
    reset,
    dispose: stopReload,
  };
}
