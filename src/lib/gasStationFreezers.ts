import * as THREE from 'three';
import { lowPolyBox } from './lowPolyGeometry';
import { markCullable } from './entityCulling';

const FREEZER_X = -7.78;
const FREEZER_Z = [-20.5, -15.8] as const;

function standard(color: number, metalness = 0.2, roughness = 0.45) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness, flatShading: true });
}

function part(
  group: THREE.Group,
  geometry: THREE.BufferGeometry,
  color: number,
  position: [number, number, number],
) {
  const object = new THREE.Mesh(geometry, standard(color));
  object.position.set(...position);
  object.castShadow = true;
  object.receiveShadow = true;
  group.add(object);
}

function buildFreezer(z: number) {
  const group = markCullable(new THREE.Group(), 3.5, 70);
  const localZ = 0;
  group.position.set(FREEZER_X, 0, z);

  part(group, lowPolyBox(0.22, 2.8, 3.45, 0.08), 0x68736f, [-0.48, 1.4, localZ]);
  part(group, lowPolyBox(1.1, 0.18, 3.45, 0.07), 0x68736f, [0, 2.72, localZ]);
  part(group, lowPolyBox(1.1, 0.18, 3.45, 0.07), 0x68736f, [0, 0.1, localZ]);
  part(group, new THREE.BoxGeometry(1.1, 2.8, 0.16), 0x68736f, [0, 1.4, -1.64]);
  part(group, new THREE.BoxGeometry(1.1, 2.8, 0.16), 0x68736f, [0, 1.4, 1.64]);
  part(group, new THREE.BoxGeometry(0.08, 2.5, 3.12), 0x1c2929, [0.61, 1.4, localZ]);

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x9bc8c2,
    emissive: 0x1d4b4d,
    emissiveIntensity: 0.75,
    roughness: 0.08,
    transparent: true,
    opacity: 0.38,
    clearcoat: 1,
    side: THREE.DoubleSide,
  });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(2.75, 2.2), glassMaterial);
  glass.rotation.y = Math.PI / 2;
  glass.position.set(0.66, 1.45, localZ);
  group.add(glass);

  for (const offset of [-1.48, 0, 1.48]) {
    part(group, new THREE.BoxGeometry(0.08, 2.5, 0.1), 0x303d3b, [0.68, 1.4, offset]);
  }
  part(group, lowPolyBox(0.12, 1.1, 0.12, 0.04), 0xd4d2bd, [0.73, 1.45, 0.18]);
  return group;
}

export function addFreezers(scene: THREE.Scene) {
  FREEZER_Z.forEach((z) => scene.add(buildFreezer(z)));
}
