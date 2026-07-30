import * as THREE from 'three';

type Position = [number, number, number];

const warmWhite = 0xffe9bd;
const coolWhite = 0xd8f1e8;

function addCeilingLight(
  scene: THREE.Scene,
  position: Position,
  width: number,
  color: number,
  intensity: number,
  castsShadow = false,
) {
  const housing = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.18, 0.12, 0.42),
    new THREE.MeshStandardMaterial({ color: 0x313733, roughness: 0.75, flatShading: true }),
  );
  housing.position.set(position[0], position[1] + 0.04, position[2]);
  scene.add(housing);

  const tube = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.07, 0.25),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 4,
      roughness: 0.25,
      flatShading: true,
    }),
  );
  tube.position.set(...position);
  scene.add(tube);

  const light = new THREE.SpotLight(color, intensity, 13, Math.PI / 3, 0.65, 1.7);
  light.position.set(position[0], position[1] - 0.12, position[2]);
  light.target.position.set(position[0], 0, position[2]);
  light.castShadow = castsShadow;
  light.shadow.mapSize.set(512, 512);
  light.shadow.bias = -0.001;
  light.shadow.normalBias = 0.025;
  scene.add(light, light.target);
}

function addEntranceLight(scene: THREE.Scene, x: number) {
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 10, 6),
    new THREE.MeshBasicMaterial({ color: warmWhite }),
  );
  bulb.position.set(x, 2.65, -9.12);
  scene.add(bulb);

  const light = new THREE.PointLight(warmWhite, 18, 7, 1.8);
  light.position.copy(bulb.position);
  scene.add(light);
}

export function addStationLighting(scene: THREE.Scene) {
  [-7, -2.4, 2.4, 7].forEach((x, index) => {
    addCeilingLight(scene, [x, 4.2, -4], 2.8, coolWhite, 75, index === 1);
  });

  for (const z of [-12.5, -17, -21.5]) {
    addCeilingLight(scene, [-4.2, 3.92, z], 2.5, warmWhite, 48);
    addCeilingLight(scene, [0, 3.92, z], 2.5, coolWhite, 52, z === -17);
    addCeilingLight(scene, [4.2, 3.92, z], 2.5, warmWhite, 48);
  }

  addEntranceLight(scene, -2.15);
  addEntranceLight(scene, 2.15);
}
