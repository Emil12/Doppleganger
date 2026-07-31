import * as THREE from 'three';

export const WEAPON_EFFECT_NAME = 'weapon-effect';

export type ShotImpact = {
  point: THREE.Vector3;
  hit: boolean;
};

const MUZZLE_FLASH_GEOMETRY = new THREE.ConeGeometry(0.2, 0.56, 7);
const SMOKE_GEOMETRY = new THREE.SphereGeometry(0.055, 5, 3);
const IMPACT_GEOMETRY = new THREE.OctahedronGeometry(0.035, 0);
const UP_DIRECTION = new THREE.Vector3(0, 1, 0);

function addMuzzleFlash(
  effect: THREE.Group,
  start: THREE.Vector3,
  direction: THREE.Vector3,
) {
  const size = 0.2;
  const material = new THREE.MeshBasicMaterial({
    color: 0xffc45c,
    transparent: true,
    blending: THREE.AdditiveBlending,
  });
  const flash = new THREE.Mesh(MUZZLE_FLASH_GEOMETRY, material);
  flash.quaternion.setFromUnitVectors(UP_DIRECTION, direction);
  flash.position.copy(start).addScaledVector(direction, size);
  effect.add(flash);

}

function addSmoke(effect: THREE.Group, start: THREE.Vector3, direction: THREE.Vector3) {
  const smoke = new THREE.Mesh(
    SMOKE_GEOMETRY,
    new THREE.MeshBasicMaterial({
      color: 0xb8b4a9,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    }),
  );
  smoke.name = 'muzzle-smoke';
  smoke.position.copy(start).addScaledVector(direction, 0.16);
  smoke.userData.velocity = direction.clone().multiplyScalar(0.55);
  effect.add(smoke);
}

function addImpact(effect: THREE.Group, point: THREE.Vector3) {
  const spark = new THREE.Mesh(
    IMPACT_GEOMETRY,
    new THREE.MeshBasicMaterial({ color: 0xffb45b, transparent: true }),
  );
  spark.position.copy(point);
  effect.add(spark);
}

export function createShotEffect(
  scene: THREE.Scene,
  start: THREE.Vector3,
  direction: THREE.Vector3,
  impacts: ShotImpact[],
) {
  const effect = new THREE.Group();
  effect.name = WEAPON_EFFECT_NAME;
  effect.userData.life = 0.24;
  effect.userData.initialLife = 0.24;
  addMuzzleFlash(effect, start, direction);
  addSmoke(effect, start, direction);
  impacts.forEach(({ point, hit }) => {
    if (hit) addImpact(effect, point);
  });
  scene.add(effect);
}

function disposeEffect(effect: THREE.Object3D) {
  effect.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => material.dispose());
  });
  effect.removeFromParent();
}

export function disposeShotEffectAssets(scene: THREE.Scene) {
  for (let index = scene.children.length - 1; index >= 0; index -= 1) {
    const object = scene.children[index];
    if (object.name === WEAPON_EFFECT_NAME) disposeEffect(object);
  }
  MUZZLE_FLASH_GEOMETRY.dispose();
  SMOKE_GEOMETRY.dispose();
  IMPACT_GEOMETRY.dispose();
}

export function updateShotEffects(scene: THREE.Scene, delta: number) {
  const expired: THREE.Object3D[] = [];
  scene.children.forEach((object) => {
    if (object.name !== WEAPON_EFFECT_NAME) return;
    object.userData.life = Number(object.userData.life) - delta;
    const fade = Math.max(0, Number(object.userData.life) / Number(object.userData.initialLife));
    object.traverse((part) => {
      if (!(part instanceof THREE.Mesh)) return;
      const material = part.material;
      if (!Array.isArray(material) && material.transparent) material.opacity *= fade;
      if (part.name === 'muzzle-smoke') {
        part.position.addScaledVector(part.userData.velocity as THREE.Vector3, delta);
        part.scale.multiplyScalar(1 + delta * 2.4);
      }
      if (part.name === 'flame-stream') {
        part.position.addScaledVector(part.userData.velocity as THREE.Vector3, delta);
        part.scale.multiplyScalar(1 + delta * 1.6);
      }
    });
    if (object.userData.life <= 0) expired.push(object);
  });
  expired.forEach(disposeEffect);
}
