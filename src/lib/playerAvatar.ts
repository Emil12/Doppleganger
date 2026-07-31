import * as THREE from 'three';
import { RESTROOM } from './gasStationLayout';
import {
  RESTROOM_MIRROR_NAME,
  RESTROOM_MIRROR_WALL_NAME,
} from './gasStationRestroom';

function part(
  group: THREE.Group,
  size: [number, number, number],
  position: [number, number, number],
  material: THREE.Material,
) {
  const object = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  object.position.set(...position);
  object.castShadow = true;
  object.receiveShadow = true;
  group.add(object);
  return object;
}

function createAvatar(fullBody: boolean, clothing: THREE.Material, skin: THREE.Material, shoes: THREE.Material) {
  const root = new THREE.Group();
  root.name = fullBody ? 'player-reflection-avatar' : 'player-visible-feet';
  const createLeg = (x: number) => {
    const leg = new THREE.Group();
    leg.position.x = x;
    part(leg, [0.2, 0.82, 0.22], [0, 0.52, 0], clothing);
    part(leg, [0.23, 0.14, 0.4], [0, 0.09, -0.09], shoes);
    root.add(leg);
    return leg;
  };
  const leftLeg = createLeg(-0.14);
  const rightLeg = createLeg(0.14);
  if (fullBody) {
    part(root, [0.58, 0.72, 0.3], [0, 1.18, 0], clothing);
    part(root, [0.24, 0.72, 0.2], [-0.42, 1.18, 0], clothing);
    part(root, [0.24, 0.72, 0.2], [0.42, 1.18, 0], clothing);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 18, 14), skin);
    head.scale.set(0.9, 1.12, 0.94);
    head.position.set(0, 1.73, 0);
    head.castShadow = true;
    root.add(head);
    for (const x of [-0.08, 0.08]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 7), shoes);
      eye.position.set(x, 1.77, -0.22);
      root.add(eye);
    }
  }
  return { root, leftLeg, rightLeg };
}

export function createPlayerAvatarSystem(
  scene: THREE.Scene,
  playerCamera: THREE.PerspectiveCamera,
) {
  const clothing = new THREE.MeshStandardMaterial({ color: 0x2d3b35, roughness: 0.78 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xb58b72, roughness: 0.68 });
  const shoes = new THREE.MeshStandardMaterial({ color: 0x111513, roughness: 0.86 });
  const feet = createAvatar(false, clothing, skin, shoes);
  const reflection = createAvatar(true, clothing, skin, shoes);
  const avatars = [feet, reflection] as const;
  reflection.root.traverse((object) => object.layers.set(1));
  scene.add(feet.root, reflection.root);

  const mirror = scene.getObjectByName(RESTROOM_MIRROR_NAME) as THREE.Mesh | undefined;
  const mirrorWall = scene.getObjectByName(RESTROOM_MIRROR_WALL_NAME);
  const renderTarget = new THREE.WebGLRenderTarget(256, 320, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
  });
  renderTarget.texture.colorSpace = THREE.SRGBColorSpace;
  const mirrorMaterial = new THREE.MeshBasicMaterial({
    map: renderTarget.texture,
    color: 0xb7c2bc,
  });
  if (mirror) {
    if (Array.isArray(mirror.material)) mirror.material.forEach((item) => item.dispose());
    else mirror.material.dispose();
    mirror.material = mirrorMaterial;
  }
  const mirrorCamera = new THREE.PerspectiveCamera(68, 0.82 / 1.05, 0.08, 35);
  mirrorCamera.layers.enable(1);
  let previousPosition = playerCamera.position.clone();
  let lastMirrorRenderAt = 0;
  const direction = new THREE.Vector3();
  const up = new THREE.Vector3();
  const lookTarget = new THREE.Vector3();
  const toMirror = new THREE.Vector3();

  const update = (yaw: number, time: number) => {
    const jumpHeight = Math.max(0, playerCamera.position.y - 1.65);
    const distance = Math.hypot(
      playerCamera.position.x - previousPosition.x,
      playerCamera.position.z - previousPosition.z,
    );
    const stride = distance > 0.0001 ? Math.sin(time * 0.012) * 0.34 : 0;
    for (const avatar of avatars) {
      avatar.root.position.set(playerCamera.position.x, jumpHeight, playerCamera.position.z);
      avatar.root.rotation.y = yaw;
      avatar.leftLeg.rotation.x = stride;
      avatar.rightLeg.rotation.x = -stride;
    }
    previousPosition.copy(playerCamera.position);
  };

  const renderMirror = (
    render: (camera: THREE.PerspectiveCamera, target: THREE.WebGLRenderTarget) => void,
  ) => {
    if (!mirror) return;
    toMirror.copy(mirror.position).sub(playerCamera.position);
    if (toMirror.lengthSq() > 6.5 ** 2) return;
    playerCamera.getWorldDirection(direction);
    if (direction.dot(toMirror.normalize()) < 0.08) return;
    const now = performance.now();
    if (now - lastMirrorRenderAt < 140) return;
    lastMirrorRenderAt = now;
    const mirrorX = RESTROOM.right - 0.14;
    up.set(0, 1, 0).applyQuaternion(playerCamera.quaternion);
    mirrorCamera.position.copy(playerCamera.position);
    mirrorCamera.position.x = mirrorX * 2 - playerCamera.position.x;
    direction.x *= -1;
    up.x *= -1;
    mirrorCamera.up.copy(up);
    mirrorCamera.fov = playerCamera.fov;
    mirrorCamera.updateProjectionMatrix();
    lookTarget.copy(mirrorCamera.position).add(direction);
    mirrorCamera.lookAt(lookTarget);
    feet.root.visible = false;
    mirror.visible = false;
    if (mirrorWall) mirrorWall.visible = false;
    render(mirrorCamera, renderTarget);
    feet.root.visible = true;
    mirror.visible = true;
    if (mirrorWall) mirrorWall.visible = true;
  };

  const dispose = () => {
    feet.root.removeFromParent();
    reflection.root.removeFromParent();
    renderTarget.dispose();
    mirrorMaterial.dispose();
    [clothing, skin, shoes].forEach((item) => item.dispose());
    for (const avatar of avatars) {
      avatar.root.traverse((object) => {
        if (object instanceof THREE.Mesh) object.geometry.dispose();
      });
    }
  };

  return { update, renderMirror, dispose };
}
