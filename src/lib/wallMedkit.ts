import * as THREE from 'three';

const MEDKIT_NAME = 'wall-medkit';
const USE_DISTANCE = 1.8;

function material(color: number) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.58,
    flatShading: true,
  });
}

export function addWallMedkit(scene: THREE.Scene) {
  const medkit = new THREE.Group();
  medkit.name = MEDKIT_NAME;
  medkit.position.set(-8.18, 1.55, -12.7);
  medkit.rotation.y = -Math.PI / 2;

  const caseBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.82, 0.18),
    material(0xe2ddc9),
  );
  const horizontalBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.12, 0.025),
    material(0xb9413b),
  );
  const verticalBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.42, 0.025),
    material(0xb9413b),
  );
  horizontalBar.position.z = -0.103;
  verticalBar.position.z = -0.104;
  medkit.add(caseBody, horizontalBar, verticalBar);
  scene.add(medkit);
}

export function wallMedkitDistance(scene: THREE.Scene, camera: THREE.Camera) {
  const medkit = scene.getObjectByName(MEDKIT_NAME);
  if (!medkit?.visible) return Number.POSITIVE_INFINITY;
  return medkit.position.distanceTo(camera.position);
}

export function useWallMedkit(
  scene: THREE.Scene,
  camera: THREE.Camera,
  healPlayer: () => boolean,
) {
  const medkit = scene.getObjectByName(MEDKIT_NAME);
  if (!medkit?.visible || wallMedkitDistance(scene, camera) >= USE_DISTANCE) return false;
  if (!healPlayer()) return false;
  medkit.visible = false;
  return true;
}
