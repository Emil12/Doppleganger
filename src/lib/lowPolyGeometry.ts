import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export function lowPolyBox(width: number, height: number, depth: number, radius = 0.12) {
  const safeRadius = Math.min(radius, width / 3, height / 3, depth / 3);
  return new RoundedBoxGeometry(width, height, depth, 1, safeRadius);
}
