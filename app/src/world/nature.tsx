// Living details for the world: swaying grass and wheat, trees, flowers,
// water, drifting clouds, sun glare, shooting stars, the aurora and each
// biome's particles. Plants are instanced (one draw call per kind per ground
// tile) and the grass sways in the vertex shader, so it stays cheap on phones.
import React, { useEffect, useMemo, useRef } from 'react';
import { Platform } from 'react-native';
import * as THREE from 'three';
import { useFrame } from './fiber';
import { Biome, heightIn, WATER_LEVEL } from './biomes';
import { cloudTexture, dotTexture, glowTexture } from './textures';
import { TILE_LENGTH } from './rig';

const NATIVE = Platform.OS !== 'web';

// The smoothed scene values every layer reads (see World.tsx).
export interface SceneParams {
  t: number;
  travel: number;
  glow: number;
  day: number;
  dusk: number;
  elevation: number;
  color: THREE.Color;
  fog: THREE.Color;
}
type P = React.MutableRefObject<SceneParams>;

// Small seeded random so every tile is laid out the same way each launch.
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const m4 = new THREE.Matrix4();
const q = new THREE.Quaternion();
const v = new THREE.Vector3();
const sc = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

function place(mesh: THREE.InstancedMesh, i: number, x: number, y: number, z: number, sx: number, sy: number, sz: number, rot: number) {
  q.setFromAxisAngle(UP, rot);
  m4.compose(v.set(x, y, z), q, sc.set(sx, sy, sz));
  mesh.setMatrixAt(i, m4);
}

// ---------------------------------------------------------------------------
// Grass and wheat

const grassTime = { value: 0 };
// Plants are lit by hand rather than by the scene lights, so they read
// clearly at dusk and night: a cool moonlit tint, warm in the day and blushing
// at sunset. Shared by every plant material and updated once per frame.
const plantLight = new THREE.Color('#ffffff');
const MOONLIT = new THREE.Color('#5d6684');
const SUNLIT = new THREE.Color('#fff3e2');
const SUNSET = new THREE.Color('#ffb2c6');

function bladeGeometry(base: string, tip: string): THREE.BufferGeometry {
  const g = new THREE.PlaneGeometry(0.07, 1, 1, 3);
  g.translate(0, 0.5, 0);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const a = new THREE.Color(base);
  const b = new THREE.Color(tip);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    pos.setX(i, pos.getX(i) * (1 - y * 0.85));
    c.copy(a).lerp(b, y);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return g;
}

let swayMat: THREE.MeshBasicMaterial | null = null;
function swayMaterial(): THREE.MeshBasicMaterial {
  if (swayMat) return swayMat;
  const m = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, color: plantLight });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = grassTime;
    shader.vertexShader =
      'uniform float uTime;\n' +
      shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vec4 root = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        float bend = position.y * position.y;
        transformed.x += sin(uTime * 1.7 + root.x * 0.35 + root.z * 0.27) * bend * 0.22;
        transformed.z += cos(uTime * 1.3 + root.x * 0.21) * bend * 0.10;`
      );
  };
  swayMat = m;
  return m;
}

// Advances the grass sway and the plant lighting; render once per scene.
export function GrassClock({ params }: { params: P }) {
  useFrame(() => {
    const p = params.current;
    grassTime.value = p.t;
    plantLight.copy(MOONLIT).lerp(SUNLIT, Math.min(1, p.day * 1.2)).lerp(SUNSET, p.dusk * 0.45);
    if (swayMat) swayMat.color.copy(plantLight);
    flowerMat.color.copy(plantLight).lerp(SUNLIT, 0.35);
  });
  return null;
}

function Grass({ biome, seed }: { biome: Biome; seed: number }) {
  const spec = biome.grass!;
  const geometry = useMemo(() => bladeGeometry(spec.base, spec.tip), [spec.base, spec.tip]);
  const mesh = useMemo(() => {
    const count = Math.round(spec.density * (NATIVE ? 0.45 : 1));
    const m = new THREE.InstancedMesh(geometry, swayMaterial(), count);
    const r = rng(seed * 7919 + 13);
    let n = 0;
    for (let i = 0; i < count; i++) {
      // Denser near the path, thinning out up the hillsides.
      const x = (r() < 0.5 ? -1 : 1) * Math.pow(r(), 1.5) * spec.spread;
      const z = (r() - 0.5) * TILE_LENGTH;
      const y = heightIn(biome, x, z);
      if (biome.water && y < WATER_LEVEL + 0.05) continue;
      const h = spec.height * (0.6 + r() * 0.8);
      place(m, n++, x, y - 0.02, z, 0.8 + r() * 0.6, h, 1, r() * Math.PI);
    }
    m.count = n;
    m.instanceMatrix.needsUpdate = true;
    m.frustumCulled = false;
    return m;
  }, [geometry, biome, spec, seed]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <primitive object={mesh} />;
}

// ---------------------------------------------------------------------------
// Trees

const TRUNK = new THREE.CylinderGeometry(0.12, 0.2, 1, 6).translate(0, 0.5, 0);
const CONE = new THREE.ConeGeometry(1, 1, 9).translate(0, 0.5, 0);
const BALL = new THREE.SphereGeometry(1, 12, 9);
const lambert = () => new THREE.MeshLambertMaterial({ color: '#ffffff' });

function Trees({ biome, seed }: { biome: Biome; seed: number }) {
  const spec = biome.trees!;
  const meshes = useMemo(() => {
    const count = Math.max(1, Math.round(spec.count * (NATIVE ? 0.6 : 1)));
    const trunk = new THREE.InstancedMesh(TRUNK, lambert(), count);
    const crown = new THREE.InstancedMesh(spec.kind === 'pine' ? CONE : BALL, lambert(), count);
    const upper = spec.kind === 'pine' ? new THREE.InstancedMesh(CONE, lambert(), count) : null;
    const snow = spec.kind === 'pine' && biome.id === 'wolf' ? new THREE.InstancedMesh(CONE, lambert(), count) : null;
    const r = rng(seed * 104729 + 7);
    const c = new THREE.Color();
    const trunkColor = new THREE.Color(spec.trunk);
    let n = 0;
    for (let i = 0; i < count; i++) {
      const side = r() < 0.5 ? -1 : 1;
      const x = side * (spec.near + r() * (spec.far - spec.near));
      const z = (r() - 0.5) * TILE_LENGTH;
      const y = heightIn(biome, x, z);
      if (biome.water && y < WATER_LEVEL + 0.1) continue;
      const s = spec.size * (0.75 + r() * 0.7);
      const rot = r() * Math.PI * 2;
      c.set(spec.crowns[Math.floor(r() * spec.crowns.length)]);
      if (spec.kind === 'pine') {
        const trunkH = 0.9 * s;
        const w = 1.25 * s;
        const h = 3.4 * s;
        place(trunk, n, x, y - 0.1, z, s, trunkH, s, rot);
        place(crown, n, x, y + trunkH * 0.6, z, w, h * 0.62, w, rot);
        place(upper!, n, x, y + trunkH * 0.6 + h * 0.38, z, w * 0.68, h * 0.55, w * 0.68, rot);
        if (snow) place(snow, n, x, y + trunkH * 0.6 + h * 0.66, z, w * 0.36, h * 0.28, w * 0.36, rot);
        upper!.setColorAt(n, c);
      } else {
        const trunkH = 1.7 * s;
        const rad = 1.35 * s;
        place(trunk, n, x, y - 0.1, z, s * 1.2, trunkH, s * 1.2, rot);
        place(crown, n, x, y + trunkH + rad * 0.55, z, rad, rad * 0.9, rad, rot);
      }
      crown.setColorAt(n, c);
      trunk.setColorAt(n, trunkColor);
      if (snow) snow.setColorAt(n, c.set('#eef3f8'));
      n++;
    }
    const all = [trunk, crown, upper, snow].filter(Boolean) as THREE.InstancedMesh[];
    all.forEach((m) => {
      m.count = n;
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      m.frustumCulled = false;
    });
    return all;
  }, [biome, spec, seed]);
  useEffect(() => () => meshes.forEach((m) => (m.material as THREE.Material).dispose()), [meshes]);
  return (
    <>
      {meshes.map((m, i) => (
        <primitive key={i} object={m} />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Flowers

const BLOOM = new THREE.SphereGeometry(0.075, 7, 5);
const flowerMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });

function Flowers({ biome, seed }: { biome: Biome; seed: number }) {
  const spec = biome.flowers!;
  const mesh = useMemo(() => {
    const count = Math.round(spec.count * (NATIVE ? 0.5 : 1));
    const m = new THREE.InstancedMesh(BLOOM, flowerMat, count);
    const r = rng(seed * 31337 + 3);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const side = r() < 0.5 ? -1 : 1;
      const x = side * (1.2 + r() * 22);
      const z = (r() - 0.5) * TILE_LENGTH;
      const y = heightIn(biome, x, z);
      const s = 0.8 + r() * 0.8;
      place(m, i, x, y + 0.22 + r() * 0.15, z, s, s * 0.8, s, 0);
      m.setColorAt(i, c.set(spec.colors[Math.floor(r() * spec.colors.length)]));
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.frustumCulled = false;
    return m;
  }, [biome, spec, seed]);
  return <primitive object={mesh} />;
}

// Everything that grows on one ground tile (rides along as the tile moves).
export function TileFlora({ biome, seed }: { biome: Biome; seed: number }) {
  return (
    <>
      {biome.grass && <Grass biome={biome} seed={seed} />}
      {biome.trees && <Trees biome={biome} seed={seed} />}
      {biome.flowers && <Flowers biome={biome} seed={seed} />}
    </>
  );
}

// ---------------------------------------------------------------------------
// Water

export function Water({ biome, params }: { biome: Biome; params: P }) {
  const spec = biome.water!;
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uTravel: { value: 0 } }), []);
  const { geometry, material } = useMemo(() => {
    const seg = NATIVE ? 60 : 120;
    const g = new THREE.PlaneGeometry(700, 700, seg, seg);
    g.rotateX(-Math.PI / 2);
    const m = new THREE.MeshStandardMaterial({
      color: spec.color,
      roughness: 0.22,
      metalness: 0.3,
      transparent: true,
      opacity: 0.93,
      emissive: spec.glow ?? '#000000',
      emissiveIntensity: 0,
    });
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uniforms.uTime;
      shader.uniforms.uTravel = uniforms.uTravel;
      shader.vertexShader =
        'uniform float uTime;\nuniform float uTravel;\n' +
        shader.vertexShader.replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
          float wz = position.z - uTravel;
          transformed.y += sin(position.x * 0.18 + wz * 0.22 + uTime * 1.1) * 0.09
            + sin(position.x * 0.43 - wz * 0.31 + uTime * 1.8) * 0.04;`
        );
    };
    return { geometry: g, material: m };
  }, [spec, uniforms]);
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material]
  );
  const sky = useMemo(() => new THREE.Color(), []);
  useFrame((_, rawDt) => {
    const p = params.current;
    uniforms.uTime.value = p.t;
    uniforms.uTravel.value += p.travel * Math.min(rawDt, 0.05);
    if (spec.glow) {
      material.emissiveIntensity = (0.12 + 0.12 * Math.sin(p.t * 0.8)) * (1 - 0.8 * p.day);
    } else {
      // No real reflections, so borrow the sky's colour: pink at sunset,
      // silvery by day, deep blue at night.
      material.emissive.copy(sky.copy(p.fog).lerp(SUNSET, p.dusk * 0.7));
      material.emissiveIntensity = 0.28 + 0.2 * p.day + 0.2 * p.dusk;
    }
  });
  return <mesh geometry={geometry} material={material} position={[0, WATER_LEVEL, -200]} />;
}

// ---------------------------------------------------------------------------
// Particles: fireflies, snow, leaves, pollen or glints, by biome.

export function Particles({ biome, params }: { biome: Biome; params: P }) {
  const { mode, colors, size } = biome.particles;
  const count = Math.round((mode === 'snow' ? 600 : mode === 'leaves' ? 260 : 220) * (NATIVE ? 0.5 : 1));
  const wide = mode === 'snow' || mode === 'leaves' || mode === 'pollen';
  const mat = useRef<THREE.PointsMaterial>(null);
  const { geometry, seeds } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const seeds = new Float32Array(count * 2);
    const r = rng(count + mode.length);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (r() - 0.5) * (wide ? 70 : 34);
      pos[i * 3 + 1] = mode === 'spark' ? 0.15 + r() * 1.4 : 0.4 + r() * (wide ? 12 : 3.5);
      pos[i * 3 + 2] = 6 - r() * 50;
      seeds[i * 2] = r() * Math.PI * 2;
      seeds[i * 2 + 1] = 0.3 + r() * 0.9;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return { geometry: g, seeds };
  }, [count, mode, wide]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const base = useMemo(() => new THREE.Color(colors[0]), [colors]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const p = params.current;
    const arr = (geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
    for (let i = 0; i < count; i++) {
      const ph = seeds[i * 2];
      const f = seeds[i * 2 + 1];
      const j = i * 3;
      if (mode === 'snow') {
        arr[j] += Math.sin(p.t * f + ph) * 0.006;
        arr[j + 1] -= (0.5 + f * 0.5) * dt;
      } else if (mode === 'leaves') {
        arr[j] += Math.sin(p.t * f * 1.4 + ph) * 0.02;
        arr[j + 1] -= (0.35 + f * 0.3) * dt;
      } else if (mode === 'pollen') {
        arr[j] += Math.sin(p.t * f + ph) * 0.004;
        arr[j + 1] += (0.08 + f * 0.1) * dt;
      } else {
        arr[j] += Math.sin(p.t * f + ph) * 0.004;
        arr[j + 1] += Math.cos(p.t * f * 0.8 + ph) * 0.003;
      }
      if (arr[j + 1] < 0) arr[j + 1] += 12;
      if (arr[j + 1] > 13) arr[j + 1] -= 12;
      arr[j + 2] += p.travel * dt;
      if (arr[j + 2] > 8) arr[j + 2] -= 50;
    }
    geometry.attributes.position.needsUpdate = true;
    if (mat.current) {
      const night = 1 - 0.75 * p.day;
      const lit = mode === 'firefly' || mode === 'spark';
      mat.current.color.copy(base);
      mat.current.opacity = lit ? (0.6 + 0.3 * Math.sin(p.t * 1.7)) * night * p.glow : 0.85 * p.glow;
    }
  });

  return (
    <points geometry={geometry}>
      <pointsMaterial
        ref={mat}
        size={mode === 'snow' || mode === 'leaves' || mode === 'pollen' ? size * 1.6 : size}
        map={dotTexture()}
        transparent
        depthWrite={false}
        blending={mode === 'firefly' || mode === 'spark' ? THREE.AdditiveBlending : THREE.NormalBlending}
        sizeAttenuation
      />
    </points>
  );
}

// ---------------------------------------------------------------------------
// Sky details

function sunDir(elevation: number, out: THREE.Vector3) {
  return out.setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - elevation), Math.PI);
}

// Soft glare and a long horizontal flare around a low sun.
export function SunGlare({ params }: { params: P }) {
  const group = useRef<THREE.Group>(null);
  const mats = useRef<(THREE.SpriteMaterial | null)[]>([]);
  const warm = useMemo(() => new THREE.Color('#ffcf9a'), []);
  const pink = useMemo(() => new THREE.Color('#ff5c9a'), []);
  const dir = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const p = params.current;
    if (!group.current) return;
    sunDir(p.elevation, dir);
    group.current.position.copy(dir).multiplyScalar(800);
    const rise = Math.max(0, Math.min(1, (p.elevation + 3) / 4));
    const high = Math.max(0, Math.min(1, (p.elevation - 3) / 6));
    const strength = rise * (1 - 0.55 * high);
    mats.current.forEach((m, i) => {
      if (!m) return;
      m.color.copy(warm).lerp(pink, p.dusk * 0.8);
      m.opacity = strength * [0.55, 0.22, 0.14][i];
    });
  });
  const sprites: [number, number][] = [
    [340, 340],
    [1400, 30],
    [800, 12],
  ];
  return (
    <group ref={group}>
      {sprites.map(([w, h], i) => (
        <sprite key={i} scale={[w, h, 1]}>
          <spriteMaterial
            ref={(m) => {
              mats.current[i] = m;
            }}
            map={glowTexture()}
            transparent
            depthWrite={false}
            fog={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      ))}
    </group>
  );
}

// Slow clouds, lit by the time of day and blushing pink at sunset.
export function Clouds({ params }: { params: P }) {
  const count = NATIVE ? 6 : 10;
  const layout = useMemo(() => {
    const r = rng(42);
    return Array.from({ length: count }, () => ({
      x: (r() - 0.5) * 1100,
      y: 70 + r() * 70,
      z: -260 - r() * 260,
      w: 220 + r() * 160,
      h: 55 + r() * 35,
      speed: 1.5 + r() * 2,
    }));
  }, [count]);
  const sprites = useRef<(THREE.Sprite | null)[]>([]);
  const mats = useRef<(THREE.SpriteMaterial | null)[]>([]);
  const night = useMemo(() => new THREE.Color('#2a2d40'), []);
  const day = useMemo(() => new THREE.Color('#f1ecf4'), []);
  const blush = useMemo(() => new THREE.Color('#ff6f9f'), []);
  useFrame((_, rawDt) => {
    const p = params.current;
    const dt = Math.min(rawDt, 0.05);
    sprites.current.forEach((s, i) => {
      if (!s) return;
      s.position.x += layout[i].speed * dt;
      if (s.position.x > 650) s.position.x -= 1300;
    });
    mats.current.forEach((m) => {
      if (!m) return;
      m.color.copy(night).lerp(day, p.day).lerp(blush, p.dusk * 0.7);
      m.opacity = 0.3 + 0.3 * p.day + 0.15 * p.dusk;
    });
  });
  return (
    <>
      {layout.map((c, i) => (
        <sprite
          key={i}
          ref={(s) => {
            sprites.current[i] = s;
          }}
          position={[c.x, c.y, c.z]}
          scale={[c.w, c.h, 1]}
        >
          <spriteMaterial
            ref={(m) => {
              mats.current[i] = m;
            }}
            map={cloudTexture()}
            transparent
            depthWrite={false}
            fog={false}
          />
        </sprite>
      ))}
    </>
  );
}

// Now and then at night, a shooting star crosses the sky.
export function ShootingStar({ params }: { params: P }) {
  const sprite = useRef<THREE.Sprite>(null);
  const mat = useRef<THREE.SpriteMaterial>(null);
  const state = useRef({ next: 6, age: -1, from: new THREE.Vector3(), vel: new THREE.Vector3() });
  const ANGLE = -0.42;
  useFrame((_, rawDt) => {
    const p = params.current;
    const s = state.current;
    const dt = Math.min(rawDt, 0.05);
    if (!sprite.current || !mat.current) return;
    if (s.age < 0) {
      mat.current.opacity = 0;
      if (p.day > 0.25) return;
      s.next -= dt;
      if (s.next > 0) return;
      s.next = 7 + Math.random() * 10;
      s.age = 0;
      s.from.set(-350 + Math.random() * 500, 220 + Math.random() * 140, -650);
      // Travel along the streak (down and to the right).
      s.vel.set(Math.cos(ANGLE), Math.sin(ANGLE), 0).multiplyScalar(520);
    }
    s.age += dt;
    const life = 0.8;
    if (s.age > life) {
      s.age = -1;
      return;
    }
    sprite.current.position.copy(s.from).addScaledVector(s.vel, s.age);
    mat.current.opacity = Math.sin((Math.PI * s.age) / life) * (1 - p.day * 2);
  });
  return (
    <sprite ref={sprite} scale={[80, 2.4, 1]}>
      <spriteMaterial
        ref={mat}
        map={glowTexture()}
        rotation={ANGLE}
        transparent
        depthWrite={false}
        fog={false}
        blending={THREE.AdditiveBlending}
      />
    </sprite>
  );
}

// The northern lights: slow green and violet curtains, visible at night.
export function Aurora({ params }: { params: P }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 } },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        vertexShader: `
          uniform float uTime;
          varying vec2 vUv;
          void main() {
            vUv = uv;
            vec3 p = position;
            p.z += sin(p.x * 0.012 + uTime * 0.25) * 40.0 + sin(p.x * 0.031 - uTime * 0.17) * 18.0;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }`,
        fragmentShader: `
          uniform float uTime;
          uniform float uOpacity;
          varying vec2 vUv;
          void main() {
            float band = smoothstep(0.0, 0.22, vUv.y) * (1.0 - smoothstep(0.3, 1.0, vUv.y));
            float rays = 0.6 + 0.4 * sin(vUv.x * 55.0 + uTime * 0.5 + sin(vUv.x * 9.0 + uTime * 0.2) * 4.0);
            float edge = smoothstep(0.0, 0.15, vUv.x) * (1.0 - smoothstep(0.85, 1.0, vUv.x));
            vec3 col = mix(vec3(0.2, 1.0, 0.62), vec3(0.62, 0.35, 1.0), smoothstep(0.25, 0.9, vUv.y));
            gl_FragColor = vec4(col, band * rays * edge * uOpacity);
          }`,
      }),
    []
  );
  useEffect(() => () => material.dispose(), [material]);
  useFrame(() => {
    const p = params.current;
    material.uniforms.uTime.value = p.t;
    material.uniforms.uOpacity.value = Math.pow(Math.max(0, 1 - p.day * 1.6), 2) * 0.45;
  });
  const curtains: [number, number, number, number][] = [
    [-160, 150, -470, 0.15],
    [60, 170, -520, -0.1],
    [260, 140, -480, 0.25],
  ];
  return (
    <>
      {curtains.map(([x, y, z, rot], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[0, rot, 0]} material={material}>
          <planeGeometry args={[520, 170, 48, 1]} />
        </mesh>
      ))}
    </>
  );
}
