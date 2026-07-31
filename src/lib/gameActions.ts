import * as THREE from 'three';
import { type CheckoutKind } from './customerSystem';
import {
  createGameInteraction,
  type CustomerInteractions,
  type DoorHudState,
} from './gameInteraction';
import {
  type WeaponHudState,
  type WeaponSounds,
} from './gameActionTypes';
import { createWeaponController } from './weaponController';

export {
  INITIAL_DOOR_STATE,
  INITIAL_WEAPON_STATE,
  type WeaponHudState,
} from './gameActionTypes';

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
  onAnomalyAccepted: () => void,
) {
  let interaction: ReturnType<typeof createGameInteraction>;
  const weapons = createWeaponController({
    scene,
    camera,
    customers,
    sounds,
    getWeapon: () => interaction.weaponKind(),
    showWeapon,
    onShot,
  });
  interaction = createGameInteraction({
    scene,
    camera,
    customers,
    showDoor,
    showCleanup,
    showMedkit,
    showCheckout,
    healPlayer,
    onWeaponChange: weapons.onWeaponChange,
    onCabinetChange: weapons.onCabinetChange,
    onPurchase,
    onAnomalyAccepted,
  });

  const reset = () => {
    weapons.reset();
    interaction.reset();
  };

  return {
    interact: interaction.interact,
    refuse: interaction.refuse,
    shoot: weapons.shoot,
    reload: weapons.reload,
    aim: weapons.aim,
    selectSlot: weapons.selectSlot,
    equipWeapon: interaction.equipWeapon,
    reset,
    updateProximity: interaction.update,
    dispose: weapons.dispose,
  };
}
