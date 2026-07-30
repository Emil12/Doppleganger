import * as THREE from 'three';

export type PixelTexture = 'asphalt' | 'concrete' | 'metal' | 'tile' | 'wall' | 'wood';

const TEXTURE_SIZE = 128;
const materialCache = new Map<string, THREE.MeshStandardMaterial>();
const palette: Record<PixelTexture, [number, number, number]> = {
  asphalt: [50, 54, 51],
  concrete: [101, 102, 92],
  metal: [91, 101, 96],
  tile: [82, 98, 91],
  wall: [75, 91, 81],
  wood: [112, 75, 48],
};

function noise(index: number, salt: number) {
  return Math.abs(Math.sin(index * 78.233 + salt * 17.17) * 43758.5453) % 1;
}

function paintNoise(context: CanvasRenderingContext2D, kind: PixelTexture) {
  const [red, green, blue] = palette[kind];
  for (let y = 0; y < TEXTURE_SIZE; y += 1) {
    for (let x = 0; x < TEXTURE_SIZE; x += 1) {
      const grain = Math.floor(noise(x + y * TEXTURE_SIZE, kind.length) * 25 - 12);
      context.fillStyle = `rgb(${red + grain},${green + grain},${blue + grain})`;
      context.fillRect(x, y, 1, 1);
    }
  }
}

function paintGrid(context: CanvasRenderingContext2D, step: number) {
  context.strokeStyle = 'rgba(18, 29, 25, 0.65)';
  context.lineWidth = 2;
  for (let line = 0; line <= TEXTURE_SIZE; line += step) {
    context.beginPath();
    context.moveTo(line, 0);
    context.lineTo(line, TEXTURE_SIZE);
    context.moveTo(0, line);
    context.lineTo(TEXTURE_SIZE, line);
    context.stroke();
  }
}

function paintPattern(context: CanvasRenderingContext2D, kind: PixelTexture) {
  if (kind === 'tile') paintGrid(context, 32);
  if (kind === 'wall') {
    context.fillStyle = 'rgba(25, 33, 28, 0.42)';
    for (let y = 31; y < TEXTURE_SIZE; y += 32) context.fillRect(0, y, TEXTURE_SIZE, 2);
    for (let y = 0; y < TEXTURE_SIZE; y += 32) {
      const offset = (y / 32) % 2 === 0 ? 0 : 32;
      for (let x = offset; x < TEXTURE_SIZE; x += 64) context.fillRect(x, y, 2, 32);
    }
  }
  if (kind === 'metal') {
    context.fillStyle = 'rgba(210, 220, 205, 0.1)';
    for (let x = 8; x < TEXTURE_SIZE; x += 16) context.fillRect(x, 0, 2, TEXTURE_SIZE);
    context.fillStyle = 'rgba(86, 43, 29, 0.4)';
    for (let index = 0; index < 15; index += 1) {
      context.fillRect(
        Math.floor(noise(index, 4) * (TEXTURE_SIZE - 4)),
        Math.floor(noise(index, 8) * (TEXTURE_SIZE - 4)),
        4,
        2,
      );
    }
  }
  if (kind === 'wood') {
    context.fillStyle = 'rgba(48, 24, 14, 0.32)';
    for (let y = 14; y < TEXTURE_SIZE; y += 18) context.fillRect(0, y, TEXTURE_SIZE, 2);
  }
  if (kind === 'concrete') {
    context.strokeStyle = 'rgba(34, 37, 34, 0.38)';
    context.beginPath();
    context.moveTo(16, TEXTURE_SIZE);
    context.lineTo(50, 72);
    context.lineTo(42, 38);
    context.lineTo(88, 0);
    context.stroke();
  }
  if (kind === 'asphalt') {
    context.fillStyle = 'rgba(185, 181, 145, 0.38)';
    for (let index = 0; index < 48; index += 1) {
      context.fillRect(
        Math.floor(noise(index, 2) * TEXTURE_SIZE),
        Math.floor(noise(index, 7) * TEXTURE_SIZE),
        1,
        1,
      );
    }
  }
}

export function pixelMaterial(
  kind: PixelTexture,
  repeatX: number,
  repeatY: number,
  tint = 0xffffff,
) {
  const cacheKey = `${kind}-${repeatX}-${repeatY}-${tint}`;
  const cached = materialCache.get(cacheKey);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = TEXTURE_SIZE;
  canvas.height = TEXTURE_SIZE;
  const context = canvas.getContext('2d');
  if (!context) {
    return new THREE.MeshStandardMaterial({ color: tint, roughness: 0.8, flatShading: true });
  }
  paintNoise(context, kind);
  paintPattern(context, kind);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestMipmapNearestFilter;
  const roughness = kind === 'metal' ? 0.55 : kind === 'tile' ? 0.62 : 0.88;
  const material = new THREE.MeshStandardMaterial({
    color: tint,
    map: texture,
    bumpMap: texture,
    bumpScale: kind === 'wall' ? 0.018 : 0.035,
    roughness,
    metalness: kind === 'metal' ? 0.22 : 0.02,
    flatShading: true,
    dithering: true,
  });
  materialCache.set(cacheKey, material);
  return material;
}
