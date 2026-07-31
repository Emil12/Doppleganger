import * as THREE from 'three';
import { WEAPON_EFFECT_NAME } from './weaponShotEffect';

export function createFlameEffect(
  scene: THREE.Scene,
  start: THREE.Vector3,
  direction: THREE.Vector3,
) {
  const effect = new THREE.Group();
  effect.name = WEAPON_EFFECT_NAME;
  effect.userData.life = 0.34;
  effect.userData.initialLife = 0.34;
  for (let index = 0; index < 4; index += 1) {
    const flame = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.09 + index * 0.055, 0),
      new THREE.MeshBasicMaterial({
        color: index === 0 ? 0xffe066 : index < 3 ? 0xff7a24 : 0xb92912,
        transparent: true,
        opacity: 0.9 - index * 0.1,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    flame.name = 'flame-stream';
    flame.position.copy(start).addScaledVector(direction, 0.12 + index * 0.12);
    flame.position.x += (Math.random() - 0.5) * 0.08;
    flame.position.y += (Math.random() - 0.5) * 0.06;
    flame.userData.velocity = direction.clone().multiplyScalar(2.1 + index * 0.2);
    effect.add(flame);
  }
  scene.add(effect);
}
