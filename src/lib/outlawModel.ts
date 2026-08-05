import * as THREE from 'three';
import { customerMaterial, customerMesh } from './customerStyle';

export function addOutlawLook(head: THREE.Group, rightArm: THREE.Group) {
  const mask = customerMesh(new THREE.SphereGeometry(0.235, 10, 7), 0x171a18, 0.92);
  mask.scale.set(1.02, 0.82, 0.92);
  mask.position.y = 0.02;
  mask.name = 'outlaw-mask';
  head.add(mask);
  for (const x of [-0.075, 0.075]) {
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 6, 4),
      customerMaterial(0xd1b079, 0.7),
    );
    eye.position.set(x, 0.055, -0.215);
    mask.add(eye);
  }
  const crowbar = customerMesh(new THREE.CylinderGeometry(0.025, 0.025, 0.9, 7), 0x3c4442, 0.28);
  crowbar.position.set(0, -0.48, -0.08);
  crowbar.rotation.z = 0.18;
  crowbar.name = 'outlaw-crowbar';
  rightArm.add(crowbar);
}
