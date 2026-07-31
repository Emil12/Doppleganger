import * as THREE from 'three';
import { createLightBudgetSystem } from './lightBudget';

const CULL_RADIUS_KEY = 'cullRadius';
const CULL_DISTANCE_KEY = 'cullDistance';
const LIGHT_DISTANCE_KEY = 'lightCullDistance';
const DISCOVERY_INTERVAL_MS = 500;

export function markCullable<T extends THREE.Object3D>(
  object: T,
  radius: number,
  maxDistance = 55,
) {
  object.userData[CULL_RADIUS_KEY] = radius;
  object.userData[CULL_DISTANCE_KEY] = maxDistance;
  return object;
}

export function markDistanceCullable<T extends THREE.Light>(light: T, maxDistance: number) {
  light.userData[LIGHT_DISTANCE_KEY] = maxDistance;
  return light;
}

export function createEntityCullingSystem(
  scene: THREE.Scene,
  initialCamera: THREE.Camera,
) {
  const frustum = new THREE.Frustum();
  const viewProjection = new THREE.Matrix4();
  const sphere = new THREE.Sphere();
  const worldPosition = new THREE.Vector3();
  const worldScale = new THREE.Vector3();
  let entities: THREE.Object3D[] = [];
  let nextDiscoveryAt = 0;
  const lightBudget = createLightBudgetSystem(scene, initialCamera, LIGHT_DISTANCE_KEY);

  const discover = (time: number) => {
    if (time < nextDiscoveryAt) return;
    nextDiscoveryAt = time + DISCOVERY_INTERVAL_MS;
    entities = scene.children.filter(
      (object) => Number(object.userData[CULL_RADIUS_KEY]) > 0,
    );
  };

  const update = (
    camera: THREE.Camera,
    time = performance.now(),
    updateLights = true,
    forceLightUpdate = false,
  ) => {
    discover(time);
    if (updateLights) lightBudget.update(camera, time, forceLightUpdate);
    camera.updateMatrixWorld();
    viewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(viewProjection);

    entities.forEach((entity) => {
      if (entity.parent !== scene) return;
      entity.getWorldPosition(worldPosition);
      entity.getWorldScale(worldScale);
      const radius = Number(entity.userData[CULL_RADIUS_KEY])
        * Math.max(worldScale.x, worldScale.y, worldScale.z);
      const maxDistance = Number(entity.userData[CULL_DISTANCE_KEY]);
      sphere.set(worldPosition, radius);
      entity.visible = worldPosition.distanceTo(camera.position) - radius <= maxDistance
        && frustum.intersectsSphere(sphere);
    });
  };

  const dispose = () => {
    entities.forEach((entity) => {
      if (entity.parent === scene) entity.visible = true;
    });
    entities = [];
    lightBudget.dispose();
  };

  return { update, dispose };
}
