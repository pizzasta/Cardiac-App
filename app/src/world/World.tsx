// Rhythm World: one persistent 3D landscape that lives behind every screen.
//
// A natural place rather than a graphic: a physically based sky that follows
// the person's local time (sunrise, golden day, sunset, starry night), rolling
// hills along a quiet valley, two ranges of distant mountains fading into
// haze, low mist and warm fireflies. Your rhythm animal waits on the path
// ahead after the reveal. The camera glides to a different spot for each
// screen (see rig.ts).
//
// Respects "reduce motion" (renders a still frame), pauses in the background,
// and falls back to the flat gradient backdrop when WebGL isn't available.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform, StyleSheet, View } from 'react-native';
import * as THREE from 'three';
import { Sky as SkyShader } from 'three/examples/jsm/objects/Sky.js';
import { Canvas, useFrame, useThree } from './fiber';
import GLBoundary from './GLBoundary';
import Animal from './animals';
import { dotTexture, glowTexture } from './textures';
import {
  damp,
  daylight,
  groundHeight,
  Mood,
  ridgeline,
  STATIONS,
  sunElevation,
  TILE_LENGTH,
  WorldMode,
} from './rig';
import { localHour } from './clock';
import { AnimalId } from '../data/archetypes';
import Atmosphere from '../components/Atmosphere';
import { T } from '../theme';

const NATIVE = Platform.OS !== 'web';
const BG = '#06060A';
const TILE = { width: 90, cols: NATIVE ? 50 : 90, rows: NATIVE ? 34 : 60 };
const TILES = 3; // leapfrogging ground tiles, nearest to farthest
const FIREFLIES = NATIVE ? 90 : 180;
const TOTEM: [number, number, number] = [0, 1.0, -16];
// Sun and moon directions, as compass angles (180 = straight ahead).
const SUN_AZIMUTH = 180;
const MOON = { azimuth: 145, elevation: 24 };

// Night, twilight and (soft) day colours for haze, sky light and ground.
const PALETTE = {
  fog: { night: new THREE.Color('#0b0d18'), dusk: new THREE.Color('#3a3046'), day: new THREE.Color('#6e7890') },
  sky: { night: new THREE.Color('#1b2340'), dusk: new THREE.Color('#5b4a6e'), day: new THREE.Color('#9fb3d6') },
};

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
  glow: number;
  t: number;
  color: THREE.Color;
  // Sun elevation (degrees) and daylight 0..1, from the local clock.
  elevation: number;
  day: number;
  fog: THREE.Color;
}


// Mix night → dusk → day for a daylight value (dusk peaks around 0.35).
function timeColor(out: THREE.Color, set: { night: THREE.Color; dusk: THREE.Color; day: THREE.Color }, day: number) {
  if (day < 0.35) return out.copy(set.night).lerp(set.dusk, day / 0.35);
  return out.copy(set.dusk).lerp(set.day, (day - 0.35) / 0.65);
}

function dirFrom(azimuthDeg: number, elevationDeg: number, out = new THREE.Vector3()) {
  return out.setFromSphericalCoords(
    1,
    THREE.MathUtils.degToRad(90 - elevationDeg),
    THREE.MathUtils.degToRad(azimuthDeg)
  );
}

function Rig({ live, params }: { live: React.MutableRefObject<Live>; params: React.MutableRefObject<Params> }) {
  const { camera, scene, gl } = useThree();
  const look = useRef(new THREE.Vector3(...STATIONS[live.current.mode].lookAt));
  const first = useRef(true);
  const hour = useRef(localHour());

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const { mode, still, pointer, tint } = live.current;
    const s = STATIONS[mode];
    const p = params.current;
    // Snap on the first frame (and always when still) so nothing swoops in.
    const k = first.current || still ? 1000 : 1;
    first.current = false;
    const speed = mode === 'reading' ? 2.4 : 1.4;

    // The clock moves slowly; re-read it about once a minute of frames.
    if (Math.random() < 0.002) hour.current = localHour();
    p.elevation = damp(p.elevation, sunElevation(hour.current), 0.5 * k, dt);
    p.day = daylight(p.elevation);
    timeColor(p.fog, PALETTE.fog, p.day);
    if (scene.fog) (scene.fog as THREE.Fog).color.copy(p.fog);
    // Darker exposure as the day brightens keeps the sky from washing out
    // behind white text.
    gl.toneMappingExposure = 0.5 - 0.36 * p.day;

    p.travel = damp(p.travel, still ? 0 : s.travel, 1.2 * k, dt);
    p.glow = damp(p.glow, s.glow, 2 * k, dt);
    p.color.lerp(tint, 1 - Math.exp(-1.5 * k * dt));
    if (!still) p.t += dt;

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

// A physically based sky (Preetham scattering) lit by a sun that follows the
// local clock, plus sun and moon lighting for the land.
function Sky({ params }: { params: React.MutableRefObject<Params> }) {
  const sky = useMemo(() => {
    const s = new SkyShader();
    s.scale.setScalar(1500);
    const u = s.material.uniforms;
    u.turbidity.value = 3;
    u.rayleigh.value = 3;
    u.mieCoefficient.value = 0.004;
    u.mieDirectionalG.value = 0.86;
    return s;
  }, []);
  const sun = useRef<THREE.DirectionalLight>(null);
  const moonLight = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const moonDir = useMemo(() => dirFrom(MOON.azimuth, MOON.elevation), []);

  useEffect(
    () => () => {
      sky.geometry.dispose();
      sky.material.dispose();
    },
    [sky]
  );

  useFrame(() => {
    const p = params.current;
    dirFrom(SUN_AZIMUTH, p.elevation, dir);
    sky.material.uniforms.sunPosition.value.copy(dir);
    if (sun.current) {
      sun.current.position.copy(dir).multiplyScalar(100);
      sun.current.intensity = 1.6 * Math.max(0, p.day - 0.15);
    }
    if (moonLight.current) {
      moonLight.current.position.copy(moonDir).multiplyScalar(100);
      moonLight.current.intensity = 0.35 * (1 - p.day);
    }
    if (hemi.current) {
      timeColor(hemi.current.color, PALETTE.sky, p.day);
      hemi.current.intensity = 0.6 + 0.8 * p.day;
    }
  });

  return (
    <>
      <primitive object={sky} />
      <hemisphereLight ref={hemi} args={['#5b4a6e', '#0a0d0b', 0.5]} />
      <directionalLight ref={sun} color="#ffd2a1" />
      <directionalLight ref={moonLight} color="#a9bcff" />
    </>
  );
}

// The scattering model has no real night, so a deep-blue night sky fades in
// over it after sunset.
function NightSky({ params }: { params: React.MutableRefObject<Params> }) {
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const geometry = useMemo(() => {
    const g = new THREE.SphereGeometry(1000, 32, 16);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const zenith = new THREE.Color('#050816');
    const horizon = new THREE.Color('#1a2140');
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const h = Math.max(0, pos.getY(i) / 1000);
      c.copy(horizon).lerp(zenith, Math.pow(h, 0.6));
      colors.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(() => {
    if (mat.current) mat.current.opacity = Math.max(0, Math.min(1, 1 - params.current.day * 2.5));
  });
  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial ref={mat} vertexColors side={THREE.BackSide} transparent depthWrite={false} fog={false} toneMapped={false} />
    </mesh>
  );
}

// A soft moon high on the left, visible from dusk through the night.
function Moon({ params }: { params: React.MutableRefObject<Params> }) {
  const core = useRef<THREE.SpriteMaterial>(null);
  const halo = useRef<THREE.SpriteMaterial>(null);
  const pos = useMemo(() => dirFrom(MOON.azimuth, MOON.elevation).multiplyScalar(500), []);
  useFrame(() => {
    const night = 1 - params.current.day;
    if (core.current) core.current.opacity = 0.95 * night;
    if (halo.current) halo.current.opacity = 0.22 * night;
  });
  return (
    <group position={pos}>
      <sprite scale={70}>
        <spriteMaterial ref={halo} map={glowTexture()} color="#c9d6ff" transparent depthWrite={false} fog={false} />
      </sprite>
      <sprite scale={16}>
        <spriteMaterial ref={core} map={glowTexture()} color="#f4f1e6" transparent depthWrite={false} fog={false} />
      </sprite>
    </group>
  );
}

// Stars that come out as the sky darkens.
const STARS = NATIVE ? 220 : 450;
function Stars({ params }: { params: React.MutableRefObject<Params> }) {
  const mat = useRef<THREE.PointsMaterial>(null);
  const geometry = useMemo(() => {
    const pos = new Float32Array(STARS * 3);
    for (let i = 0; i < STARS; i++) {
      const az = Math.random() * Math.PI * 2;
      const el = 0.08 + Math.random() * 1.4;
      pos[i * 3] = Math.cos(az) * Math.cos(el) * 600;
      pos[i * 3 + 1] = Math.sin(el) * 600;
      pos[i * 3 + 2] = Math.sin(az) * Math.cos(el) * 600;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(() => {
    const p = params.current;
    const dark = Math.max(0, 1 - p.day * 2.2);
    if (mat.current) mat.current.opacity = (0.75 + 0.15 * Math.sin(p.t * 0.7)) * dark;
  });
  return (
    <points geometry={geometry}>
      <pointsMaterial
        ref={mat}
        size={2.2}
        map={dotTexture()}
        color="#ffffff"
        transparent
        depthWrite={false}
        fog={false}
        sizeAttenuation
      />
    </points>
  );
}

// Two ranges of mountains on the horizon; distance and fog give the haze.
function Mountains() {
  const ranges = useMemo(
    () =>
      [
        { z: -175, height: 22, depth: 70, seed: 1, color: '#232a38' },
        { z: -290, height: 48, depth: 110, seed: 2, color: '#323a52' },
      ].map((r) => {
        const g = new THREE.PlaneGeometry(900, r.depth, NATIVE ? 160 : 260, 14);
        g.rotateX(-Math.PI / 2);
        const pos = g.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i);
          // 0 at the front edge rising to the ridge at the back.
          const back = 0.5 - pos.getZ(i) / r.depth;
          const rise = Math.sin(Math.max(0, Math.min(1, back)) * Math.PI * 0.5);
          pos.setY(i, ridgeline(x, r.seed) * r.height * rise - 2);
        }
        g.computeVertexNormals();
        return { ...r, geometry: g };
      }),
    []
  );
  useEffect(() => () => ranges.forEach((r) => r.geometry.dispose()), [ranges]);
  return (
    <>
      {ranges.map((r) => (
        <mesh key={r.seed} geometry={r.geometry} position={[0, 0, r.z]}>
          <meshStandardMaterial color={r.color} roughness={1} />
        </mesh>
      ))}
    </>
  );
}

// Rolling hills along a valley. Three identical tiles leapfrog toward the
// camera; the ground shape repeats every tile, so the joins are seamless and
// nothing is recomputed per frame.
function Ground({ params }: { params: React.MutableRefObject<Params> }) {
  const tiles = useRef<(THREE.Mesh | null)[]>([]);
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(TILE.width, TILE_LENGTH, TILE.cols, TILE.rows);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const low = new THREE.Color('#2b3a2e');
    const high = new THREE.Color('#4a5a40');
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = groundHeight(x, z);
      pos.setY(i, y);
      // Slightly lighter on the hillsides, with a little natural variation.
      const v = Math.min(1, Math.max(0, y / 6 + 0.25 + 0.15 * Math.sin(x * 1.7 + z * 0.9)));
      c.copy(low).lerp(high, v);
      colors.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const p = params.current;
    tiles.current.forEach((m) => {
      if (!m) return;
      m.position.z += p.travel * dt;
      // Once a tile is fully behind the camera, send it to the far end.
      if (m.position.z - TILE_LENGTH / 2 > 12) m.position.z -= TILES * TILE_LENGTH;
    });
  });

  return (
    <>
      {Array.from({ length: TILES }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            tiles.current[i] = m;
          }}
          geometry={geometry}
          position={[0, 0, -i * TILE_LENGTH]}
        >
          <meshStandardMaterial vertexColors roughness={0.95} />
        </mesh>
      ))}
    </>
  );
}

// Low banks of mist in the middle distance, tinted by the time of day.
function Mist({ params }: { params: React.MutableRefObject<Params> }) {
  const mats = useRef<(THREE.SpriteMaterial | null)[]>([]);
  const sprites = useRef<(THREE.Sprite | null)[]>([]);
  const banks = [
    { x: -14, y: 2.2, z: -55, w: 90, h: 9 },
    { x: 18, y: 3, z: -90, w: 120, h: 12 },
    { x: 0, y: 4, z: -135, w: 180, h: 16 },
  ];
  useFrame(() => {
    const p = params.current;
    mats.current.forEach((m, i) => {
      if (!m) return;
      m.color.copy(p.fog).lerp(new THREE.Color('#ffffff'), 0.08);
      m.opacity = 0.32 - i * 0.05;
    });
    sprites.current.forEach((s, i) => {
      if (s) s.position.x = banks[i].x + Math.sin(p.t * 0.05 + i * 2) * 6;
    });
  });
  return (
    <>
      {banks.map((b, i) => (
        <sprite
          key={i}
          ref={(s) => {
            sprites.current[i] = s;
          }}
          position={[b.x, b.y, b.z]}
          scale={[b.w, b.h, 1]}
        >
          <spriteMaterial
            ref={(m) => {
              mats.current[i] = m;
            }}
            map={glowTexture()}
            transparent
            depthWrite={false}
          />
        </sprite>
      ))}
    </>
  );
}

// Warm fireflies drifting over the valley, brightest after dusk.
const WARM = new THREE.Color('#ffd98a');
function Fireflies({ params }: { params: React.MutableRefObject<Params> }) {
  const mat = useRef<THREE.PointsMaterial>(null);
  const { geometry, seeds } = useMemo(() => {
    const pos = new Float32Array(FIREFLIES * 3);
    const seeds = new Float32Array(FIREFLIES * 2);
    for (let i = 0; i < FIREFLIES; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = 0.4 + Math.random() * 3.5;
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
      arr[i * 3 + 2] += p.travel * dt;
      if (arr[i * 3 + 2] > 8) arr[i * 3 + 2] -= 50;
    }
    pos.needsUpdate = true;
    if (mat.current) {
      mat.current.color.copy(WARM).lerp(p.color, 0.2);
      mat.current.opacity = (0.6 + 0.3 * Math.sin(p.t * 1.7)) * (1 - 0.75 * p.day) * p.glow;
    }
  });

  return (
    <points geometry={geometry}>
      <pointsMaterial
        ref={mat}
        size={0.16}
        map={dotTexture()}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

// Your rhythm animal on the path ahead; before the reveal, a soft wisp of
// light floating where it will appear.
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
  const wisp = useRef<THREE.SpriteMaterial>(null);
  const wispHalo = useRef<THREE.SpriteMaterial>(null);
  const light = useRef<THREE.PointLight>(null);
  const white = useMemo(() => new THREE.Color('#ffffff'), []);

  useFrame((_, rawDt) => {
    const p = params.current;
    const g = group.current;
    if (!g) return;
    presence.current = damp(presence.current, visible ? 1 : 0, 3, Math.min(rawDt, 0.05));
    g.visible = presence.current > 0.01;
    g.position.y = TOTEM[1] + (animal ? 0 : 0.8 + Math.sin(p.t * 0.9) * 0.25);
    g.rotation.y = animal ? Math.sin(p.t * 0.25) * 0.6 : 0;
    g.scale.setScalar((animal ? 1.2 : 1) * presence.current);
    const pulse = 0.85 + 0.15 * Math.sin(p.t * 1.3);
    if (wisp.current) {
      wisp.current.color.copy(p.color).lerp(white, 0.6);
      wisp.current.opacity = pulse * p.glow;
    }
    if (wispHalo.current) {
      wispHalo.current.color.copy(p.color);
      wispHalo.current.opacity = 0.45 * pulse * p.glow;
    }
    if (light.current) {
      light.current.color.copy(p.color);
      light.current.intensity = (animal ? 4 : 8) * pulse * p.glow * presence.current;
    }
  });

  return (
    <group ref={group} position={TOTEM}>
      {animal ? (
        <Animal animal={animal} color={color} mood={mood} hop={hop} still={still} />
      ) : (
        <>
          <sprite scale={5}>
            <spriteMaterial ref={wispHalo} map={glowTexture()} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
          </sprite>
          <sprite scale={1.2}>
            <spriteMaterial ref={wisp} map={glowTexture()} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
          </sprite>
        </>
      )}
      <pointLight ref={light} distance={14} decay={1.6} />
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
    glow: STATIONS[live.current.mode].glow,
    t: 0,
    color: live.current.tint.clone(),
    elevation: sunElevation(localHour()),
    day: daylight(sunElevation(localHour())),
    fog: new THREE.Color(BG),
  });
  return (
    <>
      <fog attach="fog" args={[BG, 25, 420]} />
      <Rig live={live} params={params} />
      <Sky params={params} />
      <NightSky params={params} />
      <Stars params={params} />
      <Moon params={params} />
      <Mountains />
      <Ground params={params} />
      <Mist params={params} />
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
  // Today's check-in, so the animal moves like you feel.
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
          camera={{ position: STATIONS[mode].camera, fov: 55, near: 0.1, far: 3000 }}
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
