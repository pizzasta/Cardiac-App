// Rhythm World — one persistent 3D place that lives behind every screen.
//
// A glowing waveform landscape (the app's pulse line stretched into terrain),
// drifting fireflies, a horizon glow, and a heartbeat ripple that rolls out
// from your rhythm animal on the horizon. The camera glides to a different
// station for each screen (see rig.ts), and the world takes on your animal's
// colour after the reveal.
//
// Respects "reduce motion" (renders a still frame), pauses in the background,
// and falls back to the flat gradient backdrop when WebGL isn't available.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform, StyleSheet, View } from 'react-native';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from './fiber';
import GLBoundary from './GLBoundary';
import Animal from './animals';
import { dotTexture, glowTexture } from './textures';
import { damp, heartbeat, Mood, STATIONS, terrainHeight, WorldMode } from './rig';
import { AnimalId } from '../data/archetypes';
import Atmosphere from '../components/Atmosphere';
import { T } from '../theme';

const NATIVE = Platform.OS !== 'web';
const BG = '#06060A';
// Phones run JS far slower than desktop browsers, so they get a coarser grid
// that is re-shaped every other frame (the motion is slow enough to hide it).
const TERRAIN = { width: 44, depth: 60, cols: NATIVE ? 40 : 84, rows: NATIVE ? 56 : 112 };
const TERRAIN_EVERY = NATIVE ? 2 : 1;
const FIREFLIES = NATIVE ? 110 : 220;
const TOTEM: [number, number, number] = [0, 2.6, -16];

interface Live {
  mode: WorldMode;
  tint: THREE.Color;
  still: boolean;
  pointer: { x: number; y: number };
}

// Shared, frame-to-frame state that useFrame reads without re-rendering.
function useLive(mode: WorldMode, tint: string, still: boolean): React.MutableRefObject<Live> {
  const live = useRef<Live>({ mode, tint: new THREE.Color(tint), still, pointer: { x: 0, y: 0 } });
  live.current.mode = mode;
  live.current.tint.set(tint);
  live.current.still = still;
  return live;
}

// Smoothed scene parameters that every layer reads.
interface Params {
  travel: number;
  amplitude: number;
  glow: number;
  scroll: number;
  t: number;
  color: THREE.Color;
}

function Rig({ live, params }: { live: React.MutableRefObject<Live>; params: React.MutableRefObject<Params> }) {
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3(...STATIONS[live.current.mode].lookAt));
  const first = useRef(true);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const { mode, still, pointer, tint } = live.current;
    const s = STATIONS[mode];
    const p = params.current;
    // Snap on the first frame (and always when still) so nothing swoops in.
    const k = first.current || still ? 1000 : 1;
    first.current = false;
    const speed = mode === 'reading' ? 2.4 : 1.4;

    p.travel = damp(p.travel, still ? 0 : s.travel, 1.2 * k, dt);
    p.amplitude = damp(p.amplitude, s.amplitude, 1.5 * k, dt);
    p.glow = damp(p.glow, s.glow, 2 * k, dt);
    p.color.lerp(tint, 1 - Math.exp(-1.5 * k * dt));
    if (!still) {
      p.t += dt;
      p.scroll += p.travel * dt;
    }

    const px = still ? 0 : pointer.x * 0.7;
    const py = still ? 0 : pointer.y * 0.35;
    camera.position.x = damp(camera.position.x, s.camera[0] + px, speed * k, dt);
    camera.position.y = damp(camera.position.y, s.camera[1] + py, speed * k, dt);
    camera.position.z = damp(camera.position.z, s.camera[2], speed * k, dt);
    look.current.x = damp(look.current.x, s.lookAt[0], speed * k, dt);
    look.current.y = damp(look.current.y, s.lookAt[1], speed * k, dt);
    look.current.z = damp(look.current.z, s.lookAt[2], speed * k, dt);
    camera.lookAt(look.current);
  });
  return null;
}

// Smooth, softly lit dunes with a few glowing contour lines across them: the
// app's pulse line repeated into the distance. No grid.
const CONTOUR_EVERY = NATIVE ? 4 : 5;

function Terrain({ params }: { params: React.MutableRefObject<Params> }) {
  const ground = useRef<THREE.MeshStandardMaterial>(null);
  const lines = useRef<THREE.LineBasicMaterial>(null);

  const { geometry, contours, base } = useMemo(() => {
    const g = new THREE.PlaneGeometry(TERRAIN.width, TERRAIN.depth, TERRAIN.cols, TERRAIN.rows);
    g.rotateX(-Math.PI / 2);
    g.translate(0, 0, -TERRAIN.depth / 2 + 6);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const xz = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      xz[i * 2] = pos.getX(i);
      xz[i * 2 + 1] = pos.getZ(i);
    }
    // Contour lines share the ground's vertices: every Nth row, left to right.
    const idx: number[] = [];
    const row = TERRAIN.cols + 1;
    for (let r = 0; r <= TERRAIN.rows; r += CONTOUR_EVERY) {
      for (let c = 0; c < TERRAIN.cols; c++) idx.push(r * row + c, r * row + c + 1);
    }
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', pos);
    lg.setIndex(idx);
    return { geometry: g, contours: lg, base: xz };
  }, []);

  useEffect(
    () => () => {
      geometry.dispose();
      contours.dispose();
    },
    [geometry, contours]
  );
  const frame = useRef(0);
  const dark = useMemo(() => new THREE.Color(BG), []);

  useFrame(() => {
    const p = params.current;
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    const reshape = frame.current++ % TERRAIN_EVERY === 0;
    if (reshape) {
      for (let i = 0; i < pos.count; i++) {
        pos.setY(i, terrainHeight(base[i * 2], base[i * 2 + 1], p.t, p.scroll, p.amplitude, [TOTEM[0], TOTEM[2]]));
      }
      pos.needsUpdate = true;
      geometry.computeVertexNormals();
    }
    if (ground.current) {
      ground.current.color.copy(dark).lerp(p.color, 0.14);
      ground.current.emissive.copy(p.color).multiplyScalar(0.035 * p.glow);
    }
    if (lines.current) {
      lines.current.color.copy(p.color);
      lines.current.opacity = 0.45 * p.glow;
    }
  });

  return (
    <group>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          ref={ground}
          roughness={0.55}
          metalness={0.15}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>
      <lineSegments geometry={contours}>
        <lineBasicMaterial ref={lines} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>
    </group>
  );
}

function Fireflies({ params }: { params: React.MutableRefObject<Params> }) {
  const mat = useRef<THREE.PointsMaterial>(null);
  const { geometry, seeds } = useMemo(() => {
    const pos = new Float32Array(FIREFLIES * 3);
    const seeds = new Float32Array(FIREFLIES * 2);
    for (let i = 0; i < FIREFLIES; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 34;
      pos[i * 3 + 1] = 0.4 + Math.random() * 6;
      pos[i * 3 + 2] = 6 - Math.random() * 48;
      seeds[i * 2] = Math.random() * Math.PI * 2;
      seeds[i * 2 + 1] = 0.3 + Math.random() * 0.9;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return { geometry: g, seeds };
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const p = params.current;
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < FIREFLIES; i++) {
      const phase = seeds[i * 2];
      const f = seeds[i * 2 + 1];
      arr[i * 3] += Math.sin(p.t * f + phase) * 0.004;
      arr[i * 3 + 1] += Math.cos(p.t * f * 0.8 + phase) * 0.003;
      // Drift toward the camera with the landscape, wrapping to the far end.
      arr[i * 3 + 2] += p.travel * dt;
      if (arr[i * 3 + 2] > 8) arr[i * 3 + 2] -= 50;
    }
    pos.needsUpdate = true;
    if (mat.current) {
      mat.current.color.copy(p.color).lerp(new THREE.Color('#ffffff'), 0.35);
      mat.current.opacity = (0.55 + 0.35 * Math.sin(p.t * 1.7)) * p.glow;
    }
  });

  return (
    <points geometry={geometry}>
      <pointsMaterial
        ref={mat}
        size={0.22}
        map={dotTexture()}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

// A gradient sky dome: near-black overhead, a warm glow of your colour at the
// horizon. Vertex colours, so it is smooth on every device.
function Sky({ params }: { params: React.MutableRefObject<Params> }) {
  const geometry = useMemo(() => {
    const g = new THREE.SphereGeometry(90, 32, 20);
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 3), 3));
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const top = useMemo(() => new THREE.Color('#030306'), []);
  const tmp = useMemo(() => new THREE.Color(), []);
  const last = useRef('');

  useFrame(() => {
    const p = params.current;
    const key = p.color.getHexString() + p.glow.toFixed(2);
    if (key === last.current) return; // only recolour when the tint changes
    last.current = key;
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    const col = geometry.attributes.color as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      // 0 at the horizon, 1 straight up (below the horizon stays dark).
      const h = Math.max(0, pos.getY(i) / 90);
      const glow = Math.exp(-h * 9) * 0.32 * p.glow;
      tmp.copy(top).lerp(p.color, glow);
      col.setXYZ(i, tmp.r, tmp.g, tmp.b);
    }
    col.needsUpdate = true;
  });

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} />
    </mesh>
  );
}

// A soft moon on the horizon with a wide halo, swelling with the heartbeat.
function Moon({ params }: { params: React.MutableRefObject<Params> }) {
  const core = useRef<THREE.SpriteMaterial>(null);
  const halo = useRef<THREE.SpriteMaterial>(null);
  const haloSprite = useRef<THREE.Sprite>(null);
  const light = useRef<THREE.PointLight>(null);
  const white = useMemo(() => new THREE.Color('#ffffff'), []);
  useFrame(() => {
    const p = params.current;
    const beat = heartbeat(p.t);
    if (core.current) {
      core.current.color.copy(p.color).lerp(white, 0.55);
      core.current.opacity = 0.9 * p.glow;
    }
    if (halo.current) {
      halo.current.color.copy(p.color);
      halo.current.opacity = (0.5 + 0.25 * beat) * p.glow;
    }
    if (haloSprite.current) haloSprite.current.scale.setScalar(34 + 4 * beat);
    if (light.current) {
      light.current.color.copy(p.color).lerp(white, 0.3);
      light.current.intensity = (70 + 30 * beat) * p.glow;
    }
  });
  return (
    <group position={[0, 5, -60]}>
      {/* Lights the dune crests from the horizon, in your colour. */}
      <pointLight ref={light} position={[0, 1, 20]} distance={80} decay={1.4} />
      <sprite ref={haloSprite} scale={34}>
        <spriteMaterial ref={halo} map={glowTexture()} transparent depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
      </sprite>
      <sprite scale={9}>
        <spriteMaterial ref={core} map={glowTexture()} transparent depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
      </sprite>
    </group>
  );
}

// Faint stars across the upper sky, slowly twinkling.
const STARS = NATIVE ? 160 : 320;
function Stars({ params }: { params: React.MutableRefObject<Params> }) {
  const mat = useRef<THREE.PointsMaterial>(null);
  const geometry = useMemo(() => {
    const pos = new Float32Array(STARS * 3);
    for (let i = 0; i < STARS; i++) {
      const az = Math.random() * Math.PI * 2;
      const el = 0.12 + Math.random() * 1.3; // stay above the horizon glow
      pos[i * 3] = Math.cos(az) * Math.cos(el) * 85;
      pos[i * 3 + 1] = Math.sin(el) * 85;
      pos[i * 3 + 2] = Math.sin(az) * Math.cos(el) * 85;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(() => {
    if (mat.current) mat.current.opacity = (0.55 + 0.2 * Math.sin(params.current.t * 0.7)) * params.current.glow;
  });
  return (
    <points geometry={geometry}>
      <pointsMaterial
        ref={mat}
        size={0.5}
        map={dotTexture()}
        color="#ffffff"
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        fog={false}
        sizeAttenuation
      />
    </points>
  );
}

// Your rhythm animal on the horizon (a pulsing core before the reveal).
function Totem({
  animal,
  color,
  mood,
  hop,
  still,
  visible,
  params,
}: {
  animal: AnimalId | null;
  color: string;
  mood: Mood | null;
  hop: number;
  still: boolean;
  visible: boolean;
  params: React.MutableRefObject<Params>;
}) {
  const presence = useRef(visible ? 1 : 0);
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const light = useRef<THREE.PointLight>(null);

  useFrame((_, rawDt) => {
    const p = params.current;
    const g = group.current;
    if (!g) return;
    presence.current = damp(presence.current, visible ? 1 : 0, 3, Math.min(rawDt, 0.05));
    g.visible = presence.current > 0.01;
    const beat = heartbeat(p.t);
    if (!animal) {
      // Before the reveal: a slowly turning, pulsing core.
      g.rotation.y = p.t * 0.4;
      g.rotation.x = Math.sin(p.t) * 0.1;
    } else {
      // The animal turns slowly so its whole shape reads from the horizon.
      g.rotation.y = Math.sin(p.t * 0.25) * 0.6;
      g.rotation.x = 0;
    }
    g.position.y = TOTEM[1] + Math.sin(p.t * 0.6) * 0.18;
    g.scale.setScalar((animal ? 1.3 : 1 + 0.08 * beat) * presence.current);
    if (mat.current) {
      mat.current.color.copy(p.color);
      mat.current.emissive.copy(p.color);
      mat.current.emissiveIntensity = (0.35 + 0.65 * beat) * p.glow;
    }
    if (light.current) {
      light.current.color.copy(p.color);
      light.current.intensity = (6 + 10 * beat) * p.glow * presence.current;
    }
  });

  return (
    <group ref={group} position={TOTEM}>
      {animal ? (
        <Animal animal={animal} color={color} mood={mood} hop={hop} still={still} />
      ) : (
        <mesh>
          <icosahedronGeometry args={[0.9, 1]} />
          <meshStandardMaterial ref={mat} roughness={0.35} metalness={0.25} flatShading wireframe />
        </mesh>
      )}
      <pointLight ref={light} distance={18} decay={1.6} />
    </group>
  );
}

function Scene({
  animal,
  mood,
  hop,
  mode,
  live,
}: {
  animal: AnimalId | null;
  mood: Mood | null;
  hop: number;
  mode: WorldMode;
  live: React.MutableRefObject<Live>;
}) {
  // The totem is the hero only on open, scenic screens. It steps back for the
  // reveal (which has its own close-up emblem), the reset (the breathing orb is
  // the focus) and dense screens, where it would sit behind text.
  const showTotem = ['landing', 'quiz', 'reading', 'home'].includes(mode);
  const params = useRef<Params>({
    travel: 0,
    amplitude: STATIONS[live.current.mode].amplitude,
    glow: STATIONS[live.current.mode].glow,
    scroll: 0,
    t: 0,
    color: live.current.tint.clone(),
  });
  return (
    <>
      <color attach="background" args={[BG]} />
      <fog attach="fog" args={[BG, 12, 58]} />
      <hemisphereLight args={['#2a2440', '#050507', 0.55]} />
      <directionalLight position={[0, 6, 12]} intensity={0.35} />
      <Rig live={live} params={params} />
      <Sky params={params} />
      <Stars params={params} />
      <Moon params={params} />
      <Terrain params={params} />
      <Fireflies params={params} />
      <Totem
        animal={animal}
        color={'#' + live.current.tint.getHexString()}
        mood={mood}
        hop={hop}
        still={live.current.still}
        visible={showTotem}
        params={params}
      />
    </>
  );
}

// In "demand" mode, render a few frames after a change so damped values settle.
function Settle({ deps }: { deps: unknown[] }) {
  const { invalidate } = useThree();
  useEffect(() => {
    invalidate();
    const id = setTimeout(() => invalidate(), 50);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return null;
}

export default function World({
  mode,
  animal,
  tint = T.accent,
  mood = null,
  hop = 0,
  still = false,
}: {
  mode: WorldMode;
  animal: AnimalId | null;
  tint?: string;
  // Today's check-in, so the animal on the horizon moves like you feel.
  mood?: Mood | null;
  hop?: number;
  still?: boolean;
}) {
  const live = useLive(mode, tint, still);
  const [active, setActive] = useState(true);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setActive(s === 'active'));
    return () => sub.remove();
  }, []);

  // Gentle parallax from the pointer on web.
  useEffect(() => {
    if (NATIVE || still) return;
    const g: any = globalThis;
    const onMove = (e: PointerEvent) => {
      live.current.pointer.x = (e.clientX / g.innerWidth) * 2 - 1;
      live.current.pointer.y = -((e.clientY / g.innerHeight) * 2 - 1);
    };
    g.addEventListener?.('pointermove', onMove);
    return () => g.removeEventListener?.('pointermove', onMove);
  }, [live, still]);

  const frameloop = !active ? 'never' : still ? 'demand' : 'always';

  return (
    <View pointerEvents="none" style={styles.fill}>
      <GLBoundary fallback={<Atmosphere style={StyleSheet.absoluteFill} pulse={!still} />}>
        <Canvas
          style={StyleSheet.absoluteFill as any}
          frameloop={frameloop}
          dpr={NATIVE ? 1 : [1, 1.5]}
          gl={{ antialias: !NATIVE, powerPreference: 'low-power' } as any}
          camera={{ position: STATIONS[mode].camera, fov: 55, near: 0.1, far: 120 }}
        >
          <Scene animal={animal} mood={mood} hop={hop} mode={mode} live={live} />
          {still && <Settle deps={[mode, tint, animal]} />}
        </Canvas>
      </GLBoundary>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject, backgroundColor: BG },
});
