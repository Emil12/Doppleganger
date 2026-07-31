import * as THREE from 'three';
import { sharedCustomerGeometry } from './customerGeometry';
import { lowPolyBox } from './lowPolyGeometry';
import {
  customerBasicMaterial,
  customerMaterial,
  customerMesh,
} from './customerStyle';

export function createShoppingBag() {
  const bag = new THREE.Group();
  const body = customerMesh(
    sharedCustomerGeometry('shopping-bag', () => lowPolyBox(0.38, 0.42, 0.2, 0.04)),
    0xb99c63,
    0.8,
  );
  body.position.y = -0.2;
  const handle = customerMesh(
    sharedCustomerGeometry(
      'shopping-bag-handle',
      () => new THREE.TorusGeometry(0.13, 0.025, 8, 16, Math.PI),
    ),
    0x6e5634,
  );
  handle.rotation.z = Math.PI;
  handle.position.y = 0.03;
  bag.add(body, handle);
  bag.position.set(0.49, 0.78, 0);
  bag.visible = false;
  return bag;
}

export function createIdCard(isAnomaly: boolean) {
  const card = new THREE.Group();
  const face = new THREE.Mesh(
    sharedCustomerGeometry(
      'id-card',
      () => new THREE.BoxGeometry(0.26, 0.17, 0.018),
    ),
    customerMaterial(isAnomaly ? 0xd8d2c2 : 0xe8e2c9, 0.42),
  );
  const photo = new THREE.Mesh(
    sharedCustomerGeometry(
      'id-photo',
      () => new THREE.PlaneGeometry(0.065, 0.09),
    ),
    customerBasicMaterial(isAnomaly ? 0x6f7775 : 0x526b73),
  );
  photo.position.set(-0.07, 0, -0.012);
  const text = new THREE.Mesh(
    sharedCustomerGeometry(
      'id-text',
      () => new THREE.PlaneGeometry(0.09, 0.012),
    ),
    customerBasicMaterial(0x5b625f),
  );
  text.position.set(0.055, 0.025, -0.012);
  card.add(face, photo, text);
  card.position.set(0.43, 1.48, -0.29);
  card.visible = false;
  return card;
}
