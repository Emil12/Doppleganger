import * as THREE from 'three';

const RAIN_NAME = 'night-rain';

function seeded(index: number, salt: number) {
  return Math.abs(Math.sin(index * 91.17 + salt * 14.31) * 43758.5453) % 1;
}

function addRain(scene: THREE.Scene) {
  const vertices: number[] = [];
  for (let index = 0; index < 140; index += 1) {
    const x = seeded(index, 1) * 70 - 35;
    const y = seeded(index, 2) * 24;
    const z = seeded(index, 3) * 55 - 28;
    vertices.push(x, y, z, x - 0.07, y - 0.55, z + 0.04);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  const material = new THREE.LineBasicMaterial({
    color: 0xaac4c5,
    transparent: true,
    opacity: 0.25,
    blending: THREE.AdditiveBlending,
  });
  const rain = new THREE.LineSegments(geometry, material);
  rain.name = RAIN_NAME;
  scene.add(rain);
}

function addPuddle(scene: THREE.Scene, x: number, z: number, width: number, depth: number) {
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x182522,
    roughness: 0.12,
    metalness: 0.25,
    transparent: true,
    opacity: 0.72,
    clearcoat: 1,
  });
  const puddle = new THREE.Mesh(new THREE.CircleGeometry(1, 20), material);
  puddle.rotation.x = -Math.PI / 2;
  puddle.scale.set(width, depth, 1);
  puddle.position.set(x, 0.015, z);
  puddle.receiveShadow = true;
  scene.add(puddle);
}

function addMist(scene: THREE.Scene) {
  const geometry = new THREE.PlaneGeometry(75, 20);
  const material = new THREE.MeshBasicMaterial({
    color: 0x8aa197,
    transparent: true,
    opacity: 0.025,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mist = new THREE.Mesh(geometry, material);
  mist.position.set(0, 3, -30);
  scene.add(mist);
}

export function addAtmosphere(scene: THREE.Scene) {
  addRain(scene);
  addPuddle(scene, -8, 1, 4.8, 1.2);
  addPuddle(scene, 6.5, -1, 3.2, 0.8);
  addPuddle(scene, 0, 8, 5.5, 1.1);
  addMist(scene);
}

export function updateAtmosphere(scene: THREE.Scene, delta: number) {
  const rain = scene.getObjectByName(RAIN_NAME);
  if (!rain) return;
  rain.position.y -= delta * 13;
  rain.position.x -= delta * 1.3;
  if (rain.position.y < -12) {
    rain.position.y = 0;
    rain.position.x = 0;
  }
}
