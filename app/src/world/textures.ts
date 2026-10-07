import * as THREE from 'three';

// DataTextures default to nearest-neighbour sampling, which magnifies into
// visible square pixels. Use smooth (linear) filtering instead.
function smooth(t: THREE.DataTexture): THREE.DataTexture {
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
}

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
  dot = smooth(new THREE.DataTexture(data, size, size, THREE.RGBAFormat));
  return dot;
}

// A wide, soft gaussian glow (for the moon and its halo).
let glow: THREE.DataTexture | null = null;

export function glowTexture(): THREE.DataTexture {
  if (glow) return glow;
  const size = 64;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - size / 2 + 0.5, y - size / 2 + 0.5) / (size / 2);
      // Bright core with a long, soft falloff that reaches zero at the edge.
      const a = Math.max(0, Math.exp(-d * d * 5) - Math.exp(-5) * d);
      const i = (y * size + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = 255;
      data[i + 3] = Math.round(Math.min(1, a) * 255);
    }
  }
  glow = smooth(new THREE.DataTexture(data, size, size, THREE.RGBAFormat));
  return glow;
}
