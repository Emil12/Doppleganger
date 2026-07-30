import * as THREE from 'three';
import { PUMP_POSITIONS } from './gasStationLayout';
import { lowPolyBox } from './lowPolyGeometry';

function surface(color: number, metalness = 0.1, roughness = 0.55) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness,
    roughness,
    flatShading: true,
    dithering: true,
  });
}

function addMesh(
  scene: THREE.Scene,
  geometry: THREE.BufferGeometry,
  color: number,
  position: [number, number, number],
  metalness = 0.1,
) {
  const object = new THREE.Mesh(geometry, surface(color, metalness));
  object.position.set(...position);
  object.castShadow = true;
  object.receiveShadow = true;
  scene.add(object);
  return object;
}

function addPumpShapes(scene: THREE.Scene) {
  for (const x of PUMP_POSITIONS) {
    addMesh(scene, lowPolyBox(1.08, 1.72, 1.28, 0.13), 0xd8cfad, [x, 0.86, -4.3], 0.18);
    addMesh(scene, lowPolyBox(1.38, 0.16, 1.55, 0.07), 0x8f8468, [x, 0.08, -4.3]);
    addMesh(scene, new THREE.CylinderGeometry(0.16, 0.2, 1.2, 8), 0xc9a842, [
      x - 0.86,
      0.6,
      -3.45,
    ]);
  }
}

function addRoofDetails(scene: THREE.Scene) {
  addMesh(scene, lowPolyBox(22.2, 0.7, 0.4, 0.12), 0x82775a, [0, 4.58, -1.05], 0.2);
  addMesh(scene, lowPolyBox(22.2, 0.7, 0.4, 0.12), 0x82775a, [0, 4.58, -6.95], 0.2);

  for (const x of [-5.5, 0, 5.5]) {
    addMesh(scene, new THREE.CylinderGeometry(0.55, 0.7, 0.5, 8), 0x4f5952, [
      x,
      4.75,
      -17,
    ], 0.65);
    addMesh(scene, new THREE.CylinderGeometry(0.72, 0.55, 0.18, 8), 0x303934, [
      x,
      5.08,
      -17,
    ], 0.65);
  }
  addMesh(scene, lowPolyBox(3.1, 1.1, 2.2, 0.18), 0x58625b, [4.6, 4.8, -14.2], 0.55);
  for (let x = 3.6; x < 5.8; x += 0.45) {
    addMesh(scene, new THREE.BoxGeometry(0.08, 0.6, 2.24), 0x272e2a, [x, 4.8, -14.2], 0.5);
  }
}

function beamBetween(scene: THREE.Scene, start: THREE.Vector3, end: THREE.Vector3) {
  const middle = start.clone().add(end).multiplyScalar(0.5);
  const length = start.distanceTo(end);
  const beam = addMesh(scene, new THREE.CylinderGeometry(0.07, 0.07, length, 6), 0x4f5148, [
    middle.x,
    middle.y,
    middle.z,
  ], 0.7);
  beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize());
}

function addCanopyTrusses(scene: THREE.Scene) {
  for (const x of [-9, -6, -3, 0, 3, 6, 9]) {
    beamBetween(scene, new THREE.Vector3(x, 4.35, -1.2), new THREE.Vector3(x, 4.05, -6.8));
    beamBetween(scene, new THREE.Vector3(x, 4.35, -1.2), new THREE.Vector3(x + 1.2, 4.05, -4));
    beamBetween(scene, new THREE.Vector3(x, 4.05, -6.8), new THREE.Vector3(x + 1.2, 4.05, -4));
  }
}

function addRoadsidePolygons(scene: THREE.Scene) {
  const rockGeometry = new THREE.DodecahedronGeometry(1, 0);
  const rockLocations: Array<[number, number, number, number]> = [
    [-13, 0.5, -18, 1.2],
    [14, 0.35, 1, 0.8],
    [-17, 0.3, 7, 0.65],
    [16, 0.45, -15, 1],
  ];
  for (const [x, y, z, scale] of rockLocations) {
    const rock = addMesh(scene, rockGeometry, 0x505348, [x, y, z]);
    rock.scale.set(scale * 1.5, scale, scale);
    rock.rotation.set(x * 0.03, z * 0.04, 0);
  }

  for (const z of [-18, 6]) {
    addMesh(scene, new THREE.CylinderGeometry(0.18, 0.24, 8, 7), 0x423a30, [-15, 4, z]);
    beamBetween(scene, new THREE.Vector3(-15, 7.5, z), new THREE.Vector3(-15, 7.5, z + 4));
  }
  const wire = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-15, 7.5, -18),
      new THREE.Vector3(-15, 6.7, -6),
      new THREE.Vector3(-15, 7.5, 6),
    ]),
    new THREE.LineBasicMaterial({ color: 0x171918 }),
  );
  scene.add(wire);
}

export function addPolygonDetails(scene: THREE.Scene) {
  addPumpShapes(scene);
  addRoofDetails(scene);
  addCanopyTrusses(scene);
  addRoadsidePolygons(scene);
}
