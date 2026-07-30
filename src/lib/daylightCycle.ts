import * as THREE from 'three';
import { GAME_START_HOUR, REAL_MS_PER_GAME_HOUR } from './gameTime';

const DAY_START_HOUR = 4;
const DAWN_TRANSITION_MS = 25_000;
const NIGHT_SKY = new THREE.Color(0x101713);
const DAY_SKY = new THREE.Color(0x91b6bf);
const NIGHT_FOG = new THREE.Color(0x101713);
const DAY_FOG = new THREE.Color(0x9fb5b4);
const NIGHT_SUN = new THREE.Color(0xb8d4d0);
const DAY_SUN = new THREE.Color(0xffe0a3);
const DAY_AMBIENT = new THREE.Color(0xdde9dd);

export function createDaylightCycle(scene: THREE.Scene) {
  const ambient = scene.children.find(
    (object): object is THREE.HemisphereLight => object instanceof THREE.HemisphereLight,
  );
  const sun = scene.children.find(
    (object): object is THREE.DirectionalLight => object instanceof THREE.DirectionalLight,
  );
  const stars = scene.getObjectByName('night-stars') as THREE.Points | undefined;
  const moon = scene.getObjectByName('night-moon') as THREE.Mesh | undefined;
  let startedAt: number | null = null;

  const start = (time: number) => {
    startedAt = time;
  };

  const update = (time: number) => {
    if (startedAt === null) return;
    const dawnStartsAt =
      startedAt + (DAY_START_HOUR - GAME_START_HOUR) * REAL_MS_PER_GAME_HOUR;
    const daylight = THREE.MathUtils.clamp(
      (time - dawnStartsAt) / DAWN_TRANSITION_MS,
      0,
      1,
    );
    if (scene.background instanceof THREE.Color) {
      scene.background.copy(NIGHT_SKY).lerp(DAY_SKY, daylight);
    }
    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.color.copy(NIGHT_FOG).lerp(DAY_FOG, daylight);
      scene.fog.density = THREE.MathUtils.lerp(0.022, 0.009, daylight);
    }
    if (ambient) {
      ambient.intensity = THREE.MathUtils.lerp(0.65, 1.7, daylight);
      ambient.color.set(0x75958c).lerp(DAY_AMBIENT, daylight);
    }
    if (sun) {
      sun.intensity = THREE.MathUtils.lerp(1.1, 3.1, daylight);
      sun.color.copy(NIGHT_SUN).lerp(DAY_SUN, daylight);
      sun.position.y = THREE.MathUtils.lerp(5, 18, daylight);
    }
    if (stars) {
      const material = stars.material as THREE.PointsMaterial;
      material.transparent = true;
      material.opacity = 1 - daylight;
      stars.visible = daylight < 1;
    }
    if (moon) moon.visible = daylight < 0.7;
  };

  return { start, update };
}
