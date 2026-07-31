import * as THREE from 'three';

const MAX_RENDER_WIDTH = 1280;
const SHADOW_UPDATE_INTERVAL = 10;

type ShadowLight = THREE.DirectionalLight | THREE.PointLight | THREE.SpotLight;

function shadowCastingLights(scene: THREE.Scene) {
  const lights: ShadowLight[] = [];
  scene.traverse((object) => {
    if (
      object.castShadow
      && (
        object instanceof THREE.DirectionalLight
        || object instanceof THREE.PointLight
        || object instanceof THREE.SpotLight
      )
    ) {
      lights.push(object);
    }
  });
  return lights;
}

function disposeSceneResources(scene: THREE.Scene) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    const meshMaterials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    meshMaterials.forEach((material) => materials.add(material));
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}

export function createGameRenderer(
  canvas: HTMLCanvasElement,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    precision: 'mediump',
    powerPreference: 'high-performance',
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  const shadowLights = shadowCastingLights(scene);
  let shadowFrame = 0;
  let shadowIndex = 0;
  let shadowsInitialized = false;
  let renderWidth = 0;
  let renderHeight = 0;
  let renderPixelRatio = 0;

  const scheduleShadowUpdate = () => {
    for (let checked = 0; checked < shadowLights.length; checked += 1) {
      const light = shadowLights[shadowIndex];
      shadowIndex = (shadowIndex + 1) % shadowLights.length;
      if (!light.visible) continue;
      light.shadow.needsUpdate = true;
      renderer.shadowMap.needsUpdate = true;
      return;
    }
  };

  return {
    resize(width: number, height: number) {
      const pixelRatio = Math.min(
        window.devicePixelRatio,
        1,
        MAX_RENDER_WIDTH / Math.max(width, 1),
      );
      if (
        width === renderWidth
        && height === renderHeight
        && pixelRatio === renderPixelRatio
      ) return;
      renderWidth = width;
      renderHeight = height;
      renderPixelRatio = pixelRatio;
      renderer.setDrawingBufferSize(width, height, pixelRatio);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    },
    render() {
      if (!shadowsInitialized) {
        renderer.render(scene, camera);
        shadowLights.forEach((light) => { light.shadow.autoUpdate = false; });
        shadowsInitialized = true;
        return;
      }
      shadowFrame = (shadowFrame + 1) % SHADOW_UPDATE_INTERVAL;
      if (shadowFrame === 0 && shadowLights.length > 0) scheduleShadowUpdate();
      renderer.render(scene, camera);
    },
    renderToTarget(feedCamera: THREE.PerspectiveCamera, target: THREE.WebGLRenderTarget) {
      renderer.setRenderTarget(target);
      renderer.render(scene, feedCamera);
      renderer.setRenderTarget(null);
    },
    dispose() {
      disposeSceneResources(scene);
      renderer.dispose();
    },
  };
}
