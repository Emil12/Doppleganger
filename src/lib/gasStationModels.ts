import * as THREE from 'three';
import { PUMP_POSITIONS } from './gasStationLayout';
import { lowPolyBox } from './lowPolyGeometry';
import { markCullable } from './entityCulling';

function material(color: number, metalness = 0.1, roughness = 0.55) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness,
    roughness,
    flatShading: true,
    dithering: true,
  });
}

function mesh(
  scene: THREE.Scene,
  geometry: THREE.BufferGeometry,
  color: number,
  x: number,
  y: number,
  z: number,
  metalness = 0.1,
) {
  const object = new THREE.Mesh(geometry, material(color, metalness));
  object.position.set(x, y, z);
  object.castShadow = true;
  object.receiveShadow = true;
  scene.add(object);
  return object;
}

function addPumpDetails(scene: THREE.Scene, x: number) {
  mesh(scene, new THREE.BoxGeometry(0.82, 0.52, 0.08), 0x17221c, x, 1.18, -3.63);
  mesh(scene, new THREE.BoxGeometry(0.56, 0.3, 0.04), 0x9ed5ae, x, 1.2, -3.57);
  mesh(scene, new THREE.BoxGeometry(0.72, 0.12, 0.12), 0xbc3f36, x, 1.62, -3.68);

  const hose = mesh(
    scene,
    new THREE.TorusGeometry(0.58, 0.045, 6, 16, Math.PI * 1.45),
    0x111713,
    x + 0.58,
    0.92,
    -4.25,
  );
  hose.rotation.y = Math.PI / 2;
  hose.rotation.z = -0.25;
  const nozzle = mesh(scene, new THREE.BoxGeometry(0.12, 0.42, 0.1), 0x202923, x + 0.77, 1.2, -4.15);
  nozzle.rotation.z = -0.2;
}

function addCar(scene: THREE.Scene) {
  const car = markCullable(new THREE.Group(), 3.3, 60);
  car.position.set(-11, 0, 2.5);
  car.rotation.y = -0.13;
  scene.add(car);

  const body = new THREE.Mesh(lowPolyBox(4.5, 0.8, 2, 0.22), material(0x7c2926, 0.35, 0.3));
  body.position.y = 0.75;
  car.add(body);
  const cabin = new THREE.Mesh(lowPolyBox(2.4, 0.85, 1.72, 0.2), material(0x263536, 0.2, 0.18));
  cabin.position.set(-0.15, 1.45, 0);
  car.add(cabin);
  const hood = new THREE.Mesh(lowPolyBox(1.3, 0.18, 1.86, 0.07), material(0xa33d32, 0.3, 0.28));
  hood.position.set(1.65, 1.18, 0);
  car.add(hood);

  for (const x of [-1.45, 1.45]) {
    for (const z of [-1.03, 1.03]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.25, 10), material(0x121412));
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x, 0.48, z);
      car.add(wheel);
    }
  }
  for (const z of [-0.65, 0.65]) {
    const lens = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.25, 0.38),
      new THREE.MeshStandardMaterial({
        color: 0xffe0a0,
        emissive: 0xffa633,
        flatShading: true,
      }),
    );
    lens.position.set(2.27, 0.9, z);
    car.add(lens);
  }
}

export function addDetailedModels(scene: THREE.Scene) {
  PUMP_POSITIONS.forEach((x) => addPumpDetails(scene, x));
  addCar(scene);
}
