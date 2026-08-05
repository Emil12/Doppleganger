import * as THREE from 'three';
import {
  createExplosionEffect,
  disposeEffect,
  type ExplosionEffect,
  updateExplosion,
} from './throwableEffects';

type ThrowableKind = 'grenade' | 'molotov';

type Throwable = {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  fuse: number;
  kind: ThrowableKind;
};

const grenadeGeometry = new THREE.SphereGeometry(0.12, 8, 6);
const grenadeMaterial = new THREE.MeshStandardMaterial({ color: 0x4f5943, roughness: 0.82 });
const molotovGeometry = new THREE.CylinderGeometry(0.075, 0.1, 0.38, 8);
const molotovMaterial = new THREE.MeshStandardMaterial({ color: 0x6f3d22, roughness: 0.42 });

export function createGrenadeSystem(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  onExplode: (position: THREE.Vector3) => void,
  onBurn: (position: THREE.Vector3) => void,
) {
  const throwables: Throwable[] = [];
  const explosions: ExplosionEffect[] = [];

  const explode = (item: Throwable) => {
    const position = item.mesh.position.clone();
    item.mesh.removeFromParent();
    onExplode(position);
    explosions.push(createExplosionEffect(scene, position));
  };

  const ignite = (item: Throwable) => {
    const position = item.mesh.position.clone();
    position.y = 0.08;
    item.mesh.removeFromParent();
    onBurn(position);
  };

  const throwItem = (kind: ThrowableKind) => {
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    const mesh = new THREE.Mesh(
      kind === 'grenade' ? grenadeGeometry : molotovGeometry,
      kind === 'grenade' ? grenadeMaterial : molotovMaterial,
    );
    mesh.castShadow = true;
    mesh.position.copy(camera.position).addScaledVector(direction, 0.65);
    scene.add(mesh);
    throwables.push({
      mesh,
      velocity: direction.multiplyScalar(10).add(new THREE.Vector3(0, 3.2, 0)),
      fuse: kind === 'grenade' ? 1.35 : 3,
      kind,
    });
  };

  const update = (delta: number) => {
    for (let index = throwables.length - 1; index >= 0; index -= 1) {
      const item = throwables[index];
      item.fuse -= delta;
      item.velocity.y -= 9.8 * delta;
      item.mesh.position.addScaledVector(item.velocity, delta);
      item.mesh.rotation.x += delta * 8;
      if (item.mesh.position.y < 0.13) {
        item.mesh.position.y = 0.13;
        if (item.kind === 'molotov') {
          throwables.splice(index, 1);
          ignite(item);
          continue;
        }
        item.velocity.y = Math.abs(item.velocity.y) * 0.28;
        item.velocity.x *= 0.72;
        item.velocity.z *= 0.72;
      }
      if (item.fuse > 0) continue;
      throwables.splice(index, 1);
      item.kind === 'grenade' ? explode(item) : ignite(item);
    }
    for (let index = explosions.length - 1; index >= 0; index -= 1) {
      if (!updateExplosion(explosions[index], delta)) continue;
      disposeEffect(explosions[index]);
      explosions.splice(index, 1);
    }
  };

  const reset = () => {
    throwables.splice(0).forEach(({ mesh }) => mesh.removeFromParent());
    explosions.splice(0).forEach(disposeEffect);
  };

  const dispose = () => {
    reset();
    grenadeGeometry.dispose();
    grenadeMaterial.dispose();
    molotovGeometry.dispose();
    molotovMaterial.dispose();
  };

  return {
    throwGrenade: () => throwItem('grenade'),
    throwMolotov: () => throwItem('molotov'),
    update,
    reset,
    dispose,
  };
}
