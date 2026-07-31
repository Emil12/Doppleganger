import * as THREE from 'three';

function part(
  root: THREE.Group,
  size: [number, number, number],
  position: [number, number, number],
  material: THREE.Material,
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  root.add(mesh);
  return mesh;
}

function nameLabel(name: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  if (context) {
    context.fillStyle = 'rgba(8, 13, 10, 0.82)';
    context.fillRect(0, 8, 256, 48);
    context.strokeStyle = '#829b88';
    context.strokeRect(2, 10, 252, 44);
    context.fillStyle = '#d9e6d8';
    context.font = 'bold 24px monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(name.toUpperCase(), 128, 33, 238);
  }
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, depthTest: false });
  const sprite = new THREE.Sprite(material);
  sprite.position.y = 2.18;
  sprite.scale.set(1.8, 0.45, 1);
  return { sprite, texture, material };
}

export function createRemotePlayerModel(name: string, color: number) {
  const root = new THREE.Group();
  root.name = 'multiplayer-remote-player';
  const clothing = new THREE.MeshStandardMaterial({ color, roughness: 0.76 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xb8896e, roughness: 0.68 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x111613, roughness: 0.85 });
  const leftLeg = part(root, [0.21, 0.82, 0.23], [-0.15, 0.49, 0], clothing);
  const rightLeg = part(root, [0.21, 0.82, 0.23], [0.15, 0.49, 0], clothing);
  part(root, [0.62, 0.76, 0.32], [0, 1.23, 0], clothing);
  part(root, [0.21, 0.7, 0.21], [-0.43, 1.23, 0], clothing);
  part(root, [0.21, 0.7, 0.21], [0.43, 1.23, 0], clothing);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 9), skin);
  head.position.set(0, 1.78, 0);
  root.add(head);
  const label = nameLabel(name);
  root.add(label.sprite);

  const animate = (moving: boolean, downed: boolean, time: number) => {
    const stride = moving ? Math.sin(time * 0.012) * 0.38 : 0;
    leftLeg.rotation.x = stride;
    rightLeg.rotation.x = -stride;
    root.rotation.z = THREE.MathUtils.lerp(
      root.rotation.z,
      downed ? -Math.PI / 2 : 0,
      0.18,
    );
  };

  const dispose = () => {
    root.removeFromParent();
    root.traverse((object) => {
      if (object instanceof THREE.Mesh) object.geometry.dispose();
    });
    clothing.dispose();
    skin.dispose();
    dark.dispose();
    label.texture.dispose();
    label.material.dispose();
  };

  return { root, animate, dispose };
}
