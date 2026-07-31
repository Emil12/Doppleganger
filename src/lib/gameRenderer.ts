import * as THREE from 'three';

export function createGameRenderer(
  canvas: HTMLCanvasElement,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    precision: 'highp',
    powerPreference: 'high-performance',
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  let shadowFrame = 0;

  return {
    resize(width: number, height: number) {
      const pixelRatio = Math.min(window.devicePixelRatio, 1.5);
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    },
    render() {
      shadowFrame = (shadowFrame + 1) % 6;
      if (shadowFrame === 0) renderer.shadowMap.needsUpdate = true;
      renderer.render(scene, camera);
    },
    renderToTarget(feedCamera: THREE.PerspectiveCamera, target: THREE.WebGLRenderTarget) {
      renderer.setRenderTarget(target);
      renderer.render(scene, feedCamera);
      renderer.setRenderTarget(null);
    },
    dispose() {
      renderer.dispose();
    },
  };
}
