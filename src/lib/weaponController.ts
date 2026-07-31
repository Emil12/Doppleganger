import * as THREE from 'three';
import {
  disposeWeaponEffectAssets,
  fireWeapon,
  setWeaponAiming,
  setWeaponReloading,
  type WeaponKind,
  type WeaponSlot,
  WEAPON_CONFIG,
} from './gameWeapon';
import { type WeaponHudState, type WeaponSounds } from './gameActionTypes';
import { type CustomerInteractions } from './gameInteraction';
import { createWeaponAmmo, type StartingAmmo } from './weaponAmmo';

type WeaponControllerOptions = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  customers: CustomerInteractions;
  sounds: WeaponSounds;
  getWeapon: () => WeaponKind | null;
  showWeapon: (state: WeaponHudState) => void;
  onShot: () => void;
  onWorldShot: (objects: readonly THREE.Object3D[]) => void;
  selectWeaponSlot: (slot: WeaponSlot | null) => void;
};

export function createWeaponController(options: WeaponControllerOptions) {
  const { scene, camera, customers, sounds } = options;
  const ammo = createWeaponAmmo();
  let activeSlot: WeaponSlot | null = 1;
  let nearbyWeapon: WeaponKind | null = null;
  let reloading = false;
  let reloadTimer: number | undefined;
  let fireTimer: number | undefined;
  let nextShotAt = 0;

  const state = (weapon: WeaponKind | null): WeaponHudState => ({
    weapon,
    activeSlot,
    ammo: weapon ? ammo.get(weapon) : 0,
    capacity: weapon ? ammo.capacity(weapon) : 0,
    nearbyWeapon,
    reloading,
  });
  const showCurrent = () => options.showWeapon(state(options.getWeapon()));
  const showHeldWeapon = () => {
    camera.children.forEach((child) => {
      if (child.userData.weaponKind) child.visible = child.userData.weaponSlot === activeSlot;
    });
  };
  const stopReload = () => {
    reloading = false;
    setWeaponReloading(camera, false);
    if (reloadTimer !== undefined) window.clearTimeout(reloadTimer);
    reloadTimer = undefined;
  };
  const stopFiring = () => {
    if (fireTimer !== undefined) window.clearInterval(fireTimer);
    fireTimer = undefined;
  };

  const onWeaponChange = (weapon: WeaponKind | null) => {
    stopFiring();
    stopReload();
    setWeaponAiming(camera, false);
    showHeldWeapon();
    options.showWeapon(state(weapon));
  };
  const onCabinetChange = (weapon: WeaponKind | null) => {
    nearbyWeapon = weapon;
    showCurrent();
  };
  const shootOnce = (playSound: boolean) => {
    if (activeSlot === null) return;
    const weapon = options.getWeapon();
    const now = performance.now();
    if (!weapon || now < nextShotAt) return;
    if (reloading) {
      if (ammo.isEmpty(weapon)) return;
      stopReload();
    }
    if (ammo.isEmpty(weapon)) {
      if (playSound) sounds.empty();
      stopFiring();
      return;
    }
    ammo.spend(weapon);
    nextShotAt = now + WEAPON_CONFIG[weapon].shotDelayMs;
    options.onShot();
    const hits = fireWeapon(scene, camera, weapon);
    options.onWorldShot(hits.map((hit) => hit.object));
    hits.forEach((hit) => {
      for (let damage = 0; damage < WEAPON_CONFIG[weapon].damage; damage += 1) {
        customers.hitCustomer(hit.object, now);
      }
    });
    if (playSound) sounds.fire(weapon);
    showCurrent();
  };
  const shoot = (pressed: boolean) => {
    if (!pressed) {
      stopFiring();
      return;
    }
    const weapon = options.getWeapon();
    shootOnce(true);
    if (weapon !== 'flamethrower' || fireTimer !== undefined) return;
    fireTimer = window.setInterval(
      () => shootOnce(false),
      WEAPON_CONFIG.flamethrower.shotDelayMs,
    );
  };
  const loadShell = () => {
    reloadTimer = undefined;
    const weapon = options.getWeapon();
    if (!reloading || !weapon) return;
    ammo.loadOne(weapon);
    if (ammo.isFull(weapon)) {
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
      activeSlot === null
      || !weapon
      || ammo.isFull(weapon)
      || reloading
    ) return;
    stopFiring();
    setWeaponAiming(camera, false);
    reloading = true;
    setWeaponReloading(camera, true);
    showCurrent();
    reloadTimer = window.setTimeout(loadShell, WEAPON_CONFIG[weapon].shellLoadMs);
  };
  const aim = (aiming: boolean) => {
    if (activeSlot === null) return;
    setWeaponAiming(camera, aiming);
  };
  const selectSlot = (slot: WeaponSlot) => {
    if (activeSlot === slot) {
      stopReload();
      setWeaponAiming(camera, false);
      activeSlot = null;
      options.selectWeaponSlot(null);
      return;
    }
    stopReload();
    setWeaponAiming(camera, false);
    activeSlot = slot;
    options.selectWeaponSlot(slot);
  };
  const reset = () => {
    stopFiring();
    stopReload();
    setWeaponAiming(camera, false);
    ammo.configure();
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
    configureAmmo: (startingAmmo: StartingAmmo = {}) => ammo.configure(startingAmmo),
    refillAmmo: () => {
      stopReload();
      ammo.refill();
      showCurrent();
    },
    reset,
    dispose: () => {
      stopFiring();
      stopReload();
      disposeWeaponEffectAssets(scene);
    },
  };
}
