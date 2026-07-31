import * as THREE from 'three';

const steel = new THREE.MeshStandardMaterial({ color: 0x252b29, metalness: 0.72, roughness: 0.38 });
const tank = new THREE.MeshStandardMaterial({ color: 0x6e2e22, metalness: 0.35, roughness: 0.5 });
const grip = new THREE.MeshStandardMaterial({ color: 0x181b19, roughness: 0.9 });

function part(group: THREE.Group, geometry: THREE.BufferGeometry, material: THREE.Material) {
  const mesh = new THREE.Mesh(geometry, material);
  group.add(mesh);
  return mesh;
}

export function createFlamethrowerModel(scale = 1) {
  const weapon = new THREE.Group();
  const body = part(weapon, new THREE.BoxGeometry(0.28, 0.25, 0.72), steel);
  body.position.z = 0.08;
  const fuel = part(weapon, new THREE.CylinderGeometry(0.18, 0.18, 0.62, 8), tank);
  fuel.rotation.z = Math.PI / 2;
  fuel.position.set(-0.24, -0.08, 0.2);
  const barrel = part(weapon, new THREE.CylinderGeometry(0.055, 0.072, 1.35, 8), steel);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0.04, 0.08, -0.82);
  const nozzle = part(weapon, new THREE.CylinderGeometry(0.1, 0.065, 0.22, 8), steel);
  nozzle.rotation.x = Math.PI / 2;
  nozzle.position.set(0.04, 0.08, -1.58);
  const handle = part(weapon, new THREE.BoxGeometry(0.16, 0.48, 0.2), grip);
  handle.position.set(0, -0.3, 0.18);
  handle.rotation.x = -0.18;
  const pilot = part(
    weapon,
    new THREE.SphereGeometry(0.045, 6, 4),
    new THREE.MeshBasicMaterial({ color: 0xff812b }),
  );
  pilot.position.set(0.04, 0.08, -1.72);
  weapon.scale.setScalar(scale);
  return weapon;
}
