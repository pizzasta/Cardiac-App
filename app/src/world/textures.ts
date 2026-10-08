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

// A soft, lumpy cloud: an elliptical falloff broken up by a little value
// noise, so each sprite reads as a cloud rather than a blurry disc.
let cloud: THREE.DataTexture | null = null;

export function cloudTexture(): THREE.DataTexture {
  if (cloud) return cloud;
  const w = 128;
  const h = 64;
  const hash = (x: number, y: number) => {
    const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const noise = (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi) * (1 - u) + hash(xi + 1, yi) * u;
    const b = hash(xi, yi + 1) * (1 - u) + hash(xi + 1, yi + 1) * u;
    return a * (1 - v) + b * v;
  };
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (x - w / 2 + 0.5) / (w / 2);
      const dy = (y - h / 2 + 0.5) / (h / 2);
      // Flatter underneath, puffier on top.
      const d = Math.hypot(dx, dy * (dy > 0 ? 1.25 : 0.9));
      const n = 0.5 * noise(x / 10, y / 10) + 0.3 * noise(x / 5, y / 5) + 0.2 * noise(x / 2.5, y / 2.5);
      const a = Math.max(0, Math.min(1, (1 - d) * 1.6 - 0.25 + (n - 0.5) * 0.9));
      const i = (y * w + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = 255;
      data[i + 3] = Math.round(a * a * 255);
    }
  }
  cloud = smooth(new THREE.DataTexture(data, w, h, THREE.RGBAFormat));
  return cloud;
}
