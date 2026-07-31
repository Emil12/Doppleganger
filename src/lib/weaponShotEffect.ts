import * as THREE from 'three';

export const WEAPON_EFFECT_NAME = 'weapon-effect';

export type ShotImpact = {
  point: THREE.Vector3;
  hit: boolean;
};

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
  const flash = new THREE.Mesh(new THREE.ConeGeometry(size, size * 2.8, 7), material);
  flash.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
  flash.position.copy(start).addScaledVector(direction, size);
  effect.add(flash);

  const light = new THREE.PointLight(0xffa43a, 7, 4);
  light.position.copy(start);
  effect.add(light);
}

function addSmoke(effect: THREE.Group, start: THREE.Vector3, direction: THREE.Vector3) {
  for (let index = 0; index < 3; index += 1) {
    const smoke = new THREE.Mesh(
      new THREE.SphereGeometry(0.035 + index * 0.018, 7, 5),
      new THREE.MeshBasicMaterial({
        color: 0xb8b4a9,
        transparent: true,
        opacity: 0.24 - index * 0.04,
        depthWrite: false,
      }),
    );
    smoke.name = 'muzzle-smoke';
    smoke.position.copy(start).addScaledVector(direction, 0.12 + index * 0.08);
    smoke.userData.velocity = direction.clone().multiplyScalar(0.5 + index * 0.16);
    effect.add(smoke);
  }
}

function addImpact(effect: THREE.Group, point: THREE.Vector3) {
  const spark = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.035, 0),
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
    object.geometry.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => material.dispose());
  });
  effect.removeFromParent();
}

export function updateShotEffects(scene: THREE.Scene, delta: number) {
  const expired: THREE.Object3D[] = [];
  scene.children.forEach((object) => {
    if (object.name !== WEAPON_EFFECT_NAME) return;
    object.userData.life = Number(object.userData.life) - delta;
    const fade = Math.max(0, Number(object.userData.life) / Number(object.userData.initialLife));
    object.traverse((part) => {
      if (part instanceof THREE.PointLight) part.intensity *= 0.45;
      if (!(part instanceof THREE.Mesh)) return;
      const material = part.material;
      if (!Array.isArray(material) && material.transparent) material.opacity *= fade;
      if (part.name === 'muzzle-smoke') {
        part.position.addScaledVector(part.userData.velocity as THREE.Vector3, delta);
        part.scale.multiplyScalar(1 + delta * 2.4);
      }
    });
    if (object.userData.life <= 0) expired.push(object);
  });
  expired.forEach(disposeEffect);
}
