import * as THREE from 'three';

function createWoodTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 32;
  const context = canvas.getContext('2d');
  if (!context) return null;
  const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop(0, '#4a2112');
  gradient.addColorStop(0.45, '#8a4a25');
  gradient.addColorStop(1, '#562714');
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  for (let line = 0; line < 9; line += 1) {
    context.beginPath();
    const baseY = 4 + line * 3.7;
    for (let x = 0; x <= canvas.width; x += 8) {
      const y = baseY
        + Math.sin(x * 0.032 + line * 1.7) * (1.4 + (line % 4) * 0.5)
        + Math.sin(x * 0.009 + line) * 2;
      if (x === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.strokeStyle = line % 3 === 0 ? 'rgba(38, 13, 6, 0.48)' : 'rgba(222, 133, 69, 0.19)';
    context.lineWidth = line % 5 === 0 ? 2 : 0.8;
    context.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.repeat.set(2.4, 1);
  return texture;
}

export const bluedSteel = new THREE.MeshStandardMaterial({
  color: 0x11191c,
  metalness: 0.98,
  roughness: 0.17,
});

export const darkSteel = new THREE.MeshStandardMaterial({
  color: 0x050708,
  metalness: 0.92,
  roughness: 0.27,
});

export const boltSteel = new THREE.MeshStandardMaterial({
  color: 0x8d9693,
  metalness: 1,
  roughness: 0.13,
});

export const walnut = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  map: createWoodTexture(),
  roughness: 0.3,
});

export const brass = new THREE.MeshStandardMaterial({
  color: 0xb77a22,
  metalness: 0.88,
  roughness: 0.21,
});

export const rubber = new THREE.MeshStandardMaterial({
  color: 0x090b0a,
  roughness: 0.88,
  metalness: 0,
});
