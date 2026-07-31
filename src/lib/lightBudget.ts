import * as THREE from 'three';

const POINT_LIGHT_BUDGET = 4;
const SPOT_LIGHT_BUDGET = 6;
const LIGHT_SELECTION_INTERVAL_MS = 250;
const OUT_OF_RANGE_PENALTY = 1_000_000;

type LocalLight = THREE.PointLight | THREE.SpotLight;

type LightGroup<T extends LocalLight> = {
  reserved: T[];
  flexible: T[];
};

function lightGroup<T extends LocalLight>(): LightGroup<T> {
  return { reserved: [], flexible: [] };
}

function addLight<T extends LocalLight>(group: LightGroup<T>, light: T) {
  (light.castShadow ? group.reserved : group.flexible).push(light);
}

export function createLightBudgetSystem(
  scene: THREE.Scene,
  camera: THREE.Camera,
  markerKey: string,
) {
  const points = lightGroup<THREE.PointLight>();
  const spots = lightGroup<THREE.SpotLight>();
  const allLights: LocalLight[] = [];
  let viewpoint = camera.position;
  let nextSelectionAt = 0;

  scene.traverse((object) => {
    if (Number(object.userData[markerKey]) <= 0) return;
    if (object instanceof THREE.PointLight) addLight(points, object);
    if (object instanceof THREE.SpotLight) addLight(spots, object);
    if (object instanceof THREE.PointLight || object instanceof THREE.SpotLight) {
      allLights.push(object);
    }
  });

  const lightScore = (light: LocalLight) => {
    const distance = light.position.distanceToSquared(viewpoint);
    const maxDistance = Number(light.userData[markerKey]);
    return distance <= maxDistance ** 2 ? distance : distance + OUT_OF_RANGE_PENALTY;
  };

  const byDistance = (first: LocalLight, second: LocalLight) => (
    lightScore(first) - lightScore(second)
  );

  const applyGroup = <T extends LocalLight>(group: LightGroup<T>, budget: number) => {
    group.reserved.forEach((light) => { light.visible = true; });
    group.flexible.sort(byDistance);
    const flexibleBudget = Math.max(0, budget - group.reserved.length);
    // Keep each light type's count fixed so Three.js reuses one shader program.
    group.flexible.forEach((light, index) => {
      light.visible = index < flexibleBudget;
    });
  };

  const update = (nextCamera: THREE.Camera, time = performance.now(), force = false) => {
    if (!force && time < nextSelectionAt) return;
    nextSelectionAt = time + LIGHT_SELECTION_INTERVAL_MS;
    viewpoint = nextCamera.position;
    applyGroup(points, POINT_LIGHT_BUDGET);
    applyGroup(spots, SPOT_LIGHT_BUDGET);
  };

  const dispose = () => {
    allLights.forEach((light) => { light.visible = true; });
  };

  update(camera, 0, true);
  return { update, dispose };
}
