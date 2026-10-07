import * as THREE from 'three';

// A soft round glow for point sprites, built from raw pixels so it works on
// native (no DOM canvas) as well as web.
let dot: THREE.DataTexture | null = null;

export function dotTexture(): THREE.DataTexture {
  if (dot) return dot;
  const size = 32;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - size / 2 + 0.5, y - size / 2 + 0.5) / (size / 2);
      const a = Math.max(0, 1 - d) ** 2;
      const i = (y * size + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = 255;
      data[i + 3] = Math.round(a * 255);
    }
  }
  dot = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  dot.needsUpdate = true;
  return dot;
}
