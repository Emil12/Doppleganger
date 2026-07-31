import * as THREE from 'three';
import { markDistanceCullable } from './entityCulling';
import { BREAKABLE_GLASS_PREFIX } from './breakableGlassSystem';

type Size = [number, number, number];
type Position = [number, number, number];

function box(
  scene: THREE.Scene,
  color: number,
  size: Size,
  position: Position,
  emissive = 0x000000,
) {
  const material = new THREE.MeshStandardMaterial({
    color,
    emissive,
    flatShading: true,
    roughness: emissive ? 0.35 : 0.7,
    metalness: 0.08,
  });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  scene.add(mesh);
}

function glass(scene: THREE.Scene, position: Position, width: number, name: string) {
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x6f9b8a,
    emissive: 0x152a21,
    roughness: 0.08,
    metalness: 0.12,
    transparent: true,
    opacity: 0.42,
    clearcoat: 1,
    side: THREE.DoubleSide,
  });
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(width, 1.65), material);
  pane.name = `${BREAKABLE_GLASS_PREFIX}${name}`;
  pane.position.set(...position);
  scene.add(pane);
}

function addStars(scene: THREE.Scene) {
  const positions: number[] = [];
  for (let index = 0; index < 90; index += 1) {
    const angle = index * 2.399;
    const distance = 28 + (index % 17);
    positions.push(
      Math.sin(angle) * distance,
      13 + ((index * 7) % 18),
      Math.cos(angle) * distance - 6,
    );
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ color: 0xc9d3bd, size: 0.12 });
  const stars = new THREE.Points(geometry, material);
  stars.name = 'night-stars';
  scene.add(stars);

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(2.2, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xbfc8aa }),
  );
  moon.position.set(-19, 19, -29);
  moon.name = 'night-moon';
  scene.add(moon);
}

function addStorefront(scene: THREE.Scene) {
  for (const x of [-5, 5]) {
    glass(scene, [x, 2, -9.15], 6.4, `storefront-${x}`);
    box(scene, 0x28332d, [6.6, 0.12, 0.14], [x, 2.86, -9.1]);
    box(scene, 0x28332d, [6.6, 0.12, 0.14], [x, 1.14, -9.1]);
    box(scene, 0x28332d, [0.12, 1.7, 0.14], [x, 2, -9.1]);
  }

  for (const x of [-7.1, -5.3, -3.5, 3.5, 5.3, 7.1]) {
    box(scene, 0xc3b16e, [1.4, 0.28, 0.35], [x, 3.55, -9], 0x493b18);
  }
  box(scene, 0x403a31, [1.4, 0.6, 1.3], [9.5, 0.3, -8.5]);
  box(scene, 0x74806f, [1.15, 0.12, 1.15], [9.5, 0.66, -8.5]);
}

function addLighting(scene: THREE.Scene) {
  for (const x of [-7, -2.4, 2.4, 7]) {
    box(scene, 0xf0dda0, [2.1, 0.08, 0.65], [x, 4.39, -4], 0x9b732e);
  }
  const canopyLight = new THREE.SpotLight(0xffdda0, 85, 15, Math.PI / 2.4, 0.8, 1.5);
  markDistanceCullable(canopyLight, 22);
  canopyLight.position.set(0, 4.1, -4);
  canopyLight.target.position.set(0, 0, -4);
  scene.add(canopyLight.target);
  scene.add(canopyLight);
  const shopLight = new THREE.PointLight(0xffe4aa, 28, 14, 1.6);
  markDistanceCullable(shopLight, 22);
  shopLight.position.set(0, 3.4, -16.5);
  scene.add(shopLight);
}

function addRoadsideJunk(scene: THREE.Scene) {
  for (const x of [-7.8, 7.8]) {
    box(scene, 0xd2bd64, [0.28, 1.05, 0.28], [x, 0.52, -8.8]);
  }
  box(scene, 0x6e4735, [0.85, 1.2, 0.85], [-8.4, 0.6, -5.8]);
  box(scene, 0x525e54, [0.75, 0.12, 0.75], [-8.4, 1.25, -5.8]);

  for (const z of [1.8, 5.8]) {
    box(scene, 0xbab08c, [3.2, 0.04, 0.12], [-5.6, 0.04, z]);
    box(scene, 0xbab08c, [3.2, 0.04, 0.12], [5.6, 0.04, z]);
  }

  box(scene, 0x454d43, [2.4, 0.7, 1.3], [-11, 0.4, -12]);
  box(scene, 0x454d43, [0.7, 1.8, 0.7], [-11, 1.45, -12]);
  box(scene, 0x454d43, [2.1, 0.45, 0.55], [-11, 2.35, -12]);
}

export function addGasStationDecor(scene: THREE.Scene) {
  addStars(scene);
  addStorefront(scene);
  addLighting(scene);
  addRoadsideJunk(scene);
}
