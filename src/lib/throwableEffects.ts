import * as THREE from 'three';

export type ExplosionEffect = {
  group: THREE.Group;
  material: THREE.MeshBasicMaterial;
  age: number;
};

export function createExplosionEffect(scene: THREE.Scene, position: THREE.Vector3) {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({
    color: 0xff9b45,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });
  group.add(
    new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), material),
    new THREE.PointLight(0xff7438, 8, 9, 2),
  );
  group.position.copy(position);
  scene.add(group);
  return { group, material, age: 0 } satisfies ExplosionEffect;
}

export function updateExplosion(effect: ExplosionEffect, delta: number) {
  effect.age += delta;
  effect.group.scale.setScalar(0.25 + effect.age * 9);
  effect.material.opacity = Math.max(0, 0.9 - effect.age * 2.4);
  return effect.age >= 0.42;
}

export function disposeEffect(
  effect: ExplosionEffect,
) {
  effect.group.removeFromParent();
  effect.group.traverse((object) => {
    if (object instanceof THREE.Mesh) object.geometry.dispose();
  });
  effect.material.dispose();
}
