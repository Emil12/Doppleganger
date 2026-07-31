import * as THREE from 'three';
import { lowPolyBox } from './lowPolyGeometry';
import { markCullable } from './entityCulling';

export const SHOP_SHELF_BOUNDS = [
  { minX: -4.1, maxX: 1.5, minZ: -16.8, maxZ: -15.6 },
  { minX: -4.1, maxX: 1.5, minZ: -20.8, maxZ: -19.6 },
] as const;

function labelMaterial(label: string, background: string, accent: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  if (!context) return new THREE.MeshStandardMaterial({ color: background });
  context.fillStyle = background;
  context.fillRect(0, 0, 128, 128);
  context.fillStyle = accent;
  context.beginPath();
  context.arc(64, 44, 28, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#f7f1d5';
  context.font = `bold ${label.length > 7 ? 19 : 27}px Arial`;
  context.textAlign = 'center';
  context.fillText(label, 64, 92);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  return new THREE.MeshStandardMaterial({ map: texture, roughness: 0.48 });
}

function shelfPart(group: THREE.Group, size: [number, number, number], position: [number, number, number], color: number) {
  const object = new THREE.Mesh(new THREE.BoxGeometry(...size), new THREE.MeshStandardMaterial({
    color,
    metalness: 0.45,
    roughness: 0.46,
  }));
  object.position.set(...position);
  object.castShadow = true;
  object.receiveShadow = true;
  group.add(object);
}

function can(material: THREE.Material, height: number, radius: number) {
  const cap = new THREE.MeshStandardMaterial({ color: 0xc8c3aa, metalness: 0.7, roughness: 0.28 });
  return new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 12), [material, cap, cap]);
}

function snackBag(material: THREE.Material) {
  const bag = new THREE.Mesh(lowPolyBox(0.34, 0.46, 0.13, 0.045), material);
  bag.rotation.z = 0.025;
  return bag;
}

function addProducts(group: THREE.Group, side: number, materials: THREE.Material[]) {
  const positions = [-2.35, -1.57, -0.79, 0, 0.79, 1.57, 2.35];
  positions.forEach((x, index) => {
    const soda = can(materials[index % 2], 0.43, 0.115);
    soda.position.set(x, 0.39, side * 0.48);
    group.add(soda);

    const chips = can(materials[2 + (index % 2)], 0.55, 0.135);
    chips.position.set(x, 1, side * 0.47);
    group.add(chips);

    const bag = snackBag(materials[4 + (index % 2)]);
    bag.position.set(x, 1.55, side * 0.48);
    bag.rotation.y = side < 0 ? Math.PI : 0;
    group.add(bag);
  });
}

function buildShelf(z: number, materials: THREE.Material[]) {
  const shelf = markCullable(new THREE.Group(), 3.8, 70);
  shelf.position.set(-1.3, 0, z);
  shelfPart(shelf, [5.6, 1.85, 0.1], [0, 0.98, 0], 0x3b4741);
  for (const y of [0.14, 0.7, 1.28, 1.88]) {
    shelfPart(shelf, [5.72, 0.09, 1.14], [0, y, 0], 0x737b70);
    shelfPart(shelf, [5.76, 0.1, 0.05], [0, y + 0.03, 0.59], 0xd4c9a5);
    shelfPart(shelf, [5.76, 0.1, 0.05], [0, y + 0.03, -0.59], 0xd4c9a5);
  }
  for (const x of [-2.78, 2.78]) {
    shelfPart(shelf, [0.1, 2, 0.12], [x, 1, 0.52], 0x46534d);
    shelfPart(shelf, [0.1, 2, 0.12], [x, 1, -0.52], 0x46534d);
  }
  addProducts(shelf, 1, materials);
  addProducts(shelf, -1, materials);
  return shelf;
}

export function addShopShelves(scene: THREE.Scene) {
  const materials = [
    labelMaterial('PEPSI', '#07549c', '#d72c36'),
    labelMaterial('COLA', '#9d2726', '#e8c9a1'),
    labelMaterial('PRINGLES', '#b92e2a', '#e8c13e'),
    labelMaterial('PRINGLES', '#3c773d', '#e8c13e'),
    labelMaterial('CHIPS', '#d6a927', '#bd382c'),
    labelMaterial('SNACKS', '#784b93', '#e1ad38'),
  ];
  scene.add(buildShelf(-16.2, materials));
  scene.add(buildShelf(-20.2, materials));
}
