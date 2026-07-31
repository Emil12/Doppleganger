import * as THREE from 'three';

export const FUEL_PUMP_NAME_PREFIX = 'fuel-pump-';

const HITS_TO_EXPLODE = 5;
const EFFECT_LIFETIME = 0.85;

type ExplosionEffect = {
  age: number;
  geometry: THREE.BufferGeometry;
  group: THREE.Group;
  light: THREE.PointLight;
  materials: THREE.MeshBasicMaterial[];
};

function findFuelPump(object: THREE.Object3D) {
  let current: THREE.Object3D | null = object;
  while (current && !current.name.startsWith(FUEL_PUMP_NAME_PREFIX)) {
    current = current.parent;
  }
  return current instanceof THREE.Group ? current : null;
}

function charPump(pump: THREE.Group) {
  pump.rotation.z = (Math.random() - 0.5) * 0.14;
  pump.traverse((part) => {
    if (!(part instanceof THREE.Mesh)) return;
    const material = part.material;
    if (!(material instanceof THREE.MeshStandardMaterial)) return;
    part.userData.fuelOriginalColor ??= material.color.getHex();
    part.userData.fuelOriginalEmissive ??= material.emissive.getHex();
    material.color.setHex(0x241d18);
    material.emissive.setHex(0x160500);
  });
}

function restorePump(pump: THREE.Group) {
  pump.userData.fuelHits = 0;
  pump.userData.fuelExploded = false;
  pump.rotation.z = 0;
  pump.traverse((part) => {
    if (!(part instanceof THREE.Mesh)) return;
    const material = part.material;
    if (!(material instanceof THREE.MeshStandardMaterial)) return;
    const color = part.userData.fuelOriginalColor;
    const emissive = part.userData.fuelOriginalEmissive;
    if (typeof color === 'number') material.color.setHex(color);
    if (typeof emissive === 'number') material.emissive.setHex(emissive);
  });
}

function makeExplosion(scene: THREE.Scene, pump: THREE.Group): ExplosionEffect {
  const group = new THREE.Group();
  const geometry = new THREE.DodecahedronGeometry(0.58, 0);
  const materials = [0xffd36a, 0xff6b25, 0xb92718].map((color) => (
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  ));
  const offsets = [
    new THREE.Vector3(0, 0.12, 0),
    new THREE.Vector3(-0.42, 0.38, 0.16),
    new THREE.Vector3(0.38, 0.54, -0.18),
  ];
  materials.forEach((material, index) => {
    const fireball = new THREE.Mesh(geometry, material);
    fireball.position.copy(offsets[index]);
    group.add(fireball);
  });
  const light = new THREE.PointLight(0xff6d2e, 9, 14, 2);
  group.add(light);
  group.position.copy(pump.getWorldPosition(new THREE.Vector3()));
  group.position.y += 0.85;
  scene.add(group);
  return { age: 0, geometry, group, light, materials };
}

function disposeEffect(scene: THREE.Scene, effect: ExplosionEffect) {
  scene.remove(effect.group);
  effect.geometry.dispose();
  effect.materials.forEach((material) => material.dispose());
}

export function createFuelPumpSystem(scene: THREE.Scene, onExplosion: () => void) {
  const pumps = scene.children.filter(
    (child): child is THREE.Group => (
      child instanceof THREE.Group && child.name.startsWith(FUEL_PUMP_NAME_PREFIX)
    ),
  );
  const effects: ExplosionEffect[] = [];

  const hit = (objects: readonly THREE.Object3D[]) => {
    const hitPumps = new Set(objects.map(findFuelPump).filter((pump) => pump !== null));
    hitPumps.forEach((pump) => {
      if (pump.userData.fuelExploded === true) return;
      const hits = Number(pump.userData.fuelHits ?? 0) + 1;
      pump.userData.fuelHits = hits;
      if (hits < HITS_TO_EXPLODE) return;
      pump.userData.fuelExploded = true;
      charPump(pump);
      effects.push(makeExplosion(scene, pump));
      onExplosion();
    });
  };

  const update = (delta: number) => {
    for (let index = effects.length - 1; index >= 0; index -= 1) {
      const effect = effects[index];
      effect.age += delta;
      const progress = effect.age / EFFECT_LIFETIME;
      effect.group.scale.setScalar(1 + progress * 3.2);
      effect.group.position.y += delta * 0.45;
      effect.light.intensity = Math.max(0, 9 * (1 - progress));
      effect.materials.forEach((material) => { material.opacity = 1 - progress; });
      if (effect.age < EFFECT_LIFETIME) continue;
      disposeEffect(scene, effect);
      effects.splice(index, 1);
    }
  };

  const reset = () => {
    effects.splice(0).forEach((effect) => disposeEffect(scene, effect));
    pumps.forEach(restorePump);
  };

  return { hit, update, reset, dispose: reset };
}
