import * as THREE from 'three';

const SHARED_GEOMETRY_KEY = 'sharedCustomerGeometry';
const geometries = new Map<string, THREE.BufferGeometry>();

export function sharedCustomerGeometry<T extends THREE.BufferGeometry>(
  key: string,
  create: () => T,
) {
  const cached = geometries.get(key);
  if (cached) return cached;
  const geometry = create();
  geometry.userData[SHARED_GEOMETRY_KEY] = true;
  geometries.set(key, geometry);
  return geometry;
}

export function isSharedCustomerGeometry(geometry: THREE.BufferGeometry) {
  return geometry.userData[SHARED_GEOMETRY_KEY] === true;
}

export function disposeSharedCustomerGeometries() {
  geometries.forEach((geometry) => geometry.dispose());
}
