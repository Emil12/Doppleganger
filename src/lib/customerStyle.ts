import * as THREE from 'three';

export type CustomerStyle = {
  shirt: number;
  accent: number;
  trousers: number;
  skin: number;
  hair: number;
  shoes: number;
  eyes: number;
  build: number;
};

const STYLES: CustomerStyle[] = [
  { shirt: 0x7a3f35, accent: 0xb77962, trousers: 0x263746, skin: 0xc98e68, hair: 0x2d211b, shoes: 0x17191a, eyes: 0x4a3024, build: 1 },
  { shirt: 0x355b4a, accent: 0x6d8975, trousers: 0x34323a, skin: 0x8b5c43, hair: 0x141210, shoes: 0x292522, eyes: 0x211812, build: 1.08 },
  { shirt: 0x465576, accent: 0x7f8eaf, trousers: 0x483b31, skin: 0xe1b28c, hair: 0x654026, shoes: 0x282829, eyes: 0x405b61, build: 0.94 },
  { shirt: 0x806b3c, accent: 0xb59b5c, trousers: 0x26322d, skin: 0xb87555, hair: 0x211d1a, shoes: 0x30261f, eyes: 0x34231b, build: 1.13 },
  { shirt: 0x5e404b, accent: 0x916777, trousers: 0x313944, skin: 0x6f4636, hair: 0x171312, shoes: 0x19191b, eyes: 0x21150f, build: 0.9 },
  { shirt: 0x47636a, accent: 0x7d999d, trousers: 0x3b3a35, skin: 0xd59b73, hair: 0x3b2920, shoes: 0x202325, eyes: 0x56402c, build: 1.04 },
];

const materials = new Map<string, THREE.MeshStandardMaterial>();
const basicMaterials = new Map<number, THREE.MeshBasicMaterial>();

export function customerStyle(index: number) {
  return STYLES[index % STYLES.length];
}

export function customerMaterial(color: number, roughness = 0.68, emissive = 0) {
  const key = `${color}-${roughness}-${emissive}`;
  const cached = materials.get(key);
  if (cached) return cached;
  const created = new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: emissive ? 1.35 : 1,
    roughness,
    metalness: 0.02,
  });
  materials.set(key, created);
  return created;
}

export function customerBasicMaterial(color: number) {
  const cached = basicMaterials.get(color);
  if (cached) return cached;
  const created = new THREE.MeshBasicMaterial({ color });
  basicMaterials.set(color, created);
  return created;
}

export function customerMesh(
  geometry: THREE.BufferGeometry,
  color: number,
  roughness = 0.68,
  emissive = 0,
) {
  const mesh = new THREE.Mesh(geometry, customerMaterial(color, roughness, emissive));
  return mesh;
}

export function disposeCustomerMaterials() {
  materials.forEach((material) => material.dispose());
  basicMaterials.forEach((material) => material.dispose());
}
