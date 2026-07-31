import * as THREE from 'three';
import { type CheckoutKind } from './customerSystem';
import {
  equipStartingWeapon,
  equipStartingWeapons,
  nearestWeaponCabinet,
  pickupWeapon,
  putBackWeapon,
  resetWeapons,
  showWeaponSlot,
  type WeaponKind,
  type WeaponSlot,
} from './gameWeapon';
import { type DoorLabel, nearestDoor, toggleNearestDoor } from './staffDoor';
import { respawnWallMedkit, useWallMedkit, wallMedkitDistance } from './wallMedkit';

export type DoorHudState = {
  near: boolean;
  open: boolean;
  label: DoorLabel;
};

export type CustomerInteractions = {
  hitCustomer: (object: THREE.Object3D, time: number) => boolean;
  messDistance: (camera: THREE.Camera) => number;
  cleanNearest: (camera: THREE.Camera) => boolean;
  checkoutDistance: (camera: THREE.Camera) => number;
  checkoutKind: (camera: THREE.Camera) => CheckoutKind | null;
  serveNext: (camera: THREE.Camera) => CheckoutKind | null;
  refuseNext: (camera: THREE.Camera) => CheckoutKind | null;
};

type InteractionOptions = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  customers: CustomerInteractions;
  showDoor: (state: DoorHudState) => void;
  showCleanup: (near: boolean) => void;
  showMedkit: (near: boolean) => void;
  showCheckout: (kind: CheckoutKind | null) => void;
  healPlayer: () => boolean;
  onWeaponChange: (weapon: WeaponKind | null) => void;
  onCabinetChange: (weapon: WeaponKind | null) => void;
  onPurchase: () => void;
  onAnomalyAccepted: () => void;
};

export function createGameInteraction(options: InteractionOptions) {
  const { scene, camera, customers } = options;
  let weaponSlots: [WeaponKind | null, WeaponKind | null] = [null, null];
  let activeSlot: WeaponSlot | null = 1;
  let nearCabinet: WeaponKind | null = null;
  let nearDoor = false;
  let nearMess = false;
  let nearMedkit = false;
  let checkoutKind: CheckoutKind | null = null;
  let doorOpen = true;
  let doorLabel: DoorHudState['label'] = 'STAFF DOOR';

  const weaponKind = () => activeSlot ? weaponSlots[activeSlot - 1] : null;

  const distances = () => {
    const door = nearestDoor(scene, camera);
    return {
      door,
      cabinet: nearestWeaponCabinet(scene, camera, weaponKind()),
      mess: customers.messDistance(camera),
      medkit: wallMedkitDistance(scene, camera),
      checkout: customers.checkoutDistance(camera),
    };
  };

  const interact = () => {
    const nearby = distances();
    if (nearby.medkit < 1.8 && nearby.medkit <= Math.min(nearby.mess, nearby.checkout, nearby.door.distance, nearby.cabinet.distance)) {
      if (useWallMedkit(scene, camera, options.healPlayer)) options.showMedkit(false);
      return;
    }
    if (nearby.mess < 2 && nearby.mess <= Math.min(nearby.medkit, nearby.checkout, nearby.door.distance, nearby.cabinet.distance)) {
      if (customers.cleanNearest(camera)) options.showCleanup(false);
      return;
    }
    if (nearby.checkout < 2.5 && nearby.checkout < Math.min(nearby.medkit, nearby.mess, nearby.door.distance, nearby.cabinet.distance)) {
      const result = customers.serveNext(camera);
      if (result) {
        if (result === 'buyer') options.onPurchase();
        else options.onAnomalyAccepted();
        options.showCheckout(null);
      }
      return;
    }
    if (nearby.door.distance < 2 && nearby.door.distance < Math.min(nearby.medkit, nearby.cabinet.distance, nearby.mess, nearby.checkout)) {
      const result = toggleNearestDoor(scene, camera);
      if (result) {
        doorOpen = result.open;
        doorLabel = result.label;
        options.showDoor({ near: true, open: doorOpen, label: doorLabel });
      }
      return;
    }
    const weapon = weaponKind();
    if (weapon) {
      if (!putBackWeapon(scene, camera, weapon)) return;
      if (activeSlot) weaponSlots[activeSlot - 1] = null;
      options.onWeaponChange(null);
      return;
    }
    const nextWeapon = nearby.cabinet.kind;
    if (!nextWeapon || !pickupWeapon(scene, camera, nextWeapon)) return;
    activeSlot ??= 1;
    weaponSlots[activeSlot - 1] = nextWeapon;
    options.onWeaponChange(nextWeapon);
  };

  const refuse = () => {
    const refused = customers.refuseNext(camera);
    if (refused) options.showCheckout(null);
    return refused;
  };

  const update = () => {
    const nearby = distances();
    const nextMedkit =
      nearby.medkit < 1.8 &&
      nearby.medkit <= Math.min(nearby.mess, nearby.checkout, nearby.door.distance, nearby.cabinet.distance);
    const nextMess =
      nearby.mess < 2 && nearby.mess <= Math.min(nearby.medkit, nearby.checkout, nearby.door.distance, nearby.cabinet.distance);
    const checkoutIsNearest =
      nearby.checkout < 2.5 && nearby.checkout < Math.min(nearby.medkit, nearby.mess, nearby.door.distance, nearby.cabinet.distance);
    const nextCheckout = checkoutIsNearest ? customers.checkoutKind(camera) : null;
    const nextDoor =
      nearby.door.distance < 2 &&
      nearby.door.distance < Math.min(nearby.medkit, nearby.cabinet.distance, nearby.mess, nearby.checkout);
    const nextCabinet =
      nearby.cabinet.distance < 1.75 &&
      nearby.cabinet.distance <= nearby.door.distance &&
      nearby.cabinet.distance < Math.min(nearby.medkit, nearby.mess, nearby.checkout)
        ? nearby.cabinet.kind
        : null;
    if (nextMedkit !== nearMedkit) {
      nearMedkit = nextMedkit;
      options.showMedkit(nearMedkit);
    }
    if (nextMess !== nearMess) {
      nearMess = nextMess;
      options.showCleanup(nearMess);
    }
    if (nextCheckout !== checkoutKind) {
      checkoutKind = nextCheckout;
      options.showCheckout(checkoutKind);
    }
    if (nextDoor !== nearDoor) {
      nearDoor = nextDoor;
      doorOpen = nearby.door.open;
      doorLabel = nearby.door.label;
      options.showDoor({ near: nearDoor, open: doorOpen, label: doorLabel });
    } else if (nearDoor && nearby.door.label !== doorLabel) {
      doorOpen = nearby.door.open;
      doorLabel = nearby.door.label;
      options.showDoor({ near: true, open: doorOpen, label: doorLabel });
    }
    if (nextCabinet !== nearCabinet) {
      nearCabinet = nextCabinet;
      options.onCabinetChange(nearCabinet);
    }
  };

  const reset = () => {
    resetWeapons(scene, camera);
    weaponSlots = [null, null];
    activeSlot = 1;
    nearCabinet = null;
    options.onWeaponChange(null);
    options.onCabinetChange(null);
    respawnWallMedkit(scene);
  };

  const equipWeapon = (kind: WeaponKind) => {
    resetWeapons(scene, camera);
    equipStartingWeapon(scene, camera, kind);
    weaponSlots = [kind, null];
    activeSlot = 1;
    options.onWeaponChange(kind);
    options.onCabinetChange(null);
  };

  const equipWeapons = (kinds: readonly [WeaponKind, WeaponKind?]) => {
    resetWeapons(scene, camera);
    equipStartingWeapons(scene, camera, kinds);
    weaponSlots = [kinds[0], kinds[1] ?? null];
    activeSlot = 1;
    options.onWeaponChange(kinds[0]);
    options.onCabinetChange(null);
  };

  const selectWeaponSlot = (slot: WeaponSlot | null) => {
    activeSlot = slot;
    showWeaponSlot(camera, slot);
    options.onWeaponChange(weaponKind());
  };

  return {
    interact,
    refuse,
    respawnMedkit: () => respawnWallMedkit(scene),
    update,
    reset,
    equipWeapon,
    equipWeapons,
    selectWeaponSlot,
    weaponKind,
  };
}
